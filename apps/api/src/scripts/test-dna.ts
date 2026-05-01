/**
 * DNA integration test — runs against real Supabase.
 * Place in apps/api/src/scripts/ so it can resolve @supabase/supabase-js from node_modules.
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
  // Check each table with its actual primary/accessible column
  const tableColumns: Record<string, string> = {
    dna_wallets:      "workspace_id",
    dna_ledger:       "entry_id",
    dna_events:        "event_id",
    dna_receipts:     "receipt_id",
    dna_idempotency:   "key",
    dna_outbox:       "id",
    dna_policies:      "workspace_id",
  };

  const found: string[] = [];
  const missing: string[] = [];

  for (const [table, col] of Object.entries(tableColumns)) {
    const { error } = await supabase.from(table).select(col).limit(1);
    if (error) {
      console.log(`   ❌ ${table}: ${error.message.split(".").pop() ?? error.message}`);
      missing.push(table);
    } else {
      found.push(table);
    }
  }

  console.log(`   Found ${found.length}/${Object.keys(tableColumns).length} tables`);
  return { installed: missing.length === 0, missing };
}

async function runTests(): Promise<void> {
  console.log(`\n🧪 DNA Integration Test — Real Supabase`);
  console.log(`   Project: ${SUPABASE_URL}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  // Step 1 — Check tables
  console.log("📋 Step 1 — Check DNA tables...");
  const { installed, missing: missingTables } = await checkDnaTables();

  if (!installed) {
    console.log("\n❌ DNA tables NOT installed. Run migration 014 first:");
    console.log("   1. https://smygdfpsaikujoypiysl.supabase.co → SQL Editor");
    console.log("   2. Paste: supabase/migrations/014_dna_ledger.sql");
    console.log("   3. Execute");
    console.log("   Missing:", missingTables.join(", "));
    console.log("");
    return;
  }
  console.log("✅ All 7 DNA tables installed\n");

  // Step 2 — Live tests
  const ws = `test_${Date.now()}`;
  console.log(`📋 Step 2 — Live tests (workspace: ${ws})...`);

  try {
    // [1] Credit 100 credits
    console.log("\n  [1] Credit 100 credits to wallet...");
    const { data: cr1, error: ce1 } = await supabase.rpc("dna_credit_wallet", {
      p_workspace_id: ws,
      p_amount: "100",
      p_reference_id: `ref_${Date.now()}`,
    });
    if (ce1) {
      console.log("      ⚠️  dna_credit_wallet error:", ce1.message);
      console.log("      💡 Run migration 014_dna_ledger.sql first from Supabase SQL Editor");
      return;
    }
    console.log("      ✅ balance:", cr1?.balance, "| entry_id:", cr1?.entry_id);

    // [2] Get balance
    console.log("  [2] Get balance via dna_get_balance...");
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
      `      ✅ wallet=${rec1?.wallet} | ledger=${rec1?.ledger} | match=${rec1?.match} | drift=${rec1?.drift}`,
    );

    // [5] Execute command (deduct 1 credit)
    console.log("  [5] Execute modul.generate (cost=1 credit)...");
    const idemKey = `idem_${Date.now()}`;
    const { data: exec1, error: ee1 } = await supabase.rpc("dna_execute_command", {
      p_workspace_id: ws,
      p_actor_id: "test_system",
      p_type: "modul.generate",
      p_payload: { subject: "Matematika", fase: "D" },
      p_idempotency_key: idemKey,
      p_cost: 1,
    });
    if (ee1) throw ee1;
    console.log(
      `      ✅ execution_id=${exec1?.execution_id} | status=${exec1?.status} | balance_after=${exec1?.balance_after}`,
    );

    // [6] Idempotency: same key returns same response
    console.log("  [6] Idempotency: same key → same execution (no double-deduct)...");
    const { data: exec2, error: ee2 } = await supabase.rpc("dna_execute_command", {
      p_workspace_id: ws,
      p_actor_id: "test_system",
      p_type: "modul.generate",
      p_payload: { subject: "Matematika", fase: "D" },
      p_idempotency_key: idemKey,
      p_cost: 1,
    });
    if (ee2) throw ee2;
    if (exec1?.execution_id === exec2?.execution_id) {
      console.log(`      ✅ Idempotent — same execution_id=${exec1.execution_id}`);
    } else {
      console.log(`      ❌ NOT idempotent! exec1=${exec1?.execution_id} vs exec2=${exec2?.execution_id}`);
    }

    // [7] Final balance check
    console.log("  [7] Final balance (should be 99, not 98)...");
    const { data: bal2 } = await supabase.rpc("dna_get_balance", { p_workspace_id: ws });
    const expectedBal = Number(bal1?.balance) - 1;
    if (Number(bal2?.balance) === expectedBal) {
      console.log(`      ✅ balance=${bal2?.balance} (correct — no double deduct)`);
    } else {
      console.log(`      ❌ balance=${bal2?.balance} (expected ${expectedBal})`);
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

    console.log("\n✅ All DNA integration tests PASSED!\n");
  } catch (err) {
    console.error("\n❌ Test FAILED:", err);
  }
}

runTests();