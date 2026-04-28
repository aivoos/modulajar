import { useState } from "react";

// ─── SSOT ─────────────────────────────────────────────────────────────────────
const P = {
  free:    { label:"Free",    color:"#475569", bg:"#1E293B", monthly:0,        yearly:0,         ai:0,    full_ai:false, dl:false, model:"-" },
  go:      { label:"Go",      color:"#4F46E5", bg:"#1E1B4B", monthly:49000,   yearly:490000,    ai:10,   full_ai:true,  dl:true,  model:"gpt-4o-mini" },
  plus:    { label:"Plus",    color:"#F59E0B", bg:"#2D1F06", monthly:99000,   yearly:990000,    ai:20,   full_ai:true,  dl:true,  model:"gpt-4o-mini" },
  sekolah: { label:"Sekolah", color:"#10B981", bg:"#0A2918", monthly:79000,  yearly:948000,   ai:25,   full_ai:true,  dl:true,  seats:6, min_seats:6, model:"gpt-4o-mini" },
};
const TOPUP = { price:5000, credits:3 };
const AI_COST = { idr:800, usd:0.025, model:"gpt-4o-mini" };

// ─── FULL DATABASE SCHEMA ─────────────────────────────────────────────────────
// Written as complete SQL migrations from scratch
const MIGRATIONS = [
  {
    id: "001",
    title: "Extensions & Enums",
    color: "#475569",
    desc: "Setup extensions dan semua enum types yang dipakai di seluruh schema.",
    sql: `-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Auth & Identity Enums
CREATE TYPE user_role AS ENUM ('guru', 'kepala_sekolah', 'admin', 'super_admin');
CREATE TYPE school_plan AS ENUM ('free', 'go', 'plus', 'sekolah');

-- Curriculum Enums
CREATE TYPE curriculum_status AS ENUM ('draft', 'active', 'deprecated');
CREATE TYPE curriculum_phase AS ENUM ('A', 'B', 'C', 'D', 'E', 'F');

-- Module Enums
CREATE TYPE module_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE module_mode AS ENUM ('full_ai', 'curated', 'scratch');
CREATE TYPE migration_status AS ENUM ('pending_review', 'accepted', 'rejected');

-- Academic Enums
CREATE TYPE semester_type AS ENUM ('ganjil', 'genap');
CREATE TYPE attendance_status AS ENUM ('H', 'S', 'I', 'A');
CREATE TYPE gender_type AS ENUM ('L', 'P');
CREATE TYPE assessment_type AS ENUM ('formatif', 'sumatif', 'diagnostik');
CREATE TYPE question_type AS ENUM ('PG', 'isian', 'uraian', 'benar_salah');
CREATE TYPE difficulty_level AS ENUM ('mudah', 'sedang', 'sulit');

-- AI & Billing Enums
CREATE TYPE job_type AS ENUM (
  'modul_generate', 'modul_assist', 'prota_promes',
  'bank_soal', 'deskripsi_nilai', 'refleksi',
  'bukti_kinerja', 'prota_agent'
);
CREATE TYPE job_status AS ENUM ('queued', 'running', 'done', 'failed');
CREATE TYPE agent_name AS ENUM (
  'orchestrator', 'cp', 'tp', 'atp',
  'activity', 'asesmen', 'validator',
  'prota', 'promes', 'soal', 'deskripsi', 'refleksi'
);
CREATE TYPE subscription_plan AS ENUM ('free', 'go', 'plus', 'sekolah');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'failed', 'expired');
CREATE TYPE notification_type AS ENUM (
  'migration_ready', 'quota_warning', 'payment_success',
  'payment_failed', 'export_ready', 'journal_reminder'
);`,
  },
  {
    id: "002",
    title: "Identity — Schools & Users",
    color: "#6366F1",
    desc: "Entitas utama: sekolah dan pengguna. Users linked ke Supabase Auth (auth.users).",
    sql: `-- Schools
CREATE TABLE schools (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           text NOT NULL,
  npsn           text,
  npwp           text,
  address        text,
  subdomain      text UNIQUE,
  logo_url       text,
  plan           school_plan NOT NULL DEFAULT 'free',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Users (mirrors auth.users, extra profile data)
CREATE TABLE users (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          text NOT NULL UNIQUE,
  full_name      text NOT NULL DEFAULT '',
  role           user_role NOT NULL DEFAULT 'guru',
  school_id      uuid REFERENCES schools(id) ON DELETE SET NULL,
  avatar_url     text,
  nip            text,               -- NIP guru ASN (opsional)
  phone_wa       text,               -- WhatsApp number (opsional, future)
  default_subject text,              -- dari onboarding
  default_phase  curriculum_phase,   -- dari onboarding
  default_grade  text,               -- dari onboarding
  onboarding_done boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_role ON users(role);`,
  },
  {
    id: "003",
    title: "Academic Year & Teaching Classes",
    color: "#10B981",
    desc: "Container untuk semua data pembelajaran. Semua data jurnal, nilai, siswa scoped ke academic_year dan teaching_class.",
    sql: `-- Academic Years (per sekolah)
CREATE TABLE academic_years (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id      uuid REFERENCES schools(id) ON DELETE CASCADE,
  label          text NOT NULL,     -- '2024/2025 Ganjil'
  semester       semester_type NOT NULL,
  year           int NOT NULL,      -- 2024
  start_date     date NOT NULL,
  end_date       date NOT NULL,
  is_active      boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, year, semester)
);

-- Teaching Classes (guru × mapel × kelas × tahun ajaran)
CREATE TABLE teaching_classes (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id      uuid REFERENCES schools(id) ON DELETE SET NULL,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  subject        text NOT NULL,
  grade          text NOT NULL,     -- '8' (tanpa A/B)
  class_name     text NOT NULL,     -- '8A'
  phase          curriculum_phase,
  -- Jadwal: array of { day: 1-7, time_start: 'HH:MM', time_end: 'HH:MM' }
  schedule       jsonb NOT NULL DEFAULT '[]',
  student_count  int NOT NULL DEFAULT 0,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Students (per teaching class)
CREATE TABLE students (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teaching_class_id  uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  name               text NOT NULL,
  nis                text,
  gender             gender_type,
  notes              text,
  is_active          boolean NOT NULL DEFAULT true,
  sort_order         int NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_academic_years_school ON academic_years(school_id);
CREATE INDEX idx_teaching_classes_user ON teaching_classes(user_id);
CREATE INDEX idx_teaching_classes_year ON teaching_classes(academic_year_id);
CREATE INDEX idx_teaching_classes_user_year ON teaching_classes(user_id, academic_year_id);
CREATE INDEX idx_students_class ON students(teaching_class_id);
CREATE INDEX idx_students_class_active ON students(teaching_class_id, is_active);`,
  },
  {
    id: "004",
    title: "Curriculum — Versions, Templates, Learning Outcomes",
    color: "#8B5CF6",
    desc: "Data kurikulum yang dikelola admin Modulajar. Seed dari CP Kemendikbud. Tidak bisa diedit oleh guru.",
    sql: `-- Curriculum Versions (K13, Merdeka 2022, Merdeka 2025, dst)
CREATE TABLE curriculum_versions (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           text NOT NULL,       -- 'Kurikulum Merdeka 2022'
  code           text NOT NULL UNIQUE, -- 'MERDEKA_2022'
  phase          curriculum_phase,     -- null = berlaku semua fase
  year           int NOT NULL,
  status         curriculum_status NOT NULL DEFAULT 'draft',
  published_at   timestamptz,
  published_by   uuid REFERENCES users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Module Templates (struktur form per kurikulum)
CREATE TABLE module_templates (
  id                     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum_version_id  uuid NOT NULL REFERENCES curriculum_versions(id),
  subject                text,         -- null = berlaku semua mapel
  -- JSON Schema yang drive dynamic form renderer
  -- { sections: [{ key, label, type, required, placeholder, help }] }
  schema                 jsonb NOT NULL DEFAULT '{}',
  -- Rules untuk auto-migrate dari versi sebelumnya
  -- { from_version_id, field_map: {old_key: new_key}, new_required: [], deprecated: [] }
  migration_rules        jsonb NOT NULL DEFAULT '{}',
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Learning Outcomes / Capaian Pembelajaran (seed dari BSKAP Kemendikbud)
CREATE TABLE learning_outcomes (
  id                     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum_version_id  uuid NOT NULL REFERENCES curriculum_versions(id),
  subject                text NOT NULL,
  phase                  curriculum_phase NOT NULL,
  elemen                 text NOT NULL,
  sub_elemen             text,
  deskripsi              text NOT NULL,
  sort_order             int NOT NULL DEFAULT 0,
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_module_templates_version ON module_templates(curriculum_version_id);
CREATE INDEX idx_learning_outcomes_version ON learning_outcomes(curriculum_version_id);
CREATE INDEX idx_learning_outcomes_subject_phase ON learning_outcomes(subject, phase);`,
  },
  {
    id: "005",
    title: "Modules — Core Content",
    color: "#F59E0B",
    desc: "Modul ajar sebagai entitas utama produk. Content JSONB driven by template schema. Supports versioning, curated library, public sharing.",
    sql: `-- Modules
CREATE TABLE modules (
  id                     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id              uuid REFERENCES schools(id) ON DELETE SET NULL,
  curriculum_version_id  uuid REFERENCES curriculum_versions(id),
  template_id            uuid REFERENCES module_templates(id),
  teaching_class_id      uuid REFERENCES teaching_classes(id) ON DELETE SET NULL,

  title                  text NOT NULL DEFAULT 'Modul Tanpa Judul',
  subject                text NOT NULL,
  phase                  curriculum_phase,
  grade                  text,
  duration_minutes       int NOT NULL DEFAULT 80,

  -- Konten: JSONB dengan keys sesuai template schema
  -- { identitas_modul: {...}, tujuan_pembelajaran: {...}, ... }
  content                jsonb NOT NULL DEFAULT '{}',

  status                 module_status NOT NULL DEFAULT 'draft',
  mode                   module_mode NOT NULL DEFAULT 'scratch',

  -- Curated library
  is_curated             boolean NOT NULL DEFAULT false,
  curated_by             uuid REFERENCES users(id),
  curated_at             timestamptz,

  -- Public sharing
  is_public              boolean NOT NULL DEFAULT false,
  slug                   text UNIQUE,        -- untuk /m/[slug]
  share_count            int NOT NULL DEFAULT 0,

  -- Fork tracking
  fork_count             int NOT NULL DEFAULT 0,
  source_module_id       uuid REFERENCES modules(id) ON DELETE SET NULL,

  -- Full-text search vector
  search_vector          tsvector,

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Module Migrations (auto-generated saat kurikulum update)
CREATE TABLE module_migrations (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id         uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  from_version_id   uuid NOT NULL REFERENCES curriculum_versions(id),
  to_version_id     uuid NOT NULL REFERENCES curriculum_versions(id),
  status            migration_status NOT NULL DEFAULT 'pending_review',
  -- { added: [{field, value}], changed: [{field, old, new}], removed: [{field}], needs_input: [field] }
  diff              jsonb NOT NULL DEFAULT '{}',
  migrated_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid REFERENCES users(id)
);

-- Module Exports (PDF downloads)
CREATE TABLE module_exports (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id     uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id),
  watermarked   boolean NOT NULL DEFAULT false,
  file_path     text,           -- Supabase Storage path
  signed_url    text,
  url_expires_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_modules_user ON modules(user_id);
CREATE INDEX idx_modules_school ON modules(school_id);
CREATE INDEX idx_modules_version ON modules(curriculum_version_id);
CREATE INDEX idx_modules_class ON modules(teaching_class_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_curated ON modules(is_curated) WHERE is_curated = true;
CREATE INDEX idx_modules_public ON modules(is_public) WHERE is_public = true;
CREATE INDEX idx_modules_slug ON modules(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_modules_search ON modules USING GIN(search_vector);
CREATE INDEX idx_module_migrations_module ON module_migrations(module_id);
CREATE INDEX idx_module_migrations_status ON module_migrations(status);

-- Auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION update_module_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('indonesian',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.subject, '') || ' ' ||
    coalesce(NEW.content->>'topik', '') || ' ' ||
    coalesce(NEW.grade, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER modules_search_vector_update
BEFORE INSERT OR UPDATE ON modules
FOR EACH ROW EXECUTE FUNCTION update_module_search_vector();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER modules_updated_at
BEFORE UPDATE ON modules
FOR EACH ROW EXECUTE FUNCTION update_updated_at();`,
  },
  {
    id: "006",
    title: "Journals & Attendance",
    color: "#F97316",
    desc: "Jurnal mengajar harian dan absensi siswa. Supports offline (is_synced flag). Linked ke modul untuk auto-fill topik.",
    sql: `-- Journals (Jurnal Mengajar Harian)
CREATE TABLE journals (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teaching_class_id  uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  academic_year_id   uuid NOT NULL REFERENCES academic_years(id),
  module_id          uuid REFERENCES modules(id) ON DELETE SET NULL, -- modul yang diajarkan

  date               date NOT NULL DEFAULT CURRENT_DATE,
  topic              text NOT NULL DEFAULT '',

  -- Detail kegiatan (opsional, bisa diisi nanti atau AI-generate dari modul)
  activity_open      text,   -- Kegiatan Pendahuluan
  activity_main      text,   -- Kegiatan Inti
  activity_close     text,   -- Kegiatan Penutup

  -- Ketercapaian TP hari ini (0-100, estimasi guru)
  tp_achievement     int CHECK(tp_achievement BETWEEN 0 AND 100),
  notes              text,

  -- Dokumentasi
  photo_urls         text[] NOT NULL DEFAULT '{}',

  -- Offline sync support
  is_synced          boolean NOT NULL DEFAULT true,
  client_created_at  timestamptz,  -- timestamp dari device saat offline

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  UNIQUE(teaching_class_id, date)  -- 1 jurnal per kelas per hari
);

-- Attendances (Absensi per siswa per jurnal)
CREATE TABLE attendances (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id  uuid NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status      attendance_status NOT NULL DEFAULT 'H',
  notes       text,
  is_synced   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE(journal_id, student_id)
);

-- Indexes
CREATE INDEX idx_journals_user ON journals(user_id);
CREATE INDEX idx_journals_class ON journals(teaching_class_id);
CREATE INDEX idx_journals_year ON journals(academic_year_id);
CREATE INDEX idx_journals_date ON journals(date DESC);
CREATE INDEX idx_journals_class_date ON journals(teaching_class_id, date DESC);
CREATE INDEX idx_journals_unsynced ON journals(user_id, is_synced) WHERE is_synced = false;
CREATE INDEX idx_attendances_journal ON attendances(journal_id);
CREATE INDEX idx_attendances_student ON attendances(student_id);
CREATE INDEX idx_attendances_unsynced ON attendances(journal_id, is_synced) WHERE is_synced = false;

CREATE TRIGGER journals_updated_at BEFORE UPDATE ON journals
FOR EACH ROW EXECUTE FUNCTION update_updated_at();`,
  },
  {
    id: "007",
    title: "Grades & Assessments",
    color: "#EF4444",
    desc: "Input nilai per TP per siswa. Grade summaries computed dari sumatif saja (bukan formatif). Deskripsi AI-generated.",
    sql: `-- Grade Entries (nilai per TP per siswa per assessment)
CREATE TABLE grade_entries (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teaching_class_id  uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  academic_year_id   uuid NOT NULL REFERENCES academic_years(id),
  student_id         uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  assessment_type    assessment_type NOT NULL,
  tp_code            text NOT NULL,    -- 'TP-1', 'TP-2', dll (dari modul)
  tp_label           text,             -- label lengkap TP untuk display

  score              numeric(5,2) CHECK(score BETWEEN 0 AND 100),
  -- Label untuk formatif: Mulai Berkembang / Berkembang / Sangat Berkembang
  qualitative_label  text,

  notes              text,
  assessed_at        date NOT NULL DEFAULT CURRENT_DATE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Grade Summaries (nilai akhir per siswa per mapel per semester)
-- Computed dari sumatif entries. Formatif TIDAK masuk nilai akhir.
CREATE TABLE grade_summaries (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teaching_class_id  uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  academic_year_id   uuid NOT NULL REFERENCES academic_years(id),
  student_id         uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES users(id),

  -- Nilai akhir = AVG dari semua sumatif entries
  final_score        numeric(5,2),

  -- KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)
  kktp_threshold     int NOT NULL DEFAULT 70,
  meets_kktp         boolean GENERATED ALWAYS AS (final_score >= kktp_threshold) STORED,

  -- Deskripsi AI-generated, guru bisa edit
  description        text,
  description_draft  boolean NOT NULL DEFAULT true, -- true = belum difinalisasi guru

  -- AI generation tracking
  description_job_id uuid, -- FK ke agent_jobs
  generated_at       timestamptz,

  computed_at        timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  UNIQUE(teaching_class_id, academic_year_id, student_id)
);

-- Questions (Bank Soal)
CREATE TABLE questions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id    uuid REFERENCES modules(id) ON DELETE SET NULL,
  type         question_type NOT NULL,
  content      text NOT NULL,
  -- Untuk PG: [{ label: 'A', text: '...' }, ...]
  options      jsonb NOT NULL DEFAULT '[]',
  answer       text NOT NULL DEFAULT '',
  rubric       text,
  tp_code      text,
  difficulty   difficulty_level NOT NULL DEFAULT 'sedang',
  is_public    boolean NOT NULL DEFAULT false,
  fork_count   int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Question Sets (Kumpulan soal untuk satu ulangan/kisi-kisi)
CREATE TABLE question_sets (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id    uuid REFERENCES modules(id) ON DELETE SET NULL,
  title        text NOT NULL,
  description  text,
  question_ids uuid[] NOT NULL DEFAULT '{}',
  is_curated   boolean NOT NULL DEFAULT false,
  is_public    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_grade_entries_class ON grade_entries(teaching_class_id);
CREATE INDEX idx_grade_entries_student ON grade_entries(student_id);
CREATE INDEX idx_grade_entries_year ON grade_entries(academic_year_id);
CREATE INDEX idx_grade_entries_type ON grade_entries(assessment_type);
CREATE INDEX idx_grade_entries_class_student ON grade_entries(teaching_class_id, student_id);
CREATE INDEX idx_grade_summaries_class ON grade_summaries(teaching_class_id);
CREATE INDEX idx_grade_summaries_student ON grade_summaries(student_id);
CREATE INDEX idx_questions_user ON questions(user_id);
CREATE INDEX idx_questions_public ON questions(is_public) WHERE is_public = true;
CREATE INDEX idx_question_sets_user ON question_sets(user_id);

CREATE TRIGGER grade_entries_updated_at BEFORE UPDATE ON grade_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER grade_summaries_updated_at BEFORE UPDATE ON grade_summaries
FOR EACH ROW EXECUTE FUNCTION update_updated_at();`,
  },
  {
    id: "008",
    title: "AI Agent Jobs & Steps",
    color: "#A78BFA",
    desc: "Tracking semua AI operations. Setiap job punya steps yang bisa di-resume kalau gagal. Cost tracking per job.",
    sql: `-- Agent Jobs (parent: satu request AI dari user)
CREATE TABLE agent_jobs (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type     job_type NOT NULL,
  status       job_status NOT NULL DEFAULT 'queued',

  -- Input yang dikirim ke orchestrator
  input        jsonb NOT NULL DEFAULT '{}',
  -- Output final setelah semua steps selesai
  output       jsonb,

  -- Resource yang dibuat/diupdate oleh job ini
  module_id           uuid REFERENCES modules(id) ON DELETE SET NULL,
  teaching_class_id   uuid REFERENCES teaching_classes(id) ON DELETE SET NULL,

  -- Cost tracking
  tokens_used  int NOT NULL DEFAULT 0,
  cost_idr     int NOT NULL DEFAULT 0,   -- dalam rupiah

  -- Timing
  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Agent Steps (child: tiap agent dalam orchestrator chain)
CREATE TABLE agent_steps (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id       uuid NOT NULL REFERENCES agent_jobs(id) ON DELETE CASCADE,
  agent        agent_name NOT NULL,
  status       job_status NOT NULL DEFAULT 'pending',
  step_order   int NOT NULL DEFAULT 0,

  -- Output dari step ini (jadi input untuk step berikutnya)
  output       jsonb,
  error        text,

  -- Retry tracking
  attempt      int NOT NULL DEFAULT 1,
  max_attempts int NOT NULL DEFAULT 3,

  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_agent_jobs_user ON agent_jobs(user_id);
CREATE INDEX idx_agent_jobs_status ON agent_jobs(status);
CREATE INDEX idx_agent_jobs_user_status ON agent_jobs(user_id, status);
CREATE INDEX idx_agent_steps_job ON agent_steps(job_id);
CREATE INDEX idx_agent_steps_job_order ON agent_steps(job_id, step_order);`,
  },
  {
    id: "009",
    title: "Billing — Subscriptions & Payments",
    color: "#EC4899",
    desc: "Full billing lifecycle. Subscription per user atau per sekolah. Payment history. Top-up AI credits.",
    sql: `-- Subscriptions
CREATE TABLE subscriptions (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Milik guru individual ATAU sekolah (salah satu)
  user_id               uuid REFERENCES users(id) ON DELETE CASCADE,
  school_id             uuid REFERENCES schools(id) ON DELETE CASCADE,

  plan                  subscription_plan NOT NULL DEFAULT 'free',
  billing_cycle         billing_cycle,
  status                subscription_status NOT NULL DEFAULT 'active',

  -- AI Quota: -1 = unlimited (Plus dan Sekolah)
  ai_quota_used         int NOT NULL DEFAULT 0,
  ai_quota_limit        int NOT NULL DEFAULT 0,  -- 0 = locked (free), -1 = unlimited

  -- Billing period
  current_period_start  timestamptz NOT NULL DEFAULT now(),
  current_period_end    timestamptz,

  -- Dunning
  grace_period_end      timestamptz,
  cancel_at_period_end  boolean NOT NULL DEFAULT false,

  -- Xendit
  xendit_subscription_id text,

  -- Invoice data untuk BOS (sekolah)
  invoice_data          jsonb NOT NULL DEFAULT '{}',
  -- { npwp_sekolah, nama_sekolah, alamat, pic_name }

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Constraint: harus milik user ATAU sekolah, tidak keduanya
  CONSTRAINT subscription_owner CHECK (
    (user_id IS NOT NULL AND school_id IS NULL) OR
    (user_id IS NULL AND school_id IS NOT NULL)
  )
);

-- Payments
CREATE TABLE payments (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id       uuid NOT NULL REFERENCES subscriptions(id),

  xendit_payment_id     text NOT NULL UNIQUE,  -- untuk idempotency
  xendit_invoice_id     text,

  amount_idr            int NOT NULL,
  method                text,      -- 'QRIS', 'GOPAY', 'VA_BCA', dll
  status                payment_status NOT NULL DEFAULT 'pending',

  invoice_url           text,      -- Xendit invoice URL
  pdf_url               text,      -- Supabase Storage URL (PDF invoice kita)
  pdf_signed_url        text,
  pdf_url_expires_at    timestamptz,

  paid_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Top-ups (one-time AI credit purchase)
CREATE TABLE topups (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id   uuid NOT NULL REFERENCES subscriptions(id),

  xendit_payment_id text NOT NULL UNIQUE,
  amount_idr        int NOT NULL,
  ai_credits        int NOT NULL DEFAULT 3,
  method            text,
  status            payment_status NOT NULL DEFAULT 'pending',

  paid_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Invoice Sequences (untuk nomor invoice sequential: INV-2025-000001)
CREATE TABLE invoice_sequences (
  year     int PRIMARY KEY,
  last_seq int NOT NULL DEFAULT 0
);

-- Webhook Logs (audit trail semua incoming Xendit events)
CREATE TABLE webhook_logs (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  xendit_event  text NOT NULL,
  payload       jsonb NOT NULL,
  processed     boolean NOT NULL DEFAULT false,
  error         text,
  processed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_subscriptions_user ON subscriptions(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_subscriptions_school ON subscriptions(school_id) WHERE school_id IS NOT NULL;
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_xendit ON payments(xendit_payment_id);
CREATE INDEX idx_topups_user ON topups(user_id);
CREATE INDEX idx_webhook_logs_event ON webhook_logs(xendit_event);
CREATE INDEX idx_webhook_logs_unprocessed ON webhook_logs(processed) WHERE processed = false;

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: generate invoice number INV-YYYY-NNNNNN
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  current_year int := EXTRACT(YEAR FROM now());
  new_seq int;
BEGIN
  INSERT INTO invoice_sequences(year, last_seq) VALUES(current_year, 1)
  ON CONFLICT(year) DO UPDATE SET last_seq = invoice_sequences.last_seq + 1
  RETURNING last_seq INTO new_seq;
  RETURN 'INV-' || current_year || '-' || LPAD(new_seq::text, 6, '0');
END;
$$ LANGUAGE plpgsql;`,
  },
  {
    id: "010",
    title: "Notifications, Feedback & Config",
    color: "#0EA5E9",
    desc: "In-app notifications, push subscriptions, user feedback, feature flags, dan app config.",
    sql: `-- Notifications (in-app)
CREATE TABLE notifications (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         notification_type NOT NULL,
  title        text NOT NULL,
  body         text,
  -- { module_id, version_name, job_id, amount_idr, dll }
  meta         jsonb NOT NULL DEFAULT '{}',
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Push Subscriptions (untuk PWA push notification)
CREATE TABLE push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint     text NOT NULL UNIQUE,
  p256dh       text NOT NULL,
  auth         text NOT NULL,
  device_info  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

-- Feedbacks (dari in-app feedback widget)
CREATE TABLE feedbacks (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  type         text NOT NULL DEFAULT 'general', -- 'bug', 'feature', 'general'
  content      text NOT NULL,
  url          text,     -- halaman saat feedback dikirim
  screenshot   text,     -- Supabase Storage URL (opsional)
  resolved     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Feature Flags (toggle fitur tanpa deploy)
CREATE TABLE feature_flags (
  key                text PRIMARY KEY,
  enabled            boolean NOT NULL DEFAULT false,
  rollout_percentage int NOT NULL DEFAULT 100 CHECK(rollout_percentage BETWEEN 0 AND 100),
  -- null = semua plan, atau ['go', 'plus', 'sekolah']
  enabled_for_plans  text[],
  description        text,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- App Config (setting aplikasi yang bisa diubah tanpa deploy)
CREATE TABLE app_config (
  key          text PRIMARY KEY,
  -- { value, description, updated_by, updated_at }
  value        jsonb NOT NULL,
  description  text,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Audit Logs (semua major actions)
CREATE TABLE audit_logs (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  action        text NOT NULL,  -- 'module.published', 'subscription.cancelled', dll
  resource_type text,
  resource_id   uuid,
  meta          jsonb NOT NULL DEFAULT '{}',
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Daily Metrics (aggregate harian untuk dashboard admin)
CREATE TABLE daily_metrics (
  date              date PRIMARY KEY,
  new_signups       int NOT NULL DEFAULT 0,
  active_users      int NOT NULL DEFAULT 0,
  modules_created   int NOT NULL DEFAULT 0,
  ai_jobs_run       int NOT NULL DEFAULT 0,
  ai_cost_idr       int NOT NULL DEFAULT 0,
  mrr_idr           int NOT NULL DEFAULT 0,
  new_subscriptions int NOT NULL DEFAULT 0,
  churn_count       int NOT NULL DEFAULT 0
);

-- User Flags (untuk abuse detection dan ban)
CREATE TABLE user_flags (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason       text NOT NULL,
  flagged_by   uuid REFERENCES users(id),
  resolved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_feedbacks_resolved ON feedbacks(resolved);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);`,
  },
  {
    id: "011",
    title: "Row Level Security — All Tables",
    color: "#F59E0B",
    desc: "RLS policy untuk semua tabel. Multi-tenant isolation. server-side (Elysia) pakai service_role bypass.",
    sql: `-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE topups ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- USERS: own row only
CREATE POLICY users_select ON users FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY users_update ON users FOR UPDATE
  USING (auth.uid() = id);

-- SCHOOLS: own school only
CREATE POLICY schools_select ON schools FOR SELECT
  USING (id IN (SELECT school_id FROM users WHERE id = auth.uid()));

-- ACADEMIC YEARS: own school
CREATE POLICY academic_years_all ON academic_years FOR ALL
  USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));

-- TEACHING CLASSES: own user only
CREATE POLICY teaching_classes_all ON teaching_classes FOR ALL
  USING (user_id = auth.uid());

-- STUDENTS: via teaching class ownership
CREATE POLICY students_all ON students FOR ALL
  USING (teaching_class_id IN (
    SELECT id FROM teaching_classes WHERE user_id = auth.uid()
  ));

-- CURRICULUM: public read, admin write
CREATE POLICY curriculum_versions_read ON curriculum_versions FOR SELECT
  USING (true);
CREATE POLICY module_templates_read ON module_templates FOR SELECT
  USING (true);
CREATE POLICY learning_outcomes_read ON learning_outcomes FOR SELECT
  USING (true);

-- MODULES: own + school + curated/public
CREATE POLICY modules_select ON modules FOR SELECT
  USING (
    user_id = auth.uid() OR
    school_id IN (SELECT school_id FROM users WHERE id = auth.uid()) OR
    is_curated = true OR
    is_public = true
  );
CREATE POLICY modules_insert ON modules FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY modules_update ON modules FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY modules_delete ON modules FOR DELETE
  USING (user_id = auth.uid());

-- MODULE MIGRATIONS: via module ownership
CREATE POLICY module_migrations_all ON module_migrations FOR ALL
  USING (module_id IN (SELECT id FROM modules WHERE user_id = auth.uid()));

-- MODULE EXPORTS: own only
CREATE POLICY module_exports_all ON module_exports FOR ALL
  USING (user_id = auth.uid());

-- JOURNALS: own only
CREATE POLICY journals_all ON journals FOR ALL
  USING (user_id = auth.uid());

-- ATTENDANCES: via journal ownership
CREATE POLICY attendances_all ON attendances FOR ALL
  USING (journal_id IN (SELECT id FROM journals WHERE user_id = auth.uid()));

-- GRADES: own only
CREATE POLICY grade_entries_all ON grade_entries FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY grade_summaries_all ON grade_summaries FOR ALL
  USING (user_id = auth.uid());

-- QUESTIONS: own + public
CREATE POLICY questions_select ON questions FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY questions_insert ON questions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY questions_update ON questions FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY questions_delete ON questions FOR DELETE
  USING (user_id = auth.uid());

-- QUESTION SETS: own + public
CREATE POLICY question_sets_select ON question_sets FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY question_sets_insert ON question_sets FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY question_sets_update ON question_sets FOR UPDATE
  USING (user_id = auth.uid());

-- AGENT JOBS: own only
CREATE POLICY agent_jobs_all ON agent_jobs FOR ALL
  USING (user_id = auth.uid());

-- AGENT STEPS: via job ownership (read-only for users, server writes)
CREATE POLICY agent_steps_select ON agent_steps FOR SELECT
  USING (job_id IN (SELECT id FROM agent_jobs WHERE user_id = auth.uid()));

-- SUBSCRIPTIONS: own or own school
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR
    school_id IN (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- PAYMENTS: via subscription
CREATE POLICY payments_select ON payments FOR SELECT
  USING (subscription_id IN (
    SELECT id FROM subscriptions
    WHERE user_id = auth.uid() OR
    school_id IN (SELECT school_id FROM users WHERE id = auth.uid())
  ));

-- TOPUPS: own only
CREATE POLICY topups_select ON topups FOR SELECT
  USING (user_id = auth.uid());

-- NOTIFICATIONS: own only
CREATE POLICY notifications_all ON notifications FOR ALL
  USING (user_id = auth.uid());

-- PUSH SUBSCRIPTIONS: own only
CREATE POLICY push_subscriptions_all ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- FEEDBACKS: own only (insert any, select own)
CREATE POLICY feedbacks_insert ON feedbacks FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY feedbacks_select ON feedbacks FOR SELECT
  USING (user_id = auth.uid());

-- NOTE: feature_flags, app_config, audit_logs, daily_metrics,
-- user_flags, invoice_sequences, webhook_logs:
-- Tidak ada RLS → HANYA accessible via service_role (Elysia server)
-- Frontend tidak pernah akses tabel ini langsung`,
  },
  {
    id: "012",
    title: "Seed Data",
    color: "#84CC16",
    desc: "Data awal yang harus ada sebelum app bisa dipakai. CurriculumVersion, AppConfig, FeatureFlags, AcademicYear.",
    sql: `-- Curriculum Versions
INSERT INTO curriculum_versions (name, code, year, status) VALUES
  ('Kurikulum 2013', 'K13', 2013, 'deprecated'),
  ('Kurikulum Merdeka 2022', 'MERDEKA_2022', 2022, 'active');

-- App Config
INSERT INTO app_config (key, value, description) VALUES
  ('ai_quota_go',        '{"value": 10}',   'AI quota per bulan untuk Go tier'),
  ('ai_quota_plus',      '{"value": -1}',   'AI quota Plus: -1 = unlimited'),
  ('ai_quota_sekolah',   '{"value": -1}',   'AI quota Sekolah: -1 = unlimited'),
  ('topup_price_idr',    '{"value": 5000}',  'Harga top-up AI credits'),
  ('topup_credits',      '{"value": 3}',    'Jumlah credits per top-up'),
  ('max_modules_free',   '{"value": 3}',    'Maks modul per bulan untuk Free'),
  ('maintenance_mode',   '{"value": false}', 'Toggle maintenance mode'),
  ('maintenance_message','{"value": "Modulajar sedang dalam pemeliharaan. Kembali dalam beberapa menit."}', 'Pesan maintenance');

-- Feature Flags
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('full_ai_mode',       true,  'Full AI generate modul'),
  ('curated_library',    true,  'Browse dan fork curated modules'),
  ('plus_tier',          false, 'Plus tier (diaktifkan saat launch Plus)'),
  ('sekolah_tier',       false, 'Sekolah tier (diaktifkan saat launch Sekolah)'),
  ('journal_feature',    false, 'Jurnal mengajar harian (post-launch sprint 1)'),
  ('grade_feature',      false, 'Input nilai dan deskripsi (post-launch sprint 1)'),
  ('pwa_offline',        false, 'Offline mode PWA (post-launch sprint 2)'),
  ('bukti_pmm',          false, 'Paket Bukti Kinerja PMM (post-launch sprint 2)'),
  ('bank_soal',          false, 'Bank Soal AI (post-launch sprint 2)');

-- Academic Year (current)
-- Run ini di awal deployment, update year sesuai tahun aktif
INSERT INTO academic_years (label, semester, year, start_date, end_date, is_active)
VALUES ('2025/2026 Ganjil', 'ganjil', 2025, '2025-07-14', '2025-12-20', true);

-- NOTE: Learning Outcomes (CP) di-seed via script terpisah
-- packages/db/seed/learning-outcomes.ts
-- Data dari PDF CP Kemendikbud per mapel per fase (~500-800 rows)`,
  },
];

