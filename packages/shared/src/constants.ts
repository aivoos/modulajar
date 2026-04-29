// Shared constants — imported by web, api, agents
// Ref: modulajar-spec-v3.jsx — ANTI-DRIFT: Pricing, Tech Stack
// Updated to align with SPEC v3: Annual-only pricing, 3-tier model

export const OPENAI_API_KEY = process.env["OPENAI_API_KEY"] ?? "";
export const ANTHROPIC_API_KEY = process.env["ANTHROPIC_API_KEY"] ?? "";

// Spec v3: 3-tier plan — free/pro/school
// Note: DB stores "go"/"plus" for existing subscriptions, display layer maps to free/pro
export const PLAN = {
  FREE: "free",
  PRO: "pro",       // maps to DB "go" in existing subs
  SCHOOL: "school", // maps to DB "sekolah" in existing subs
} as const;
export type Plan = (typeof PLAN)[keyof typeof PLAN];

// Legacy plan names (DB stored values — keep for existing data compatibility)
export const LEGACY_PLAN = {
  FREE: "free",
  GO: "go",
  PLUS: "plus",
  SEKOLAH: "sekolah",
} as const;

// Spec v3: 3-tier plan — Free, Pro (monthly/6mo/annual), School (tiered, annual)
// AI model: GPT-4o mini (90%) + o3-mini (10%) — NOT Claude
export const PLAN_LIMITS = {
  [PLAN.FREE]: {
    label: "Free",
    desc: "Untuk coba",
    free_generates_limit: 3,           // 3 AI generate TOTAL (lifetime), NOT per month
    price_yearly_idr: 0,
    features: [
      "3× AI generate modul (lifetime trial)",
      "Preview di app",
      "Akses curated library (baca saja)",
    ],
    locked: [
      "Download PDF",
      "Jurnal Harian",
      "Input Nilai",
      "Bukti PMM",
    ],
    color: "#6B7280",
    psychology: "3 generate cukup untuk rasakan value. Tidak 'free forever' = ada urgency to upgrade.",
  },

  [PLAN.PRO]: {
    label: "Pro",
    desc: "Untuk guru aktif",
    // Spec v3: Monthly Rp 99k, 6-month Rp 494k, Annual Rp 790k
    price_monthly_idr: 99_000,
    price_6mo_idr: 494_000,
    price_yearly_idr: 790_000,
    price_monthly_equiv: Math.round(790_000 / 12), // Rp ~65.833/bulan equivalent for annual
    ai_quota_per_month: 30,
    features: [
      "30× AI generate modul/bulan (GPT-4o mini)",
      "Download PDF (A4, siap cetak)",
      "Jurnal Harian (harian, 60 detik)",
      "Absensi siswa per kelas",
      "Input Nilai + Deskripsi AI",
      "Paket Bukti PMM (ZIP untuk upload ke PMM)",
      "Push notification reminder jurnal",
    ],
    locked: [],
    color: "#2563EB",
    anchor: "Rp 99.000/bulan — lebih murah dari segelas kopi",
    psychology: "Satu keputusan per tahun vs 12 keputusan bulanan. Terasa seperti one-time tapi recurring.",
    db_plan: LEGACY_PLAN.GO,
  },

  [PLAN.SCHOOL]: {
    label: "Sekolah",
    desc: "Untuk sekolah (B2B)",
    // Spec v3: Tiered pricing per-guru, annual billing
    // Tier I (3-10): Rp 89k/guru/mo × 12 = Rp 1.068k/guru/thn
    // Tier II (11-25): Rp 79k/guru/mo × 12 = Rp 948k/guru/thn
    // Tier III (26-50): Rp 69k/guru/mo × 12 = Rp 828k/guru/thn
    // Tier IV (51-100): Rp 59k/guru/mo × 12 = Rp 708k/guru/thn
    // Tier V (100+): Rp 49k/guru/mo × 12 = Rp 588k/guru/thn
    tiers: [
      { tier: "I",   range: "3-10",   per_guru_month: 89_000,  per_guru_year: 1_068_000, ai_quota: 30 },
      { tier: "II",  range: "11-25",  per_guru_month: 79_000,  per_guru_year:   948_000, ai_quota: 30 },
      { tier: "III", range: "26-50",  per_guru_month: 69_000,  per_guru_year:   828_000, ai_quota: 30 },
      { tier: "IV",  range: "51-100", per_guru_month: 59_000,  per_guru_year:   708_000, ai_quota: 30 },
      { tier: "V",   range: "100+",   per_guru_month: 49_000,  per_guru_year:   588_000, ai_quota: 30, custom: true },
    ],
    min_guru: 3,
    ai_quota_per_teacher: 30,
    features: [
      "Semua fitur Pro untuk semua guru",
      "Dashboard Kepala Sekolah",
      "Upload master jadwal sekolah",
      "Laporan compliance kurikulum semua guru",
      "Invoice resmi BOS (NPWP, PPN 11%)",
      "Onboarding guru oleh tim kami",
      "School invite: kepala sekolah invite guru",
    ],
    locked: [],
    color: "#22C55E",
    anchor: "Mulai Rp 49.000/guru/bulan — 51% discount dari Pro",
    psychology: "B2B = keputusan kepala sekolah / TU, bukan guru individual. Budget BOS. NRR > 100%.",
    db_plan: LEGACY_PLAN.SEKOLAH,
  },
} as const;

// Spec v3: Grace period 14 hari (bukan 3 hari)
export const GRACE_PERIOD_DAYS = 14;

