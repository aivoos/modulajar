-- Prota (Program Tahunan) — yearly overview
-- Ref: modulajar-spec-v3.jsx — Sprint 2 S2-3
CREATE TABLE IF NOT EXISTS prota_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  phase TEXT,
  grade TEXT,
  academic_year TEXT NOT NULL,
  curriculum_version_id UUID REFERENCES curriculum_versions(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  content JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promes (Program Semester) — semester breakdown from prota
CREATE TABLE IF NOT EXISTS protes_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  phase TEXT,
  grade TEXT,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL CHECK (semester IN ('1','2')),
  prota_plan_id UUID REFERENCES prota_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  content JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_prota_user_id ON prota_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_prota_user_year ON prota_plans(user_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_prota_status ON prota_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_prota_subject ON prota_plans(user_id, subject);

CREATE INDEX IF NOT EXISTS idx_protes_user_id ON protes_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_protes_user_year ON protes_plans(user_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_protes_prota ON protes_plans(prota_plan_id);
CREATE INDEX IF NOT EXISTS idx_protes_status ON protes_plans(user_id, status);