// ─── SPRINT TRACKS ────────────────────────────────────────────────────────────
const SPRINT_LAUNCH = [
  {
    day: "Day 1", focus: "Monorepo + Supabase Init",
    tasks: [
      "pnpm create turbo@latest modulajar — pilih pnpm workspaces",
      "Setup apps/web (Next.js 15), apps/api (Elysia+Bun)",
      "Setup packages/db, packages/agents, packages/shared, packages/emails",
      "supabase init + supabase start (local dev)",
      "Buat 2 Supabase project di cloud: production + staging",
      "Commit ke GitHub — connect Railway (api) + Vercel (web)",
      "Submit dokumen Xendit business account — HARI INI (verifikasi 2-3 hari)",
    ],
    output: "Repo berjalan lokal. Supabase local start OK.", blocker: "Xendit verification butuh 2-3 hari — submit dokumen sekarang atau billing tidak bisa ditest di Week 2.",
  },
  {
    day: "Day 2", focus: "Full Database Schema",
    tasks: [
      "Run Migration 001: extensions + semua enums",
      "Run Migration 002: schools + users",
      "Run Migration 003: academic_years + teaching_classes + students",
      "Run Migration 004: curriculum_versions + module_templates + learning_outcomes",
      "Run Migration 005: modules + module_migrations + module_exports (dengan trigger FTS)",
      "Run Migration 006: journals + attendances",
      "Run Migration 007: grade_entries + grade_summaries + questions + question_sets",
      "Run Migration 008: agent_jobs + agent_steps",
      "Run Migration 009: subscriptions + payments + topups + invoice_sequences + webhook_logs",
      "Run Migration 010: notifications + push_subscriptions + feedbacks + feature_flags + app_config + audit_logs + daily_metrics + user_flags",
      "Run Migration 011: semua RLS policies",
      "Run Migration 012: seed data (curriculum versions, app_config, feature_flags, academic_year)",
      "supabase db push ke staging → verifikasi 25+ tabel terbuat semua",
    ],
    output: "Semua tabel + RLS + triggers + seed data exist di staging.", blocker: "Run urut migration 001→012. Jangan skip. Enum harus ada sebelum tabel yang pakai enum.",
  },
  {
    day: "Day 3", focus: "Elysia Bootstrap + Auth",
    tasks: [
      "Elysia bootstrap: bun create elysia apps/api, setup @elysiajs/cors, @elysiajs/rate-limit",
      "GET /health → { status: 'ok', timestamp, version }",
      "Supabase Auth: enable email + Google SSO di Supabase dashboard",
      "Google OAuth: setup Google Cloud Console → Client ID + Secret ke Supabase",
      "Kustomisasi email Supabase Auth template (Bahasa Indonesia)",
      "Railway: create project, link repo apps/api, set env vars, deploy",
      "Verify: api.modulajar.app/health returns 200",
      "packages/shared: setup Zod schemas (UserSchema, ModuleSchema, AgentOutputSchema)",
    ],
    output: "api.modulajar.app/health OK. Auth Google berjalan.", blocker: "Railway custom domain butuh DNS propagation ~30 menit.",
  },
  {
    day: "Day 4", focus: "Next.js Bootstrap + Auth Pages",
    tasks: [
      "Next.js 15 bootstrap: App Router, Tailwind, shadcn/ui, Plus Jakarta Sans",
      "Setup @supabase/ssr (server + browser client)",
      "next.config.ts: security headers (CSP, HSTS, X-Frame-Options, dll)",
      "Auth middleware: redirect /login kalau tidak ada session",
      "app/(auth)/login: Google SSO button (primary) + email/password",
      "app/(auth)/register: form + ToS checkbox wajib di-centang",
      "app/(auth)/forgot-password: form kirim reset email",
      "Email verification middleware: redirect kalau belum verify",
      "Onboarding wizard 3 step: nama+sekolah → mapel → fase+kelas",
      "Vercel: connect repo apps/web, set env vars, deploy",
    ],
    output: "Full auth flow: register → verify email → login → onboarding → dashboard.", blocker: "CSP header yang terlalu ketat bisa block Supabase JS — test di browser sebelum push.",
  },
  {
    day: "Day 5", focus: "CI/CD + Sentry + Dashboard Shell",
    tasks: [
      "GitHub Actions ci.yml: typecheck + lint + pnpm audit on PR",
      "GitHub Actions deploy.yml: supabase db push → Railway deploy → Vercel deploy on main",
      "Sentry: install @sentry/nextjs + @sentry/node, setup source maps",
      "Test CI/CD end-to-end: buat PR → CI hijau → merge → auto-deploy",
      "app/(app)/dashboard: shell layout (sidebar + header), greeting WIB, stat cards kosong",
      "app/(app)/modules: list kosong dengan empty state dan CTA buat modul",
      "Betterstack: setup status page + monitor api.modulajar.app/health",
    ],
    output: "CI/CD pipeline hijau. Dashboard shell berjalan. Status page live.", blocker: "pnpm audit CI: kalau ada critical vuln → fix dulu sebelum lanjut.",
  },
  {
    day: "Day 6", focus: "Seed CP + AI Agents Setup",
    tasks: [
      "Download CP Kurikulum Merdeka dari BSKAP (PDF per mapel)",
      "Buat seed script packages/db/seed/learning-outcomes.ts",
      "Seed prioritas: Matematika, IPA, IPS, Bahasa Indonesia Fase A-F",
      "Seed ModuleTemplate Kurikulum Merdeka (11 section schema)",
      "packages/agents: setup Bun, install @anthropic-ai/sdk",
      "AgentBase abstract class + Zod output schemas per agent",
      "CP Agent: query learning_outcomes → return structured CP list",
      "Test CP Agent isolated 20x → konsistensi > 95%",
    ],
    output: "CP data seeded. CP Agent return output valid Zod schema.", blocker: "PDF CP format tidak konsisten antar mapel — butuh ~2 jam manual review.",
  },
  {
    day: "Day 7", focus: "TP + ATP + Activity + Asesmen + Validator Agent",
    tasks: [
      "TP Agent: CP list → Tujuan Pembelajaran ABCD format (sertakan Bloom's Taxonomy di prompt)",
      "ATP Agent: TP list + durasi → alur per minggu, sequential",
      "Activity Agent: ATP + gaya_belajar → kegiatan (diferensiasi 3 gaya belajar)",
      "Asesmen Agent: TP list → diagnostik + formatif + sumatif dengan instrumen dan rubrik",
      "Validator Agent: full draft → check vs ModuleTemplate schema, return { valid, missing, score }",
      "Test chain: CP→TP→ATP→Activity→Asesmen→Validator end-to-end",
      "Verify setiap agent output ter-validate Zod schema",
    ],
    output: "6 agent berjalan. Chain end-to-end output modul draft lengkap.", blocker: "Asesmen Agent sering generic — sertakan contoh instrumen konkret di system prompt.",
  },
  {
    day: "Day 8", focus: "Orchestrator + SSE Streaming",
    tasks: [
      "Orchestrator: sequential dispatch, passing output antar step",
      "AgentJob + AgentStep tracking di Supabase (via service_role)",
      "Retry logic: 3x per step, exponential backoff (1s, 2s, 4s)",
      "Resume: POST /agent/jobs/:id/retry — skip steps status=done",
      "Quota check: atomic Supabase transaction sebelum dispatch",
      "Elysia SSE endpoint: GET /agent/jobs/:id/stream",
      "SSE keep-alive: comment event setiap 15 detik (prevent Railway timeout)",
      "Next.js: useEventSource hook + polling fallback 3 detik (iOS Safari)",
      "Generating screen: real-time checklist 6 steps",
    ],
    output: "Orchestrator berjalan. SSE checklist update real-time di browser.", blocker: "iOS Safari SSE terbatas — polling fallback wajib ditest di iPhone.",
  },
  {
    day: "Day 9", focus: "Full AI Wizard + Scratch Editor + Curated Library",
    tasks: [
      "Full AI wizard: 4 step form (mapel/fase/kelas → topik/durasi → gaya belajar → catatan)",
      "Dynamic form renderer dari ModuleTemplate.schema (JSONB → React form)",
      "Tiptap rich text editor: dynamic import ssr:false, toolbar dasar",
      "Scratch editor: sidebar outline + accordion mobile + autosave debounce 2000ms",
      "Curated library: GET /library dengan FTS (to_tsquery indonesian), filter mapel/fase",
      "Fork modul: POST /library/:id/fork → copy + redirect ke editor",
      "Module preview: read-only A4 style layout",
      "AI Assist: POST /agent/assist (Suggest/Improve/Generate/Check per section)",
    ],
    output: "Full AI wizard → generating → editor berjalan. Curated library + fork berjalan.", blocker: "Tiptap SSR Next.js: gunakan dynamic import dengan ssr: false, jangan lupa.",
  },
  {
    day: "Day 10", focus: "PDF Export + Upgrade Prompt",
    tasks: [
      "Install Puppeteer di Elysia (atau @sparticuz/chromium di Railway)",
      "HTML template modul: A4, Times New Roman 12pt, header, footer halaman",
      "Free tier: diagonal watermark CSS overlay (text 'MODULAJAR — UPGRADE' opacity 15%)",
      "Upload ke Supabase Storage exports/ private bucket, signed URL 7 hari",
      "Storage lifecycle rule: auto-delete exports > 7 hari",
      "Upgrade prompt slide-up sheet: muncul saat free user klik download",
      "Public share: /m/[slug] dengan OG image dynamic (@vercel/og)",
      "Module status flow: Draft → Published → Archived",
    ],
    output: "PDF export berjalan (clean Go, watermark Free). Upgrade prompt muncul.", blocker: "Puppeteer memory di Railway: set 512MB RAM minimum, pantau setelah deploy.",
  },
  {
    day: "Day 11", focus: "Xendit Checkout + Webhook Handler",
    tasks: [
      "Install xendit-node SDK di Elysia",
      "POST /billing/checkout { plan: 'go', billing_cycle } → create Xendit invoice → return payment_url",
      "Setup payment methods: QRIS, GoPay, OVO, Dana, VA BCA/Mandiri/BNI, Indomaret/Alfamart",
      "POST /webhooks/xendit: verify X-CALLBACK-TOKEN header DULU",
      "Return 200 ke Xendit DULU, proses logic setelah",
      "payment.paid → subscription active, reset quota, kirim email, generate invoice PDF",
      "payment.expired/failed → past_due, grace_period_end = now + 3 hari",
      "Idempotency: cek xendit_payment_id UNIQUE sebelum proses semua event",
      "Log semua webhook ke webhook_logs table",
      "Test via Xendit sandbox 'Send Test Webhook' semua event types",
    ],
    output: "Checkout flow berjalan. payment.paid → subscription active dalam < 5 detik.", blocker: "Xendit business account harus sudah verified — kalau belum, billing tidak bisa di-test.",
  },
  {
    day: "Day 12", focus: "Billing Page + Dunning Crons",
    tasks: [
      "Invoice PDF: install @react-pdf/renderer, template INV-YYYY-NNNNNN, NPWP PT, PPN 11%",
      "Upload invoice ke Storage invoices/ private, signed URL 30 hari",
      "Kirim invoice via Resend email payment_success",
      "app/(app)/settings/billing: plan badge, quota bar, riwayat bayar, [Download Invoice], top-up",
      "POST /billing/topup → Xendit payment link Rp 5.000",
      "Supabase Edge Functions crons:",
      "  - quota_reset: '0 0 1 * *' (monthly reset)",
      "  - grace_period_check: '0 8 * * *' (suspend kalau expired)",
      "  - subscription_expiry: '0 9 * * *' (cek renewal)",
      "8 Resend email templates: welcome, payment_success, payment_failed, subscription_expiring, migration_ready, quota_warning, export_ready, school_invite",
      "Test semua email di Gmail + Outlook mobile",
    ],
    output: "Invoice PDF terkirim via email. Billing page berjalan. 3 crons berjalan di staging.", blocker: "React-PDF di Bun: test compatibility sebelum integrasi. Kadang ada issue dengan font embedding.",
  },
  {
    day: "Day 13", focus: "Landing Page + SEO",
    tasks: [
      "app/(marketing)/page.tsx: hero, counter modul, how it works, feature showcase, pricing 3 tier, FAQ accordion, footer",
      "Pricing toggle: bulanan/tahunan (highlight hemat 2 bulan)",
      "'Yang Akan Datang' section: Jurnal, Nilai, Bukti PMM, Sekolah Plan",
      "app/(marketing)/pricing: standalone pricing page",
      "next-sitemap: sitemap.xml otomatis, robots.txt",
      "OG image: @vercel/og untuk landing + /m/[slug]",
      "Schema.org: Organization + SoftwareApplication + FAQPage",
      "Posthog EU: install posthog-js, cookie consent banner (opt-out), semua 10 key events",
      "Blog MDX: 1 artikel launch ('Cara Buat Modul Ajar Kurikulum Merdeka dalam 60 Detik')",
    ],
    output: "Landing page live dan fast (LCP < 2.5s). Sitemap valid. Posthog events masuk.", blocker: "OG image: Plus Jakarta Sans harus di-embed di @vercel/og, bukan Google Fonts.",
  },
  {
    day: "Day 14", focus: "Legal + Security + Help Center",
    tasks: [
      "app/(marketing)/terms: Terms of Service (Bahasa Indonesia)",
      "app/(marketing)/privacy: Privacy Policy (UU PDP Indonesia)",
      "app/(marketing)/refund: Kebijakan Pengembalian Dana",
      "app/(marketing)/cookies: Cookie Policy",
      "ToS checkbox di register: wajib dicentang sebelum bisa submit",
      "Auto-renewal disclosure di checkout: teks jelas sebelum bayar",
      "app/(marketing)/help: 5 artikel MDX minimal (cara buat modul, cara bayar, cara download, kurikulum, FAQ)",
      "Lighthouse audit semua halaman penting: fix LCP > 2.5s",
      "Test security headers di securityheaders.com: target grade A",
    ],
    output: "Legal pages live. Help center 5 artikel. Security grade A.", blocker: "Privacy Policy harus mention Anthropic API data handling dan Supabase storage location (AWS Singapore).",
  },
  {
    day: "Day 15", focus: "Curated Modules + Launch Checklist → LAUNCH",
    tasks: [
      "Generate 10 curated modules via Full AI: Matematika Fase D, IPA Fase D, IPS Fase D, Bahasa Indonesia Fase D, Matematika Fase B, IPA Fase B, Bahasa Inggris Fase D, PPKN Fase D, Matematika Fase E, IPA Fase E",
      "Review semua 10 modul manual: konten akurat, tidak ada hallucination",
      "Flag is_curated=true untuk semua 10 modul",
      "Run launch checklist subset (15 items) — fix semua yang belum hijau",
      "Final smoke test production: register → Full AI → bayar QRIS → download PDF → invoice email",
      "Post di grup Facebook Guru Indonesia + Twitter/X",
      "LAUNCH 🚀 (Selasa atau Rabu pagi — BUKAN Jumat)",
    ],
    output: "modulajar.app live di production dengan Free + Go tier.", blocker: "JANGAN launch Jumat sore. Kalau ada bug kritis, tidak bisa fix weekend.",
  },
];

