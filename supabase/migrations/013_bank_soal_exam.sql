-- Migration 013: Bank Soal AI + AI Examination (Paper-Based)
-- Ref: modulajar-spec-v3.jsx — Sprint 2-4
-- Workflow: Generate soal → Export PDF → Print → Give to students → Photo answer → OCR → AI Grading + Feedback
BEGIN;

-- ── Question Banks (kelompok soal per topik/TP) ──────────────────────────────
CREATE TABLE question_banks (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  subject         text NOT NULL DEFAULT '',
  phase           curriculum_phase,
  tp_codes        text[] NOT NULL DEFAULT '{}',
  description     text,
  is_public       boolean NOT NULL DEFAULT false,
  fork_count      int NOT NULL DEFAULT 0,
  question_count  int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Quiz Sessions (satu ulangan paper-based) ──────────────────────────────────
CREATE TABLE quizzes (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teaching_class_id  uuid REFERENCES teaching_classes(id) ON DELETE SET NULL,
  question_bank_id   uuid REFERENCES question_banks(id) ON DELETE SET NULL,
  title              text NOT NULL,
  description        text,
  question_ids       uuid[] NOT NULL DEFAULT '{}',
  -- Paper-based settings
  duration_minutes   int NOT NULL DEFAULT 60,
  scheduled_at       timestamptz,
  -- Status
  status             text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'graded')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ── Quiz Attempts (jawaban siswa per ulangan) ─────────────────────────────────
CREATE TABLE quiz_attempts (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id          uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id       uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  -- Paper-based: answers input by teacher OR photo OCR
  answers_json      jsonb NOT NULL DEFAULT '{}',
  -- AI grading result
  score            numeric(5,2),
  max_score        numeric(5,2),
  graded_at        timestamptz,
  grading_job_id   uuid,
  -- Generated feedback
  feedback_json    jsonb NOT NULL DEFAULT '[]',
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Photo Answer Uploads (jawaban siswa difoto oleh guru) ──────────────────────
CREATE TABLE quiz_photo_answers (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_attempt_id uuid NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  student_id     uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  photo_url      text NOT NULL,
  ocr_text       text,
  ocr_confidence numeric(3,2),
  ocr_job_id     uuid,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_question_banks_user ON question_banks(user_id);
CREATE INDEX idx_question_banks_public ON question_banks(is_public) WHERE is_public = true;
CREATE INDEX idx_quizzes_user ON quizzes(user_id);
CREATE INDEX idx_quizzes_class ON quizzes(teaching_class_id);
CREATE INDEX idx_quizzes_status ON quizzes(status);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_photo_answers_attempt ON quiz_photo_answers(quiz_attempt_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────────
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_photo_answers ENABLE ROW LEVEL SECURITY;

-- question_banks
CREATE POLICY question_banks_owner ON question_banks FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY question_banks_public_view ON question_banks FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

-- quizzes
CREATE POLICY quizzes_owner ON quizzes FOR ALL
  USING (user_id = auth.uid());

-- quiz_attempts
CREATE POLICY quiz_attempts_owner ON quiz_attempts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_attempts.quiz_id AND quizzes.user_id = auth.uid())
  );

-- quiz_photo_answers
CREATE POLICY photo_answers_owner ON quiz_photo_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      JOIN quizzes ON quizzes.id = quiz_attempts.quiz_id
      WHERE quiz_attempts.id = quiz_photo_answers.quiz_attempt_id
      AND quizzes.user_id = auth.uid()
    )
  );

-- ── Triggers ────────────────────────────────────────────────────────────────────
CREATE TRIGGER question_banks_updated_at BEFORE UPDATE ON question_banks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
