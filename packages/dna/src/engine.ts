/**
 * DNA Engine — event-sourced execution engine.
 * Framework-agnostic: works with any JS runtime + any SQL database.
 */
import { withSpanAsync } from "./tracer.js";
import { PostgresStore, type PostgresStoreOptions } from "./postgres_store.js";
import type { Command, EngineConfig, LedgerEntry, Response, Wallet } from "./types.js";

export interface EngineOptions extends PostgresStoreOptions {
  config?: Partial<EngineConfig>;
}

export class Engine {
  protected readonly store: PostgresStore;

  constructor(pool: PostgresStore | PostgresStoreOptions) {
    if (pool instanceof PostgresStore) {
      this.store = pool;
    } else {
      this.store = new PostgresStore(pool.pool, pool.config);
    }
  }

  /** Run all pending migrations. Call once on startup. */
  async migrate(): Promise<void> {
    await this.store.migrate();
  }

  /**
   * Execute a command atomically.
   *
   * Guarantees:
   * - Idempotent: same idempotency key → same response (cached)
   * - Serialized: per-workspace via row-level locking
   * - Consistent: atomic commit (event + ledger + wallet + outbox)
   * - Policy-enforced: daily spend limits per workspace
   */
  async execute(cmd: Command): Promise<Response> {
    return withSpanAsync("dna.execute", async (span) => {
      span.setAttribute("workspace_id", cmd.workspaceId);
      span.setAttribute("type", cmd.type);
      span.setAttribute("idempotency_key", cmd.idempotencyKey);

      const resp = await this.store.execute(cmd);
      span.setAttribute("execution_id", resp.executionId);
      return resp;
    });
  }

  /** Get current wallet balance. */
  async getBalance(workspaceId: string): Promise<bigint> {
    return this.store.getBalanceOnly(workspaceId);
  }

  /**
   * Credit a workspace wallet (e.g., topup, refund).
   * Does NOT go through the command pipeline — direct mutation.
   */
  async credit(workspaceId: string, amount: bigint, referenceId: string): Promise<Wallet> {
    if (amount <= 0n) throw new Error("Credit amount must be positive");

    return withSpanAsync("dna.credit", async (span) => {
      span.setAttribute("workspace_id", workspaceId);
      span.setAttribute("amount", String(amount));

      const entry: LedgerEntry = {
        entryId: crypto.randomUUID(),
        workspaceId,
        direction: "credit",
        amount,
        referenceId,
        createdAt: new Date(),
      };

      await this.store.transaction(async (tx) => {
        // Ensure wallet exists
        await tx.exec(
          `INSERT INTO dna_wallets (workspace_id, balance) VALUES ($1, 0)
           ON CONFLICT DO NOTHING`,
          [workspaceId],
        );

        // Credit
        await tx.query(
          `UPDATE dna_wallets SET balance = balance + $1, updated_at = NOW()
           WHERE workspace_id = $2`,
          [String(amount), workspaceId],
        );

        // Record in ledger
        await tx.query(
          `INSERT INTO dna_ledger (entry_id, workspace_id, direction, amount, reference_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [entry.entryId, entry.workspaceId, entry.direction, String(entry.amount), entry.referenceId, entry.createdAt],
        );
      });

      const balance = await this.store.getBalanceOnly(workspaceId);
      return { workspaceId, balance, createdAt: new Date(), updatedAt: new Date() };
    });
  }

  /**
   * Process pending outbox messages.
   * Call periodically from a background worker / cron.
   *
   * @param handler Return true if processed successfully (marks as done).
   * @param limit Max messages per batch. Default: 100.
   * @returns Number of messages successfully processed.
   */
  async processOutbox(
    handler: (topic: string, payload: unknown) => Promise<boolean>,
    limit = 100,
  ): Promise<number> {
    return this.store.processOutbox(handler, limit);
  }

  /**
   * Get ledger history for a workspace.
   */
  async getHistory(workspaceId: string, limit = 50): Promise<LedgerEntry[]> {
    return this.store.getHistory(workspaceId, limit);
  }

  /**
   * Reconcile wallet balance vs ledger sum.
   * Use for debugging, cron jobs, or alerting on drift.
   */
  async reconcile(workspaceId: string): Promise<{
    wallet: bigint;
    ledger: bigint;
    match: boolean;
    drift: bigint;
  }> {
    return this.store.reconcile(workspaceId);
  }

  /**
   * Delete expired idempotency records.
   * Call periodically (e.g., daily cron).
   */
  async cleanupIdempotency(): Promise<void> {
    await this.store.cleanupIdempotency();
  }
}
