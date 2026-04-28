// Shared constants — imported by web, api, agents
// Ref: modulajar-master-v3.jsx — ANTI-DRIFT: Pricing

export const OPENAI_API_KEY = process.env["OPENAI_API_KEY"] ?? "";
export const ANTHROPIC_API_KEY = process.env["ANTHROPIC_API_KEY"] ?? "";

export const PLAN = {
  FREE: "free",
  GO: "go",
  PLUS: "plus",
  SEKOLAH: "sekolah",
} as const;
export type Plan = (typeof PLAN)[keyof typeof PLAN];

export const PLAN_LIMITS = {
  [PLAN.FREE]: {
    full_ai_per_month: 2,    // 2 free generations per bulan, tidak bisa download PDF
    journal: false,
    nilai: false,
    pdf_download: false,
    topup_price_idr: 0,
    can_generate: true,
    can_download_pdf: false,
  },
  [PLAN.GO]: {
    full_ai_per_month: 10,
    journal: true,
    nilai: true,
    pdf_download: true,
    deskripsi_nilai_batch: 5, // per bulan
    topup_price_idr: 10_000,
    topup_credits: 3,
    price_idr: 49_000,
    price_yearly_idr: 490_000,
    ai_model: "gpt-4o-mini",
  },
  [PLAN.PLUS]: {
    full_ai_per_month: 20, // 20 modul/bulan pakai gpt-4o-mini
    journal: true,
    nilai: true,
    pdf_download: true,
    deskripsi_nilai_batch: -1, // unlimited
    prota_promes: true,
    bank_soal: true,
    bukti_pmm: true,
    school_profile: true, // bisa upload kop surat + branding
    price_idr: 99_000,
    price_yearly_idr: 990_000,
    ai_model: "gpt-4o-mini",
  },
  // Sekolah: Rp 70.000/bulan per guru. Min 6 guru = Rp 420.000/bln.
  // 30 modul/guru/bulan. Semua pakai gpt-4o-mini (cukup untuk modul ajar).
  [PLAN.SEKOLAH]: {
    full_ai_per_month: 25, // 25 modul/guru/bulan — margin ~75%
    journal: true,
    nilai: true,
    pdf_download: true,
    deskripsi_nilai_batch: -1,
    prota_promes: true,
    bank_soal: true,
    bukti_pmm: true,
    school_profile: true, // admin upload master kop surat → auto-apply ke semua guru
    kepala_sekolah_dashboard: true,
    invoice_bos: true,
    min_seats: 6,
    max_seats: 200,
    price_per_seat_idr: 79_000,
    base_price_idr: 474_000,  // 6 guru × Rp 79.000
    price_yearly_idr: 4_740_000,
    ai_model: "gpt-4o-mini",
  },
} as const;

export const KURIKULUM = {
  K13: "k13",
  MERDEKA_2022: "merdeka_2022",
  MERDEKA_2025: "merdeka_2025",
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

// AI Agent types from Master v2 (6 Tier 2 agents + orchestrator)
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

// AI cost tracking (gpt-4o-mini ~Rp 500-800/modul)
export const AI_COST_PER_MODULE_IDR = 800;
export const AI_COST_PER_MODULE_USD = 0.27;

// ADR-009: Tahun ajaran invariant
export const GRACE_PERIOD_DAYS = 3;
export const PPN_RATE = 0.11; // 11%

// ADR-012: PWA offline sync
export const OFFLINE_MAX_QUEUE = 50;

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
] as const;