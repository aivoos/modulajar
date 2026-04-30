// Database types — mirrors Supabase schema v3
// Ref: modulajar-master-v3.jsx — SCHEMA section (12 migrations, 25+ tables)
// These types MUST match the actual DB schema — do not add types that don't exist in migrations

// Spec v3: 3-tier plan
// DB may contain legacy values (go, plus, sekolah) for existing subscriptions
// New subscriptions use: free | pro | school
export type Plan = "free" | "pro" | "school";
// Legacy DB values (for backward compat with existing subscriptions)
export type LegacyPlan = "go" | "plus" | "sekolah";
export type UserRole = "guru" | "kepala_sekolah" | "admin" | "super_admin";
// Legacy: sekolah plan stored as "sekolah" in DB
export type SchoolPlan = "free" | "pro" | "school";
export type Kurikulum = "K13" | "MERDEKA_2022" | "MERDEKA_2025";
export type Fase = "A" | "B" | "C" | "D" | "E" | "F";
export type CurriculumStatus = "draft" | "active" | "deprecated";
export type ModuleStatus = "draft" | "published" | "archived";
export type ModuleMode = "full_ai" | "curated" | "scratch";
export type MigrationStatus = "pending_review" | "accepted" | "rejected";
export type SemesterType = "ganjil" | "genap";
export type AttendanceStatus = "H" | "S" | "I" | "A";
export type GenderType = "L" | "P";
export type AssessmentType = "formatif" | "sumatif" | "diagnostik";
export type QuestionType = "PG" | "isian" | "uraian" | "benar_salah";
export type DifficultyLevel = "mudah" | "sedang" | "sulit";
export type JobType = "modul_generate" | "modul_assist" | "prota_promes" | "bank_soal" | "deskripsi_nilai" | "refleksi" | "bukti_kinerja" | "prota_agent";
export type JobStatus = "queued" | "running" | "done" | "failed";
export type AgentName = "orchestrator" | "cp" | "tp" | "atp" | "activity" | "asesmen" | "validator" | "prota" | "promes" | "soal" | "deskripsi" | "refleksi";
// Spec v3: Annual-only. No monthly billing cycle.
export type BillingCycle = "yearly"; // only valid value going forward
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing";
export type PaymentStatus = "paid" | "pending" | "failed" | "expired";
export type NotificationType = "migration_ready" | "quota_warning" | "payment_success" | "payment_failed" | "export_ready" | "journal_reminder";

// ── Schools ───────────────────────────────────────────��─────────
export interface School {
  id: string;
  name: string;
  npsn: string | null;
  npwp: string | null;
  address: string | null;
  subdomain: string | null;
  logo_url: string | null;
  plan: SchoolPlan;
  created_at: string;
  updated_at: string;
}

// ── Users (extends auth.users) ──────────────────────────────────
export interface User {
  id: string;
  email: string;           // NOT from auth.users — explicit column
  full_name: string;
  role: UserRole;
  school_id: string | null;
  avatar_url: string | null;
  nip: string | null;
  phone_wa: string | null;
  default_subject: string | null;
  default_phase: Fase | null;
  default_grade: string | null;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

// ── Academic Years (ADR-009) ───────────────────────────────────
export interface AcademicYear {
  id: string;
  school_id: string | null;
  label: string;           // "2025/2026 Genap"
  semester: SemesterType;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

// ── Teaching Class (Day 1 of Sprint 1) ──────────────────────────
export interface TeachingClass {
  id: string;
  user_id: string;
  school_id: string | null;
  academic_year_id: string;
  subject: string;
  grade: string;           // "8" (text, tanpa A/B)
  class_name: string;       // "8A"
  phase: Fase | null;
  schedule: ScheduleEntry[]; // JSONB
  student_count: number;
  notes: string | null;
  is_active?: boolean;      // future field, not in schema yet
  created_at: string;
  updated_at: string;
}

export interface ScheduleEntry {
  day: number;             // 1-7 (Senin-Senin)
  time_start: string;       // "07:00"
  time_end: string;        // "09:00"
}

// ── Students ────────────────────────────────────────────────────
export interface Student {
  id: string;
  teaching_class_id: string;
  name: string;
  nis: string | null;
  gender: GenderType | null;
  notes: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ── Curriculum ─────────────────────────────────────────────────
export interface CurriculumVersion {
  id: string;
  name: string;
  code: string;             // "K13", "MERDEKA_2022"
  phase: Fase | null;
  year: number;
  status: CurriculumStatus;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
}

export interface ModuleTemplate {
  id: string;
  curriculum_version_id: string;
  subject: string | null;
  schema: ModuleTemplateSchema;
  migration_rules: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Dynamic form renderer schema (JSONB)
export interface ModuleTemplateSchema {
  sections: ModuleTemplateSection[];
}

export interface ModuleTemplateSection {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "table";
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];       // for select
  columns?: { key: string; label: string }[]; // for table
}

// ── Modules ─────────────────────────────────────────────────────
export interface Module {
  id: string;
  user_id: string;
  school_id: string | null;
  curriculum_version_id: string | null;
  template_id: string | null;
  teaching_class_id: string | null;

