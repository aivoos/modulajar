-- Migration 009: Billing — Subscriptions & Payments
-- Ref: modulajar-master-v3.jsx — Migration 009
BEGIN;

-- Subscriptions
CREATE TABLE subscriptions (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               uuid REFERENCES users(id) ON DELETE CASCADE,
  school_id             uuid REFERENCES schools(id) ON DELETE CASCADE,

  plan                  subscription_plan NOT NULL DEFAULT 'free',
  billing_cycle         billing_cycle,
  status                subscription_status NOT NULL DEFAULT 'active',

  -- AI Quota: 0=locked(Free), angka=Go, -1=unlimited(Plus/Sekolah)
  ai_quota_used         int NOT NULL DEFAULT 0,
  ai_quota_limit        int NOT NULL DEFAULT 0,

  current_period_start  timestamptz NOT NULL DEFAULT now(),
  current_period_end    timestamptz,

  -- Dunning
  grace_period_end      timestamptz,
  cancel_at_period_end   boolean NOT NULL DEFAULT false,

  -- Xendit
  xendit_subscription_id text,
  invoice_data           jsonb NOT NULL DEFAULT '{}',

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Constraint: user XOR school, tidak keduanya
  CONSTRAINT subscription_owner CHECK (
    (user_id IS NOT NULL AND school_id IS NULL) OR
    (user_id IS NULL AND school_id IS NOT NULL)
  )
);

-- Payments
CREATE TABLE payments (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id       uuid NOT NULL REFERENCES subscriptions(id),

  xendit_payment_id     text NOT NULL UNIQUE,
  xendit_invoice_id     text,

  amount_idr            int NOT NULL,
  method                text,
  status                payment_status NOT NULL DEFAULT 'pending',

  invoice_url           text,
  pdf_url               text,
  pdf_signed_url        text,
  pdf_url_expires_at    timestamptz,

  paid_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Top-ups (one-time AI credit purchase)
CREATE TABLE topups (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id     uuid NOT NULL REFERENCES subscriptions(id),

  xendit_payment_id   text NOT NULL UNIQUE,
  amount_idr          int NOT NULL,
  ai_credits          int NOT NULL DEFAULT 3,
  method              text,
  status              payment_status NOT NULL DEFAULT 'pending',

  paid_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Invoice Sequences
CREATE TABLE invoice_sequences (
  year     int PRIMARY KEY,
  last_seq int NOT NULL DEFAULT 0
);

-- Webhook Logs
CREATE TABLE webhook_logs (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  xendit_event text NOT NULL,
  payload      jsonb NOT NULL,
  processed    boolean NOT NULL DEFAULT false,
  error        text,
  processed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_subscriptions_user ON subscriptions(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_subscriptions_school ON subscriptions(school_id) WHERE school_id IS NOT NULL;
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_xendit ON payments(xendit_payment_id);
CREATE INDEX idx_topups_user ON topups(user_id);
CREATE INDEX idx_webhook_logs_event ON webhook_logs(xendit_event);
CREATE INDEX idx_webhook_logs_unprocessed ON webhook_logs(processed) WHERE processed = false;

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: generate invoice number INV-YYYY-NNNNNN
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  current_year int := EXTRACT(YEAR FROM now());
  new_seq int;
BEGIN
  INSERT INTO invoice_sequences(year, last_seq) VALUES(current_year, 1)
  ON CONFLICT(year) DO UPDATE SET last_seq = invoice_sequences.last_seq + 1
  RETURNING last_seq INTO new_seq;
  RETURN 'INV-' || current_year || '-' || LPAD(new_seq::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

COMMIT;