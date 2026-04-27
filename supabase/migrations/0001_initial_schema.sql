-- Day 2: Supabase schema — semua tabel + constraint + index
-- Ref: modulajar-docs.jsx — ADR + Uncovered sections
-- Migration: 0001_initial_schema.sql

BEGIN;

-- ── Extensions ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- fuzzy search

-- ── Schools ─────────────────────────────────────────────────────
CREATE TABLE schools (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text        NOT NULL,
  npsn        text,
  npwp        text,
  address     text,
  logo_url    text,
  kepala_sekolah_user_id uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_schools_npsn ON schools(npsn) WHERE npsn IS NOT NULL;

-- ── Users (extends auth.users) ──────────────────────────────────
CREATE TABLE users (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text        NOT NULL,
  school_id   uuid        REFERENCES schools(id) ON DELETE SET NULL,
  role        text        NOT NULL CHECK (role IN ('guru', 'kepala_sekolah', 'super_admin')) DEFAULT 'guru',
  subjects    text[]      DEFAULT '{}',
  default_fase text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_school ON users(school_id) WHERE school_id IS NOT NULL;
CREATE INDEX idx_users_role   ON users(role);

-- ── Curriculum Versions ─────────────────────────────────────────
CREATE TABLE curriculum_versions (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  kurikulum   text        NOT NULL CHECK (kurikulum IN ('k13', 'merdeka_2022', 'merdeka_2025')),
  name        text        NOT NULL,
  phase       text        NOT NULL,
  year        integer     NOT NULL,
  status      text        NOT NULL CHECK (status IN ('draft', 'active', 'superseded')) DEFAULT 'draft',
  is_default  boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kurikulum, year)
);
CREATE INDEX idx_cv_status    ON curriculum_versions(status);
CREATE INDEX idx_cv_kurikulum ON curriculum_versions(kurikulum);

-- ── Module Templates ───────────────────────────────────────────
CREATE TABLE module_templates (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum_version_id uuid       NOT NULL REFERENCES curriculum_versions(id) ON DELETE CASCADE,
  name                text        NOT NULL,
  schema              jsonb       NOT NULL DEFAULT '{}',
  migration_rules      jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mt_cv    ON module_templates(curriculum_version_id);
CREATE INDEX idx_mt_name  ON module_templates(name);

-- ── Capaian Pembelajaran ───────────────────────────────────────
CREATE TABLE capaian_pembelajaran (
  id                   uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum_version_id uuid       NOT NULL REFERENCES curriculum_versions(id) ON DELETE CASCADE,
  subject              text        NOT NULL,
  fase                 text        NOT NULL,
  elements             jsonb       NOT NULL DEFAULT '[]',
  description          text,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cp_cv       ON capaian_pembelajaran(curriculum_version_id);
CREATE INDEX idx_cp_subject  ON capaian_pembelajaran(subject);
CREATE INDEX idx_cp_fase     ON capaian_pembelajaran(fase);
CREATE INDEX idx_cp_subject_fase ON capaian_pembelajaran(subject, fase);

-- ── Tujuan Pembelajaran ─────────────────────────────────────────
CREATE TABLE tujuan_pembelajaran (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  cp_id       uuid        NOT NULL REFERENCES capaian_pembelajaran(id) ON DELETE CASCADE,
  module_id   uuid,
  sequence    integer     NOT NULL DEFAULT 0,
  code        text        NOT NULL,
  statement   text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tp_cp      ON tujuan_pembelajaran(cp_id);
CREATE INDEX idx_tp_module  ON tujuan_pembelajaran(module_id) WHERE module_id IS NOT NULL;
CREATE UNIQUE INDEX idx_tp_code ON tujuan_pembelajaran(code);

-- ── Modules ─────────────────────────────────────────────────────
CREATE TABLE modules (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id           uuid        REFERENCES schools(id) ON DELETE SET NULL,
  curriculum_version_id uuid       NOT NULL REFERENCES curriculum_versions(id),
  module_template_id  uuid        NOT NULL REFERENCES module_templates(id),
  title               text        NOT NULL,
  subject             text        NOT NULL,
  fase                text        NOT NULL,
  kelas               integer[]   NOT NULL DEFAULT '{}',
  duration_weeks      integer     NOT NULL DEFAULT 4,
  learning_style      text        NOT NULL CHECK (learning_style IN ('visual', 'auditori', 'kinestetik', 'campuran')) DEFAULT 'campuran',
  content             jsonb       NOT NULL DEFAULT '{}',
  status              text        NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  is_curated          boolean     NOT NULL DEFAULT false,
  curated_by          uuid        REFERENCES auth.users(id),
  fork_from_module_id uuid        REFERENCES modules(id),
  fork_count          integer     NOT NULL DEFAULT 0,
  tags                text[]      DEFAULT '{}',
  search_vector       tsvector,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  published_at         timestamptz
);
CREATE INDEX idx_modules_user    ON modules(user_id);
CREATE INDEX idx_modules_status  ON modules(status);
CREATE INDEX idx_modules_school  ON modules(school_id) WHERE school_id IS NOT NULL;
CREATE INDEX idx_modules_subject ON modules(subject);
CREATE INDEX idx_modules_fase    ON modules(fase);
CREATE INDEX idx_modules_curated ON modules(is_curated) WHERE is_curated = true;
CREATE INDEX idx_modules_fork    ON modules(fork_from_module_id) WHERE fork_from_module_id IS NOT NULL;

-- Full-text search index
CREATE INDEX idx_modules_fts ON modules USING gin(search_vector);
CREATE INDEX idx_modules_created ON modules(created_at DESC);

-- Trigger to update search_vector
CREATE OR REPLACE FUNCTION modules_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('indonesian', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('indonesian', coalesce(NEW.subject,'')), 'B') ||
    setweight(to_tsvector('indonesian', coalesce(array_to_string(NEW.tags,' '),'')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_modules_search_vector
  BEFORE INSERT OR UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION modules_search_update();

-- ── Module Migrations ───────────────────────────────────────────
CREATE TABLE module_migrations (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id       uuid        NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  from_version_id uuid        NOT NULL REFERENCES curriculum_versions(id),
  to_version_id   uuid        NOT NULL REFERENCES curriculum_versions(id),
  diff            jsonb       NOT NULL DEFAULT '{}',
  status          text        NOT NULL CHECK (status IN ('pending_review', 'accepted', 'rejected')) DEFAULT 'pending_review',
  reviewed_by     uuid        REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mm_module  ON module_migrations(module_id);
CREATE INDEX idx_mm_status ON module_migrations(status) WHERE status = 'pending_review';

-- ── Subscriptions ───────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id           uuid        REFERENCES schools(id) ON DELETE SET NULL,
  plan                text        NOT NULL CHECK (plan IN ('free', 'guru_pro', 'sekolah')) DEFAULT 'free',
  status              text        NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')) DEFAULT 'active',
  ai_quota_used       integer     NOT NULL DEFAULT 0,
  ai_quota_limit      integer     NOT NULL DEFAULT 0,
  xendit_subscription_id text,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end   timestamptz NOT NULL DEFAULT now(),
  grace_period_end     timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE INDEX idx_sub_user   ON subscriptions(user_id);
CREATE INDEX idx_sub_status ON subscriptions(status);
CREATE INDEX idx_sub_school ON subscriptions(school_id) WHERE school_id IS NOT NULL;

-- ── Payments ───────────────────────────────────────────────────
CREATE TABLE payments (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid,
  school_id       uuid,
  subscription_id uuid        REFERENCES subscriptions(id) ON DELETE SET NULL,
  xendit_payment_id text      UNIQUE,
  amount_idr      integer     NOT NULL,
  currency        text        NOT NULL DEFAULT 'IDR',
  status          text        NOT NULL CHECK (status IN ('pending', 'paid', 'expired', 'failed')) DEFAULT 'pending',
  payment_method  text,
  paid_at         timestamptz,
  invoice_url     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pay_user   ON payments(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_pay_status ON payments(status);
CREATE INDEX idx_pay_xendit ON payments(xendit_payment_id) WHERE xendit_payment_id IS NOT NULL;

-- ── Top-ups ────────────────────────────────────────────────────
CREATE TABLE topups (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xendit_payment_id   text        UNIQUE,
  amount_idr          integer     NOT NULL,
  modul_count         integer     NOT NULL,
  status              text        NOT NULL CHECK (status IN ('pending', 'paid', 'expired', 'failed')) DEFAULT 'pending',
  paid_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_topup_user   ON topups(user_id);
CREATE INDEX idx_topup_status ON topups(status);

-- ── Invoice Sequences ───────────────────────────────────────────
CREATE TABLE invoice_sequences (
  year        integer     PRIMARY KEY,
  last_seq    integer     NOT NULL DEFAULT 0
);

-- ── Agent Jobs ──────────────────────────────────────────────────
CREATE TABLE agent_jobs (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id       uuid        REFERENCES modules(id) ON DELETE SET NULL,
  status          text        NOT NULL CHECK (status IN ('queued', 'running', 'done', 'failed')) DEFAULT 'queued',
  agent           text        NOT NULL,
  input           jsonb       NOT NULL DEFAULT '{}',
  output          jsonb,
  error_message   text,
  tokens_used     integer,
  cost_idr        numeric(10,2),
  retry_count     integer     NOT NULL DEFAULT 0,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_job_user    ON agent_jobs(user_id);
CREATE INDEX idx_job_status  ON agent_jobs(status);
CREATE INDEX idx_job_module  ON agent_jobs(module_id) WHERE module_id IS NOT NULL;
CREATE INDEX idx_job_created ON agent_jobs(created_at DESC);

-- ── Agent Steps ────────────────────────────────────────────────
CREATE TABLE agent_steps (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          uuid        NOT NULL REFERENCES agent_jobs(id) ON DELETE CASCADE,
  agent           text        NOT NULL,
  sequence        integer     NOT NULL DEFAULT 0,
  status          text        NOT NULL CHECK (status IN ('pending', 'running', 'done', 'failed')) DEFAULT 'pending',
  input           jsonb       NOT NULL DEFAULT '{}',
  output          jsonb,
  error_message   text,
  retry_count     integer     NOT NULL DEFAULT 0,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_step_job ON agent_steps(job_id);

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE notifications (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text        NOT NULL,
  title       text        NOT NULL,
  body        text        NOT NULL,
  meta        jsonb,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notif_type  ON notifications(type);

-- ── Webhook Logs ───────────────────────────────────────────────
CREATE TABLE webhook_logs (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider    text        NOT NULL,
  event       text        NOT NULL,
  payload     jsonb       NOT NULL DEFAULT '{}',
  processed_at timestamptz,
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wh_provider ON webhook_logs(provider);
CREATE INDEX idx_wh_event   ON webhook_logs(event);
CREATE INDEX idx_wh_created  ON webhook_logs(created_at DESC);

-- ── User Flags (Abuse) ──────────────────────────────────────────
CREATE TABLE user_flags (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      text        NOT NULL,
  flagged_by  uuid        REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_uf_user ON user_flags(user_id);

-- ── Audit Logs ─────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid,
  action        text        NOT NULL,
  resource_type text        NOT NULL,
  resource_id   uuid,
  meta          jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_user   ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_res    ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ── Auto-update updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_cv_updated_at BEFORE UPDATE ON curriculum_versions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_mt_updated_at BEFORE UPDATE ON module_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_subs_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_pay_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_job_updated_at BEFORE UPDATE ON agent_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;