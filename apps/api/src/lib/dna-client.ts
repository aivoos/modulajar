/**
 * DNA Client — wraps @modulajar/dna Engine for Modulajar's Supabase setup.
 *
 * Approach: All DNA operations run inside Postgres functions (RPC).
 * This is the right abstraction for Supabase because:
 * 1. Postgres functions can use transactions natively
 * 2. Supabase RPC calls them with service_role (bypasses RLS — correct for server-side)
 * 3. No raw SQL needed — fully compatible with Supabase connection pooling
 *
 * SQL operations are defined in migration 014_dna_ledger.sql as stored procedures.
 */
import { createAdminClient } from "@modulajar/db";

// ─── RPC wrappers for Supabase ───────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createAdminClient>;

interface DnaResponse {
  execution_id: string;
  status: "success" | "error";
  receipts: Array<{ receipt_id: string; event_id: string; amount: string; created_at: string }>;
  balance_after: string;
  error?: string;
}

interface LedgerEntry {
  entry_id: string;
  workspace_id: string;
  direction: string;
  amount: string;
  reference_id: string;
  created_at: string;
}

interface ReconcileResult {
  wallet: string;
  ledger: string;
  match: boolean;
  drift: string;
}

// ─── RPC functions ───────────────────────────────────────────────────────────

/** Execute a DNA command via stored procedure (atomic transaction inside Postgres). */
export async function dnaExecute(
  supabase: SupabaseClient,
  params: {
    p_workspace_id: string;
    p_actor_id: string;
    p_type: string;
    p_payload: Record<string, unknown>;
    p_idempotency_key: string;
    p_cost: string; // BIGINT as string
  },
): Promise<DnaResponse> {
  const { data, error } = await supabase.rpc("dna_execute_command", {
    p_workspace_id: params.p_workspace_id,
    p_actor_id: params.p_actor_id,
    p_type: params.p_type,
    p_payload: params.p_payload,
    p_idempotency_key: params.p_idempotency_key,
    p_cost: params.p_cost,
  });
  if (error) throw error;
  return data as DnaResponse;
}

/** Credit wallet via stored procedure. */
export async function dnaCredit(
  supabase: SupabaseClient,
  params: {
    p_workspace_id: string;
    p_amount: string;
    p_reference_id: string;
    p_reference_type?: string;
  },
): Promise<{ balance: bigint; entry_id: string }> {
  const { data, error } = await supabase.rpc("dna_credit_wallet", {
    p_workspace_id: params.p_workspace_id,
    p_amount: params.p_amount,
    p_reference_id: params.p_reference_id,
    p_reference_type: params.p_reference_type ?? "topup",
  });
  if (error) throw error;
  const r = data as { balance: string; entry_id: string };
  return { balance: BigInt(r.balance), entry_id: r.entry_id };
}

/** Get current wallet balance. */
export async function dnaGetBalance(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<bigint> {
  const { data, error } = await supabase.rpc("dna_get_balance", { p_workspace_id: workspaceId });
  if (error) throw error;
  return BigInt((data as { balance: string }).balance ?? "0");
}

/** Get ledger history. */
export async function dnaGetHistory(
  supabase: SupabaseClient,
  workspaceId: string,
  limit = 50,
): Promise<LedgerEntry[]> {
  const { data, error } = await supabase.rpc("dna_get_history", {
    p_workspace_id: workspaceId,
    p_limit: limit,
  });
  if (error) throw error;
  return (data as LedgerEntry[]) ?? [];
}

/** Reconcile wallet vs ledger. */
export async function dnaReconcile(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<ReconcileResult> {
  const { data, error } = await supabase.rpc("dna_reconcile", { p_workspace_id: workspaceId });
  if (error) throw error;
  return data as ReconcileResult;
}

/** Process pending outbox messages. */
export async function dnaProcessOutbox(
  supabase: SupabaseClient,
  p_handler: (topic: string, payload: unknown) => Promise<boolean>,
  limit = 100,
): Promise<number> {
  // Outbox processing is done by a cron worker in cron.ts
  // This RPC marks processed = true for a given id
  const { data, error } = await supabase.rpc("dna_outbox_pending", { p_limit: limit });
  if (error) throw error;
  const messages = data as Array<{ id: string; topic: string; payload: unknown }>;
  let processed = 0;
  for (const msg of messages) {
    const ok = await p_handler(msg.topic, msg.payload);
    if (ok) {
      await supabase.rpc("dna_outbox_mark_processed", { p_id: msg.id });
      processed++;
    }
  }
  return processed;
}

// ─── Convenience helpers for Modulajar ─────────────────────────────────────

export interface ModulajarCommand {
  workspaceId: string;
  actorId: string;
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  cost?: bigint;
}

/** Charge AI module generation — deducts from DNA wallet. */
export async function chargeModuleGeneration(
  supabase: SupabaseClient,
  params: {
    userId: string;
    moduleId: string;
    subject: string;
    phase?: string;
  },
): Promise<{
  success: boolean;
  executionId?: string;
  balanceAfter?: bigint;
  error?: string;
}> {
  try {
    const resp = await dnaExecute(supabase, {
      p_workspace_id: params.userId,
      p_actor_id: "system",
      p_type: "modul.generate",
      p_payload: { moduleId: params.moduleId, subject: params.subject, phase: params.phase ?? "" },
      p_idempotency_key: `modul_generate_${params.moduleId}`,
      p_cost: "1",
    });

    return {
      success: resp.status === "success",
      executionId: resp.execution_id,
      balanceAfter: BigInt(resp.balance_after),
      error: resp.error,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("INSUFFICIENT_BALANCE")) {
      return { success: false, error: "INSUFFICIENT_BALANCE" };
    }
    if (msg.includes("POLICY_LIMIT_EXCEEDED")) {
      return { success: false, error: "POLICY_LIMIT_EXCEEDED" };
    }
    return { success: false, error: msg };
  }
}

/** Credit topup to DNA wallet (called after Xendit confirms payment). */
export async function creditTopup(
  supabase: SupabaseClient,
  params: {
    userId: string;
    topupId: string;
    amountIdr: number;
    aiCredits: number;
  },
): Promise<{
  success: boolean;
  balance?: bigint;
  error?: string;
}> {
  try {
    // Map IDR to DNA credits: Rp 10.000 = 3 credits = 3n
    const dnaCredits = BigInt(params.aiCredits);

    const result = await dnaCredit(supabase, {
      p_workspace_id: params.userId,
      p_amount: String(dnaCredits),
      p_reference_id: params.topupId,
      p_reference_type: "topup",
    });

    return { success: true, balance: result.balance };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Get DNA balance summary for a user. */
export async function getDnaSummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  balance: bigint;
  recentEntries: LedgerEntry[];
  reconciled: { wallet: bigint; ledger: bigint; match: boolean; drift: bigint };
}> {
  const [balance, entries, reconciled] = await Promise.all([
    dnaGetBalance(supabase, userId),
    dnaGetHistory(supabase, userId, 10),
    dnaReconcile(supabase, userId),
  ]);

  return {
    balance,
    recentEntries: entries,
    reconciled: {
      wallet: BigInt(reconciled.wallet),
      ledger: BigInt(reconciled.ledger),
      match: reconciled.match,
      drift: BigInt(reconciled.drift),
    },
  };
}