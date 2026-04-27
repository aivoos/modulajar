// Shared constants — imported by web, api, agents

export const PLAN = {
  FREE: "free",
  GURU_PRO: "guru_pro",
  SEKOLAH: "sekolah",
} as const;
export type Plan = (typeof PLAN)[keyof typeof PLAN];

export const PLAN_LIMITS = {
  [PLAN.FREE]: {
    full_ai_per_month: 0,
    topup_modul: 0,
    price_idr: 0,
  },
  [PLAN.GURU_PRO]: {
    full_ai_per_month: 10,
    topup_modul: 3,
    topup_price_idr: 5_000,
    price_idr: 29_000,
  },
  [PLAN.SEKOLAH]: {
    full_ai_per_month: Infinity,
    topup_modul: 0,
    topup_price_idr: 0,
    price_idr: 499_000,
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

export const AI_AGENTS = {
  CP: "cp_agent",
  TP: "tp_agent",
  ATP: "atp_agent",
  ACTIVITY: "activity_agent",
  ASESMEN: "asesmen_agent",
  VALIDATOR: "validator_agent",
  ORCHESTRATOR: "orchestrator",
} as const;
export type AiAgent = (typeof AI_AGENTS)[keyof typeof AI_AGENTS];

export const GRACE_PERIOD_DAYS = 3;

export const SHARED_ENVS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_KEY",
  "ANTHROPIC_API_KEY",
  "XENDIT_SECRET",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;