const POST_LAUNCH = [
  {
    sprint: "Sprint 1", weeks: "Week 4-5", title: "Plus Tier — Jurnal + Nilai", color: "#F59E0B",
    trigger: "Launch setelah ada 50+ Go users aktif. Email blast ke semua Go users saat launch.",
    items: [
      "Teaching classes CRUD + import siswa dari Excel (SheetJS parser)",
      "Jurnal mengajar harian: form minimal 60 detik (topik auto-fill dari modul)",
      "Absensi siswa: swipe H/S/I/A per siswa, bulk 'Semua Hadir'",
      "Input nilai formatif + sumatif per TP per siswa",
      "Grade summary: AVG sumatif → nilai akhir, flag KKTP",
      "Deskripsi nilai AI: generate narasi per siswa dari data nilai",
      "Rekap jurnal bulanan PDF (React-PDF)",
      "Academic year lifecycle + duplicate kelas dari semester lalu",
      "Enable feature_flags: journal_feature, grade_feature, plus_tier",
      "LAUNCH Plus Rp 99.000",
    ],
  },
  {
    sprint: "Sprint 2", weeks: "Week 6-7", title: "Power Features + Offline PWA", color: "#8B5CF6",
    trigger: "Launch saat ada feedback dari Plus users soal fitur yang mereka mau.",
    items: [
      "Prota & Promes AI generate",
      "Bank Soal AI (kisi-kisi → PG + uraian + rubrik)",
      "Refleksi Pembelajaran AI (dari jurnal + nilai)",
      "Paket Bukti Kinerja PMM (ZIP: jurnal PDF + nilai PDF + modul list + refleksi)",
      "Offline PWA: next-pwa + Dexie.js (jurnal + absensi offline)",
      "Background sync saat online kembali",
      "Push notification: reminder jurnal 30 menit setelah jam kelas",
      "Enable feature_flags: pwa_offline, bukti_pmm, bank_soal",
    ],
  },
  {
    sprint: "Sprint 3", weeks: "Week 8-9", title: "Sekolah Tier + School Dashboard", color: "#10B981",
    trigger: "Launch saat ada kepala sekolah yang interested dari komunitas guru.",
    items: [
      "School plan dashboard kepala sekolah",
      "Invite guru flow (email invite + join link)",
      "Upload master jadwal sekolah → auto-assign ke guru",
      "Compliance report: rekap PKG semua guru semester ini",
      "Subdomain routing: sman1bdg.modulajar.app (Vercel wildcard)",
      "School branding di PDF export (logo + nama sekolah di header)",
      "Invoice BOS resmi: NPWP sekolah, PPN 11%, tanda terima sah",
      "Enable feature_flags: sekolah_tier",
      "LAUNCH Sekolah Rp 699.000",
    ],
  },
  {
    sprint: "Sprint 4", weeks: "Week 10+", title: "Kurikulum Versioning + Growth", color: "#6366F1",
    trigger: "Launch saat Kemendikbud publish kurikulum update atau menjelang tahun ajaran baru.",
    items: [
      "Admin panel: CRUD CurriculumVersion + ModuleTemplate + migration_rules",
      "Edge Function auto-migrate (batch 50, partial failure safe)",
      "Migration diff review UI (before/after, needs_input inline edit)",
      "Posthog: NPS survey (setelah user publish modul ke-3)",
      "Churn survey saat cancel",
      "WhatsApp notification via Fonnte (opt-in)",
      "Referral program: guru invite guru → bonus AI credits",
      "Admin business dashboard: MRR, AI cost, conversion, churn",
    ],
  },
];

