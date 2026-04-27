-- Day 3: RLS Policies — Multi-tenant row-level isolation
-- Ref: modulajar-docs.jsx → Uncovered: "RLS Policy Supabase"
-- Migration: 0002_rls_policies.sql

BEGIN;

-- ── Helper Functions ────────────────────────────────────────────

-- Check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is kepala_sekolah of a school
CREATE OR REPLACE FUNCTION is_kepala_sekolah_of(school_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND school_id = school_uuid
      AND role = 'kepala_sekolah'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Schools ─────────────────────────────────────────────────────
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY schools_select ON schools FOR SELECT
  USING (
    is_super_admin()
    OR is_kepala_sekolah_of(id)
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.school_id = schools.id
    )
  );

CREATE POLICY schools_insert ON schools FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY schools_update ON schools FOR UPDATE
  USING (
    is_super_admin()
    OR kepala_sekolah_user_id = auth.uid()
  );

-- ── Users ───────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users FOR SELECT
  USING (id = auth.uid() OR is_super_admin());

CREATE POLICY users_select_school ON users FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid()
    )
    OR is_super_admin()
  );

CREATE POLICY users_update_own ON users FOR UPDATE
  USING (
    id = auth.uid()
    OR is_super_admin()
  );

-- ── Curriculum Versions ─────────────────────────────────────────
ALTER TABLE curriculum_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cv_public_read ON curriculum_versions FOR SELECT
  USING (true); -- Public read for all

CREATE POLICY cv_admin_write ON curriculum_versions FOR ALL
  USING (is_super_admin());

-- ── Module Templates ────────────────────────────────────────────
ALTER TABLE module_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY mt_public_read ON module_templates FOR SELECT
  USING (true);

CREATE POLICY mt_admin_write ON module_templates FOR ALL
  USING (is_super_admin());

-- ── Capaian Pembelajaran ───────────────────────────────────────
ALTER TABLE capaian_pembelajaran ENABLE ROW LEVEL SECURITY;

CREATE POLICY cp_public_read ON capaian_pembelajaran FOR SELECT
  USING (true);

CREATE POLICY cp_admin_write ON capaian_pembelajaran FOR ALL
  USING (is_super_admin());

-- ── Tujuan Pembelajaran ─────────────────────────────────────────
ALTER TABLE tujuan_pembelajaran ENABLE ROW LEVEL SECURITY;

CREATE POLICY tp_public_read ON tujuan_pembelajaran FOR SELECT
  USING (true);

CREATE POLICY tp_admin_write ON tujuan_pembelajaran FOR ALL
  USING (is_super_admin());

-- ── Modules ─────────────────────────────────────────────────────
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Read: own modules OR school modules OR curated public library
CREATE POLICY modules_select ON modules FOR SELECT
  USING (
    is_super_admin()
    OR user_id = auth.uid()
    OR (
      school_id IN (
        SELECT school_id FROM users WHERE id = auth.uid()
      )
      AND school_id IS NOT NULL
    )
    OR is_curated = true
  );

-- Insert: only own modules
CREATE POLICY modules_insert ON modules FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Update: only own modules (or kepala sekolah on school modules)
CREATE POLICY modules_update ON modules FOR UPDATE
  USING (
    is_super_admin()
    OR user_id = auth.uid()
    OR (
      school_id = (
        SELECT school_id FROM users WHERE id = auth.uid()
      )
      AND is_kepala_sekolah_of(school_id)
    )
  );

-- Delete: own modules only
CREATE POLICY modules_delete ON modules FOR DELETE
  USING (
    is_super_admin()
    OR user_id = auth.uid()
  );

-- ── Module Migrations ───────────────────────────────────────────
ALTER TABLE module_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY mm_select ON module_migrations FOR SELECT
  USING (
    is_super_admin()
    OR module_id IN (
      SELECT id FROM modules WHERE user_id = auth.uid()
    )
  );

CREATE POLICY mm_update ON module_migrations FOR UPDATE
  USING (is_super_admin());

-- ── Subscriptions ───────────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Read: own subscription OR school subscription (kepala sekolah)
CREATE POLICY sub_select ON subscriptions FOR SELECT
  USING (
    is_super_admin()
    OR user_id = auth.uid()
    OR (
      school_id IN (
        SELECT school_id FROM users WHERE id = auth.uid()
      )
      AND school_id IS NOT NULL
    )
  );

-- Write: server-side only (service_role from Elysia)
CREATE POLICY sub_server_write ON subscriptions FOR ALL
  USING (is_super_admin());

-- ── Payments ────────────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY pay_select_own ON payments FOR SELECT
  USING (
    is_super_admin()
    OR user_id = auth.uid()
    OR (
      school_id IN (
        SELECT school_id FROM users WHERE id = auth.uid()
      )
      AND school_id IS NOT NULL
    )
  );

-- Write: server-side only
CREATE POLICY pay_server_write ON payments FOR ALL
  USING (is_super_admin());

-- ── Top-ups ─────────────────────────────────────────────────────
ALTER TABLE topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY topup_select ON topups FOR SELECT
  USING (
    is_super_admin()
    OR user_id = auth.uid()
  );

CREATE POLICY topup_server_write ON topups FOR ALL
  USING (is_super_admin());

-- ── Invoice Sequences ──────────────────────────────────────────
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY inv_seq_read ON invoice_sequences FOR SELECT
  USING (is_super_admin());

CREATE POLICY inv_seq_write ON invoice_sequences FOR ALL
  USING (is_super_admin());

-- ── Agent Jobs ──────────────────────────────────────────────────
ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_select ON agent_jobs FOR SELECT
  USING (
    is_super_admin()
    OR user_id = auth.uid()
  );

CREATE POLICY job_insert ON agent_jobs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Update: server-side only (Elysia updates status/output)
CREATE POLICY job_server_write ON agent_jobs FOR UPDATE
  USING (is_super_admin());

-- ── Agent Steps ─────────────────────────────────────────────────
ALTER TABLE agent_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY step_select ON agent_steps FOR SELECT
  USING (
    is_super_admin()
    OR job_id IN (
      SELECT id FROM agent_jobs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY step_server_write ON agent_steps FOR ALL
  USING (is_super_admin());

-- ── Notifications ───────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notif_select ON notifications FOR SELECT
  USING (
    is_super_admin()
    OR user_id = auth.uid()
  );

CREATE POLICY notif_insert ON notifications FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY notif_update ON notifications FOR UPDATE
  USING (
    is_super_admin()
    OR user_id = auth.uid()
  );

-- ── Webhook Logs ──────────────────────��──────────────────────────
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY wh_select ON webhook_logs FOR SELECT
  USING (is_super_admin());

CREATE POLICY wh_insert ON webhook_logs FOR INSERT
  WITH CHECK (true); -- Public endpoint, no auth

-- ── User Flags ──────────────────────────────────────────────────
ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY uf_select ON user_flags FOR SELECT
  USING (is_super_admin());

CREATE POLICY uf_insert ON user_flags FOR INSERT
  WITH CHECK (is_super_admin());

-- ── Audit Logs ───────────────────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_select ON audit_logs FOR SELECT
  USING (is_super_admin());

CREATE POLICY audit_insert ON audit_logs FOR INSERT
  WITH CHECK (true); -- Server-side inserts

-- ── Disable public anon access to auth.users ────────────────────
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auth_users_select ON auth.users;
CREATE POLICY auth_users_select ON auth.users FOR SELECT
  USING (id = auth.uid() OR is_super_admin());

COMMIT;