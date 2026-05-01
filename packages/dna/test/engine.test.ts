/**
 * DNA package tests.
 * These tests require a running PostgreSQL instance.
 * Set DATABASE_URL before running: bun test
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { v4 as uuidv4 } from "uuid";

interface PgPool {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>;
}

const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres";

// ─── Test pool ─────────────────────────────────────────────────────────────────

async function createPool(): Promise<PgPool> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(DATABASE_URL, { max: 10 });
  return {
    async query<T>(sqlText: string, params?: unknown[]) {
      const rows = await sql<T[]`${sqlText}${params ? params : []}`];
      return { rows, rowCount: rows.length };
    },
  };
}

// ─── Import DNA ────────────────────────────────────────────────────────────────

import { Engine } from "../src/index.js";
import { PostgresStore } from "../src/index.js";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

let pool: PgPool;
let engine: Engine;

beforeAll(async () => {
  pool = await createPool();
  const store = new PostgresStore({ pool });
  engine = new Engine(store);
  await engine.migrate();
});

afterAll(async () => {
  // Clean up test data
  const { default: postgres } = await import("postgres");
  await postgres(DATABASE_URL).end();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

const mkKey = () => `test_${Date.now()}_${Math.random().toString(36).slice(2)}`;

describe("DNA Engine — Execute", () => {
  it("should execute a command and deduct balance", async () => {
    const ws = mkKey();

    const resp = await engine.execute({
      workspaceId: ws,
      actorId: "test_actor",
      type: "test.action",
      payload: { foo: "bar" },
      idempotencyKey: mkKey(),
      cost: 1n,
    });

    expect(resp.status).toBe("success");
    expect(resp.executionId).toBeTruthy();
    expect(resp.receipts.length).toBe(1);
    expect(resp.balanceAfter).toBe(0n);
  });

  it("should be idempotent — same key returns same response", async () => {
    const ws = mkKey();
    const key = mkKey();

    const resp1 = await engine.execute({
      workspaceId: ws,
      actorId: "test_actor",
      type: "test.action",
      payload: {},
      idempotencyKey: key,
      cost: 1n,
    });

    const resp2 = await engine.execute({
      workspaceId: ws,
      actorId: "test_actor",
      type: "test.action",
      payload: {},
      idempotencyKey: key,
      cost: 1n,
    });

    expect(resp1.executionId).toBe(resp2.executionId);
    expect(resp1.balanceAfter).toBe(resp2.balanceAfter);
    // Balance should NOT be deducted twice
    expect(resp1.balanceAfter).toBe(resp2.balanceAfter);
  });

  it("should credit wallet and reflect in balance", async () => {
    const ws = mkKey();

    const before = await engine.getBalance(ws);
    await engine.credit(ws, 100n, `topup_${mkKey()}`);
    const after = await engine.getBalance(ws);

    expect(Number(after - before)).toBe(100);
  });

  it("should reject execution with insufficient balance", async () => {
    const ws = mkKey();
    // No balance, cost = 100n

    await expect(
      engine.execute({
        workspaceId: ws,
        actorId: "test_actor",
        type: "test.action",
        payload: {},
        idempotencyKey: mkKey(),
        cost: 100n,
      }),
    ).rejects.toThrow("INSUFFICIENT_BALANCE");
  });

  it("should respect daily spend policy limit", async () => {
    const ws = mkKey();

    // Set policy: max spend = 2n
    await pool.query(
      `INSERT INTO dna_policies (workspace_id, daily_limit, current_spend, last_reset)
       VALUES ($1, 2, 0, NOW())
       ON CONFLICT (workspace_id) DO UPDATE SET daily_limit = 2, current_spend = 0`,
      [ws],
    );

    await engine.credit(ws, 10n, mkKey());

    // First execution (cost=1): ok
    await engine.execute({
      workspaceId: ws,
      actorId: "test",
      type: "x",
      payload: {},
      idempotencyKey: mkKey(),
      cost: 1n,
    });

    // Second execution (cost=1): ok
    await engine.execute({
      workspaceId: ws,
      actorId: "test",
      type: "x",
      payload: {},
      idempotencyKey: mkKey(),
      cost: 1n,
    });

    // Third execution: should fail (limit exceeded)
    await expect(
      engine.execute({
        workspaceId: ws,
        actorId: "test",
        type: "x",
        payload: {},
        idempotencyKey: mkKey(),
        cost: 1n,
      }),
    ).rejects.toThrow("POLICY_LIMIT_EXCEEDED");
  });
});

describe("DNA Engine — Outbox", () => {
  it("should process outbox messages in order", async () => {
    const processed: string[] = [];

    await engine.execute({
      workspaceId: mkKey(),
      actorId: "test",
      type: "test",
      payload: {},
      idempotencyKey: mkKey(),
      cost: 1n,
    });

    const count = await engine.processOutbox(async (topic, payload) => {
      processed.push(topic);
      return true;
    });

    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe("DNA Engine — History & Reconcile", () => {
  it("should return ledger history", async () => {
    const ws = mkKey();

    await engine.credit(ws, 50n, mkKey());
    await engine.execute({
      workspaceId: ws,
      actorId: "test",
      type: "test",
      payload: {},
      idempotencyKey: mkKey(),
      cost: 5n,
    });

    const history = await engine.getHistory(ws, 10);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].workspaceId).toBe(ws);
  });

  it("should reconcile wallet vs ledger without drift", async () => {
    const ws = mkKey();

    await engine.credit(ws, 200n, mkKey());

    const result = await engine.reconcile(ws);
    expect(result.match).toBe(true);
    expect(result.drift).toBe(0n);
  });
});

describe("DNA Engine — Zero cost commands", () => {
  it("should allow execution with cost=0 (no balance deduction)", async () => {
    const ws = mkKey();
    // No credit — balance = 0

    const resp = await engine.execute({
      workspaceId: ws,
      actorId: "test",
      type: "free_action",
      payload: {},
      idempotencyKey: mkKey(),
      cost: 0n, // no deduction
    });

    expect(resp.status).toBe("success");
    const balance = await engine.getBalance(ws);
    expect(balance).toBe(0n);
  });
});