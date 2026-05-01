/**
 * PostgreSQL store — generic, framework-agnostic.
 * Works with any pg-compatible driver (pg, postgres.js, Bun.sql, etc.)
 */
import type {
  Command,
  EngineConfig,
  Event,
  IdempotencyRecord,
  LedgerEntry,
  LedgerDirection,
  OutboxMessage,
  Policy,
  Receipt,
  Response,
  Wallet,
} from "./types.js";

// ─── Errors ──────────────────────────────────────────────────────────────────

export const ErrInsufficientBalance = "INSUFFICIENT_BALANCE";
export const ErrPolicyLimitExceeded = "POLICY_LIMIT_EXCEEDED";
export const ErrIdempotentReplay = "IDEMPOTENT_REPLAY";
export const ErrInvalidWorkspace = "INVALID_WORKSPACE";

// ─── SQL migrations ───────────────────────────────────────────────────────────

/** All schema migrations — run once on startup. */
export const MIGRATIONS = [
  /* 0001 */ `
CREATE TABLE IF NOT EXISTS dna_events (
  event_id       TEXT    NOT NULL PRIMARY KEY,
  execution_id   TEXT,
  workspace_id   TEXT,
  actor_id       TEXT,
  type           TEXT,
  payload        JSONB,
  created_at     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS dna_idx_events_workspace ON dna_events(workspace_id);

CREATE TABLE IF NOT EXISTS dna_receipts (
  receipt_id   TEXT    NOT NULL PRIMARY KEY,
  event_id     TEXT    NOT NULL,
  amount       BIGINT,
  created_at   TIMESTAMP DEFAULT NOW(),
  CONSTRAINT   dna_uniq_receipt_event UNIQUE (event_id)
);
CREATE INDEX IF NOT EXISTS dna_idx_receipts_event ON dna_receipts(event_id);

CREATE TABLE IF NOT EXISTS dna_ledger (
  entry_id      TEXT    NOT NULL PRIMARY KEY,
  workspace_id  TEXT,
  direction     TEXT,
  amount        BIGINT,
  reference_id  TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  CONSTRAINT    dna_uniq_ledger_ref UNIQUE (reference_id),
  CONSTRAINT    dna_positive_amount CHECK (amount >= 0)
);
CREATE INDEX IF NOT EXISTS dna_idx_ledger_workspace ON dna_ledger(workspace_id);

CREATE TABLE IF NOT EXISTS dna_idempotency (
  key          TEXT    NOT NULL PRIMARY KEY,
  response     JSONB,
  created_at   TIMESTAMP DEFAULT NOW(),
  expires_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dna_wallets (
  workspace_id  TEXT    NOT NULL PRIMARY KEY,
  balance      BIGINT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dna_outbox (
  id          TEXT    NOT NULL PRIMARY KEY,
  topic       TEXT,
  payload     JSONB,
  created_at  TIMESTAMP DEFAULT NOW(),
  processed   BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS dna_policies (
  workspace_id        TEXT    NOT NULL PRIMARY KEY,
  daily_limit         BIGINT  NOT NULL DEFAULT 9223372036854775807,
  current_spend       BIGINT  NOT NULL DEFAULT 0,
  last_reset          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dna_api_keys (
  key          TEXT    NOT NULL PRIMARY KEY,
  workspace_id TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);
`,
] as const;

// ─── PgPool interface (framework-agnostic) ───────────────────────────────────

/** Minimal interface — compatible with pg.Pool, postgres.js Pool, Bun.sql */
export interface PgPool {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>;
}

export interface PgTx {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>;
  exec(sql: string, params?: unknown[]): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export interface PostgresStoreOptions {
  pool: PgPool;
  config?: Partial<EngineConfig>;
}

export class PostgresStore {
  protected readonly pool: PgPool;
  protected readonly config: Required<EngineConfig>;

  constructor(pool: PgPool, config: Partial<EngineConfig> = {}) {
    this.pool = pool;
    this.config = {
      defaultCost: config.defaultCost ?? 1n,
      idempotencyTTL: config.idempotencyTTL ?? 172_800,
      initialWalletBalance: config.initialWalletBalance ?? 0n,
      defaultDailyLimit: config.defaultDailyLimit ?? BigInt(Number.MAX_SAFE_INTEGER),
      isolationLevel: config.isolationLevel ?? "read committed",
    };
  }

  // ─── Migrations ─────────────────────────────────────────────────────────────

  async migrate(): Promise<void> {
    for (const sql of MIGRATIONS) {
      await this.pool.query(sql);
    }
  }

  // ─── Transactions ────────────────────────────────────────────────────────────

