-- Migration 011: Row Level Security — All Tables
-- Ref: modulajar-master-v3.jsx — Migration 011

BEGIN;

-- ── Enable RLS on all user-facing tables ─────────────────────
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE topups ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- NOTE: curriculum_versions, module_templates, learning_outcomes, feature_flags,
-- app_config, audit_logs, daily_metrics, user_flags, invoice_sequences, webhook_logs
-- → RLS disabled (server-only via service_role)

-- ── USERS: own row only ────────────────────────────────────────
CREATE POLICY users_select ON users FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY users_update ON users FOR UPDATE
  USING (auth.uid() = id);

-- ── SCHOOLS: own school only ──────────────────────────────────
CREATE POLICY schools_select ON schools FOR SELECT
  USING (id IN (SELECT school_id FROM users WHERE id = auth.uid()));

-- ── ACADEMIC YEARS: own school ─────────────────────────────────
CREATE POLICY academic_years_all ON academic_years FOR ALL
  USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));

-- ── TEACHING CLASSES: own user only ──────────────────────────
CREATE POLICY teaching_classes_all ON teaching_classes FOR ALL
  USING (user_id = auth.uid());

-- ── STUDENTS: via teaching class ownership ────────────────────
CREATE POLICY students_all ON students FOR ALL
  USING (teaching_class_id IN (
    SELECT id FROM teaching_classes WHERE user_id = auth.uid()
  ));

-- ── CURRICULUM: public read (service_role untuk write) ─────────
CREATE POLICY curriculum_versions_read ON curriculum_versions FOR SELECT USING (true);
CREATE POLICY module_templates_read ON module_templates FOR SELECT USING (true);
CREATE POLICY learning_outcomes_read ON learning_outcomes FOR SELECT USING (true);

-- ── MODULES: own + school + curated/public ────────────────────
CREATE POLICY modules_select ON modules FOR SELECT
  USING (
    user_id = auth.uid() OR
    school_id IN (SELECT school_id FROM users WHERE id = auth.uid()) OR
    is_curated = true OR
    is_public = true
  );
CREATE POLICY modules_insert ON modules FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY modules_update ON modules FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY modules_delete ON modules FOR DELETE USING (user_id = auth.uid());

-- ── MODULE MIGRATIONS: via module ownership ───────────────────
CREATE POLICY module_migrations_all ON module_migrations FOR ALL
  USING (module_id IN (SELECT id FROM modules WHERE user_id = auth.uid()));

-- ── MODULE EXPORTS: own only ──────────────────────────────────
CREATE POLICY module_exports_all ON module_exports FOR ALL
  USING (user_id = auth.uid());

-- ── JOURNALS: own only ─────────────────────────────────────────
CREATE POLICY journals_all ON journals FOR ALL
  USING (user_id = auth.uid());

-- ── ATTENDANCES: via journal ownership ────────────────────────
CREATE POLICY attendances_all ON attendances FOR ALL
  USING (journal_id IN (SELECT id FROM journals WHERE user_id = auth.uid()));

-- ── GRADES: own only ───────────────────────────────────────────
CREATE POLICY grade_entries_all ON grade_entries FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY grade_summaries_all ON grade_summaries FOR ALL
  USING (user_id = auth.uid());

-- ── QUESTIONS: own + public ───────────────────────────────────
CREATE POLICY questions_select ON questions FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY questions_insert ON questions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY questions_update ON questions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY questions_delete ON questions FOR DELETE USING (user_id = auth.uid());

-- ── QUESTION SETS: own + public ────────────────────────────────
CREATE POLICY question_sets_select ON question_sets FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY question_sets_insert ON question_sets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY question_sets_update ON question_sets FOR UPDATE USING (user_id = auth.uid());

-- ── AGENT JOBS: own only ───────────────────────────────────────
CREATE POLICY agent_jobs_all ON agent_jobs FOR ALL
  USING (user_id = auth.uid());

-- ── AGENT STEPS: via job ownership ────────────────────────────
CREATE POLICY agent_steps_select ON agent_steps FOR SELECT
  USING (job_id IN (SELECT id FROM agent_jobs WHERE user_id = auth.uid()));

-- ── SUBSCRIPTIONS: own or own school ───────────────────────────
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR
    school_id IN (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- ── PAYMENTS: via subscription ────────────────────────────────
CREATE POLICY payments_select ON payments FOR SELECT
  USING (subscription_id IN (
    SELECT id FROM subscriptions
    WHERE user_id = auth.uid() OR school_id IN (SELECT school_id FROM users WHERE id = auth.uid())
  ));

-- ── TOPUPS: own only ───────────────────────────────────────────
CREATE POLICY topups_select ON topups FOR SELECT USING (user_id = auth.uid());

-- ── NOTIFICATIONS: own only ──────────────────────────────────
CREATE POLICY notifications_all ON notifications FOR ALL
  USING (user_id = auth.uid());

-- ── PUSH SUBSCRIPTIONS: own only ──────────────────────────────
CREATE POLICY push_subscriptions_all ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- ── FEEDBACKS: own only ────────────────────────────────────────
CREATE POLICY feedbacks_insert ON feedbacks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY feedbacks_select ON feedbacks FOR SELECT USING (user_id = auth.uid());

COMMIT;