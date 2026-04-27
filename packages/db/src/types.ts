// Database types — mirrors Supabase schema
// These match the table definitions in supabase/migrations/

// Inline type aliases (source of truth: @modulajar/shared)
export type Plan = "free" | "guru_pro" | "sekolah";
export type Kurikulum = "k13" | "merdeka_2022" | "merdeka_2025";
export type Fase = "A" | "B" | "C" | "D" | "E" | "F";
export type Mapel =
  | "Bahasa Indonesia" | "Matematika" | "IPA" | "IPS"
  | "Bahasa Inggris" | "PJOK" | "Seni Budaya" | "Prakarya"
  | "Pendidikan Agama" | "PKn" | "Bahasa Daerah";
export type ModuleStatus = "draft" | "published" | "archived";
export type JobStatus = "queued" | "running" | "done" | "failed";
export type StepStatus = "pending" | "running" | "done" | "failed";
export type AiAgent = "cp_agent" | "tp_agent" | "atp_agent" | "activity_agent" | "asesmen_agent" | "validator_agent" | "orchestrator";

// ── Auth / Users ──────────────────────────────────────────────
export interface User {
  id: string; // Supabase auth.uuid
  email: string;
  full_name: string;
  school_id: string | null;
  role: "guru" | "kepala_sekolah" | "super_admin";
  subjects: Mapel[];
  default_fase: Fase | null;
  created_at: string;
  updated_at: string;
}

// ── School ─────────────────────────────────────────────────────
export interface School {
  id: string;
  name: string;
  npsn: string | null;
  npwp: string | null;
  address: string | null;
  kepala_sekolah_user_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Curriculum ─────────────────────────────────────────────────
export interface CurriculumVersion {
  id: string;
  kurikulum: Kurikulum;
  name: string; // e.g. "Kurikulum 2013", "Kurikulum Merdeka 2022"
  phase: string; // e.g. "2013", "2022", "2025"
  year: number;
  status: "draft" | "active" | "superseded";
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModuleTemplate {
  id: string;
  curriculum_version_id: string;
  name: string;
  schema: Record<string, unknown>; // JSONB — form schema driven by this
  migration_rules: Record<string, unknown> | null; // JSONB
  created_at: string;
  updated_at: string;
}

// ── Modules ─────────────────────────────────────────────────────
export interface Module {
  id: string;
  user_id: string;
  school_id: string | null;
  curriculum_version_id: string;
  module_template_id: string;
  title: string;
  subject: Mapel;
  fase: Fase;
  kelas: number[]; // array of class levels, e.g. [1, 2, 3]
  duration_weeks: number;
  learning_style: "visual" | "auditori" | "kinestetik" | "campuran";
  content: Record<string, unknown>; // JSONB — driven by template schema
  status: ModuleStatus;
  is_curated: boolean;
  curated_by: string | null;
  fork_from_module_id: string | null;
  fork_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ModuleMigration {
  id: string;
  module_id: string;
  from_version_id: string;
  to_version_id: string;
  diff: {
    added?: Array<{ field: string; value: unknown }>;
    changed?: Array<{ field: string; old: unknown; new: unknown }>;
    removed?: Array<{ field: string }>;
    needs_input?: Array<{ field: string }>;
  };
  status: "pending_review" | "accepted" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// ── Capaian Pembelajaran ───────────────────────────────────────
export interface CapaianPembelajaran {
  id: string;
  curriculum_version_id: string;
  subject: Mapel;
  fase: Fase;
  elements: string[]; // JSONB array of CP elements
  description: string;
  created_at: string;
}

// ── Tujuan Pembelajaran ─────────────────────────────────────────
export interface TujuanPembelajaran {
  id: string;
  cp_id: string;
  module_id: string | null;
  sequence: number;
  code: string; // e.g. "TP-1", "TP-2"
  statement: string; // measurable statement in ABCD format
  created_at: string;
}

// ── Billing / Subscriptions ─────────────────────────────────────
export interface Subscription {
  id: string;
  user_id: string;
  school_id: string | null;
  plan: Plan;
  status: "active" | "past_due" | "cancelled" | "trialing";
  ai_quota_used: number;
  ai_quota_limit: number;
  xendit_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string;
  grace_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string | null;
  school_id: string | null;
  subscription_id: string | null;
  xendit_payment_id: string | null;
  amount_idr: number;
  currency: "IDR";
  status: "pending" | "paid" | "expired" | "failed";
  payment_method: string | null;
  paid_at: string | null;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Topup {
  id: string;
  user_id: string;
  xendit_payment_id: string | null;
  amount_idr: number;
  modul_count: number; // how many Full AI modul this topup adds
  status: "pending" | "paid" | "expired" | "failed";
  paid_at: string | null;
  created_at: string;
}

export interface InvoiceSequence {
  year: number;
  last_seq: number;
}

// ── AI Agent ────────────────────────────────────────────────────
export interface AgentJob {
  id: string;
  user_id: string;
  module_id: string | null;
  status: JobStatus;
  agent: AiAgent | "orchestrator";
  input: Record<string, unknown>; // JSONB
  output: Record<string, unknown> | null; // JSONB — partial output saved per step
  error_message: string | null;
  tokens_used: number | null;
  cost_idr: number | null;
  retry_count: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentStep {
  id: string;
  job_id: string;
  agent: AiAgent;
  sequence: number;
  status: StepStatus;
  input: Record<string, unknown>; // JSONB
  output: Record<string, unknown> | null; // JSONB
  error_message: string | null;
  retry_count: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// ── Notifications ───────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  meta: Record<string, unknown> | null; // JSONB
  read_at: string | null;
  created_at: string;
}

// ── Audit Log ───────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  meta: Record<string, unknown> | null; // JSONB
  created_at: string;
}

// ── Webhook Log ─────────────────────────────────────────────────
export interface WebhookLog {
  id: string;
  provider: "xendit" | "resend" | string;
  event: string;
  payload: Record<string, unknown>; // JSONB
  processed_at: string | null;
  error: string | null;
  created_at: string;
}

// ── User Flags (Abuse) ──────────────────────────────────────────
export interface UserFlag {
  id: string;
  user_id: string;
  reason: string;
  flagged_by: string | null;
  resolved_at: string | null;
  created_at: string;
}