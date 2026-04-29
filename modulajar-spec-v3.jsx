import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// THE 10/10 MODEL
// Annual-first Freemium + Daily Habit Core + B2B School Anchor
//
// KENAPA INI 10/10:
//
// FEASIBLE  → 3 tier saja. Annual billing = tidak ada dunning complexity.
//             Tidak ada marketplace (no chicken-and-egg, no moderation queue).
//             Launch 12 hari.
//
// RETENSI   → Jurnal harian = daily active habit (seperti Duolingo).
//             Annual = 12x lebih retained dari monthly.
//             PMM deadline tiap semester = natural renewal urgency.
//             Sekolah plan = institution lock-in.
//
// STABLE    → Annual = predictable ARR (bukan lumpy like voucher).
//             School plan = B2B kontrak tahunan = sangat stable.
//             NRR > 100% possible: sekolah tambah guru = revenue naik.
//             Dua revenue streams: individual Pro + institutional School.
//
// FAST      → 12 hari ke launch (3 hari lebih cepat dari V1/V2).
//             Schema lebih simple dari V2 (hapus marketplace layer).
//             Billing annual = 1 payment per user per tahun.
//
// FIRST-MOVER → Teacher Assistant chatbot pertama di Indonesia.
//                No Indonesian edtech punya AI assistant untuk guru.
//                KM knowledge base + daily workflow integration = competitive moat.
// ─────────────────────────────────────────────────────────────────────────────

const BLUE = "#2563EB", BLUEDARK = "#1D4ED8", BLUEL = "#EFF6FF";
const GREEN = "#22C55E", GREENL = "#F0FDF4";
const AMBER = "#F59E0B", AMBERL = "#FFFBEB";
const RED   = "#EF4444", REDL   = "#FEF2F2";
const PURPLE = "#8B5CF6";

const PRICING = {
  free: {
    label:"Free",
    color:"#6B7280",
    price:0,
    desc:"Untuk coba",
    limits:"3 AI generate total (bukan per bulan — setelah itu upgrade)",
    features:["3× AI generate modul (lifetime trial)","Preview di app","Akses curated library (baca saja)"],
    locked:["Download PDF","Jurnal Harian","Input Nilai","Bukti PMM"],
    psychology:"3 generate cukup untuk rasakan value. Tidak 'free forever' = ada urgency to upgrade.",
  },
  pro: {
    label:"Pro",
    color:BLUE,
    monthly:99000,
    six_month:494000,
    annual:790000,
    monthly_equiv:99000,
    six_month_equiv:Math.round(494000/6),
    annual_equiv:Math.round(790000/12),
    desc:"Untuk guru aktif",
    anchor:"Rp 99.000/bulan — lebih murah dari segelas kopi",
    features:["30× AI generate modul/bulan (CP, TP, ATP, Activity, Asesmen)","Download PDF (A4, siap cetak)","Jurnal Harian (harian, 60 detik)","Absensi siswa per kelas","Input Nilai + Deskripsi AI","Paket Bukti PMM (ZIP untuk upload ke PMM)","Push notification reminder jurnal"],
    locked:[],
    ai_quota_per_month:30,
    psychology:"Annual = satu keputusan per tahun vs 12 keputusan bulanan. Terasa seperti one-time tapi recurring untuk kamu.",
  },
  school: {
    label:"Sekolah",
    color:GREEN,
    desc:"Untuk sekolah (B2B)",
    anchor:"Mulai Rp 49.000/guru/bulan — 51% discount dari Pro",
    // Per-guru pricing, annual billing, min 3 guru
    // Tier I: 3-10 guru Rp 89K/bln, Tier II: 11-25 Rp 79K, Tier III: 26-50 Rp 69K, Tier IV: 51-100 Rp 59K, Tier V: 100+ Rp 49K (custom)
    tiers: [
      { tier:"I",   range:"3-10",   per_guru_month:89000, per_guru_year:1068000, ai_quota:30 },
      { tier:"II",  range:"11-25",  per_guru_month:79000, per_guru_year:948000,  ai_quota:30 },
      { tier:"III", range:"26-50",  per_guru_month:69000, per_guru_year:828000,  ai_quota:30 },
      { tier:"IV",  range:"51-100", per_guru_month:59000, per_guru_year:708000,  ai_quota:30 },
      { tier:"V",   range:"100+",   per_guru_month:49000, per_guru_year:588000,   ai_quota:30, custom:true },
    ],
    min_guru:3,
    features:["Semua fitur Pro untuk semua guru","Dashboard Kepala Sekolah","Upload master jadwal sekolah","Laporan compliance kurikulum semua guru","Invoice resmi BOS (NPWP, PPN 11%)","Onboarding guru oleh tim kami","School invite: kepala sekolah invite guru ke plan"],
    psychology:"B2B = keputusan kepala sekolah / TU, bukan guru individual. Budget BOS. NRR > 100% kalau sekolah tambah guru.",
  },
};

// AI Strategy: Hybrid GPT-4o mini + o3-mini (BUKAN Claude)
// GPT-4o mini: $0.15/1M input, $0.60/1M output
// Per modul (~50K tokens): ~$0.0165 (~Rp 270) — 90% of tasks
// o3-mini: $1.10/1M input, $4.40/1M output — 10% tasks (validation, deskripsi nilai complex)
// Annual cost (500 Pro users × 20 modules): ~$322/tahun (~$5.4jt/thn)
// Skip Claude: 23x lebih mahal dari GPT-4o mini untuk quality similar
// Skip Eliza OS: chat agent framework, bukan structured content SaaS
// AI Strategy: Hybrid GPT-4o mini + o3-mini (BUKAN Claude)
// GPT-4o mini: $0.15/1M input, $0.60/1M output → ~Rp 443/generate avg (90% of tasks)
// o3-mini: ~Rp 2.000/generate — used only for validation/complex tasks (10%)
// Annual AI cost (500 Pro users × 30 gen/mo): 500 × 30 × 12 × 443 = ~$805/year
// Skip Claude: 23x lebih mahal, tidak ada quality benefit untuk structured generation
// Skip Eliza OS: chat agent framework, bukan structured content SaaS
const AI_COST = {
  gpt4o_mini_per_gen_idr: 270,   // simple tasks (90%)
  o3_mini_per_gen_idr: 2000,     // complex tasks (10%)
  avg_per_gen_idr: 443,           // weighted avg
  annual_ai_cost_500_users_usd: 805, // ~$805/year for 500 users × 30 gen/mo
};
const MARGIN = {
  pro:    { monthly_rev:99000, ai_cost:13290, margin_pct:Math.round((99000-13290)/99000*100) }, // 87%
  school: { avg_rev_per_guru_month:70000, ai_cost_per_guru:10632, margin_pct:Math.round((70000-10632)/70000*100) }, // 85%
};

// ─── WHY ANNUAL > MONTHLY > VOUCHER ──────────────────────────────────────────
const BILLING_COMPARISON = [
  {
    model:"Voucher (V2)",
    retention:"⭐⭐",
    revenue:"⭐⭐",
    complexity:"⭐⭐⭐⭐⭐ (paling simple)",
    verdict:"Lumpy revenue. Tidak ada lock-in. Guru beli pas butuh, tidak beli pas tidak butuh → unpredictable.",
    color:AMBER,
  },
  {
    model:"Monthly Subscription (V1)",
    retention:"⭐⭐⭐",
    revenue:"⭐⭐⭐⭐",
    complexity:"⭐⭐⭐ (dunning, grace period)",
    verdict:"Guru Indonesia tidak suka tagihan bulanan. Churn rate edtech Indonesia 40-60%/bulan. Dunning = support nightmare.",
    color:AMBER,
  },
  {
    model:"Annual Subscription ← INI",
    retention:"⭐⭐⭐⭐⭐",
    revenue:"⭐⭐⭐⭐⭐",
    complexity:"⭐⭐⭐⭐ (lebih simple dari monthly)",
    verdict:"Satu keputusan per tahun. Revenue predictable. No dunning (bayar di muka). PMM deadline = natural renewal urgency.",
    color:GREEN,
  },
];

// ─── RETENTION MECHANICS ──────────────────────────────────────────────────────
const RETENTION = [
  {
    lever:"Daily Habit: Jurnal Harian",
    strength:"⭐⭐⭐⭐⭐",
    color:BLUE,
    how:"Guru isi jurnal setiap selesai mengajar. 3 kelas/hari = buka app 3×. Seperti Duolingo — habit loop terbentuk sendiri.",
    metric:"Target: DAU/MAU ratio > 40% (SaaS rata-rata 13%)",
  },
  {
    lever:"Push Notification Reminder",
    strength:"⭐⭐⭐⭐",
    color:PURPLE,
    how:"30 menit setelah jam kelas berakhir → 'Bu Sari, jurnal kelas 8A belum diisi'. Skip kalau sudah diisi. Max 3 notif/hari.",
    metric:"Open rate push notif 10-20×, lebih baik dari email",
  },
  {
    lever:"PMM Deadline Urgency",
    strength:"⭐⭐⭐⭐⭐",
    color:RED,
    how:"Tiap akhir semester, semua guru ASN WAJIB submit bukti PMM. Modulajar generate ZIP-nya dalam 1 klik. Tanpa app ini, guru kerjakan manual 10+ jam.",
    metric:"PMM deadline = renewal spike. Ekspektasi renewal rate > 80%.",
  },
  {
    lever:"Curated Progress Dashboard",
    strength:"⭐⭐⭐",
    color:AMBER,
    how:"Dashboard: 'Kamu sudah isi jurnal X hari berturut-turut' + 'X% modul sudah selesai semester ini'. Progress visible = completion bias.",
    metric:"Gamifikasi ringan tanpa gimmick berlebihan",
  },
  {
    lever:"Annual Sunk Cost",
    strength:"⭐⭐⭐⭐",
    color:GREEN,
    how:"Sudah bayar Rp 199.000 di muka → motivasi untuk aktif pakai. Tidak ada 'ah bulan ini skip dulu' seperti monthly.",
    metric:"Annual retention rate rata-rata SaaS: 70-80% vs monthly 40-60%",
  },
  {
    lever:"School Lock-in (B2B)",
    strength:"⭐⭐⭐⭐⭐",
    color:BLUE,
    how:"Kepala sekolah yang beli plan Sekolah = institutional decision. Churn butuh approval kepala sekolah. Data semua guru tersimpan. Switching cost tinggi.",
    metric:"B2B SaaS churn biasanya < 5%/tahun vs B2C 20-40%",
  },
];

