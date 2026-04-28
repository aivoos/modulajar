-- Migration 002: Identity — Schools & Users
-- Ref: modulajar-master-v3.jsx — Migration 002
BEGIN;

-- Schools
CREATE TABLE schools (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text NOT NULL,
  npsn         text,
  npwp         text,
  address      text,
  subdomain    text UNIQUE,
  logo_url     text,
  plan         school_plan NOT NULL DEFAULT 'free',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Users (mirrors auth.users, extra profile data)
CREATE TABLE users (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            text NOT NULL UNIQUE,
  full_name        text NOT NULL DEFAULT '',
  role             user_role NOT NULL DEFAULT 'guru',
  school_id        uuid REFERENCES schools(id) ON DELETE SET NULL,
  avatar_url       text,
  nip              text,
  phone_wa         text,
  default_subject  text,
  default_phase    curriculum_phase,
  default_grade    text,
  onboarding_done  boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_role ON users(role);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;