// Spec v3: AI cost tracking
// GPT-4o mini: $0.15/1M input, $0.60/1M output
// Per modul (~50K tokens, 30K in + 20K out): ~$0.0165 (~Rp 270)
// Annual cost: 500 users × 20 modules × $0.0165 = ~$165/tahun
// Hybrid: mini (90% task) + o3-mini (10% task, validation/complex narrative) = ~$322/tahun
export const AI_COST_PER_GENERATE_IDR = 1500; // legacy reference only
export const AI_MODELS = {
  PRIMARY: "gpt-4o-mini",           // structured generation (CP, TP, ATP, Activity, Asesmen)
  VALIDATION: "o3-mini",            // complex: CP/TP alignment check, deskripsi nilai naratif
  FALLBACK: "gpt-4o",               // retry fallback
} as const;
export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

// Cost per module (IDR estimate — GPT-4o mini at current rates)
export const COST_PER_MODULE_IDR = {
  [AI_MODELS.PRIMARY]: 270,       // ~$0.0165
  [AI_MODELS.VALIDATION]: 2000,   // ~$0.121 (o3-mini — used sparingly)
  [AI_MODELS.FALLBACK]: 4500,     // ~$0.275 (gpt-4o fallback)
};

// Unit economics (Pro: monthly Rp 99k, 6mo Rp 494k, annual Rp 790k; Sekolah: tiered per-guru)
// AI: GPT-4o mini primary (90%) + o3-mini for complex tasks (10%)
// Avg: (0.9 × 270) + (0.1 × 2000) = Rp 443/generate
// Pro: 30 gen/mo × 12 = 360 gen/year
export const UNIT_ECONOMICS = {
  pro: {
    monthly_rev_idr: 99_000,
    yearly_rev_idr: 790_000,
    avg_ai_cost_per_gen_idr: 443,
    monthly_gen: 30,
    monthly_ai_cost_idr: 443 * 30,        // ~Rp 13.290/mo
    yearly_ai_cost_idr: 443 * 30 * 12,   // ~Rp 159.480/thn
    margin_pct: Math.round((790_000 - 443 * 30 * 12) / 790_000 * 100), // ~80% annual
    monthly_margin_pct: Math.round((99_000 - 443 * 30) / 99_000 * 100), // ~87% monthly
  },
  school: {
    // Tier II average: 11-25 guru, Rp 79k/guru/mo, annual Rp 948k/guru
    yearly_rev_per_guru_idr: 948_000,
    monthly_rev_per_guru_idr: 79_000,
    avg_ai_cost_per_gen_idr: 443,
    monthly_gen_per_guru: 30,
    monthly_ai_cost_per_guru_idr: 443 * 30, // ~Rp 13.290/guru/mo
    yearly_ai_cost_per_guru_idr: 443 * 30 * 12, // ~Rp 159.480/guru/thn
    // 20-guru school: Rp 1.58jt/mo revenue, ~Rp 265.8k/mo AI cost
    margin_pct: Math.round((79_000 - 443 * 30) / 79_000 * 100), // ~85%/guru
  },
};

export const KURIKULUM = {
  K13: "K13",
  MERDEKA_2022: "MERDEKA_2022",
  MERDEKA_2025: "MERDEKA_2025",
} as const;
export type Kurikulum = (typeof KURIKULUM)[keyof typeof KURIKULUM];

export const FASE = ["A", "B", "C", "D", "E", "F"] as const;
export type Fase = (typeof FASE)[number];

export const MAPEL_MERDEKA = [
  "Bahasa Indonesia",
  "Matematika",
  "IPA",
  "IPS",
  "Bahasa Inggris",
  "PJOK",
  "Seni Budaya",
  "Prakarya",
  "Pendidikan Agama",
  "PKn",
  "Bahasa Daerah",
] as const;
export type Mapel = (typeof MAPEL_MERDEKA)[number];

export const MODULE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;
export type ModuleStatus = (typeof MODULE_STATUS)[keyof typeof MODULE_STATUS];

export const MODULE_MODE = {
  FULL_AI: "full_ai",
  CURATED: "curated",
  SCRATCH: "scratch",
} as const;

export const JOB_STATUS = {
  QUEUED: "queued",
  RUNNING: "running",
  DONE: "done",
  FAILED: "failed",
} as const;
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const STEP_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  DONE: "done",
  FAILED: "failed",
} as const;
export type StepStatus = (typeof STEP_STATUS)[keyof typeof STEP_STATUS];

// AI Agent types — 6-agent chain per spec v3 Day 5
export const AI_AGENTS = {
  ORCHESTRATOR: "orchestrator",
  CP: "cp_agent",
  TP: "tp_agent",
  ATP: "atp_agent",
  ACTIVITY: "activity_agent",
  ASESMEN: "asesmen_agent",
  VALIDATOR: "validator_agent",
  PROTA: "prota_agent",
  PROMES: "promes_agent",
  SOAL: "soal_agent",
  DESKRIPSI: "deskripsi_agent",
  REFLEKSI: "refleksi_agent",
} as const;
export type AiAgent = (typeof AI_AGENTS)[keyof typeof AI_AGENTS];

// PPN for BOS invoice (spec v3: 11% included in all displayed prices)
export const PPN_RATE = 0.11;

// PWA offline (Sprint 2)
export const OFFLINE_MAX_QUEUE = 50;

// Feature flags (default values — override via DB)
export const FEATURE_FLAGS = {
  ai_generate: true,
  pdf_export: true,
  curated_library: true,
  journal_feature: true,
  grade_feature: true,
  pwa_offline: false,   // Sprint 2
  school_dashboard: false, // Sprint 3
  prota_promes: false,   // Sprint 2
  bank_soal: false,      // Sprint 2
};

export const SHARED_ENVS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "XENDIT_SECRET",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SENTRY_DSN",
  "POSTHOG_API_KEY",
  "NEXT_PUBLIC_BASE_URL",
] as const;