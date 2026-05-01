/**
 * DNA Routes — /api/dna/*
 * Wallet, ledger, idempotency, policy — generic DNA engine exposed as REST API.
 */
import { Elysia } from "elysia";
import { createAdminClient } from "@modulajar/db";
import { dnaGetBalance, dnaGetHistory, dnaReconcile, getDnaSummary } from "../lib/dna-client.js";

function getUserId(request: Request): string | null {
  return request.headers.get("X-User-ID") ?? null;
}

export const dnaRoutes = new Elysia({ prefix: "dna" })

  // GET /api/dna/balance — current wallet balance
  .get("/balance", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const balance = await dnaGetBalance(supabase, userId);

    return {
      workspace_id: userId,
      balance: Number(balance),
      balance_formatted: `${balance} credits`,
      enough_for_generation: balance >= 1n,
    };
  })

  // GET /api/dna/history — ledger entries
  .get("/history", async ({ request, set, query }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const limit = Math.min(parseInt(query["limit"] ?? "50", 10), 200);

    const entries = await dnaGetHistory(supabase, userId, limit);

    return {
      workspace_id: userId,
      entries: entries.map((e) => ({
        entry_id: e.entry_id,
        direction: e.direction,
        amount: Number(e.amount),
        reference_id: e.reference_id,
        created_at: e.created_at,
      })),
      count: entries.length,
    };
  })

  // GET /api/dna/summary — balance + history + reconciliation
  .get("/summary", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const summary = await getDnaSummary(supabase, userId);

    return {
      workspace_id: userId,
      balance: Number(summary.balance),
      reconciled: {
        wallet: Number(summary.reconciled.wallet),
        ledger: Number(summary.reconciled.ledger),
        match: summary.reconciled.match,
        drift: Number(summary.reconciled.drift),
      },
      recent: summary.recentEntries.map((e) => ({
        entry_id: e.entry_id,
        direction: e.direction,
        amount: Number(e.amount),
        reference_id: e.reference_id,
        created_at: e.created_at,
      })),
    };
  })

  // GET /api/dna/reconcile — audit reconciliation
  .get("/reconcile", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const result = await dnaReconcile(supabase, userId);

    return {
      workspace_id: userId,
      wallet: Number(result.wallet),
      ledger: Number(result.ledger),
      match: result.match,
      drift: Number(result.drift),
      healthy: result.match,
    };
  })

  // POST /api/dna/cleanup — cleanup expired idempotency records (admin/cron)
  .post("/cleanup", async ({ request, set }) => {
    const userId = getUserId(request);
    if (!userId) { set.status = 401; return { error: "unauthorized" }; }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("dna_cleanup_idempotency");

    if (error) { set.status = 500; return { error: error.message }; }

    return {
      deleted: data as number,
      cleaned_at: new Date().toISOString(),
    };
  });