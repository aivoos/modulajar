-- Migration 004: Curriculum — Versions, Templates, Learning Outcomes
-- Ref: modulajar-master-v3.jsx — Migration 004
BEGIN;

-- Curriculum Versions (K13, Merdeka 2022, Merdeka 2025, dst)
CREATE TABLE curriculum_versions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text NOT NULL,
  code         text NOT NULL UNIQUE,
  phase        curriculum_phase,
  year         int NOT NULL,
  status       curriculum_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  published_by uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Module Templates (struktur form per kurikulum)
CREATE TABLE module_templates (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum_version_id uuid NOT NULL REFERENCES curriculum_versions(id),
  subject               text,
  -- JSON Schema yang drive dynamic form renderer
  -- { sections: [{ key, label, type, required, placeholder, help }] }
  schema                jsonb NOT NULL DEFAULT '{}',
  -- Rules untuk auto-migrate dari versi sebelumnya
  migration_rules       jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
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
CREATE INDEX idx_learning_outcomes_subject_phase ON learning_outcomes(subject, phase);

CREATE TRIGGER module_templates_updated_at BEFORE UPDATE ON module_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;