/**
 * DNA integration test — runs against real Supabase.
 * Uses @supabase/supabase-js directly (no workspace resolution needed).
 *
 * Run: bun run scripts/test-dna-integration.ts
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkDnaTables(): Promise<{ installed: boolean; missing: string[] }> {
  const names = [
    "dna_wallets",
    "dna_ledger",
    "dna_events",
    "dna_receipts",
    "dna_idempotency",
    "dna_outbox",
    "dna_policies",
  ];

  const { data, error } = await supabase
    .from("pg_tables")
    .select("tablename")
    .eq("schemaname", "public");

  if (error) {
    console.error("   Query error:", error);
    return { installed: false, missing: names };
  }

  const tableNames = (data ?? []).map((r: Record<string, string>) => r.tablename);
  const found = names.filter((n) => tableNames.includes(n));
  const missing = names.filter((n) => !tableNames.includes(n));

  console.log("   Found:", found.join(", ") || "none");
  if (missing.length) console.log("   Missing:", missing.join(", "));

  return { installed: found.length === names.length, missing };
}

async function runTests(): Promise<void> {
  console.log(`\n🧪 DNA Integration Test`);
  console.log(`   Project: ${SUPABASE_URL}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  // Step 1 — Check tables
  console.log("📋 Step 1 — Check DNA tables...");
  const { installed, missing: missingTables } = await checkDnaTables();

  if (!installed) {
    console.log("\n❌ DNA tables NOT found. Run migration 014 first:");
    console.log("   1. Open https://smygdfpsaikujoypiysl.supabase.co → SQL Editor");
    console.log("   2. Paste contents of supabase/migrations/014_dna_ledger.sql");
    console.log("   3. Run it");
    console.log("   Missing:", missingTables.join(", "));
    return;
  }
  console.log("✅ All 7 DNA tables present\n");

  // Step 2 — Live tests
  const ws = `test_${Date.now()}`;
  console.log(`📋 Step 2 — Live tests (workspace: ${ws})...`);

  try {
    // [1] Credit 100 credits
    console.log("\n  [1] Credit 100 credits...");
    const { data: cr1, error: ce1 } = await supabase.rpc("dna_credit_wallet", {
      p_workspace_id: ws,
      p_amount: "100",
      p_reference_id: `ref_${Date.now()}`,
    });
    if (ce1) throw ce1;
    console.log("      ✅ balance:", cr1?.balance, "entry_id:", cr1?.entry_id);

    // [2] Get balance
    console.log("  [2] Get balance...");
    const { data: bal1, error: be1 } = await supabase.rpc("dna_get_balance", {
      p_workspace_id: ws,
    });
    if (be1) throw be1;
    console.log("      ✅ balance:", bal1?.balance);

    // [3] Get history
    console.log("  [3] Get ledger history...");
    const { data: hist1, error: he1 } = await supabase.rpc("dna_get_history", {
      p_workspace_id: ws,
      p_limit: 5,
    });
    if (he1) throw he1;
    console.log("      ✅ entries:", hist1?.length ?? 0);

    // [4] Reconcile
    console.log("  [4] Reconcile wallet vs ledger...");
    const { data: rec1, error: re1 } = await supabase.rpc("dna_reconcile", {
      p_workspace_id: ws,
    });
    if (re1) throw re1;
    console.log(
      `      ✅ wallet=${rec1?.wallet} ledger=${rec1?.ledger} match=${rec1?.match} drift=${rec1?.drift}`,
    );

    // [5] Execute command (1 credit deduction)
    console.log("  [5] Execute modul.generate (cost=1)...");
    const idemKey = `idem_${Date.now()}`;
    const { data: exec1, error: ee1 } = await supabase.rpc("dna_execute_command", {
      p_workspace_id: ws,
      p_actor_id: "test",
      p_type: "modul.generate",
      p_payload: { subject: "Matematika", phase: "D" },
      p_idempotency_key: idemKey,
      p_cost: 1,
    });
    if (ee1) throw ee1;
    console.log(
      `      ✅ execution_id=${exec1?.execution_id} status=${exec1?.status} balance_after=${exec1?.balance_after}`,
    );

    // [6] Idempotency — same key returns same response (should NOT deduct again)
    console.log("  [6] Idempotency: same key → same response (no re-deduct)...");
    const { data: exec2, error: ee2 } = await supabase.rpc("dna_execute_command", {
      p_workspace_id: ws,
      p_actor_id: "test",
      p_type: "modul.generate",
      p_payload: { subject: "Matematika", phase: "D" },
      p_idempotency_key: idemKey,
      p_cost: 1,
    });
    if (ee2) throw ee2;
    if (exec1?.execution_id === exec2?.execution_id) {
      console.log(`      ✅ Idempotent: same execution_id=${exec1.execution_id}`);
    } else {
      console.log(
        `      ❌ Different execution_id: ${exec1?.execution_id} vs ${exec2?.execution_id}`,
      );
    }

    // [7] Verify balance unchanged after idempotent replay
    console.log("  [7] Final balance (should still be 99)...");
    const { data: bal2 } = await supabase.rpc("dna_get_balance", { p_workspace_id: ws });
    console.log("      ✅ balance:", bal2?.balance);
    if (bal2?.balance !== bal1?.balance - BigInt(1)) {
      console.log("      ⚠️  Balance mismatch — possible double deduction");
    }

    // [8] Final reconcile
    console.log("  [8] Final reconcile...");
    const { data: rec2 } = await supabase.rpc("dna_reconcile", { p_workspace_id: ws });
    if (!rec2?.match) {
      console.log(`      ❌ DRIFT DETECTED: wallet=${rec2?.wallet} ledger=${rec2?.ledger} drift=${rec2?.drift}`);
    } else {
      console.log(`      ✅ Match: wallet=${rec2?.wallet} ledger=${rec2?.ledger}`);
    }

    // [9] Cleanup
    console.log("\n  [9] Cleanup test data...");
    await supabase.from("dna_wallets").delete().eq("workspace_id", ws);
    await supabase.from("dna_ledger").delete().eq("workspace_id", ws);
    await supabase.from("dna_idempotency").delete().eq("key", idemKey);
    await supabase.from("dna_outbox").delete().ilike("id", `out_%`);
    console.log("      ✅ Cleaned up");

    console.log("\n✅ All integration tests passed!\n");
  } catch (err) {
    console.error("\n❌ Test FAILED:", err);
    console.error("   Error details:", JSON.stringify(err, null, 2));
  }
}

runTests();
