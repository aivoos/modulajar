-- Migration 007: Grades & Assessments
-- Ref: modulajar-master-v3.jsx — Migration 007
BEGIN;

-- Grade Entries (nilai per TP per siswa per assessment)
CREATE TABLE grade_entries (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teaching_class_id  uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  academic_year_id   uuid NOT NULL REFERENCES academic_years(id),
  student_id         uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  assessment_type    assessment_type NOT NULL,
  tp_code            text NOT NULL,
  tp_label           text,

  score              numeric(5,2) CHECK(score BETWEEN 0 AND 100),
  qualitative_label  text,

  notes              text,
  assessed_at        date NOT NULL DEFAULT CURRENT_DATE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Grade Summaries (nilai akhir per siswa per mapel per semester)
-- final_score = AVG sumatif SAJA. Formatif TIDAK masuk.
CREATE TABLE grade_summaries (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teaching_class_id  uuid NOT NULL REFERENCES teaching_classes(id) ON DELETE CASCADE,
  academic_year_id   uuid NOT NULL REFERENCES academic_years(id),
  student_id         uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES users(id),

  final_score        numeric(5,2),

  -- KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)
  kktp_threshold     int NOT NULL DEFAULT 70,
  meets_kktp          boolean GENERATED ALWAYS AS (final_score >= kktp_threshold) STORED,

  -- Deskripsi AI-generated, guru bisa edit
  description         text,
  description_draft    boolean NOT NULL DEFAULT true,

  -- AI generation tracking
  description_job_id  uuid,
  generated_at        timestamptz,

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
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;