  title: string;
  subject: string;
  phase: Fase | null;
  grade: string | null;
  duration_minutes: number;  // minutes, not weeks

  content: ModuleContent;    // JSONB

  status: ModuleStatus;
  mode: ModuleMode;

  is_curated: boolean;
  curated_by: string | null;
  curated_at: string | null;

  is_public: boolean;
  slug: string | null;
  share_count: number;

  fork_count: number;
  source_module_id: string | null;

  created_at: string;
  updated_at: string;
}

export type ModuleContent = Record<string, unknown>;

export interface ModuleMigration {
  id: string;
  module_id: string;
  from_version_id: string;
  to_version_id: string;
  status: MigrationStatus;
  diff: MigrationDiff;
  migrated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface MigrationDiff {
  added?: Array<{ field: string; value: unknown }>;
  changed?: Array<{ field: string; old: unknown; new: unknown }>;
  removed?: Array<{ field: string }>;
  needs_input?: Array<{ field: string }>;
}

export interface ModuleExport {
  id: string;
  module_id: string;
  user_id: string;
  watermarked: boolean;
  file_path: string | null;
  signed_url: string | null;
  url_expires_at: string | null;
  created_at: string;
}

// ── Learning Outcomes ───────────────────────────────────────────
export interface LearningOutcome {
  id: string;
  curriculum_version_id: string;
  subject: string;
  phase: Fase;
  elemen: string;
  sub_elemen: string | null;
  deskripsi: string;
  sort_order: number;
  created_at: string;
}

// ── Journals (ADR-012 offline) ──────────────────────────────────
export interface Journal {
  id: string;
  user_id: string;
  teaching_class_id: string;
  academic_year_id: string;
  module_id: string | null;

  date: string;
  topic: string;

  activity_open: string | null;
  activity_main: string | null;
  activity_close: string | null;

  tp_achievement: number | null;
  notes: string | null;
  photo_urls: string[];

  is_synced: boolean;
  client_created_at: string | null;

  created_at: string;
  updated_at: string;
}

// ── Attendances ─────────────────────────────────────────────────
export interface Attendance {
  id: string;
  journal_id: string;
  student_id: string;
  status: AttendanceStatus;
  notes: string | null;
  is_synced: boolean;
  created_at: string;
}

// ── Grades (ADR-010: final_score = AVG sumatif SAJA) ─────────────
export interface GradeEntry {
  id: string;
  user_id: string;
  teaching_class_id: string;
  academic_year_id: string;
  student_id: string;

  assessment_type: AssessmentType;
  tp_code: string;
  tp_label: string | null;

  score: number | null;
  qualitative_label: string | null;

  notes: string | null;
  assessed_at: string;
  created_at: string;
  updated_at: string;
}

export interface GradeSummary {
  id: string;
  teaching_class_id: string;
  academic_year_id: string;
  student_id: string;
  user_id: string;

  final_score: number | null;

  kktp_threshold: number;
  // meets_kktp: boolean (GENERATED column, not in SELECT by default)

  description: string | null;
  description_draft: boolean;