// ─── REVENUE MATH ─────────────────────────────────────────────────────────────
const REVENUE_SCENARIOS = [
  {
    label:"Konservatif (12 bln)",
    color:"#6B7280",
    pro_users:400,
    school_count:15,
    renewal_rate:0.75,
    get arr() { return this.pro_users*249000 + this.school_count*1499000; },
    get net_arr() { return this.arr * this.renewal_rate; },
  },
  {
    label:"Moderate (2 thn)",
    color:BLUE,
    pro_users:1500,
    school_count:60,
    renewal_rate:0.80,
    get arr() { return this.pro_users*249000 + this.school_count*1499000; },
    get net_arr() { return this.arr * this.renewal_rate; },
  },
  {
    label:"Optimis (3 thn)",
    color:GREEN,
    pro_users:5000,
    school_count:200,
    renewal_rate:0.85,
    get arr() { return this.pro_users*249000 + this.school_count*1499000; },
    get net_arr() { return this.arr * this.renewal_rate; },
  },
];

// ─── REFERRAL PROGRAM ──────────────────────────────────────────────────────────
// HYBRID model: 10% first payment + 5% recurring for 12 months
// Pros: menarik share (10% upfront) + jaga retention (5% recurring)
// Referrer earns passive income as long as referred user stays active
//
// Example Pro Annual (Rp 790.000):
//   First payout: 10% × Rp 790.000 = Rp 79.000
//   Recurring: 5% × Rp 99.000/bln = Rp 4.950/bln × 12 bulan = Rp 59.400
//   Total per annual referral: Rp 138.400
//
// Example School Tier II (15 guru, annual = 15 × Rp 948.000 = Rp 14.220.000):
//   First payout: 10% × Rp 14.220.000 = Rp 1.422.000
//   Recurring: 5% × Rp 1.185.000/bln = Rp 59.250/bln × 12 = Rp 711.000
//   Total per school referral: Rp 2.133.000
//
// Rules:
// - Commission = % of price PAID (monthly/6mo/annual) by new user
// - Recurring paid monthly for 12 months after first payment
// - Referrer earns as long as referred user stays active (no churn clawback)
// - Referral code: valid 12 months (user who uses code gets 10% discount on first payment)

const REFERRAL = {
  first_payment_pct: 10,     // 10% of first plan price paid by new user
  recurring_pct: 5,         // 5% of monthly equivalent per month
  recurring_months: 12,    // recurring payout for 12 months
  payout_trigger: "payment_confirmed",  // first payout after payment confirmed
  recurring_trigger: "active_subscription",  // recurring paid while sub active
  min_payout: 10000,         // Rp 10.000 minimum balance to earn
  // Cashout: mingguan every Monday, min Rp 50.000
  cashout_schedule: "weekly (every Monday)",
  cashout_min: 50000,
  cashout_methods: ["Bank Transfer BCA", "Bank Transfer Mandiri", "Bank Transfer BNI", "OVO", "DANA"],
  // Referral code: new user gets 10% discount first payment when using code
  new_user_discount: 10,  // 10% discount on first payment for referred user
  code_validity: "12 months",  // referral code expires 12 months from creation
  // Examples:
  // Pro annual (Rp 790.000): first = Rp 79.000 + recurring Rp 4.950/bln × 12 = Rp 138.400 total
  // School Tier II 15guru (Rp 14.220.000): first = Rp 1.422.000 + recurring Rp 59.250/bln × 12 = Rp 2.133.000 total
};

// ─── INFRASTRUCTURE ───────────────────────────────────────────────────────────
// STACK: Railway + Supabase (Simplified)
// Drop Vercel. Keep Supabase. $40-50/mo savings with zero migration effort.
//
const INFRA = {
  frontend: {
    provider:"Railway", plan:"Starter ($10/mo)", specs:"1 vCPU, 1GB RAM, 2 replicas",
    deployment:"GitHub → auto-deploy",
    notes:"Drop Vercel. Railway cukup untuk Next.js. Simpler + lebih murah.",
  },
  backend: {
    provider:"Railway", plan:"Starter ($10/mo)", specs:"1 vCPU, 1GB RAM, 2 replicas",
    service:"Elysia (API) + Eliza OS (chatbot backend, Sprint 2)",
  },
  staging: { provider:"Railway", plan:"Branch preview ($5/mo)" },
  database: {
    provider:"Supabase", plan:"Pro ($25/mo)",
    features:["Postgres + RLS","Supabase Auth (email + Google SSO)","Supabase Storage","Real-time","Edge Functions"],
    migration:"Post-revenue positive → Neon ($15/mo) + Clerk ($20/mo)",
  },
  observability: {
    sentry:"Developer (free) — 5K errors/mo",
    posthog:"Free — 1M events/mo",
    betterstack:"Free — 3 monitors uptime",
  },
  migration: {
    now:"Drop Vercel → Railway (1h, save $20/mo)",
    later:"Migrate Supabase → Neon + Clerk (14h effort, save $20/mo extra, trigger: $500+/mo revenue)",
  },
};

const ESTIMATED_COST = {
  launch: {
    breakdown: {
      "Railway (frontend)":10,
      "Railway (backend)":10,
      "Railway (staging)":5,
      "Supabase Pro":25,
      "Sentry (free)":0,
      "PostHog (free)":0,
      "Betterstack (free)":0,
      "Domain .app":1,
    },
    total_monthly_usd:51,
    total_monthly_idr:51 * 16500, // ~Rp 841.500/bulan
  },
};

// ─── TEACHER ASSISTANT CHATBOT ────────────────────────────────────────────────
// Eliza OS backend (Opsi C) + custom React UI
// Unique selling point: First Indonesian edtech platform with teacher AI chatbot
//
// Competitive advantage:
// - No Indonesian competitor has this
// - Deep Kurikulum Merdeka knowledge base (CP/TP/ATP data)
// - Daily workflow integration (jurnal, nilai, modul)
// - Indonesian language + cultural context
// - Canva/Google have teacher AI, but not Indonesian KM-specific
//
// Scope: Sprint 2 (after daily habit + billing stable)
//
// Architecture:
// User → React Chat Widget → Next.js API → Eliza OS HTTP
// Eliza OS → RAG (knowledge base) + GPT-4o mini/o3-mini
// Eliza OS plugins: checkSubscription, generateModule, createJournal, checkGrades
//
// Knowledge Base (RAG):
// - Kurikulum Merdeka docs (CP, TP, ATP, Asesmen)
// - Modulajar FAQ (billing, feature, troubleshoot)
// - Indonesian education terminology
// - PPDB, BOS, PMM government format knowledge
//
// Competitor landscape (April 2026):
// - Indonesian: Ruangguru, Zenius, Quipper → NO chatbot for teachers
// - Global: Khan Academy (Khanmigo - student), Canva for Ed (content creation)
// - GAP: No Indonesian edtech with KM-aware teacher chatbot
// - Modulajar = first-mover di this space

const TEACHER_CHATBOT = {
  backend: "Eliza OS",         // Opsi C: separate backend service
  frontend: "Custom React",      // Widget matching app design
  primary_model: "gpt-4o-mini", // Q&A, simple tasks
  complex_model: "o3-mini",     // Complex: validation, deep reasoning
  knowledge_sources: [
    "Kurikulum Merdeka CP/TP/ATP (from DB seed data)",
    "Modulajar help/FAQ articles",
    "Indonesian education terminology glossary",
    "Government format docs (BOS, PMM, PPDB)",
  ],
  actions: [
    "checkSubscription — cek plan + period",
    "generateModule — trigger module wizard",
    "createJournal — pre-fill journal form",
    "checkGrades — lookup student grades",
    "answerKM — Kurikulum Merdeka Q&A",
    "helpFAQ — troubleshoot common issues",
  ],
  deployment: "Separate Railway service (same repo, separate process)",
  effort_days: 7,  // Sprint 2: 3-4 hari build, 3 hari KB seeding
  cost_per_month: "~$50-100/mo AI cost (GPT-4o mini at scale)",
  moat: [
    "6 bulan effort untuk seed KM knowledge base",
    "Eliza OS plugin ecosystem untuk daily workflow",
    "Teacher trust + habit formation",
    "Indonesian language + cultural context",
  ],
};

