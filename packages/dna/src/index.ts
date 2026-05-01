/**
 * @modulajar/dna — Generic SaaS Architecture DNA
 *
 * Framework-agnostic patterns for building reliable SaaS products:
 * - Event-sourced execution engine with ledger
 * - Idempotency & deduplication
 * - Outbox pattern for reliable events
 * - Wallet & policy engine
 * - Reconciliation & audit trail
 *
 * Usage:
 *   import { Engine, PostgresStore } from "@modulajar/dna";
 *
 *   const store = new PostgresStore({ pool: myPgPool });
 *   const engine = new Engine(store);
 *   await engine.migrate();
 *
 *   const resp = await engine.execute({
 *     workspaceId: "ws_123",
 *     actorId: "actor_456",
 *     type: "modul.generate",
 *     payload: { mapel: "Matematika" },
 *     idempotencyKey: "idem_789",
 *   });
 */

// ─── Public API ────────────────────────────────────────────────────────────────

export type { EngineConfig, Command, Response, Receipt } from "./types.js";
export type { PgPool, PgTx, PostgresStoreOptions } from "./postgres_store.js";
export { PostgresStore, ErrInsufficientBalance, ErrPolicyLimitExceeded } from "./postgres_store.js";
export type { EngineOptions } from "./engine.js";
export { Engine } from "./engine.js";
export { setGlobalTracer, getTracer, withSpan } from "./tracer.js";
export type { Tracer, Span } from "./types.js";