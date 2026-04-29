-- Migration 010: Notifications, Feedback & Config
-- Ref: modulajar-master-v3.jsx — Migration 010
BEGIN;

-- Notifications (in-app)
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      text NOT NULL,
  body       text,
  meta       jsonb NOT NULL DEFAULT '{}',
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Push Subscriptions (untuk PWA push notification)
CREATE TABLE push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  device_info text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

-- Feedbacks (dari in-app feedback widget)
CREATE TABLE feedbacks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  type        text NOT NULL DEFAULT 'general',
  content     text NOT NULL,
  url         text,
  screenshot  text,
  resolved    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Feature Flags (toggle fitur tanpa deploy)
CREATE TABLE feature_flags (
  key               text PRIMARY KEY,
  enabled           boolean NOT NULL DEFAULT false,
  rollout_percentage int NOT NULL DEFAULT 100
    CHECK(rollout_percentage BETWEEN 0 AND 100),
  enabled_for_plans text[],
  description       text,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- App Config (setting aplikasi yang bisa diubah tanpa deploy)
CREATE TABLE app_config (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Audit Logs (semua major actions)
CREATE TABLE audit_logs (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  action        text NOT NULL,
  resource_type text,
  resource_id   uuid,
  meta          jsonb NOT NULL DEFAULT '{}',
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Daily Metrics (aggregate harian untuk dashboard admin)
CREATE TABLE daily_metrics (
  date              date PRIMARY KEY,
  new_signups       int NOT NULL DEFAULT 0,
  active_users      int NOT NULL DEFAULT 0,
  modules_created   int NOT NULL DEFAULT 0,
  ai_jobs_run       int NOT NULL DEFAULT 0,
  ai_cost_idr       int NOT NULL DEFAULT 0,
  mrr_idr           int NOT NULL DEFAULT 0,
  new_subscriptions int NOT NULL DEFAULT 0,
  churn_count       int NOT NULL DEFAULT 0
);

-- User Flags (untuk abuse detection dan ban)
CREATE TABLE user_flags (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      text NOT NULL,
  flagged_by  uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_feedbacks_resolved ON feedbacks(resolved);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

CREATE TRIGGER feature_flags_updated_at BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;