// ─── ANTI-DRIFT ───────────────────────────────────────────────────────────────
const DRIFT = [
  { cat: "Pricing SSOT", color: "#EF4444", rules: ["FREE: Rp 0 — 2 Full AI/bln (gpt-4o-mini), preview modul, NO download PDF, no jurnal/nilai", "GO: Rp 49.000/bln — 10 Full AI (gpt-4o-mini), jurnal, absensi, nilai, 5 deskripsi batch, download PDF", "PLUS: Rp 99.000/bln — 20 Full AI (gpt-4o-mini), Prota/Promes, Bank Soal, Bukti PMM, Kop Surat", "SEKOLAH: Rp 79.000/guru/bln MIN 6 GURU — 25 modul/guru/bln (gpt-4o-mini, margin ~75%). Tambah guru Rp 79.000/guru/bln.", "TOP-UP: Rp 10.000 = +3 modul (semua tier)", "AI: gpt-4o-mini semua tier", "AI COST: gpt-4o-mini ~Rp 500-800/modul. Margin Go/Plus: ~84%. Sekolah: ~75%."] },
  { cat: "Positioning (Anti-Kompetisi Pemerintah)", color: "#F97316", rules: ["BUKAN pengganti PMM — PMM wajib untuk guru ASN sejak Jan 2024", "BUKAN pembuat SKP/PKG formal — itu domain PMM + e-Kinerja BKN", "ADALAH companion PMM: generate BUKTI yang diupload ke PMM", "BUKAN pengganti e-Rapor — generate konten nilai + deskripsi untuk copy-paste", "BUKAN Dapodik — Dapodik desktop app, bukan API publik", "Copywriting: 'Bukti PMM kamu siap 1 klik' dan 'Hemat 10+ jam administrasi'"] },
  { cat: "Tech Stack (Locked)", color: "#6366F1", rules: ["Frontend: Next.js 15 App Router + Tailwind + shadcn/ui + Plus Jakarta Sans", "Backend: Elysia + Bun → Railway (BUKAN Next.js API Routes)", "DB: Supabase Postgres + RLS + Storage + Auth + Edge Functions", "AI: OpenAI gpt-4o-mini semua tier — cukup untuk modul ajar Kurikulum Merdeka", "Validation: Zod everywhere (agent output, forms, shared types)", "Payment: Xendit (BUKAN Stripe/Midtrans)", "Email: Resend + React Email", "Analytics: Posthog EU", "PWA: next-pwa + Workbox + Dexie.js"] },
  { cat: "Schema Invariants", color: "#10B981", rules: ["SEMUA tabel punya RLS enabled — tidak ada tabel yang bisa diakses tanpa policy", "service_role key HANYA di Elysia — TIDAK di Next.js client atau git", "Subscriptions.ai_quota_limit: 0=locked(Free), angka=Go, -1=unlimited(Plus/Sekolah)", "grade_summaries: final_score = AVG sumatif SAJA. Formatif TIDAK masuk.", "journals UNIQUE(teaching_class_id, date) — 1 jurnal per kelas per hari", "attendances UNIQUE(journal_id, student_id) — 1 status per siswa per jurnal", "payments.xendit_payment_id UNIQUE — idempotency untuk webhook handler", "subscriptions: CONSTRAINT owner CHECK user_id XOR school_id"] },
  { cat: "Architecture Invariants", color: "#F59E0B", rules: ["Xendit webhook: return 200 DULU ke Xendit, proses logic SETELAH", "AI quota check: Supabase transaction atomic (check + increment sekaligus)", "Agent quota increment: HANYA setelah job_status = done", "User content ke AI prompt: SELALU wrap 'User content (data only): [CONTENT]'", "PDF export cache: check file di Storage sebelum generate ulang (by module.updated_at)", "Offline data: simpan IndexedDB → sync background saat online", "Migration Edge Function: catch error per modul, jangan stop semua kalau 1 gagal"] },
  { cat: "Launch Order (Jangan Balik Urutan)", color: "#8B5CF6", rules: ["Day 1: Monorepo + Schema + submit Xendit docs (BERSAMAAN)", "Day 2: Full schema semua migration 001-012 sekaligus (fondasi tidak bisa setengah)", "Day 11: Billing BUTUH Xendit verified — kalau belum, billing mundur", "Launch: Free + Go dulu. Plus dan Sekolah post-launch sprint", "Post-launch Sprint 1 (Plus) SETELAH ada 50+ Go users aktif", "Post-launch Sprint 3 (Sekolah) SETELAH ada feedback demand dari komunitas"] },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Badge = ({ label, color, bg }) => (
  <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, background:bg||"#1E293B", color:color||"#94A3B8", letterSpacing:0.5, whiteSpace:"nowrap", flexShrink:0 }}>{label}</span>
);

