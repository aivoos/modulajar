/**
 * Shared types used across the DNA package.
 * Framework-agnostic — works with any runtime (Bun, Node, Deno, CF Workers).
 */

// ─── Primitives ─────────────────────────────────────────────────────────────

export type Timestamp = Date;
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = JsonValue[];

// ─── Branded IDs (nominal types — prevent mixing up IDs) ─────────────────────
// We use string intersection with a unique symbol tag instead of extending String
// to avoid index signature conflicts.

declare const __brand: unique symbol;

export type Brand<T extends string, B extends symbol> = T & { readonly [__brand]: B };

export type WorkspaceID = Brand<string, symbol>;
export type ActorID = Brand<string, symbol>;
export type ExecutionID = Brand<string, symbol>;
export type IdempotencyKey = Brand<string, symbol>;

export function brand<T extends string>(value: T): T {
  return value;
}

export function parseWorkspaceID(value: string): WorkspaceID {
  if (!value?.trim()) throw new Error("WorkspaceID cannot be empty");
  return value as WorkspaceID;
}

export function parseActorID(value: string): ActorID {
  if (!value?.trim()) throw new Error("ActorID cannot be empty");
  return value as ActorID;
}

export function parseExecutionID(value: string): ExecutionID {
  return value as ExecutionID;
}

export function parseIdempotencyKey(value: string): IdempotencyKey {
  if (!value?.trim()) throw new Error("IdempotencyKey cannot be empty");
  return value as IdempotencyKey;
}

// ─── Command ─────────────────────────────────────────────────────────────────

export interface Command<
  TType extends string = string,
  TPayload extends JsonObject = JsonObject,
> {
  workspaceId: string;
  actorId: string;
  type: TType;
  payload: TPayload;
  idempotencyKey: string;
  /** Custom cost override. Defaults to 1n. Set to 0n to skip balance deduction. */
  cost?: bigint;
}

// ─── Response ────────────────────────────────────────────────────────────────

export interface Receipt {
  receiptId: string;
  eventId: string;
  amount: bigint;
  createdAt: Date;
}

export interface Response {
  executionId: string;
  status: "success" | "error";
  receipts: Receipt[];
  balanceAfter: bigint;
  error?: string;
}

// ─── Event (Event Sourcing) ───────────────────────────────────────────────────

export interface Event<TPayload extends JsonObject = JsonObject> {
  eventId: string;
  executionId: string;
  workspaceId: string;
  actorId: string;
  type: string;
  payload: TPayload;
  createdAt: Date;
}

// ─── Ledger ──────────────────────────────────────────────────────────────────

export type LedgerDirection = "credit" | "debit";

export interface LedgerEntry {
  entryId: string;
  workspaceId: string;
  direction: LedgerDirection;
  amount: bigint;
  referenceId: string;
  createdAt: Date;
}

// ─── Wallet ──────────────────────────────────────────────────────────────────

export interface Wallet {
  workspaceId: string;
  balance: bigint;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Policy ──────────────────────────────────────────────────────────────────

export interface Policy {
  workspaceId: string;
  dailyLimit: bigint;
  currentSpend: bigint;
  lastReset: Date;
}

// ─── Outbox ──────────────────────────────────────────────────────────────────

export interface OutboxMessage {
  id: string;
  topic: string;
  payload: JsonValue;
  createdAt: Date;
  processed: boolean;
}

// ─── Idempotency ─────────────────────────────────────────────────────────────

export interface IdempotencyRecord {
  key: string;
  response: Response;
  createdAt: Date;
  expiresAt: Date;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface EngineConfig {
  defaultCost?: bigint;
  idempotencyTTL?: number;
  initialWalletBalance?: bigint;
  defaultDailyLimit?: bigint;
  isolationLevel?: "read committed" | "repeatable read";
}

// ─── Tracer ──────────────────────────────────────────────────────────────────

export interface Span {
  end(): void;
  setAttribute(key: string, value: JsonValue): void;
  recordError(error: Error): void;
}

export interface Tracer {
  startSpan(name: string, attrs?: JsonObject): Span;
}