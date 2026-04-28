-- Migration 005: Modules — Core Content
-- Ref: modulajar-master-v3.jsx — Migration 005
BEGIN;

-- Modules
CREATE TABLE modules (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id             uuid REFERENCES schools(id) ON DELETE SET NULL,
  curriculum_version_id uuid REFERENCES curriculum_versions(id),
  template_id           uuid REFERENCES module_templates(id),
  teaching_class_id     uuid REFERENCES teaching_classes(id) ON DELETE SET NULL,

  title                 text NOT NULL DEFAULT 'Modul Tanpa Judul',
  subject              text NOT NULL,
  phase                 curriculum_phase,
  grade                 text,
  duration_minutes      int NOT NULL DEFAULT 80,

  -- Konten: JSONB dengan keys sesuai template schema
  content               jsonb NOT NULL DEFAULT '{}',

  status                module_status NOT NULL DEFAULT 'draft',
  mode                  module_mode NOT NULL DEFAULT 'scratch',

  -- Curated library
  is_curated            boolean NOT NULL DEFAULT false,
  curated_by            uuid REFERENCES users(id),
  curated_at            timestamptz,

  -- Public sharing
  is_public             boolean NOT NULL DEFAULT false,
  slug                  text UNIQUE,
  share_count           int NOT NULL DEFAULT 0,

  -- Fork tracking
  fork_count            int NOT NULL DEFAULT 0,
  source_module_id      uuid REFERENCES modules(id) ON DELETE SET NULL,

  -- Full-text search vector
  search_vector         tsvector,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Module Migrations
CREATE TABLE module_migrations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id       uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  from_version_id uuid NOT NULL REFERENCES curriculum_versions(id),
  to_version_id   uuid NOT NULL REFERENCES curriculum_versions(id),
  status          migration_status NOT NULL DEFAULT 'pending_review',
  diff            jsonb NOT NULL DEFAULT '{}',
  migrated_at     timestamptz NOT NULL DEFAULT now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid REFERENCES users(id)
);

-- Module Exports (PDF downloads)
CREATE TABLE module_exports (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id       uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id),
  watermarked     boolean NOT NULL DEFAULT false,
  file_path       text,
  signed_url      text,
  url_expires_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
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
CREATE INDEX idx_module_migrations_status ON module_migrations(status) WHERE status = 'pending_review';

-- Auto-update search_vector
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

CREATE TRIGGER modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;