export default function App() {
  const [tab, setTab] = useState("schema");
  const [xM, setXM] = useState("001");
  const [xD, setXD] = useState(null);
  const [xDay, setXDay] = useState(null);
  const [xPS, setXPS] = useState(null);
  const [done, setDone] = useState({});
  const [pDone, setPDone] = useState({});

  const tabs = [
    { id:"schema",   label:"🗄️ Schema SQL" },
    { id:"launch",   label:"🚀 Sprint to Launch (15 days)" },
    { id:"postlaunch", label:"📈 Post-Launch Sprints" },
    { id:"antidrift",label:"🔒 Anti-Drift" },
    { id:"ssot",     label:"💡 SSOT" },
  ];

  const doneCount = SPRINT_LAUNCH.filter(d => done[d.day]).length;
  const C = { background:"#161B27", border:"1px solid #21293A", borderRadius:12, overflow:"hidden", marginBottom:8 };
  const rowBtn = { width:"100%", padding:"12px 16px", border:"none", background:"none", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"space-between" };
  const ST = { fontSize:9, fontWeight:700, color:"#334155", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6, marginTop:12 };
  const IT = { fontSize:12, color:"#7A8A9E", marginBottom:6, display:"flex", gap:8, lineHeight:1.65 };

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", background:"#0D1117", color:"#E2E8F0", minHeight:"100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding:"16px 16px 0", background:"#080C14", borderBottom:"1px solid #161B27" }}>
        <div style={{ maxWidth:920, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
            <div style={{ background:"linear-gradient(135deg,#4338CA,#7C3AED)", borderRadius:8, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>📚</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:15, color:"#F1F5F9", letterSpacing:-0.5 }}>modulajar.app</div>
              <div style={{ fontSize:9, color:"#1E293B", letterSpacing:2, fontFamily:"'DM Mono',monospace" }}>MASTER SPEC v3.0 · FULL SCHEMA AS FOUNDATION · BUILD WHILE LAUNCH</div>
            </div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              <span style={{ fontSize:10, fontWeight:700, background:"#0A2918", color:"#10B981", padding:"3px 8px", borderRadius:6 }}>{doneCount}/15 days done</span>
              <span style={{ fontSize:10, fontWeight:700, background:"#2D1F06", color:"#F59E0B", padding:"3px 8px", borderRadius:6 }}>Launch Day 15</span>
              <span style={{ fontSize:10, fontWeight:700, background:"#1E1B4B", color:"#818CF8", padding:"3px 8px", borderRadius:6 }}>12 migrations</span>
            </div>
          </div>
          <div style={{ display:"flex", overflowX:"auto", gap:0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"8px 12px", border:"none", background:"none", cursor:"pointer", fontSize:11, fontWeight:tab===t.id?700:500, color:tab===t.id?"#818CF8":"#334155", borderBottom:tab===t.id?"2px solid #6366F1":"2px solid transparent", whiteSpace:"nowrap", fontFamily:"inherit" }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:920, margin:"0 auto", padding:"16px 12px 60px" }}>

        {/* SCHEMA SQL */}
        {tab === "schema" && <>
          <div style={{ background:"#0A2918", border:"1px solid #10B98133", borderRadius:10, padding:"12px 16px", marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:12, color:"#10B981", marginBottom:4 }}>✅ Schema dibangun dari awal sebagai fondasi</div>
            <div style={{ fontSize:12, color:"#064E3B", lineHeight:1.7 }}>12 migration files. Run urut 001→012 di Day 2. Semua enum, tabel, indexes, RLS, triggers, dan seed data didefinisikan di sini. Ini adalah satu-satunya source of truth untuk database.</div>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {MIGRATIONS.map(m => (
              <button key={m.id} onClick={()=>setXM(m.id)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${xM===m.id?m.color:"#21293A"}`, background:xM===m.id?m.color+"22":"#161B27", color:xM===m.id?m.color:"#475569", fontSize:11, fontWeight:xM===m.id?700:500, cursor:"pointer", fontFamily:"inherit" }}>
                {m.id}
              </button>
            ))}
          </div>
          {MIGRATIONS.filter(m=>m.id===xM).map(m => (
            <div key={m.id} style={{ ...C, borderLeft:`3px solid ${m.color}` }}>
              <div style={{ padding:"14px 16px", borderBottom:"1px solid #1A2030" }}>
                <div style={{ fontWeight:700, fontSize:14, color:"#F1F5F9", marginBottom:4 }}>Migration {m.id} — {m.title}</div>
                <div style={{ fontSize:12, color:"#7A8A9E", lineHeight:1.6 }}>{m.desc}</div>
              </div>
              <div style={{ position:"relative" }}>
                <pre style={{ margin:0, padding:"16px", fontSize:11, color:"#94A3B8", lineHeight:1.8, fontFamily:"'DM Mono',monospace", overflowX:"auto", background:"#0D1117", whiteSpace:"pre" }}>{m.sql}</pre>
              </div>
            </div>
          ))}
        </>}

        {/* SPRINT TO LAUNCH */}
        {tab === "launch" && <>
          <div style={{ background:"#161B27", borderRadius:10, padding:"12px 16px", marginBottom:12, border:"1px solid #21293A" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:700, color:"#E2E8F0" }}>Sprint to Launch — {doneCount}/15 hari</span>
              <span style={{ fontSize:11, color:doneCount===15?"#10B981":"#334155", fontFamily:"'DM Mono',monospace" }}>{Math.round(doneCount/15*100)}%</span>
            </div>
            <div style={{ background:"#1A2030", borderRadius:99, height:5 }}>
              <div style={{ background:doneCount===15?"#10B981":"linear-gradient(90deg,#6366F1,#EF4444)", height:"100%", width:`${doneCount/15*100}%`, borderRadius:99, transition:"width 0.3s" }} />
            </div>
          </div>
          <div style={{ background:"#1A0A0A", border:"1px solid #3D1515", borderRadius:10, padding:"12px 16px", marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:12, color:"#EF4444", marginBottom:4 }}>⚠️ Submit dokumen Xendit di Day 1 — bukan Day 11</div>
            <div style={{ fontSize:12, color:"#7A1515", lineHeight:1.7 }}>Verifikasi Xendit butuh 2-3 hari kerja. Kalau tidak submit di Day 1, billing tidak bisa ditest saat Day 11. Sprint bisa molor seminggu.</div>
          </div>

          {/* Phase headers */}
          <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
            {[{label:"Day 1-5 — Foundation", color:"#6366F1"},{label:"Day 6-8 — AI Agents", color:"#8B5CF6"},{label:"Day 9-10 — Editor + PDF", color:"#F59E0B"},{label:"Day 11-12 — Billing", color:"#EF4444"},{label:"Day 13-15 — Launch", color:"#10B981"}].map(p => (
              <div key={p.label} style={{ display:"flex", alignItems:"center", gap:5, background:"#161B27", borderRadius:6, padding:"3px 8px", border:`1px solid ${p.color}33` }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:p.color, flexShrink:0 }} />
                <span style={{ fontSize:10, color:"#475569" }}>{p.label}</span>
              </div>
            ))}
          </div>

          {SPRINT_LAUNCH.map((d, idx) => {
            const phaseColor = idx < 5 ? "#6366F1" : idx < 8 ? "#8B5CF6" : idx < 10 ? "#F59E0B" : idx < 12 ? "#EF4444" : "#10B981";
            return (
              <div key={d.day} style={{ ...C, borderLeft:`3px solid ${phaseColor}` }}>
                <button style={rowBtn} onClick={()=>setXDay(xDay===d.day?null:d.day)}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <button onClick={e=>{e.stopPropagation();setDone(p=>({...p,[d.day]:!p[d.day]}));}} style={{ width:16, height:16, borderRadius:3, border:`2px solid ${done[d.day]?phaseColor:"#21293A"}`, background:done[d.day]?phaseColor:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, fontSize:9, color:"white", fontWeight:700 }}>
                      {done[d.day]?"✓":""}
                    </button>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:phaseColor, minWidth:44 }}>{d.day}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:done[d.day]?"#334155":"#B0BEC5" }}>{d.focus}</span>
                  </div>
                  <span style={{ color:"#334155", fontSize:14 }}>{xDay===d.day?"−":"+"}</span>
                </button>
                {xDay===d.day && (
                  <div style={{ padding:"10px 16px 14px 44px", background:"#0D1117", borderTop:"1px solid #111827" }}>
                    <div style={ST}>Tasks ({d.tasks.length})</div>
                    {d.tasks.map((t,i) => <div key={i} style={IT}><span style={{ color:phaseColor, flexShrink:0, fontFamily:"'DM Mono',monospace", fontSize:10, minWidth:16 }}>{i+1}.</span><span>{t}</span></div>)}
                    <div style={ST}>Output</div>
                    <div style={{ fontSize:12, color:"#10B981", background:"#0A2918", padding:"8px 10px", borderRadius:6, lineHeight:1.6 }}>✓ {d.output}</div>
                    <div style={ST}>Blocker</div>
                    <div style={{ fontSize:12, color:"#F59E0B", background:"#2D1F06", padding:"8px 10px", borderRadius:6, lineHeight:1.6 }}>⚠ {d.blocker}</div>
                  </div>
                )}
              </div>
            );
          })}
        </>}

        {/* POST-LAUNCH */}
        {tab === "postlaunch" && <>
          <p style={{ color:"#334155", fontSize:12, margin:"0 0 14px" }}>4 post-launch sprints. Fitur dibangun setelah launch berdasarkan feedback user nyata.</p>
          {POST_LAUNCH.map(s => (
            <div key={s.sprint} style={{ ...C, borderLeft:`3px solid ${s.color}`, marginBottom:12 }}>
              <button style={rowBtn} onClick={()=>setXPS(xPS===s.sprint?null:s.sprint)}>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:s.color }}>{s.sprint}</span>
                  <span style={{ fontWeight:700, fontSize:13, color:"#E2E8F0" }}>{s.title}</span>
                  <span style={{ fontSize:10, color:"#334155" }}>{s.weeks}</span>
                </div>
                <span style={{ color:s.color, fontSize:18 }}>{xPS===s.sprint?"−":"+"}</span>
              </button>
              {xPS===s.sprint && (
                <div style={{ borderTop:"1px solid #1A2030", padding:"14px 16px" }}>
                  <div style={{ background:`${s.color}22`, borderRadius:8, padding:"8px 12px", marginBottom:12, border:`1px solid ${s.color}33` }}>
                    <span style={{ fontSize:11, fontWeight:600, color:s.color }}>Launch trigger: </span>
                    <span style={{ fontSize:11, color:"#94A3B8" }}>{s.trigger}</span>
                  </div>
                  {s.items.map((item, i) => (
                    <div key={i} onClick={()=>setPDone(p=>({...p,[`${s.sprint}-${i}`]:!p[`${s.sprint}-${i}`]}))} style={{ display:"flex", gap:10, marginBottom:9, alignItems:"flex-start", cursor:"pointer" }}>
                      <div style={{ width:15, height:15, borderRadius:3, border:`2px solid ${pDone[`${s.sprint}-${i}`]?s.color:"#21293A"}`, background:pDone[`${s.sprint}-${i}`]?s.color:"transparent", flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"white", fontWeight:700 }}>
                        {pDone[`${s.sprint}-${i}`]?"✓":""}
                      </div>
                      <span style={{ fontSize:12, color:pDone[`${s.sprint}-${i}`]?"#334155":"#7A8A9E", lineHeight:1.5, textDecoration:pDone[`${s.sprint}-${i}`]?"line-through":"none" }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>}

        {/* ANTI-DRIFT */}
        {tab === "antidrift" && <>
          <div style={{ background:"#1A0A0A", border:"1px solid #3D1515", borderRadius:10, padding:"12px 16px", marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:12, color:"#EF4444", marginBottom:4 }}>⚠️ Anti-Drift Protocol</div>
            <div style={{ fontSize:12, color:"#7A1515", lineHeight:1.7 }}>Setiap keputusan yang bertentangan dengan rules di bawah butuh ADR baru yang explicit. Jangan drift diam-diam — terutama schema database yang sudah jadi fondasi.</div>
          </div>
          {DRIFT.map(s => (
            <div key={s.cat} style={{ ...C, borderLeft:`3px solid ${s.color}` }}>
              <button style={rowBtn} onClick={()=>setXD(xD===s.cat?null:s.cat)}>
                <span style={{ fontWeight:700, fontSize:13, color:"#E2E8F0" }}>{s.cat}</span>
                <span style={{ color:s.color, fontSize:18 }}>{xD===s.cat?"−":"+"}</span>
              </button>
              {xD===s.cat && (
                <div style={{ borderTop:"1px solid #1A2030", padding:"12px 16px" }}>
                  {s.rules.map((r,i) => (
                    <div key={i} style={{ fontSize:12, color:"#7A8A9E", marginBottom:8, display:"flex", gap:8, padding:"6px 10px", background:"#111827", borderRadius:6, borderLeft:`2px solid ${s.color}44`, lineHeight:1.65 }}>
                      <span style={{ color:s.color, flexShrink:0, fontWeight:700 }}>→</span>{r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>}

        {/* SSOT */}
        {tab === "ssot" && <>
          <p style={{ color:"#334155", fontSize:12, margin:"0 0 14px" }}>Single Source of Truth. Update di sini kalau ada perubahan pricing atau stack.</p>

          {/* Pricing */}
          <div style={{ ...C, marginBottom:12 }}>
            <div style={{ padding:"10px 16px", background:"#111827", borderBottom:"1px solid #1A2030" }}><span style={{ fontWeight:700, fontSize:12, color:"#F59E0B" }}>💰 Pricing</span></div>
            <div style={{ padding:16, display:"flex", flexDirection:"column", gap:8 }}>
              {Object.entries(P).map(([key, plan]) => (
                <div key={key} style={{ background:"#111827", borderRadius:8, padding:"10px 14px", borderLeft:`3px solid ${plan.color}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:6, marginBottom:6 }}>
                    <div>
                      <span style={{ fontWeight:800, fontSize:14, color:plan.color }}>{plan.label}</span>
                      <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginTop:2 }}>
                        {plan.monthly===0?"Gratis":`Rp ${plan.monthly.toLocaleString("id-ID")}/bln`}
                      </div>
                      {plan.yearly>0 && <div style={{ fontSize:10, color:"#334155" }}>Rp {plan.yearly.toLocaleString("id-ID")}/thn</div>}
                    </div>
                    {key!=="free" && (
                      <div style={{ background:"#0A2918", borderRadius:6, padding:"6px 10px", textAlign:"right" }}>
                        <div style={{ fontSize:10, color:"#334155" }}>AI cost ~Rp {AI_COST.idr.toLocaleString("id-ID")}/modul</div>
                        <div style={{ fontSize:11, fontWeight:700, color:"#10B981" }}>Margin: {key==="go"?"67%":key==="plus"?"~50% avg":"85%"}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    <span style={{ background:"#1A2130", color:"#475569", padding:"2px 8px", borderRadius:6, fontSize:10 }}>
                      Full AI: {plan.full_ai?(plan.ai===-1?"Unlimited":`${plan.ai}/bln`):"Locked"}
                    </span>
                    <span style={{ background:"#1A2130", color:"#475569", padding:"2px 8px", borderRadius:6, fontSize:10 }}>Download: {plan.dl?"✓":"✗"}</span>
                    {plan.seats && <span style={{ background:"#1A2130", color:"#475569", padding:"2px 8px", borderRadius:6, fontSize:10 }}>Min {plan.seats} seats</span>}
                  </div>
                </div>
              ))}
              <div style={{ background:"#2D1F06", borderRadius:8, padding:"10px 14px", border:"1px solid #F59E0B33" }}>
                <span style={{ fontWeight:700, color:"#F59E0B", fontSize:12 }}>Top-up: </span>
                <span style={{ fontSize:12, color:"#94A3B8" }}>Rp {TOPUP.price.toLocaleString("id-ID")} = +{TOPUP.credits} Full AI (Go only, Plus sudah unlimited)</span>
              </div>
            </div>
          </div>

          {/* Stack */}
          <div style={{ ...C, marginBottom:12 }}>
            <div style={{ padding:"10px 16px", background:"#111827", borderBottom:"1px solid #1A2030" }}><span style={{ fontWeight:700, fontSize:12, color:"#6366F1" }}>🛠️ Tech Stack (Locked)</span></div>
            <div style={{ padding:"12px 16px" }}>
              {[
                ["Frontend","Next.js 15 App Router + Tailwind + shadcn/ui + Plus Jakarta Sans"],
                ["Backend","Elysia + Bun → Railway (persistent server, bukan serverless)"],
                ["Database","Supabase Postgres + RLS + Storage + Auth + Edge Functions"],
                ["AI","Anthropic Claude claude-sonnet-4-20250514"],
                ["Validation","Zod (forms, agent output, shared types) + Elysia t() (endpoints)"],
                ["Payment","Xendit (QRIS, GoPay, OVO, Dana, VA, Retail, Invoice)"],
                ["Email","Resend + React Email (8 templates, Bahasa Indonesia)"],
                ["Analytics","Posthog EU (privacy-first, opt-out)"],
                ["Monitoring","Sentry + Railway metrics + Betterstack (status page)"],
                ["PWA","next-pwa + Workbox + Dexie.js (IndexedDB offline)"],
                ["Deploy","Vercel (FE) + Railway (BE) + Supabase cloud"],
                ["Repo","Turborepo + pnpm workspaces (monorepo)"],
                ["Excel parse","SheetJS (import siswa dari Excel)"],
                ["PDF invoice","@react-pdf/renderer (billing invoice)"],
                ["PDF export","Puppeteer / @sparticuz/chromium (modul export)"],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", gap:10, marginBottom:7, alignItems:"flex-start" }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#334155", minWidth:80, flexShrink:0, paddingTop:2 }}>{k}</span>
                  <span style={{ fontSize:12, color:"#7A8A9E" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue */}
          <div style={C}>
            <div style={{ padding:"10px 16px", background:"#111827", borderBottom:"1px solid #1A2030" }}><span style={{ fontWeight:700, fontSize:12, color:"#10B981" }}>📈 Revenue Projection</span></div>
            <div style={{ padding:"12px 16px" }}>
              {[
                { label:"Konservatif (12 bln post-launch)", go:1500, plus:500, sekolah:30, color:"#475569" },
                { label:"Moderate (18-24 bln)", go:5000, plus:2000, sekolah:120, color:"#6366F1" },
                { label:"Optimis (3 thn)", go:15000, plus:8000, sekolah:400, color:"#10B981" },
              ].map(s => {
                const mrr = s.go*49000 + s.plus*99000 + s.sekolah*700000; // Sekolah avg 10 guru × 70rb
                return (
                  <div key={s.label} style={{ background:"#111827", borderRadius:8, padding:"10px 12px", marginBottom:8, borderLeft:`2px solid ${s.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:s.color }}>{s.label}</span>
                      <span style={{ fontSize:13, fontWeight:800, color:"#F1F5F9", fontFamily:"'DM Mono',monospace" }}>MRR Rp {(mrr/1000000).toFixed(0)}jt</span>
                    </div>
                    <div style={{ fontSize:11, color:"#334155", marginTop:3 }}>
                      {s.go.toLocaleString("id-ID")} Go + {s.plus.toLocaleString("id-ID")} Plus + {s.sekolah} Sekolah → ARR ~Rp {((mrr*12)/1000000000).toFixed(1)}M
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>}

      </div>
    </div>
  );
}