const AI_COST   = { per_generate_idr: 1500 };
const MARGIN    = {
  pro:    { yearly_rev:249000, ai_cost_avg:270*20, margin_pct:Math.round((249000 - 270*20)/249000*100) },
  school: { yearly_rev:1499000, ai_cost_avg:270*20*30, margin_pct:Math.round((1499000 - 270*20*30)/1499000*100) },
};
const MIGRATIONS = [
  {
    id:"001", title:"Extensions & Enums", color:"#6B7280",
    sql:`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE TYPE user_role AS ENUM ('guru','kepala_sekolah','admin','super_admin');
CREATE TYPE curriculum_phase AS ENUM ('A','B','C','D','E','F');
CREATE TYPE module_status AS ENUM ('draft','published','archived');
CREATE TYPE module_mode AS ENUM ('ai_generated','scratch','edited_from_ai');

-- Billing (simpler than V1/V2: annual only, 2 paid plans)
CREATE TYPE subscription_plan AS ENUM ('free','pro','school');
CREATE TYPE sub_status AS ENUM ('active','past_due','cancelled','trialing');
CREATE TYPE payment_status AS ENUM ('paid','pending','failed','expired');

-- Daily habit features
CREATE TYPE attendance_status AS ENUM ('H','S','I','A');
CREATE TYPE assessment_type AS ENUM ('formatif','sumatif');

-- AI jobs
CREATE TYPE job_type AS ENUM ('generate','assist','prota','bank_soal','deskripsi_nilai','bukti_pmm');
CREATE TYPE job_status AS ENUM ('queued','running','done','failed');
CREATE TYPE agent_name AS ENUM ('orchestrator','cp','tp','atp','activity','asesmen','validator');

CREATE TYPE notif_type AS ENUM (
  'module_done','journal_reminder','payment_success',
  'payment_failed','quota_warning','pmm_deadline','school_invite'
);`,
  },
  {
    id:"002", title:"Shared Functions", color:"#6B7280",
    sql:`CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE yr int := EXTRACT(YEAR FROM now()); seq int;
BEGIN
  INSERT INTO invoice_sequences(year, last_seq) VALUES(yr,1)
  ON CONFLICT(year) DO UPDATE SET last_seq = invoice_sequences.last_seq + 1
  RETURNING last_seq INTO seq;
  RETURN 'INV-'||yr||'-'||LPAD(seq::text,6,'0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_module_search()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('indonesian',
    coalesce(NEW.title,'') || ' ' ||
    coalesce(NEW.subject,'') || ' ' ||
    coalesce(NEW.grade,'')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
  },
  {
    id:"003", title:"Schools & Users", color:BLUE,
    sql:`-- Schools (untuk School plan)
CREATE TABLE schools (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  npsn        text,
  npwp        text,
  address     text,
  subdomain   text UNIQUE,         -- sman1bdg.modulajar.app (future)
  logo_url    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL UNIQUE,
  full_name       text NOT NULL DEFAULT '',
  role            user_role NOT NULL DEFAULT 'guru',
  school_id       uuid REFERENCES schools(id) ON DELETE SET NULL,
  avatar_url      text,
  nip             text,
  default_subject text,
  default_phase   curriculum_phase,
  onboarding_done boolean NOT NULL DEFAULT false,

  -- Free trial tracking (3 generates total, NOT per month)
  free_generates_used int NOT NULL DEFAULT 0,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoice_sequences (
  year     int PRIMARY KEY,
  last_seq int NOT NULL DEFAULT 0
);

CREATE INDEX idx_users_school ON users(school_id);
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();`,
  },
  {
    id:"004", title:"Subscriptions & Payments", color:AMBER,
    sql:`-- Subscriptions (ANNUAL ONLY — tidak ada monthly)
-- Pro: Rp 199.000/tahun per user
-- School: Rp 1.499.000/tahun per sekolah (max 30 guru)
CREATE TABLE subscriptions (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Milik user individual ATAU sekolah (XOR)
  user_id              uuid REFERENCES users(id) ON DELETE CASCADE,
  school_id            uuid REFERENCES schools(id) ON DELETE CASCADE,

  plan                 subscription_plan NOT NULL DEFAULT 'free',
  status               sub_status NOT NULL DEFAULT 'active',
  seats                int NOT NULL DEFAULT 1,  -- untuk school plan

  -- Annual period
  period_start         timestamptz NOT NULL DEFAULT now(),
  period_end           timestamptz NOT NULL,     -- period_start + 1 tahun
  grace_period_end     timestamptz,              -- +14 hari setelah period_end
  cancel_at_period_end boolean NOT NULL DEFAULT false,

  -- Xendit
  xendit_payment_id    text,
  invoice_data         jsonb NOT NULL DEFAULT '{}',  -- NPWP, nama lembaga untuk BOS

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT sub_owner CHECK (
    (user_id IS NOT NULL AND school_id IS NULL) OR
    (user_id IS NULL AND school_id IS NOT NULL)
  )
);

-- Payments (hanya satu per tahun per subscription)
CREATE TABLE payments (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id   uuid NOT NULL REFERENCES subscriptions(id),
  xendit_payment_id text NOT NULL UNIQUE,  -- idempotency
  xendit_invoice_id text,
  amount_idr        int NOT NULL,
  method            text,
  status            payment_status NOT NULL DEFAULT 'pending',
  invoice_number    text,        -- INV-2025-000001
  invoice_pdf_url   text,        -- Supabase Storage
  paid_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- School invites (kepala sekolah invite guru)
CREATE TABLE school_invites (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id   uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email       text NOT NULL,
  token       text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhook_logs (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  xendit_event text NOT NULL,
  payload      jsonb NOT NULL,
  processed    boolean NOT NULL DEFAULT false,
  error        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_sub_user ON subscriptions(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_sub_school ON subscriptions(school_id) WHERE school_id IS NOT NULL;
CREATE INDEX idx_payments_sub ON payments(subscription_id);
CREATE INDEX idx_payments_xendit ON payments(xendit_payment_id);
CREATE INDEX idx_webhook_unprocessed ON webhook_logs(processed) WHERE processed = false;

CREATE TRIGGER sub_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();`,
  },
  {
    id:"005", title:"Curriculum & Learning Outcomes", color:PURPLE,
    sql:`CREATE TABLE curriculum_versions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text NOT NULL,
  code         text NOT NULL UNIQUE,
  year         int NOT NULL,
  status       text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE module_templates (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum_version_id uuid NOT NULL REFERENCES curriculum_versions(id),
  subject               text,
  schema                jsonb NOT NULL DEFAULT '{}',
  migration_rules       jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE learning_outcomes (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum_version_id uuid NOT NULL REFERENCES curriculum_versions(id),
  subject               text NOT NULL,
  phase                 curriculum_phase NOT NULL,
  elemen                text NOT NULL,
  sub_elemen            text,
  deskripsi             text NOT NULL,
  sort_order            int NOT NULL DEFAULT 0
);

CREATE INDEX idx_lo_subject_phase ON learning_outcomes(subject, phase);
CREATE INDEX idx_lo_version ON learning_outcomes(curriculum_version_id);`,
  },
  {
    id:"006", title:"Modules — Core Content", color:AMBER,
    sql:`CREATE TABLE modules (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  curriculum_version_id uuid REFERENCES curriculum_versions(id),
  template_id           uuid REFERENCES module_templates(id),

  title                 text NOT NULL DEFAULT 'Modul Tanpa Judul',
  subject               text NOT NULL,
  phase                 curriculum_phase,
  grade                 text,
  duration_minutes      int NOT NULL DEFAULT 80,
  content               jsonb NOT NULL DEFAULT '{}',
  status                module_status NOT NULL DEFAULT 'draft',
  mode                  module_mode NOT NULL DEFAULT 'ai_generated',

  -- Public share
  is_public             boolean NOT NULL DEFAULT false,
  slug                  text UNIQUE,

  -- Fork from curated library
  fork_count            int NOT NULL DEFAULT 0,
  source_module_id      uuid REFERENCES modules(id) ON DELETE SET NULL,

  -- FTS
  search_vector         tsvector,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Curated modules (admin managed, public library)
CREATE TABLE curated_modules (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id   uuid NOT NULL UNIQUE REFERENCES modules(id) ON DELETE CASCADE,
  curated_by  uuid REFERENCES users(id),
  curated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE module_exports (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id      uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES users(id),
  file_path      text,
  signed_url     text,
  url_expires_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_modules_user ON modules(user_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_search ON modules USING GIN(search_vector);
CREATE INDEX idx_modules_public ON modules(is_public) WHERE is_public = true;

CREATE TRIGGER modules_search_trig BEFORE INSERT OR UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_module_search();
CREATE TRIGGER modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();`,
  },
  {
    id:"007", title:"Daily Habit — Journals & Attendance", color:GREEN,
    sql:`-- Teaching classes (kelas yang diajar guru)
CREATE TABLE teaching_classes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id   uuid REFERENCES schools(id) ON DELETE SET NULL,
  subject     text NOT NULL,
  grade       text NOT NULL,
  class_name  text NOT NULL,
  phase       curriculum_phase,
  -- [{ day: 1-7, time_start: 'HH:MM', time_end: 'HH:MM' }]
  schedule    jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Students per class
CREATE TABLE students (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teaching_class_id uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  name              text NOT NULL,
  nis               text,
  is_active         boolean NOT NULL DEFAULT true,
  sort_order        int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Journal entries (daily habit core)
CREATE TABLE journals (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teaching_class_id uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  module_id         uuid REFERENCES modules(id) ON DELETE SET NULL,
  date              date NOT NULL DEFAULT CURRENT_DATE,
  topic             text NOT NULL DEFAULT '',
  activity_notes    text,
  notes             text,
  photo_urls        text[] NOT NULL DEFAULT '{}',

  -- Offline support
  is_synced         boolean NOT NULL DEFAULT true,
  client_created_at timestamptz,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  -- Satu jurnal per kelas per hari
  UNIQUE(teaching_class_id, date)
);

-- Attendance (per journal)
CREATE TABLE attendances (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id uuid NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status     attendance_status NOT NULL DEFAULT 'H',
  notes      text,
  is_synced  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(journal_id, student_id)
);

CREATE INDEX idx_tc_user ON teaching_classes(user_id);
CREATE INDEX idx_students_class ON students(teaching_class_id);
CREATE INDEX idx_journals_user ON journals(user_id);
CREATE INDEX idx_journals_class_date ON journals(teaching_class_id, date DESC);
CREATE INDEX idx_journals_unsynced ON journals(user_id, is_synced) WHERE is_synced = false;
CREATE INDEX idx_att_journal ON attendances(journal_id);

CREATE TRIGGER tc_updated_at BEFORE UPDATE ON teaching_classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER journals_updated_at BEFORE UPDATE ON journals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();`,
  },
  {
    id:"008", title:"Grades & Assessments", color:RED,
    sql:`CREATE TABLE grade_entries (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teaching_class_id uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  student_id        uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_type   assessment_type NOT NULL,
  tp_code           text NOT NULL,
  tp_label          text,
  score             numeric(5,2) CHECK(score BETWEEN 0 AND 100),
  qualitative_label text,  -- Mulai Berkembang / Berkembang / dst
  notes             text,
  assessed_at       date NOT NULL DEFAULT CURRENT_DATE,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Computed grade summary (AVG sumatif per siswa)
CREATE TABLE grade_summaries (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teaching_class_id uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  student_id        uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES users(id),
  final_score       numeric(5,2),
  kktp_threshold    int NOT NULL DEFAULT 70,

  -- Generated always: apakah final_score >= kktp_threshold
  meets_kktp        boolean GENERATED ALWAYS AS (final_score >= kktp_threshold) STORED,

  -- AI-generated description (guru review + edit sebelum finalisasi)
  description       text,
  description_draft boolean NOT NULL DEFAULT true,

  computed_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teaching_class_id, student_id)
);

CREATE INDEX idx_ge_class ON grade_entries(teaching_class_id);
CREATE INDEX idx_ge_student ON grade_entries(student_id);
CREATE INDEX idx_gs_class ON grade_summaries(teaching_class_id);`,
  },
  {
    id:"009", title:"AI Agent Jobs & Steps", color:PURPLE,
    sql:`CREATE TABLE agent_jobs (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type     job_type NOT NULL DEFAULT 'generate',
  status       job_status NOT NULL DEFAULT 'queued',
  input        jsonb NOT NULL DEFAULT '{}',
  output       jsonb,
  module_id    uuid REFERENCES modules(id) ON DELETE SET NULL,

  -- Cost tracking
  tokens_used  int NOT NULL DEFAULT 0,
  cost_idr     int NOT NULL DEFAULT 0,

  -- Free trial tracking
  used_free_generate boolean NOT NULL DEFAULT false,

  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agent_steps (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id       uuid NOT NULL REFERENCES agent_jobs(id) ON DELETE CASCADE,
  agent        agent_name NOT NULL,
  status       job_status NOT NULL DEFAULT 'pending',
  step_order   int NOT NULL DEFAULT 0,
  output       jsonb,
  error        text,
  attempt      int NOT NULL DEFAULT 1,
  max_attempts int NOT NULL DEFAULT 3,
  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_user ON agent_jobs(user_id);
CREATE INDEX idx_jobs_status ON agent_jobs(status);
CREATE INDEX idx_steps_job ON agent_steps(job_id);`,
  },
  {
    id:"010", title:"Notifications, Config & Audit", color:"#06B6D4",
    sql:`CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notif_type NOT NULL,
  title      text NOT NULL,
  body       text,
  meta       jsonb NOT NULL DEFAULT '{}',
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint     text NOT NULL UNIQUE,
  p256dh       text NOT NULL,
  auth         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feature_flags (
  key         text PRIMARY KEY,
  enabled     boolean NOT NULL DEFAULT false,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_config (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  action        text NOT NULL,
  resource_type text,
  resource_id   uuid,
  meta          jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE daily_metrics (
  date              date PRIMARY KEY,
  new_signups       int NOT NULL DEFAULT 0,
  new_pro           int NOT NULL DEFAULT 0,
  new_school        int NOT NULL DEFAULT 0,
  modules_generated int NOT NULL DEFAULT 0,
  journals_created  int NOT NULL DEFAULT 0,
  revenue_idr       bigint NOT NULL DEFAULT 0,
  ai_cost_idr       int NOT NULL DEFAULT 0,
  renewals          int NOT NULL DEFAULT 0,
  churns            int NOT NULL DEFAULT 0
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);`,
  },
  {
    id:"011", title:"RLS Policies", color:AMBER,
    sql:`ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Curriculum: public read
CREATE POLICY cv_read ON curriculum_versions FOR SELECT USING (true);
CREATE POLICY mt_read ON module_templates FOR SELECT USING (true);
CREATE POLICY lo_read ON learning_outcomes FOR SELECT USING (true);

-- Curated: public read
CREATE POLICY cm_read ON curated_modules FOR SELECT USING (true);

-- Users: own row
CREATE POLICY u_sel ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY u_upd ON users FOR UPDATE USING (auth.uid() = id);

-- Schools: own school members
CREATE POLICY sch_sel ON schools FOR SELECT
  USING (id IN (SELECT school_id FROM users WHERE id = auth.uid()));

-- Subscriptions: own user or own school
CREATE POLICY sub_sel ON subscriptions FOR SELECT
  USING (user_id = auth.uid() OR
         school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));

-- Payments: via subscription
CREATE POLICY pay_sel ON payments FOR SELECT
  USING (subscription_id IN (
    SELECT id FROM subscriptions
    WHERE user_id = auth.uid() OR
    school_id IN (SELECT school_id FROM users WHERE id = auth.uid())
  ));

-- School invites: own school (kepala sekolah)
CREATE POLICY si_sel ON school_invites FOR SELECT
  USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));

-- Modules: own + curated public
CREATE POLICY mod_sel ON modules FOR SELECT
  USING (user_id = auth.uid() OR
         id IN (SELECT module_id FROM curated_modules) OR
         is_public = true);
CREATE POLICY mod_ins ON modules FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY mod_upd ON modules FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY mod_del ON modules FOR DELETE USING (user_id = auth.uid());

CREATE POLICY me_all ON module_exports FOR ALL USING (user_id = auth.uid());

-- Teaching classes, students: own user
CREATE POLICY tc_all ON teaching_classes FOR ALL USING (user_id = auth.uid());
CREATE POLICY st_all ON students FOR ALL
  USING (teaching_class_id IN (SELECT id FROM teaching_classes WHERE user_id = auth.uid()));

-- Journals, attendance: own user
CREATE POLICY j_all ON journals FOR ALL USING (user_id = auth.uid());
CREATE POLICY att_all ON attendances FOR ALL
  USING (journal_id IN (SELECT id FROM journals WHERE user_id = auth.uid()));

-- Grades: own user
CREATE POLICY ge_all ON grade_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY gs_all ON grade_summaries FOR ALL USING (user_id = auth.uid());

-- AI jobs: own
CREATE POLICY aj_all ON agent_jobs FOR ALL USING (user_id = auth.uid());
CREATE POLICY as_sel ON agent_steps FOR SELECT
  USING (job_id IN (SELECT id FROM agent_jobs WHERE user_id = auth.uid()));

-- Notif, push: own
CREATE POLICY notif_all ON notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY push_all ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- NO RLS: feature_flags, app_config, audit_logs, daily_metrics,
-- webhook_logs, invoice_sequences → service_role only`,
  },
  {
    id:"012", title:"Seed Data", color:GREEN,
    sql:`-- Curriculum
INSERT INTO curriculum_versions (name, code, year, status) VALUES
  ('Kurikulum 2013', 'K13', 2013, 'deprecated'),
  ('Kurikulum Merdeka 2022', 'MERDEKA_2022', 2022, 'active');

-- App Config
INSERT INTO app_config (key, value, description) VALUES
  ('free_generates_limit',    '{"value": 3}',    'Jumlah AI generate gratis total per akun'),
  ('pro_price_yearly_idr',    '{"value": 199000}','Harga Pro per tahun'),
  ('school_price_yearly_idr', '{"value": 1499000}','Harga Sekolah per tahun'),
  ('school_max_seats',        '{"value": 30}',   'Maksimum guru per School plan'),
  ('grace_period_days',       '{"value": 14}',   'Grace period setelah expired (hari)'),
  ('ai_cost_per_generate',    '{"value": 1500}', 'Cost AI per generate modul (Rp)'),
  ('min_renew_notify_days',   '{"value": 30}',   'Notifikasi renewal berapa hari sebelum expired'),
  ('maintenance_mode',        '{"value": false}','Toggle maintenance mode');

-- Feature Flags (semua on saat launch kecuali yang bertanda Sprint 2+)
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('ai_generate',      true,  'AI generate modul — aktif saat launch'),
  ('pdf_export',       true,  'Export PDF — aktif saat launch'),
  ('curated_library',  true,  'Curated library browse+fork — aktif saat launch'),
  ('journal_feature',  true,  'Jurnal harian + absensi — aktif saat launch'),
  ('grade_feature',    true,  'Input nilai + deskripsi AI — aktif saat launch'),
  ('teacher_chatbot',  false, 'Teacher Assistant chatbot (Eliza OS) — Sprint 2'),
  ('pwa_offline',      false, 'Offline mode PWA — Sprint 2'),
  ('school_dashboard', false, 'Dashboard kepala sekolah — Sprint 3'),
  ('prota_promes',     false, 'Prota & Promes AI — Sprint 2'),
  ('bank_soal',        false, 'Bank Soal AI — Sprint 2');`,
  },
];

// ─── SPRINT ───────────────────────────────────────────────────────────────────
const SPRINT = [
  { day:"Day 1", color:BLUE, phase:"Foundation", focus:"Monorepo + Supabase Init", tasks:["pnpm create turbo@latest modulajar","Setup apps/web, apps/api, packages/db, packages/agents, packages/shared, packages/emails","supabase init + supabase start (local)","Buat 2 Supabase project: production + staging","Connect Railway + Vercel","⚠️ Submit dokumen Xendit HARI INI (verifikasi 2-3 hari)"], output:"Repo berjalan lokal. Supabase start OK.", blocker:"Xendit = submit sekarang." },
  { day:"Day 2", color:BLUE, phase:"Foundation", focus:"Full Database Schema (Migration 001-012)", tasks:["Run Migration 001-012 urut","supabase db push ke staging","Verifikasi 25+ tabel terbuat semua","Test RLS dengan anon key dan authenticated key","Test get_vouchers_remaining() equivalent checks berjalan"], output:"Semua tabel + RLS + seed data di staging.", blocker:"Enum HARUS ada sebelum tabel yang pakai enum." },
  { day:"Day 3", color:BLUE, phase:"Foundation", focus:"Elysia + Auth + CI/CD", tasks:["Elysia bootstrap: cors, rate-limit, bearer auth","GET /health","Supabase Auth: email + Google SSO","packages/shared: Zod schemas semua entities","Railway deploy → verify /health 200","GitHub Actions: ci.yml + deploy.yml","Sentry + Posthog EU + Betterstack"], output:"api.modulajar.app/health OK. CI/CD pipeline hijau.", blocker:"Railway DNS propagation ~30 menit." },
  { day:"Day 4", color:BLUE, phase:"Foundation", focus:"Auth Pages + Security + Onboarding", tasks:["next.config.ts security headers (CSP, HSTS, dll)","Auth pages: login, register, forgot-password","Email verification middleware","Onboarding: nama, sekolah, mapel","Free trial tracking: free_generates_used = 0 saat registrasi","Dashboard shell: greeting, stat cards, sidebar nav"], output:"Auth flow lengkap. Onboarding selesai.", blocker:"CSP bisa block Supabase JS — test browser." },
  { day:"Day 5", color:"#8B5CF6", phase:"AI Core", focus:"Seed CP + AI Agents", tasks:["Seed learning_outcomes (CP) prioritas: Mat, IPA, IPS, B.Indo Fase A-F","Seed ModuleTemplate schema 11 section Kurikulum Merdeka","packages/agents: setup, @OpenAI/sdk (GPT-4o mini primary + o3-mini for complex tasks)","CP Agent → TP → ATP → Activity → Asesmen → Validator","Test chain end-to-end","AgentBase + Zod output schemas"], output:"6 agent chain berjalan. Output modul draft lengkap.", blocker:"GP-4o mini cukup untuk 90% task. o3-mini hanya untuk validation/complex narrative." },
  { day:"Day 6", color:"#8B5CF6", phase:"AI Core", focus:"Generate Flow + Access Control", tasks:["Free tier check: free_generates_used < 3? → allow → increment","Pro/School check: subscription.status = active? → allow","Atomic check di Elysia (service_role): tidak bisa dari client","SSE streaming: GET /agent/jobs/:id/stream + keep-alive 15 detik","SSE polling fallback 3 detik (iOS Safari)","Generate wizard UI: 4 step form","Generating screen: realtime 6-step checklist","Retry: 3x per step, exponential backoff"], output:"Generate hanya jalan kalau berhak. SSE realtime.", blocker:"Free trial: increment ATOMIC di server, bukan client." },
  { day:"Day 7", color:"#F97316", phase:"Editor & Export", focus:"Editor + PDF + Modul List", tasks:["Scratch editor: Tiptap + autosave 2000ms","AI Assist per section (Suggest/Improve/Generate/Check)","Dynamic form renderer dari template schema","Puppeteer HTML → PDF A4, signed URL 7 hari","Curated library: browse + fork","app/(app)/modules: list, filter, search (FTS)","Module preview + download PDF"], output:"Editor + PDF berjalan. Curated library bisa difork.", blocker:"Puppeteer RAM Railway: minimum 512MB." },
  { day:"Day 8", color:"#F97316", phase:"Daily Habit", focus:"Jurnal Harian + Absensi", tasks:["Teaching classes CRUD","Import siswa dari Excel (SheetJS parser)","Jurnal form: tanggal, kelas, topik (auto-fill dari modul), catatan","Absensi: swipe H/S/I/A per siswa, bulk 'Semua Hadir'","Rekap jurnal bulanan PDF","IndexedDB setup (Dexie.js) untuk offline support awal","Journals UNIQUE(teaching_class_id, date) constraint tested"], output:"Jurnal bisa diisi dalam 60 detik. Import Excel berjalan.", blocker:"Offline: awal cukup graceful degradation, PWA full di Sprint 2." },
  { day:"Day 9", color:"#22C55E", phase:"Daily Habit", focus:"Nilai + Deskripsi AI + Push Notif", tasks:["Input nilai formatif + sumatif per TP per siswa","Grade summary: AVG sumatif, meets_kktp computed column","Deskripsi nilai AI: narasi per siswa (Pro/School only)","Push notification setup: service worker + push subscription","Cron Edge Function: reminder jurnal 30 menit setelah jam kelas (skip kalau sudah diisi, max 3/hari)","Paket Bukti PMM: ZIP generator (jurnal PDF + nilai PDF + modul list)"], output:"Full daily loop: jurnal → absensi → nilai → deskripsi AI → bukti PMM.", blocker:"Push notif: prompt opt-in di onboarding." },
  { day:"Day 10", color:"#EF4444", phase:"Billing", focus:"Xendit Annual Subscription", tasks:["Xendit: POST /billing/checkout { plan } → invoice → return payment_url","Payment methods: QRIS, GoPay, OVO, Dana, VA BCA/Mandiri/BNI, Indomaret","POST /webhooks/xendit: verify signature → return 200 → process","payment.paid → subscription active, period_end = now + 1 tahun","Invoice PDF: @react-pdf/renderer, INV-YYYY-NNNNNN, NPWP PT, PPN 11%","Billing page: plan status, period end date, [Perpanjang/Upgrade], invoice history","Cancel: cancel_at_period_end = true (akses sampai period_end)"], output:"Annual subscription berjalan. payment.paid → active < 5 detik.", blocker:"Xendit harus verified — kalau belum, lanjut Day 11 dulu." },
  { day:"Day 11", color:"#EF4444", phase:"Billing", focus:"Renewal Crons + School Plan + Upgrade Flow", tasks:["Cron: subscription_expiry_check (daily 09.00) → past_due kalau expired","Cron: grace_period_check (daily 08.00) → suspend kalau grace expired","Cron: renewal_reminder (30 hari + 7 hari sebelum expired) → email + in-app notif","School invite flow: POST /school/invite → email token → join link","School checkout: invoice dengan NPWP sekolah untuk BOS","6 email templates: welcome, payment_success, payment_failed, renewal_reminder, pmm_deadline, school_invite","Upgrade prompt: slide-up sheet saat free user hit generate limit ke-4"], output:"Full billing lifecycle berjalan. School invite flow berjalan.", blocker:"Grace period: 14 hari — bukan 3 hari (guru perlu waktu untuk renew)." },
  { day:"Day 12", color:"#22C55E", phase:"Launch", focus:"Landing Page + Admin + Legal", tasks:["Landing page: hero (UI mockup), problem/solution, cara kerja 4 langkah, fitur, pricing 3 tier (Free/Pro/Sekolah), FAQ 10 item, footer","Pricing highlight: Pro Rp 199.000/tahun = Rp 16.600/bulan","Admin panel: dashboard metrics, user management, subscription override, curated modules, feature flags, app config","Legal pages: ToS, Privacy Policy (UU PDP), Refund Policy","Help center: 8 MDX articles","Sitemap + robots.txt + OG images","Posthog: 10 key events"], output:"Landing page live. Admin panel berjalan.", blocker:"Pricing psychology penting: tampilkan 'Rp 16.600/bulan' sebagai anchor price." },
  { day:"Day 13", color:"#22C55E", phase:"Launch", focus:"Polish + Performance + Smoke Test", tasks:["Lighthouse audit semua halaman: LCP < 2.5s","pnpm audit: tidak ada critical vulnerability","Run full launch checklist — fix semua yang belum hijau","Seed: 20 curated modules di library (reviewed manual)","Mobile test di HP Android real (bukan DevTools)","Final smoke test: register → 3× free generate → upgrade Pro → jurnal → nilai → bukti PMM download","School smoke test: checkout school → invite guru → guru join"], output:"Semua launch checklist hijau.", blocker:"Smoke test harus cover full lifecycle Pro dan School plan." },
  { day:"Day 14-15", color:"#22C55E", phase:"Launch", focus:"Production Deploy + LAUNCH 🚀", tasks:["Push semua migrations ke production Supabase","Seed CP data + curated modules di production","Railway + Vercel production: env vars, custom domain, SSL","Betterstack monitors aktif","Post di grup Facebook Guru Indonesia + Twitter/X","LAUNCH 🚀 Selasa atau Rabu pagi — BUKAN Jumat"], output:"modulajar.app live di production dengan Free + Pro + Sekolah.", blocker:"JANGAN launch Jumat. Kalau ada bug kritis, tidak bisa fix weekend." },
];

// ─── SPRINT 2 (Post-Launch) ──────────────────────────────────────────────────
const SPRINT_2 = [
  { day:"S2-1", color:"#8B5CF6", phase:"Chatbot", focus:"Teacher Assistant Chatbot (Eliza OS)", tasks:["Eliza OS setup: bun init, plugin structure, character.ts (Teacher persona)","Custom React chat widget: bubble UI matching app design","Eliza OS REST API: /api/chat → proxy to Eliza OS service","Knowledge base RAG: ingest CP/TP/ATP data + FAQ + KM docs","Plugin: checkSubscription, generateModule, createJournal, checkGrades","Deploy Eliza OS as separate Railway service","Auth: pass user token to Eliza OS for user context"], output:"Teacher chatbot live di dashboard. Guru bisa chat tentang KM + daily workflow.", blocker:"Eliza OS plugin system perlu belajar — allocate 1 hari untuk debugging." },
  { day:"S2-2", color:"#8B5CF6", phase:"Chatbot", focus:"Knowledge Base Seeding + Polish", tasks:["Seed KM knowledge base: CP deskripsi lengkap per Fase + Mapel","Seed FAQ: 50 pertanyaan umum + jawaban","Seed terminology glossary: KI, KD, CP, TP, ATP, Asesmen, diferensiasi","Test RAG accuracy: 20 sample questions, min 80% correct","Polish chat widget: streaming response, typing indicator, error states","Mobile optimization: chat widget di HP Android"], output:"Knowledge base accurate + chatbot responsive di mobile.", blocker:"Quality RAG butuh manual review per topik." },
  { day:"S2-3", color:"#F97316", phase:"Polish", focus:"PWA Offline + Prota/Promes", tasks:["PWA: full offline mode dengan Dexie.js (IndexedDB)","Prota AI: yearly teaching plan generator","Promes AI: semester lesson plan generator","Mobile test: HP Android low-end (bukan DevTools)"], output:"PWA works offline. Prota/Promes AI jalan.", blocker:"PWA offline: test di HP Android real." },
  { day:"S2-4", color:"#EC4899", phase:"AI Examination", focus:"Bank Soal AI + AI Examination (Paper-Based)", tasks:["Bank Soal AI: generate soal (PG/isian/uraian/benar_salah) dari TP codes + CP, save to bank","Quiz (Paper-Based): guru pilih soal dari bank → export PDF → print → give to students in class","AI Examination: guru input jawaban siswa dari paper → AI check → generate feedback per soal","Bank Soal page: browse/search soal, filter by TP/asesmen type, difficulty, subject","Quiz creation: select questions → set time limit → assign to class → generate paper PDF","Quiz attempt: record student answers (paper-based input by teacher)","AI grading: o3-mini untuk uraian, GPT-4o mini untuk PG/isian/benar_salah","Result + AI feedback: tampilkan hasil per siswa + AI feedback per soal","Integrate bank_soal feature flag — hide until S2-4 ready"], output:"Guru generate soal → print paper → siswa kerjakan → guru input jawaban → AI periksa + feedback.", blocker:"AI grading accuracy perlu dicek manual — allocate 1 hari untuk prompt tuning." },
];

// ─── ANTI-DRIFT ───────────────────────────────────────────────────────────────
const ANTIDRIFT = [
  { cat:"Pricing SSOT", color:RED, rules:["FREE: 3 AI generate TOTAL (bukan per bulan) → setelah itu upgrade","PRO: Rp 99.000/bulan, Rp 494.000/6bln, Rp 790.000/tahun. BUKAN monthly subscription locked.","SEKOLAH: Per-guru Rp 89K-49K/bln (tier I-V), annual billing, min 3 guru","Tier I: 3-10 guru Rp 89K/bln. Tier II: 11-25 Rp 79K. Tier III: 26-50 Rp 69K. Tier IV: 51-100 Rp 59K. Tier V: 100+ Rp 49K (custom)","TIDAK ADA monthly subscription lock-in — annual billing adalah rekomendasi","AI Cost: GPT-4o mini primary ~Rp 443/generate avg (90% mini, 10% o3-mini). Margin Pro: 87%+","AI quota: Pro 30 gen/bln. Sekolah 30 gen/guru/bln.","Referral: 10% first payment + 5% recurring 12 bulan. Cashout mingguan, min Rp 50.000.","PPN 11% INCLUDED di semua harga tampilan ke user."] },
  { cat:"Tech Stack (Locked)", color:BLUE, rules:["Frontend: Next.js 15 App Router + Tailwind + shadcn/ui + Plus Jakarta Sans","Frontend Hosting: Railway (bukan Vercel — simpel + murah)","Backend: Elysia + Bun → Railway (BUKAN Next.js API Routes)","Database: Supabase Postgres + RLS + Storage + Auth + Edge Functions","AI Primary: GPT-4o mini (90% tasks: module content, journal, simple Q&A) — $0.0165/generate","AI Complex: o3-mini (10% tasks: validation, deskripsi nilai naratif) — $0.12/generate","SKIP Claude: 23x lebih mahal, tidak ada quality benefit untuk structured generation.","Teacher Chatbot: Eliza OS backend (Opsi C) + custom React widget — Sprint 2","Teacher Chatbot Hosting: Railway separate service (not embedded in Next.js process)","Observability: Sentry (free) + PostHog (free) + Betterstack (free)","Validation: Zod (agents, forms, shared) | Elysia t() (endpoints)","Payment: Xendit ONE-TIME annual charge (bukan Xendit Recurring)","Email: Resend + React Email","Monitoring: Railway metrics + Betterstack uptime (free tiers)","MIGRASI (post-revenue): Supabase → Neon + Clerk (trigger: $500+/mo revenue)"] },
  { cat:"Schema Invariants", color:AMBER, rules:["subscriptions: CONSTRAINT owner CHECK (user_id XOR school_id)","journals: UNIQUE(teaching_class_id, date) — 1 jurnal per kelas per hari","attendances: UNIQUE(journal_id, student_id)","grade_summaries.meets_kktp: GENERATED ALWAYS AS — jangan ditulis manual","users.free_generates_used: increment di Elysia server (service_role), TIDAK dari client","payments.xendit_payment_id: UNIQUE — idempotency webhook","service_role key: HANYA di Elysia server, TIDAK di Next.js client atau git","subscriptions.period_end = paid_at + 1 tahun (bukan +365 hari): pakai interval '1 year'"] },
  { cat:"Billing Rules", color:GREEN, rules:["Xendit webhook: return 200 DULU ke Xendit, proses logic SETELAH","Annual billing: satu payment per tahun per subscription. No monthly cycle.","Grace period: 14 hari setelah period_end (bukan 3 hari)","Cancel: cancel_at_period_end = true → akses sampai period_end (tidak langsung suspend)","Free limit: cek free_generates_used < 3 di Elysia SEBELUM dispatch agent job","Upgrade prompt: slide-up sheet (BUKAN redirect atau modal fullscreen)","Renewal reminder: 30 hari + 7 hari sebelum expired (dua reminder, bukan satu)"] },
  { cat:"Product Rules", color:PURPLE, rules:["Daily habit = fitur WAJIB launch: Jurnal harian + absensi. BUKAN post-launch.","PMM deadline setiap semester = renewal moment — Bukti PMM harus ada saat launch.","Jurnal harus bisa diisi dalam 60 detik di HP Android low-end.","Push notification: reminder jurnal 30 menit setelah jam kelas (skip kalau sudah diisi).","Curated library: 20+ modul disiapkan manual sebelum launch.","BUKAN pengganti PMM — companion PMM yang generate bukti kinerja.","BUKAN pengganti e-Rapor — generate konten untuk copy-paste ke e-Rapor."] },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const DK = { bg:"#0A0F1E", bgAlt:"#111827", surface:"#161B27", border:"#1E293B", text:"#F8FAFC", sub:"#94A3B8", muted:"#475569" };
const LK = { bg:"#F8FAFC", bgAlt:"#F1F5F9", surface:"#FFFFFF", border:"#E2E8F0", text:"#0F172A", sub:"#475569", muted:"#94A3B8" };

export default function UltimateSpec() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("why");
  const [xM, setXM] = useState("001");
  const [xOpen, setXOpen] = useState({});
  const [done, setDone] = useState({});
  const [checked, setChecked] = useState({});

  const T = dark ? DK : LK;
  const toggle = key => setXOpen(p => ({...p,[key]:!p[key]}));
  const doneCount = SPRINT.filter(s=>done[s.day]).length;
  const doneCountS2 = SPRINT_2.filter(s=>done[s.day]).length;

  const TABS = [
    { id:"why", label:"💡 Why 10/10" },
    { id:"pricing", label:"💰 Pricing Model" },
    { id:"retention", label:"🔄 Retention" },
    { id:"schema", label:"🗄️ Schema SQL" },
    { id:"sprint", label:"🚀 Sprint (14d)" },
    { id:"chatbot", label:"🤖 Chatbot" },
    { id:"antidrift", label:"🔒 Anti-Drift" },
    { id:"revenue", label:"📈 Revenue Math" },
  ];

  const Card = ({ children, color, style:ex }) => (
    <div style={{ background:T.surface, border:`1.5px solid ${color||T.border}`, borderRadius:14, overflow:"hidden", marginBottom:8, ...ex }}>
      {children}
    </div>
  );

  const Pill = ({ label, color, bg }) => (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:bg||(dark?"rgba(37,99,235,.12)":BLUEL), color:color||BLUE, whiteSpace:"nowrap" }}>{label}</span>
  );

  const ST = { fontSize:9, fontWeight:700, color:T.muted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6, marginTop:10 };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:T.bg, color:T.text, minHeight:"100vh", transition:"background .25s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        pre{font-family:'DM Mono',monospace!important;}
        .sc::-webkit-scrollbar{width:4px;}
        .sc::-webkit-scrollbar-thumb{background:${T.border};border-radius:99px;}
      `}</style>

      {/* HEADER */}
      <div style={{ background:dark?"#070C15":T.surface, borderBottom:`1px solid ${T.border}`, padding:"14px 16px 0" }}>
        <div style={{ maxWidth:940, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
            <div style={{ background:BLUE, borderRadius:8, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>📚</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:14, color:T.text }}>modulajar<span style={{ color:BLUE }}>.app</span></div>
              <div style={{ fontSize:8, color:T.muted, letterSpacing:2, fontFamily:"'DM Mono',monospace" }}>SPEC v3.0 — 10/10 ANNUAL FREEMIUM · DAILY HABIT CORE · FEASIBLE SOLO DEV</div>
            </div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
              {[["🟢 FEASIBLE",GREEN],["🔄 HIGH RETENTION",BLUE],["📈 STABLE ARR",AMBER],["⚡ 14 DAYS",PURPLE]].map(([l,c])=>(
                <span key={l} style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:99, background:`${c}15`, color:c }}>{l}</span>
              ))}
              <button onClick={()=>setDark(d=>!d)} style={{ width:26, height:26, borderRadius:7, background:T.surface, border:`1px solid ${T.border}`, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {dark?"☀️":"🌙"}
              </button>
            </div>
          </div>
          <div style={{ display:"flex", overflowX:"auto" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"7px 12px", border:"none", background:"none", cursor:"pointer", fontSize:11, fontWeight:tab===t.id?700:500, color:tab===t.id?BLUE:T.muted, borderBottom:tab===t.id?`2px solid ${BLUE}`:"2px solid transparent", whiteSpace:"nowrap", fontFamily:"inherit" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:940, margin:"0 auto", padding:"16px 12px 60px" }}>

        {/* WHY 10/10 */}
        {tab==="why" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            {/* The pitch */}
            <div style={{ background:`linear-gradient(135deg,${BLUE},#1E40AF)`, borderRadius:16, padding:"24px", marginBottom:16, color:"#FFF" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.6)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>The 10/10 Formula</div>
              <h2 style={{ fontSize:"clamp(20px,4vw,32px)", fontWeight:900, letterSpacing:-1, lineHeight:1.2, marginBottom:16 }}>
                Annual-first Freemium<br/>+ Daily Habit Core<br/>+ B2B School Anchor
              </h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:10 }}>
                {[
                  { icon:"✅", label:"Feasible", desc:"3 tier saja. Annual = no dunning. Launch 14 hari." },
                  { icon:"🔄", label:"Retensi Tinggi", desc:"Jurnal harian = daily active. PMM deadline = renewal urgency." },
                  { icon:"📈", label:"Revenue Stabil", desc:"Annual = predictable ARR. School = B2B kontrak." },
                  { icon:"⚡", label:"Fast Launch", desc:"Scope minimal, no marketplace, no voucher complexity." },
                ].map(c=>(
                  <div key={c.label} style={{ background:"rgba(255,255,255,.08)", borderRadius:10, padding:"12px" }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>{c.icon}</div>
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:3 }}>{c.label}</div>
                    <div style={{ fontSize:11, opacity:.7, lineHeight:1.5 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing model comparison */}
            <h3 style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:12 }}>Kenapa Annual, Bukan Monthly atau Voucher?</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
              {BILLING_COMPARISON.map(b=>(
                <div key={b.model} style={{ background:T.surface, border:`1.5px solid ${b.color==="#22C55E"?GREEN:T.border}`, borderRadius:12, padding:"14px 16px", boxShadow:b.color==="#22C55E"?`0 4px 20px ${GREEN}15`:undefined }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:8 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:b.color==="#22C55E"?GREEN:T.text }}>{b.model}</div>
                    {b.color==="#22C55E" && <Pill label="✓ PILIHAN TERBAIK" color={GREEN} bg={dark?"rgba(34,197,94,.12)":GREENL} />}
                  </div>
                  <div style={{ display:"flex", gap:16, marginBottom:8, flexWrap:"wrap" }}>
                    {[["Retensi",b.retention],["Revenue",b.revenue],["Complexity",b.complexity]].map(([l,v])=>(
                      <div key={l}>
                        <div style={{ fontSize:9, color:T.muted, letterSpacing:1, textTransform:"uppercase" }}>{l}</div>
                        <div style={{ fontSize:12, color:T.text }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:12, color:T.sub, lineHeight:1.6, fontStyle:"italic" }}>{b.verdict}</div>
                </div>
              ))}
            </div>

            {/* What's NOT included (scope decision) */}
            <h3 style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:10 }}>Apa yang Sengaja Tidak Dibangun di V1</h3>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
              {[
                { feature:"Marketplace (guru jual modul)", reason:"Chicken-and-egg problem. Butuh moderation queue setiap hari. +5 hari build. Feasible di Sprint 2 setelah ada 500+ user.", when:"Sprint 2" },
                { feature:"Voucher system", reason:"Lumpy revenue, no lock-in, lebih complex dari kelihatannya (atomic decrement, refund logic). Annual subscription lebih baik untuk semua metric.", when:"Tidak ada" },
                { feature:"Monthly subscription", reason:"Guru Indonesia tidak suka tagihan bulanan. Dunning = support nightmare. Annual 1 keputusan per tahun vs 12.", when:"Tidak ada" },
                { feature:"PWA full offline", reason:"Awal cukup graceful degradation. Full offline butuh +3 hari. Prioritas setelah daily habit terbukti.", when:"Sprint 2" },
                { feature:"Prota/Promes AI", reason:"Fitur penting tapi bukan daily use. Selesaikan daily habit loop dulu.", when:"Sprint 2" },
                { feature:"Bank Soal AI", reason:"Power feature, bukan entry feature. Tidak ada guru beli karena bank soal.", when:"Sprint 2" },
              ].map((item,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 16px", borderBottom:i<5?`1px solid ${T.border}`:"none" }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>🚫</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:T.text }}>{item.feature}</div>
                    <div style={{ fontSize:12, color:T.sub, lineHeight:1.6 }}>{item.reason}</div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:item.when==="Tidak ada"?(dark?"rgba(239,68,68,.1)":REDL):(dark?"rgba(37,99,235,.1)":BLUEL), color:item.when==="Tidak ada"?RED:BLUE, flexShrink:0, whiteSpace:"nowrap" }}>{item.when}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRICING */}
        {tab==="pricing" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14, marginBottom:20 }}>
              {Object.values(PRICING).map(plan=>(
                <div key={plan.label} style={{ background:T.surface, border:`2px solid ${plan.color==="6B7280"?T.border:plan.color}`, borderRadius:16, overflow:"hidden" }}>
                  <div style={{ padding:"20px", background:plan.color===BLUE?BLUE:plan.color===GREEN?GREEN:"transparent", color:plan.color===BLUE||plan.color===GREEN?"#FFF":T.text }}>
                    <div style={{ fontWeight:800, fontSize:18 }}>{plan.label}</div>
                    <div style={{ fontSize:13, opacity:.75, marginTop:2 }}>{plan.desc}</div>
                    {plan.price===0 && <div style={{ fontSize:28, fontWeight:900, marginTop:8 }}>Gratis</div>}
                    {plan.price_yearly && <>
                      <div style={{ fontSize:28, fontWeight:900, marginTop:8 }}>Rp {plan.price_yearly.toLocaleString("id-ID")}</div>
                      <div style={{ fontSize:11, opacity:.7 }}>per tahun · Rp {plan.price_monthly_equiv.toLocaleString("id-ID")}/bulan equiv.</div>
                    </>}
                    {plan.price_per_teacher && <>
                      <div style={{ fontSize:28, fontWeight:900, marginTop:8 }}>Rp {plan.price_yearly.toLocaleString("id-ID")}</div>
                      <div style={{ fontSize:11, opacity:.7 }}>per sekolah/tahun · maks {plan.seats} guru</div>
                      <div style={{ fontSize:11, opacity:.7 }}>= Rp {plan.price_per_teacher.toLocaleString("id-ID")}/guru/tahun</div>
                    </>}
                  </div>
                  <div style={{ padding:"16px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:10, fontStyle:"italic" }}>"{plan.psychology}"</div>
                    {plan.features.map(f=>(
                      <div key={f} style={{ display:"flex", gap:8, marginBottom:7, fontSize:12, color:T.text }}>
                        <span style={{ color:GREEN, flexShrink:0 }}>✓</span>{f}
                      </div>
                    ))}
                    {plan.locked && plan.locked.map(f=>(
                      <div key={f} style={{ display:"flex", gap:8, marginBottom:7, fontSize:12, color:T.muted }}>
                        <span style={{ flexShrink:0 }}>–</span>{f}
                      </div>
                    ))}
                    {plan.limits && <div style={{ marginTop:10, padding:"8px 10px", background:dark?"rgba(239,68,68,.07)":REDL, borderRadius:8, fontSize:11, color:RED, lineHeight:1.6 }}>{plan.limits}</div>}
                    {plan.anchor && <div style={{ marginTop:10, padding:"8px 10px", background:dark?"rgba(37,99,235,.07)":BLUEL, borderRadius:8, fontSize:11, color:BLUE }}>{plan.anchor}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Margin analysis */}
            <h3 style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:12 }}>Unit Economics (AI: GPT-4o mini Rp 270/generate)</h3>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px" }}>
              {[
                { plan:"Pro", rev:249000, ai_avg:"Rp 270 × 20 generate/thn = Rp 5.400", cost:5400, margin:Math.round((249000-5400)/249000*100) },
                { plan:"Sekolah (30 guru)", rev:1499000, ai_avg:"Rp 270 × 20 × 30 guru = Rp 162.000", cost:162000, margin:Math.round((1499000-162000)/1499000*100) },
              ].map(u=>(
                <div key={u.plan} style={{ display:"grid", gridTemplateColumns:"auto 1fr auto", gap:16, padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ fontWeight:700, fontSize:14, color:T.text, minWidth:100 }}>{u.plan}</div>
                  <div>
                    <div style={{ fontSize:12, color:T.sub }}>Revenue: Rp {u.rev.toLocaleString("id-ID")}/thn</div>
                    <div style={{ fontSize:11, color:T.muted }}>AI Cost (estimasi): {u.ai_avg}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:20, fontWeight:900, color:GREEN }}>{u.margin}%</div>
                    <div style={{ fontSize:10, color:T.muted }}>gross margin</div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize:11, color:T.muted, marginTop:10, lineHeight:1.7 }}>
                * Estimasi AI cost berdasarkan Rp 1.500/generate dan 20 generate rata-rata per user per tahun. Margin aktual lebih tinggi kalau user generate lebih sedikit. Tidak termasuk infra cost (~$15-20/bulan total untuk Railway + Vercel + Supabase Pro).
              </div>
            </div>
          </div>
        )}

        {/* RETENTION */}
        {tab==="retention" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ background:`linear-gradient(135deg,${GREEN},#15803D)`, borderRadius:14, padding:"20px", marginBottom:16, color:"#FFF" }}>
              <div style={{ fontSize:11, fontWeight:600, opacity:.7, marginBottom:6 }}>RETENTION TARGET</div>
              <h2 style={{ fontSize:24, fontWeight:900, letterSpacing:-.5, marginBottom:4 }}>Annual Renewal Rate &gt; 75%</h2>
              <p style={{ fontSize:13, opacity:.8 }}>DAU/MAU &gt; 40% (benchmark SaaS rata-rata 13%)</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {RETENTION.map(r=>(
                <div key={r.lever} style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:14, padding:"16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:8 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{r.lever}</div>
                      <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{r.strength}</div>
                    </div>
                    <div style={{ width:32, height:32, background:`${r.color}15`, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                      {r.lever.includes("Journal")?"📓":r.lever.includes("Push")?"🔔":r.lever.includes("PMM")?"🏅":r.lever.includes("Progress")?"📊":r.lever.includes("Sunk")?"💳":"🏫"}
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:T.sub, lineHeight:1.7, marginBottom:8 }}>{r.how}</div>
                  <div style={{ padding:"7px 10px", background:`${r.color}10`, borderRadius:8, fontSize:11, color:r.color, fontStyle:"italic" }}>📊 {r.metric}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCHEMA */}
        {tab==="schema" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ background:dark?"rgba(34,197,94,.06)":"#F0FDF4", border:"1px solid rgba(34,197,94,.25)", borderRadius:10, padding:"10px 14px", marginBottom:12 }}>
              <div style={{ fontWeight:700, fontSize:12, color:GREEN, marginBottom:3 }}>✅ 12 migration files — lebih simple dari V2</div>
              <div style={{ fontSize:11, color:T.sub }}>
                Vs V2: TIDAK ADA voucher_purchases, voucher_usage, listings, marketplace_purchases, reviews, withdrawal_requests.
                Vs V1: TIDAK ADA academic_years (diganti dengan kelas saja, simpler). Tambah: users.free_generates_used untuk free trial tracking.
              </div>
            </div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
              {MIGRATIONS.map(m=>(
                <button key={m.id} onClick={()=>setXM(m.id)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${xM===m.id?m.color:T.border}`, background:xM===m.id?m.color+"22":T.surface, color:xM===m.id?m.color:T.muted, fontSize:11, fontWeight:xM===m.id?700:400, cursor:"pointer", fontFamily:"inherit" }}>
                  {m.id}
                </button>
              ))}
            </div>
            {MIGRATIONS.filter(m=>m.id===xM).map(m=>(
              <div key={m.id} style={{ background:T.surface, border:`1.5px solid ${m.color}`, borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ fontWeight:700, fontSize:14, color:T.text }}>Migration {m.id} — {m.title}</div>
                </div>
                <pre style={{ margin:0, padding:"14px 16px", fontSize:11, color:dark?"#94A3B8":"#374151", lineHeight:1.85, overflowX:"auto", background:dark?"#070C15":"#F9FAFB", whiteSpace:"pre" }}>{m.sql}</pre>
              </div>
            ))}
          </div>
        )}

        {/* SPRINT */}
        {tab==="sprint" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, fontWeight:700, color:T.text }}>Sprint to Launch — {doneCount}/{SPRINT.length} hari</span>
                <span style={{ fontSize:11, color:T.muted, fontFamily:"'DM Mono',monospace" }}>{Math.round(doneCount/SPRINT.length*100)}%</span>
              </div>
              <div style={{ background:T.border, borderRadius:99, height:5 }}>
                <div style={{ background:`linear-gradient(90deg,${BLUE},${GREEN})`, height:"100%", width:`${doneCount/SPRINT.length*100}%`, borderRadius:99, transition:"width .3s" }} />
              </div>
            </div>
            <div style={{ background:dark?"rgba(239,68,68,.06)":"#FEF2F2", border:"1px solid rgba(239,68,68,.2)", borderRadius:9, padding:"9px 14px", marginBottom:12 }}>
              <span style={{ fontSize:12, color:RED }}>⚠️ Xendit submit Day 1. Jurnal harian WAJIB ada saat launch (bukan post-launch). PMM deadline = renewal moment.</span>
            </div>
            {SPRINT.map((s,idx)=>(
              <div key={s.day} style={{ background:T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${s.color}`, borderRadius:12, overflow:"hidden", marginBottom:7 }}>
                <button onClick={()=>toggle(s.day)} style={{ width:"100%", padding:"11px 16px", border:"none", background:"none", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:10 }}>
                  <button onClick={e=>{ e.stopPropagation(); setDone(p=>({...p,[s.day]:!p[s.day]})); }} style={{ width:16, height:16, borderRadius:3, border:`2px solid ${done[s.day]?s.color:T.border}`, background:done[s.day]?s.color:"transparent", cursor:"pointer", flexShrink:0, fontSize:9, color:"#FFF", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {done[s.day]?"✓":""}
                  </button>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:s.color, minWidth:52 }}>{s.day}</span>
                  <span style={{ fontSize:9, fontWeight:700, padding:"1px 7px", borderRadius:99, background:`${s.color}15`, color:s.color, marginRight:4, flexShrink:0 }}>{s.phase}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:done[s.day]?T.muted:T.text, flex:1, textAlign:"left" }}>{s.focus}</span>
                  <span style={{ color:T.muted, fontSize:14 }}>{xOpen[s.day]?"−":"+"}</span>
                </button>
                {xOpen[s.day] && <div style={{ padding:"0 16px 14px 44px", background:dark?"#070C15":"#F9FAFB", borderTop:`1px solid ${T.border}` }}>
                  <div style={{ ...ST, marginTop:12 }}>Tasks ({s.tasks.length})</div>
                  {s.tasks.map((t,i)=>(
                    <div key={i} style={{ fontSize:12, color:T.sub, marginBottom:6, display:"flex", gap:8, lineHeight:1.65 }}>
                      <span style={{ color:s.color, flexShrink:0, fontFamily:"'DM Mono',monospace", fontSize:10, minWidth:16 }}>{i+1}.</span><span>{t}</span>
                    </div>
                  ))}
                  <div style={ST}>Output</div>
                  <div style={{ fontSize:12, color:GREEN, background:dark?"rgba(34,197,94,.06)":"#F0FDF4", padding:"7px 10px", borderRadius:7, lineHeight:1.6 }}>✓ {s.output}</div>
                  <div style={ST}>Blocker</div>
                  <div style={{ fontSize:12, color:AMBER, background:dark?"rgba(245,158,11,.06)":"#FFFBEB", padding:"7px 10px", borderRadius:7, lineHeight:1.6 }}>⚠ {s.blocker}</div>
                </div>}
              </div>
            ))}
          </div>
        )}

        {/* ANTI-DRIFT */}
        {tab==="antidrift" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ background:dark?"rgba(239,68,68,.06)":"#FEF2F2", border:"1px solid rgba(239,68,68,.2)", borderRadius:9, padding:"9px 14px", marginBottom:12 }}>
              <span style={{ fontSize:12, color:RED, fontWeight:700 }}>⚠️ Anti-Drift: </span>
              <span style={{ fontSize:12, color:T.sub }}>Setiap perubahan dari rules di bawah butuh ADR baru yang explicit. Spec v3 ini adalah source of truth.</span>
            </div>
            {ANTIDRIFT.map(s=>(
              <div key={s.cat} style={{ background:T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${s.color}`, borderRadius:12, overflow:"hidden", marginBottom:8 }}>
                <button onClick={()=>toggle(s.cat)} style={{ width:"100%", padding:"12px 16px", border:"none", background:"none", cursor:"pointer", fontFamily:"inherit", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{s.cat}</span>
                  <span style={{ color:s.color, fontSize:18 }}>{xOpen[s.cat]?"−":"+"}</span>
                </button>
                {xOpen[s.cat] && <div style={{ borderTop:`1px solid ${T.border}`, padding:"10px 16px" }}>
                  {s.rules.map((r,i)=>(
                    <div key={i} style={{ fontSize:12, color:T.sub, marginBottom:7, display:"flex", gap:8, padding:"6px 10px", background:dark?"#111827":"#F9FAFB", borderRadius:6, borderLeft:`2px solid ${s.color}44`, lineHeight:1.65 }}>
                      <span style={{ color:s.color, flexShrink:0, fontWeight:700 }}>→</span>{r}
                    </div>
                  ))}
                </div>}
              </div>
            ))}
          </div>
        )}

        {/* REVENUE */}
        {tab==="revenue" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:14 }}>Revenue Projection — Annual Subscription Model</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
              {REVENUE_SCENARIOS.map(s=>{
                const arr = s.arr;
                const net = s.net_arr;
                const monthly_equiv = arr/12;
                return (
                  <div key={s.label} style={{ background:T.surface, border:`1.5px solid ${s.color}`, borderRadius:14, padding:"18px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                      <span style={{ fontWeight:700, fontSize:15, color:s.color }}>{s.label}</span>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:24, fontWeight:900, color:T.text, fontFamily:"'DM Mono',monospace" }}>
                          Rp {(arr/1000000).toFixed(1)}jt<span style={{ fontSize:13, fontWeight:500, color:T.muted }}>/thn</span>
                        </div>
                        <div style={{ fontSize:12, color:T.muted }}>≈ Rp {(monthly_equiv/1000000).toFixed(1)}jt MRR equiv</div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
                      {[
                        { l:"Pro users", v:s.pro_users.toLocaleString("id-ID") },
                        { l:"School contracts", v:s.school_count },
                        { l:"Pro ARR", v:`Rp ${(s.pro_users*199000/1000000).toFixed(1)}jt` },
                        { l:"School ARR", v:`Rp ${(s.school_count*1499000/1000000).toFixed(1)}jt` },
                        { l:"Renewal rate", v:`${(s.renewal_rate*100).toFixed(0)}%` },
                        { l:"Net ARR (setelah churn)", v:`Rp ${(net/1000000).toFixed(1)}jt` },
                      ].map(item=>(
                        <div key={item.l} style={{ background:dark?"#111827":"#F9FAFB", borderRadius:8, padding:"8px 10px" }}>
                          <div style={{ fontSize:9, color:T.muted, marginBottom:2 }}>{item.l}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{item.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Key insight */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px" }}>
              <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:14 }}>Key Insight: Two-Revenue-Stream Moat</div>
              {[
                { icon:"👩‍🏫", stream:"Individual Pro", rate:"Rp 199.000/thn", stability:"Medium", churn:"Est. 20-25%/thn", notes:"Tinggi saat PMM deadline. Rendah semester antara. Jaga dengan daily habit (jurnal)." },
                { icon:"🏫", stream:"School Plan", rate:"Rp 1.499.000/thn", stability:"Very High", churn:"Est. 5-10%/thn", notes:"B2B decision = harder to cancel. Budget BOS tersedia. NRR > 100% kalau sekolah tambah guru." },
              ].map(s=>(
                <div key={s.stream} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:24, flexShrink:0 }}>{s.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:3 }}>{s.stream} — {s.rate}</div>
                    <div style={{ display:"flex", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                      <Pill label={`Stability: ${s.stability}`} color={s.stability==="Very High"?GREEN:AMBER} bg={s.stability==="Very High"?(dark?"rgba(34,197,94,.1)":GREENL):(dark?"rgba(245,158,11,.1)":AMBERL)} />
                      <Pill label={`Churn: ${s.churn}`} color={T.muted} bg={T.bgAlt} />
                    </div>
                    <div style={{ fontSize:12, color:T.sub, lineHeight:1.6 }}>{s.notes}</div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize:12, color:T.sub, lineHeight:1.7, marginTop:14, padding:"10px 12px", background:dark?"rgba(37,99,235,.07)":BLUEL, borderRadius:8 }}>
                💡 <strong style={{ color:T.text }}>Milestone strategy:</strong> Bulan 1-6: acquire 200+ Pro users. Bulan 6-12: convert 10+ sekolah. Sekolah plan = 7.5× revenue per contract vs Pro. Satu sekolah dengan 30 guru = Rp 1.499.000 vs 30 × Pro = Rp 5.970.000 — sekolah lebih murah per guru, kamu lebih stabil per contract.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
