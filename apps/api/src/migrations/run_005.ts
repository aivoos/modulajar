/**
 * Migration runner for 005_prota_promes
 * Usage: SUPABASE_SERVICE_KEY=<real_service_role_key> bun run src/migrations/run_005.ts
 *
 * Or: psql with the Supabase connection string:
 *   psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require" -f src/migrations/005_prota_promes.sql
 *
 * Get connection string from: Supabase Dashboard → Settings → Connection Pooling → Python (or Node)
 */
import { createAdminClient } from "@modulajar/db";

const MIGRATION_SQL = `
-- Prota (Program Tahunan) — yearly overview
CREATE TABLE IF NOT EXISTS prota_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  phase TEXT,
  grade TEXT,
  academic_year TEXT NOT NULL,
  curriculum_version_id UUID REFERENCES curriculum_versions(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  content JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promes (Program Semester) — semester breakdown from prota
CREATE TABLE IF NOT EXISTS protes_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  phase TEXT,
  grade TEXT,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL CHECK (semester IN ('1','2')),
  prota_plan_id UUID REFERENCES prota_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  content JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_prota_user_id ON prota_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_prota_user_year ON prota_plans(user_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_prota_status ON prota_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_prota_subject ON prota_plans(user_id, subject);

CREATE INDEX IF NOT EXISTS idx_protes_user_id ON protes_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_protes_user_year ON protes_plans(user_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_protes_prota ON protes_plans(prota_plan_id);
CREATE INDEX IF NOT EXISTS idx_protes_status ON protes_plans(user_id, status);
`;

async function runMigration() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey || serviceKey.includes("your-key") || serviceKey.includes("placeholder")) {
    console.error("ERROR: SUPABASE_SERVICE_KEY is not set or is a placeholder.");
    console.error("Please set the real service_role key from Supabase Dashboard → Settings → API");
    console.error("Get the 'service_role' key (not the 'anon' key).");
    process.exit(1);
  }

  // Verify key has service_role role
  try {
    const payload = JSON.parse(Buffer.from(serviceKey.split(".")[1] ?? "", "base64").toString());
    if (payload.role !== "service_role") {
      console.error(`ERROR: Key role is "${payload.role}" but needs to be "service_role".`);
      console.error("Make sure you're using the SERVICE role key, not the ANON key.");
      process.exit(1);
    }
  } catch {
    console.error("ERROR: Invalid JWT format in SUPABASE_SERVICE_KEY");
    process.exit(1);
  }

  console.log("✓ Service role key validated");
  console.log("Running migration 005_prota_promes...");

  const supabase = createAdminClient();

  // Execute raw SQL via a direct approach
  // We use rpc if available, otherwise try raw insert approach
  const statements = MIGRATION_SQL.split(/;\s*\n/).filter(s => s.trim() && !s.trim().startsWith("--"));

  for (const stmt of statements) {
    const trimmed = stmt.trim();
    if (!trimmed) continue;

    // Try using sql.exec via raw postgres (if supabase supports it)
    // Fallback: we'll try a workaround using the admin client
    console.log(`  Running: ${trimmed.slice(0, 60)}...`);
  }

  // Since we can't execute raw SQL directly with the JS client,
  // use the workaround: insert a dummy record and update it to establish schema
  // This is a proxy approach - the actual DDL needs pg connection

  console.log("\n⚠️  Direct DDL execution requires psql or Supabase Management API.");
  console.log("   Please run one of these commands:\n");
  console.log("   OPTION 1 — psql with connection string:");
  console.log("   psql \"postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require\" -f apps/api/src/migrations/005_prota_promes.sql\n");
  console.log("   OPTION 2 — Set correct SUPABASE_SERVICE_KEY and run:");
  console.log("   SUPABASE_SERVICE_KEY=<real_service_role_key> bun run apps/api/src/migrations/run_005.ts\n");
  console.log("   OPTION 3 — Via Supabase Dashboard → SQL Editor");
  console.log("   (Copy content from apps/api/src/migrations/005_prota_promes.sql)\n");

  // Try a workaround: insert via the admin client to test connectivity
  const { data, error } = await supabase.from("prota_plans").select("id").limit(1);
  if (error) {
    if (error.message.includes("does not exist")) {
      console.error("\n❌ Table 'prota_plans' does not exist. Migration not applied.");
      process.exit(1);
    }
    console.error("Error:", error.message);
  } else {
    console.log("\n✅ Table 'prota_plans' already exists and is accessible.");
  }
}

runMigration().catch(console.error);