  async transaction<T>(fn: (tx: PgTx) => Promise<T>): Promise<T> {
    const tx = new PostgresTx(this.pool);
    try {
      await tx.exec(`BEGIN ${this.isolationSQL()}`);
      const result = await fn(tx);
      await tx.commit();
      return result;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

  private isolationSQL(): string {
    return this.config.isolationLevel === "repeatable read"
      ? "ISOLATION LEVEL REPEATABLE READ"
      : "";
  }

  // ─── Wallet ─────────────────────────────────────────────────────────────────

  /**
   * Get-or-create wallet balance with row lock.
   * Serializes concurrent requests per workspace (SELECT FOR UPDATE).
   */
  async getBalanceForUpdate(tx: PgTx, workspaceId: string): Promise<bigint> {
    await tx.exec(
      `INSERT INTO dna_wallets (workspace_id, balance) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [workspaceId, String(this.config.initialWalletBalance)],
    );

    const { rows } = await tx.query<{ balance: string }>(
      `SELECT balance FROM dna_wallets WHERE workspace_id = $1 FOR UPDATE`,
      [workspaceId],
    );

    return BigInt(rows[0]?.balance ?? "0");
  }

  async getBalanceOnly(workspaceId: string): Promise<bigint> {
    const { rows } = await this.pool.query<{ balance: string }>(
      `SELECT balance FROM dna_wallets WHERE workspace_id = $1`,
      [workspaceId],
    );
    return BigInt(rows[0]?.balance ?? "0");
  }

  // ─── Idempotency ────────────────────────────────────────────────────────────

  /** Check if an idempotency key exists inside a transaction. */
  async getIdempotencyTx(tx: PgTx, key: string): Promise<Response | null> {
    const { rows } = await tx.query<{ response: Response }>(
      `SELECT response FROM dna_idempotency WHERE key = $1`,
      [key],
    );
    return rows[0]?.response ?? null;
  }

  // ─── Policy ─────────────────────────────────────────────────────────────────

  /**
   * Check and increment daily spend policy.
   * If no policy row exists, creates one with the default limit.
   */
  async checkPolicy(tx: PgTx, workspaceId: string, cost: bigint): Promise<void> {
    await tx.exec(
      `INSERT INTO dna_policies (workspace_id, daily_limit)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [workspaceId, String(this.config.defaultDailyLimit)],
    );

    const { rows } = await tx.query<{ daily_limit: string; current_spend: string }>(
      `SELECT daily_limit, current_spend FROM dna_policies
       WHERE workspace_id = $1 FOR UPDATE`,
      [workspaceId],
    );

    if (rows.length === 0) return; // safety: shouldn't happen

    const limit = BigInt(rows[0].daily_limit);
    const current = BigInt(rows[0].current_spend);

    if (current + cost > limit) {
      throw new Error(ErrPolicyLimitExceeded);
    }

    await tx.exec(
      `UPDATE dna_policies
       SET current_spend = current_spend + $1
       WHERE workspace_id = $2`,
      [String(cost), workspaceId],
    );
  }

  // ─── Engine Execute ─────────────────────────────────────────────────────────

  /**
   * Execute a command atomically:
   *   1. Lock wallet (serializes per workspace)
   *   2. Idempotency check
   *   3. Policy check
   *   4. Balance check
   *   5. Commit: event + receipts + ledger + wallet debit + outbox
   */
  async execute(cmd: Command): Promise<Response> {
    return this.transaction(async (tx) => {
      const cost = cmd.cost ?? this.config.defaultCost;

      // 1. Lock wallet
      const balance = await this.getBalanceForUpdate(tx, String(cmd.workspaceId));

      // 2. Idempotency
      const cached = await this.getIdempotencyTx(tx, String(cmd.idempotencyKey));
      if (cached) return cached;

      // 3. Policy
      if (cost > 0n) {
        await this.checkPolicy(tx, String(cmd.workspaceId), cost);
      }

      // 4. Balance
      if (balance < cost) {
        throw new Error(ErrInsufficientBalance);
      }

      const executionId = crypto.randomUUID();
      const eventId = crypto.randomUUID();
      const receiptId = crypto.randomUUID();
      const now = new Date();

      const event: Event = {
        eventId,
        executionId,
        workspaceId: String(cmd.workspaceId),
        actorId: String(cmd.actorId),
        type: cmd.type,
        payload: cmd.payload,
        createdAt: now,
      };

      const receipt: Receipt = {
        receiptId,
        eventId,
        amount: cost,
        createdAt: now,
      };

      const entry: LedgerEntry = {
        entryId: crypto.randomUUID(),
        workspaceId: String(cmd.workspaceId),
        direction: cost > 0n ? "debit" : "credit",
        amount: cost,
        referenceId: receiptId,
        createdAt: now,
      };

      const resp: Response = {
        executionId,
        status: "success",
        receipts: [receipt],
        balanceAfter: balance - cost,
      };

      // 5. Commit all
      await this.commitExecution(tx, event, entry, String(cmd.idempotencyKey), resp);

      return resp;
    });
  }

  /** Commit execution inside a transaction. */
  protected async commitExecution(
    tx: PgTx,
    event: Event,
    entry: LedgerEntry,
    idempotencyKey: string,
    resp: Response,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + this.config.idempotencyTTL * 1000);
    const respJSON = JSON.stringify(resp);
    const payloadJSON = JSON.stringify(event.payload);

    // a) Idempotency record
    const { rowCount } = await tx.query(
      `INSERT INTO dna_idempotency (key, response, created_at, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO NOTHING`,
      [idempotencyKey, respJSON, new Date(), expiresAt],
    );

    if (rowCount === 0) {
      // Key already existed — fetch and return existing (idempotent)
      const { rows } = await tx.query<{ response: Response }>(
        `SELECT response FROM dna_idempotency WHERE key = $1`,
        [idempotencyKey],
      );
      if (rows[0]) return;
    }

    // b) Event
    await tx.query(
      `INSERT INTO dna_events (event_id, execution_id, workspace_id, actor_id, type, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [event.eventId, event.executionId, event.workspaceId, event.actorId, event.type, payloadJSON, event.createdAt],
    );

    // c) Ledger
    await tx.query(
      `INSERT INTO dna_ledger (entry_id, workspace_id, direction, amount, reference_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [entry.entryId, entry.workspaceId, entry.direction, String(entry.amount), entry.referenceId, entry.createdAt],
    );

    // d) Wallet debit (guard: only deduct if sufficient balance)
    const debitResult = await tx.query(
      `UPDATE dna_wallets
       SET balance = balance - $1, updated_at = NOW()
       WHERE workspace_id = $2 AND balance >= $1`,
      [String(entry.amount), entry.workspaceId],
    );

    if (debitResult.rowCount === 0) {
      throw new Error(ErrInsufficientBalance);
    }

    // e) Outbox entry
    const outboxId = `out_${event.executionId}`;
    await tx.query(
      `INSERT INTO dna_outbox (id, topic, payload, created_at)
       VALUES ($1, $2, $3, $4)`,
      [outboxId, "dna.execution.success", respJSON, new Date()],
    );
  }

  // ─── Outbox ────────────────────────────────────────────────────────────────────

  /**
   * Process pending outbox messages.
   * Uses SELECT FOR UPDATE SKIP LOCKED — safe to run concurrently.
   * @param handler Return true to mark as processed, false to skip.
   */
  async processOutbox(
    handler: (topic: string, payload: unknown) => Promise<boolean>,
    limit = 100,
  ): Promise<number> {
    return this.transaction(async (tx) => {
      const { rows } = await tx.query<{ id: string; topic: string; payload: unknown }>(
        `SELECT id, topic, payload
         FROM dna_outbox
         WHERE processed = FALSE
         ORDER BY created_at
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [limit],
      );

      let processed = 0;
      for (const row of rows) {
        try {
          const ok = await handler(row.topic, row.payload);
          if (ok) {
            await tx.query(`UPDATE dna_outbox SET processed = TRUE WHERE id = $1`, [row.id]);
            processed++;
          }
        } catch {
          // Log and continue — don't block other messages
        }
      }

      return processed;
    });
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  async cleanupIdempotency(): Promise<void> {
    await this.pool.query(`DELETE FROM dna_idempotency WHERE expires_at < NOW()`);
  }

  // ─── History & Reconciliation ───────────────────────────────────────────────

  async getHistory(workspaceId: string, limit = 50): Promise<LedgerEntry[]> {
    const { rows } = await this.pool.query<{
      entry_id: string;
      workspace_id: string;
      direction: LedgerDirection;
      amount: string;
      reference_id: string;
      created_at: Date;
    }>(
      `SELECT entry_id, workspace_id, direction, amount, reference_id, created_at
       FROM dna_ledger
       WHERE workspace_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [workspaceId, limit],
    );

    return rows.map((r) => ({
      entryId: r.entry_id,
      workspaceId: r.workspace_id,
      direction: r.direction,
      amount: BigInt(r.amount),
      referenceId: r.reference_id,
      createdAt: r.created_at,
    }));
  }

  /**
   * Reconcile: compare wallet balance with ledger sum.
   * Returns { wallet, ledger, match }.
   */
  async reconcile(workspaceId: string): Promise<{
    wallet: bigint;
    ledger: bigint;
    match: boolean;
    drift: bigint;
  }> {
    const wallet = await this.getBalanceOnly(workspaceId);

    const { rows } = await this.pool.query<{ sum: string }>(
      `SELECT COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0) + $1 as sum
       FROM dna_ledger
       WHERE workspace_id = $2`,
      [String(this.config.initialWalletBalance), workspaceId],
    );

    const ledger = BigInt(rows[0]?.sum ?? "0");
    const match = wallet === ledger;
    const drift = wallet - ledger;

    return { wallet, ledger, match, drift };
  }
}

// ─── Tx helper ────────────────────────────────────────────────────────────────

class PostgresTx implements PgTx {
  constructor(private readonly pool: PgPool) {}

  async query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number }> {
    return this.pool.query<T>(sql, params);
  }

  async exec(sql: string, params?: unknown[]): Promise<void> {
    // postgres.js and Bun.sql use query() for everything
    // pg uses exec() for non-row results — override in subclass if needed
    await this.pool.query(sql, params);
  }

  async commit(): Promise<void> {
    await this.pool.query("COMMIT");
  }

  async rollback(): Promise<void> {
    await this.pool.query("ROLLBACK");
  }
}
