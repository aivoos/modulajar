-- Migration 003: Academic Year & Teaching Classes & Students
-- Ref: modulajar-master-v3.jsx — Migration 003
BEGIN;

-- Academic Years (per sekolah)
CREATE TABLE academic_years (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id    uuid REFERENCES schools(id) ON DELETE CASCADE,
  label        text NOT NULL,
  semester     semester_type NOT NULL,
  year         int NOT NULL,
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  is_active    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, year, semester)
);

-- Teaching Classes (guru × mapel × kelas × tahun ajaran)
CREATE TABLE teaching_classes (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id        uuid REFERENCES schools(id) ON DELETE SET NULL,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  subject          text NOT NULL,
  grade            text NOT NULL,
  class_name       text NOT NULL,
  phase            curriculum_phase,
  schedule         jsonb NOT NULL DEFAULT '[]',
  student_count    int NOT NULL DEFAULT 0,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Students (per teaching class)
CREATE TABLE students (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teaching_class_id uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  name              text NOT NULL,
  nis               text,
  gender            gender_type,
  notes             text,
  is_active         boolean NOT NULL DEFAULT true,
  sort_order        int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_academic_years_school ON academic_years(school_id);
CREATE INDEX idx_academic_years_active ON academic_years(is_active) WHERE is_active = true;
CREATE INDEX idx_teaching_classes_user ON teaching_classes(user_id);
CREATE INDEX idx_teaching_classes_year ON teaching_classes(academic_year_id);
CREATE INDEX idx_teaching_classes_user_year ON teaching_classes(user_id, academic_year_id);
CREATE INDEX idx_students_class ON students(teaching_class_id);
CREATE INDEX idx_students_class_active ON students(teaching_class_id, is_active);

CREATE TRIGGER teaching_classes_updated_at BEFORE UPDATE ON teaching_classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;