  description_job_id: string | null;
  generated_at: string | null;

  computed_at: string;
  updated_at: string;
}

// ── Questions & Question Sets (ADR-014) ────────────────────────
export interface Question {
  id: string;
  user_id: string;
  module_id: string | null;
  type: QuestionType;
  content: string;
  options: QuestionOption[];
  answer: string;
  rubric: string | null;
  tp_code: string | null;
  difficulty: DifficultyLevel;
  is_public: boolean;
  fork_count: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface QuestionSet {
  id: string;
  user_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  question_ids: string[];
  is_curated: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// ── AI Agent ────────────────────────────────────────────────────
export interface AgentJob {
  id: string;
  user_id: string;
  job_type: JobType;
  status: JobStatus;

  input: Record<string, unknown>;
  output: Record<string, unknown> | null;

  module_id: string | null;
  teaching_class_id: string | null;

  tokens_used: number;
  cost_idr: number;

  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface AgentStep {
  id: string;
  job_id: string;
  agent: AgentName;
  status: JobStatus;
  step_order: number;
  output: Record<string, unknown> | null;
  error: string | null;
  attempt: number;
  max_attempts: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

// ── Billing ───────────────────────────────────────────────────���─
export interface Subscription {
  id: string;
  user_id: string | null;
  school_id: string | null;

  plan: Plan;
  billing_cycle: BillingCycle | null;
  status: SubscriptionStatus;

  ai_quota_used: number;
  ai_quota_limit: number;  // -1 = unlimited

  current_period_start: string;
  current_period_end: string | null;

  grace_period_end: string | null;
  cancel_at_period_end: boolean;

  xendit_subscription_id: string | null;
  invoice_data: InvoiceData;

  created_at: string;
  updated_at: string;
}

export interface InvoiceData {
  npwp_sekolah?: string;
  nama_sekolah?: string;
  alamat?: string;
  pic_name?: string;
}

export interface Payment {
  id: string;
  subscription_id: string;

  xendit_payment_id: string;
  xendit_invoice_id: string | null;

  amount_idr: number;
  method: string | null;
  status: PaymentStatus;

  invoice_url: string | null;
  pdf_url: string | null;
  pdf_signed_url: string | null;
  pdf_url_expires_at: string | null;

  paid_at: string | null;
  created_at: string;
}

export interface Topup {
  id: string;
  user_id: string;
  subscription_id: string;

  xendit_payment_id: string;
  amount_idr: number;
  ai_credits: number;
  method: string | null;
  status: PaymentStatus;

  paid_at: string | null;
  created_at: string;
}

export interface InvoiceSequence {
  year: number;
  last_seq: number;
}

// ── Notifications (ADR-013) ───────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  meta: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// ── Push Subscriptions (PWA) ────────────────────────────────────
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_info: string | null;
  created_at: string;
  last_used_at: string | null;
}

// ── Feedback ─────────────────────────────────────────────────────
export interface Feedback {
  id: string;
  user_id: string | null;
  type: string;
  content: string;
  url: string | null;
  screenshot: string | null;
  resolved: boolean;
  created_at: string;
}

// ── Feature Flags ────────────────────────────────────────────────
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rollout_percentage: number;
  enabled_for_plans: string[] | null;
  description: string | null;
  updated_at: string;
}

// ── App Config ───────────────────────────────────────────────────
export interface AppConfig {
  key: string;
  value: { value: unknown };
  description: string | null;
  updated_at: string;
}

// ── Audit Log ───────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  meta: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// ── Daily Metrics ────────────────────────────────────────────────
export interface DailyMetric {
  date: string;
  new_signups: number;
  active_users: number;
  modules_created: number;
  ai_jobs_run: number;
  ai_cost_idr: number;
  mrr_idr: number;
  new_subscriptions: number;
  churn_count: number;
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

// ── Webhook Logs ────────────────────────────────────────────────
export interface WebhookLog {
  id: string;
  xendit_event: string;
  payload: Record<string, unknown>;
  processed: boolean;
  error: string | null;
  processed_at: string | null;
  created_at: string;
}