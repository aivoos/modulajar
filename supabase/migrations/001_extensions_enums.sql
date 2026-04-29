-- Migration 001: Extensions & Enums
-- Ref: modulajar-master-v3.jsx — Migration 001
BEGIN;

-- Extensions
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
);

COMMIT;