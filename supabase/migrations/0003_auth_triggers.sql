-- Day 4: Auth triggers + auto-profile creation
-- Ref: modulajar-docs.jsx → Supabase Auth
-- Migration: 0003_auth_triggers.sql

BEGIN;

-- ── Auto-create user profile on signup ──────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only create profile if not exists (handles both email + OAuth signups)
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = NEW.id
  ) THEN
    INSERT INTO users (id, full_name, role)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
      ),
      'guru'
    );

    -- Create free subscription
    INSERT INTO subscriptions (
      user_id,
      plan,
      status,
      ai_quota_used,
      ai_quota_limit,
      current_period_start,
      current_period_end
    )
    VALUES (
      NEW.id,
      'free',
      'active',
      0,
      0,
      NOW(),
      NOW() + INTERVAL '30 days'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Audit log helper function ──────────────────────────────────
CREATE OR REPLACE FUNCTION auth_audit_log()
RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, meta)
  VALUES (
    COALESCE(NEW.user_id, TG_ARGV[0]::uuid),
    TG_OP,
    TG_TABLE_NAME::text,
    COALESCE(NEW.id, TG_ARGV[0]::uuid),
    jsonb_build_object(
      'email', COALESCE(NEW.email, ''::text),
      'trigger', 'auth_audit'
    )
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;