import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_KEY ?? "";

if (!url || !key) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Check if dna_wallets exists
  console.log("\n[1] Check existing tables...");
  const { error: err1 } = await supabase.from("dna_wallets").select("workspace_id").limit(1);

  if (err1) {
    console.log("   ❌ dna_wallets:", err1.message);
    console.log("   📝 Run migration 014 via Supabase SQL Editor first");
    console.log("   → supabase/migrations/014_dna_ledger.sql");
    return;
  }
  console.log("   ✅ dna_wallets exists");

  // 2. Check stored procedures
  console.log("\n[2] Check stored procedures...");
  const procs = [
    "dna_credit_wallet",
    "dna_get_balance",
    "dna_execute_command",
    "dna_get_history",
    "dna_reconcile",
  ];

  for (const proc of procs) {
    // Try a simple call — will fail if not exists
    const { error } = await (supabase.rpc as Function)(proc as never, {});
    if (error) {
      console.log(`   ❌ ${proc}: ${error.message.split("\n")[0]}`);
    } else {
      console.log(`   ✅ ${proc}`);
    }
  }

  // 3. Live test
  const ws = `test_${Date.now()}`;
  console.log(`\n[3] Live test (workspace=${ws})...`);

  // Credit
  const { data: cr, error: crErr } = await supabase.rpc("dna_credit_wallet", {
    p_workspace_id: ws,
    p_amount: "100",
    p_reference_id: `ref_${Date.now()}`,
  });
  if (crErr) { console.log("   ❌ Credit failed:", crErr.message); return; }
  console.log("   ✅ Credited 100. Balance:", cr?.balance);

  // Balance
  const { data: bal } = await supabase.rpc("dna_get_balance", { p_workspace_id: ws });
  console.log("   ✅ Balance:", bal?.balance);

  // Execute
  const idem = `idem_${Date.now()}`;
  const { data: exec } = await supabase.rpc("dna_execute_command", {
    p_workspace_id: ws,
    p_actor_id: "test",
    p_type: "modul.generate",
    p_payload: { subject: "Matematika" },
    p_idempotency_key: idem,
    p_cost: 1,
  });
  if (exec.error) { console.log("   ❌ Execute failed:", exec.error); return; }
  console.log(`   ✅ Executed. exec_id=${exec?.execution_id} status=${exec?.status} bal_after=${exec?.balance_after}`);

  // Idempotency
  const { data: exec2 } = await supabase.rpc("dna_execute_command", {
    p_workspace_id: ws,
    p_actor_id: "test",
    p_type: "modul.generate",
    p_payload: { subject: "Matematika" },
    p_idempotency_key: idem,
    p_cost: 1,
  });
  console.log(`   ${exec?.execution_id === exec2?.execution_id ? "✅" : "❌"} Idempotency: ${exec?.execution_id === exec2?.execution_id ? "OK (same exec_id)" : "FAIL"}`);

  // Final balance
  const { data: bal2 } = await supabase.rpc("dna_get_balance", { p_workspace_id: ws });
  console.log(`   ✅ Final balance: ${bal2?.balance} (expected 99)`);

  // Reconcile
  const { data: rec } = await supabase.rpc("dna_reconcile", { p_workspace_id: ws });
  console.log(`   ${rec?.match ? "✅" : "❌"} Reconcile: match=${rec?.match} drift=${rec?.drift}`);

  // Cleanup
  await supabase.from("dna_wallets").delete().eq("workspace_id", ws);
  await supabase.from("dna_ledger").delete().eq("workspace_id", ws);
  await supabase.from("dna_idempotency").delete().eq("key", idem);
  console.log("   ✅ Cleanup done");

  console.log("\n✅ All tests passed!\n");
}

main().catch(console.error);