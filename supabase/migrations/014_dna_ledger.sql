-- Migration 014: DNA Ledger — Event-sourced wallet, ledger, idempotency, outbox, policy engine
-- Ref: packages/dna — extracted from aivo-core-template, ported to TypeScript + Supabase
-- Purpose: Reliable AI quota billing with double-entry ledger, idempotency, and outbox pattern
BEGIN;

-- ─── DNA Tables (isolated namespace via dna_ prefix to avoid collision) ──────────

-- Event log (immutable append-only)
CREATE TABLE IF NOT EXISTS dna_events (
  event_id       TEXT    NOT NULL,
  execution_id   TEXT,
  workspace_id   TEXT,
  actor_id       TEXT,
  type           TEXT,
  payload        JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id)
);

-- Receipts
CREATE TABLE IF NOT EXISTS dna_receipts (
  receipt_id   TEXT    NOT NULL PRIMARY KEY,
  event_id     TEXT    NOT NULL,
  amount       BIGINT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Double-entry ledger
CREATE TABLE IF NOT EXISTS dna_ledger (
  entry_id      TEXT    NOT NULL,
  workspace_id  TEXT,
  direction     TEXT    CHECK (direction IN ('credit', 'debit')),
  amount        BIGINT  NOT NULL CHECK (amount >= 0),
  reference_id  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (entry_id)
);

-- Idempotency cache (TTL: 48h, cleaned by cron)
CREATE TABLE IF NOT EXISTS dna_idempotency (
  key          TEXT    NOT NULL PRIMARY KEY,
  response     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours')
);

-- Per-workspace wallet (get-or-create via INSERT ON CONFLICT)
CREATE TABLE IF NOT EXISTS dna_wallets (
  workspace_id  TEXT    NOT NULL PRIMARY KEY,
  balance      BIGINT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Outbox (transactional outbox pattern — reliable event delivery)
CREATE TABLE IF NOT EXISTS dna_outbox (
  id          TEXT    NOT NULL PRIMARY KEY,
  topic       TEXT,
  payload     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  processed   BOOLEAN DEFAULT FALSE
);

-- Daily spend policy per workspace
CREATE TABLE IF NOT EXISTS dna_policies (
  workspace_id        TEXT    NOT NULL PRIMARY KEY,
  daily_limit         BIGINT  NOT NULL DEFAULT 9223372036854775807, -- BIGINT MAX = unlimited
  current_spend       BIGINT  NOT NULL DEFAULT 0,
  last_reset          TIMESTAMPTZ DEFAULT NOW()
);

-- API key registry
CREATE TABLE IF NOT EXISTS dna_api_keys (
  key          TEXT    NOT NULL PRIMARY KEY,
  workspace_id TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS dna_idx_events_workspace    ON dna_events(workspace_id);
CREATE INDEX IF NOT EXISTS dna_idx_receipts_event       ON dna_receipts(event_id);
CREATE INDEX IF NOT EXISTS dna_idx_ledger_workspace    ON dna_ledger(workspace_id);
CREATE INDEX IF NOT EXISTS dna_idx_ledger_created     ON dna_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS dna_idempotency_expires     ON dna_idempotency(expires_at);
CREATE INDEX IF NOT EXISTS dna_idx_outbox_unprocessed ON dna_outbox(processed, created_at) WHERE processed = FALSE;

-- ─── Helpers & Functions ──────────────────────────────────────────────────────

-- Reconcile: compare wallet balance with ledger sum
CREATE OR REPLACE FUNCTION dna_reconcile(p_workspace_id TEXT)
RETURNS TABLE(
  wallet   BIGINT,
  ledger   BIGINT,
  match    BOOLEAN,
  drift    BIGINT
) AS $$
DECLARE
  v_wallet BIGINT;
  v_ledger BIGINT;
BEGIN
  SELECT balance INTO v_wallet FROM dna_wallets WHERE workspace_id = p_workspace_id;
  v_wallet := COALESCE(v_wallet, 0);

  SELECT COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0)
  INTO v_ledger FROM dna_ledger WHERE workspace_id = p_workspace_id;

  wallet := v_wallet;
  ledger := v_ledger;
  match  := (v_wallet = v_ledger);
  drift  := v_wallet - v_ledger;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired idempotency records
CREATE OR REPLACE FUNCTION dna_cleanup_idempotency()
RETURNS INT AS $$
DECLARE
  deleted INT;
BEGIN
  DELETE FROM dna_idempotency WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Outbox processor helper (marks message as processed)
CREATE OR REPLACE FUNCTION dna_outbox_mark_processed(p_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE dna_outbox SET processed = TRUE WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Trigger for updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION dna_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dna_wallets_updated_at ON dna_wallets;
CREATE TRIGGER dna_wallets_updated_at
  BEFORE UPDATE ON dna_wallets
  FOR EACH ROW EXECUTE FUNCTION dna_wallets_updated_at();

-- ─── Core Stored Procedures ────────────────────────────────────────────────

-- dna_execute_command: atomic command execution with idempotency, policy check, wallet debit
CREATE OR REPLACE FUNCTION dna_execute_command(
  p_workspace_id    TEXT,
  p_actor_id        TEXT,
  p_type            TEXT,
  p_payload         JSONB,
  p_idempotency_key TEXT,
  p_cost            BIGINT DEFAULT 1
) RETURNS JSONB AS $$
DECLARE
  v_balance       BIGINT;
  v_new_balance   BIGINT;
  v_exec_id        TEXT := gen_random_uuid()::TEXT;
  v_event_id      TEXT := gen_random_uuid()::TEXT;
  v_receipt_id    TEXT := gen_random_uuid()::TEXT;
  v_entry_id      TEXT := gen_random_uuid()::TEXT;
  v_daily_limit   BIGINT;
  v_current_spend BIGINT;
  v_cached        JSONB;
  v_resp          JSONB;
BEGIN
  -- 1. Idempotency check first (fast path)
  SELECT response INTO v_cached FROM dna_idempotency WHERE key = p_idempotency_key;
  IF v_cached IS NOT NULL THEN
    RETURN v_cached;
  END IF;

  -- 2. Get-or-create wallet, lock row
  INSERT INTO dna_wallets (workspace_id, balance) VALUES (p_workspace_id, 0)
  ON CONFLICT (workspace_id) DO NOTHING;

  SELECT balance INTO v_balance FROM dna_wallets WHERE workspace_id = p_workspace_id FOR UPDATE;
  v_balance := COALESCE(v_balance, 0);

  -- 3. Policy check (skip if cost = 0)
  IF p_cost > 0 THEN
    INSERT INTO dna_policies (workspace_id, daily_limit) VALUES (p_workspace_id, 9223372036854775807)
    ON CONFLICT (workspace_id) DO NOTHING;

    SELECT daily_limit, current_spend INTO v_daily_limit, v_current_spend
    FROM dna_policies WHERE workspace_id = p_workspace_id FOR UPDATE;

    IF v_current_spend + p_cost > COALESCE(v_daily_limit, 9223372036854775807) THEN
      RETURN jsonb_build_object(
        'status', 'error', 'error', 'POLICY_LIMIT_EXCEEDED',
        'execution_id', v_exec_id
      );
    END IF;

    UPDATE dna_policies SET current_spend = current_spend + p_cost WHERE workspace_id = p_workspace_id;
  END IF;

  -- 4. Balance check
  IF v_balance < p_cost THEN
    RETURN jsonb_build_object(
      'status', 'error', 'error', 'INSUFFICIENT_BALANCE',
      'execution_id', v_exec_id
    );
  END IF;

  -- 5. Commit all in one statement (idempotency + event + ledger + wallet)
  v_new_balance := v_balance - p_cost;

  -- Idempotency record
  v_resp := jsonb_build_object(
    'execution_id', v_exec_id,
    'status', 'success',
    'receipts', jsonb_build_array(
      jsonb_build_object(
        'receipt_id', v_receipt_id,
        'event_id', v_event_id,
        'amount', p_cost,
        'created_at', NOW()::TEXT
      )
    ),
    'balance_after', v_new_balance
  );

  INSERT INTO dna_idempotency (key, response, created_at, expires_at)
  VALUES (p_idempotency_key, v_resp, NOW(), NOW() + INTERVAL '48 hours')
  ON CONFLICT (key) DO NOTHING;

  -- Event log
  INSERT INTO dna_events (event_id, execution_id, workspace_id, actor_id, type, payload, created_at)
  VALUES (v_event_id, v_exec_id, p_workspace_id, p_actor_id, p_type, p_payload, NOW());

  -- Receipt
  INSERT INTO dna_receipts (receipt_id, event_id, amount, created_at)
  VALUES (v_receipt_id, v_event_id, p_cost, NOW());

  -- Ledger entry
  INSERT INTO dna_ledger (entry_id, workspace_id, direction, amount, reference_id, created_at)
  VALUES (v_entry_id, p_workspace_id, CASE WHEN p_cost > 0 THEN 'debit' ELSE 'credit' END, p_cost, v_receipt_id, NOW());

  -- Wallet debit (with guard)
  UPDATE dna_wallets SET balance = balance - p_cost, updated_at = NOW()
  WHERE workspace_id = p_workspace_id AND balance >= p_cost;

  -- Outbox entry
  INSERT INTO dna_outbox (id, topic, payload, created_at)
  VALUES ('out_' || v_exec_id, 'dna.execution.success', v_resp, NOW());

  RETURN v_resp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- dna_credit_wallet: credit funds to workspace wallet
CREATE OR REPLACE FUNCTION dna_credit_wallet(
  p_workspace_id   TEXT,
  p_amount         BIGINT,
  p_reference_id   TEXT,
  p_reference_type TEXT DEFAULT 'topup'
) RETURNS JSONB AS $$
DECLARE
  v_balance   BIGINT;
  v_entry_id  TEXT := gen_random_uuid()::TEXT;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  -- Ensure wallet exists
  INSERT INTO dna_wallets (workspace_id, balance) VALUES (p_workspace_id, 0)
  ON CONFLICT (workspace_id) DO NOTHING;

  -- Credit
  UPDATE dna_wallets
  SET balance = balance + p_amount, updated_at = NOW()
  WHERE workspace_id = p_workspace_id
  RETURNING balance INTO v_balance;

  -- Ledger
  INSERT INTO dna_ledger (entry_id, workspace_id, direction, amount, reference_id, created_at)
  VALUES (v_entry_id, p_workspace_id, 'credit', p_amount, p_reference_id, NOW());

  -- Outbox
  INSERT INTO dna_outbox (id, topic, payload, created_at)
  VALUES (
    'credit_' || v_entry_id,
    'dna.credit',
    jsonb_build_object('reference_type', p_reference_type, 'amount', p_amount, 'balance', v_balance),
    NOW()
  );

  RETURN jsonb_build_object('balance', v_balance, 'entry_id', v_entry_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- dna_get_balance: get current wallet balance
CREATE OR REPLACE FUNCTION dna_get_balance(p_workspace_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  SELECT balance INTO v_balance FROM dna_wallets WHERE workspace_id = p_workspace_id;
  RETURN jsonb_build_object('balance', COALESCE(v_balance, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- dna_get_history: get ledger entries for a workspace
CREATE OR REPLACE FUNCTION dna_get_history(p_workspace_id TEXT, p_limit INT DEFAULT 50)
RETURNS TABLE(
  entry_id     TEXT,
  workspace_id TEXT,
  direction    TEXT,
  amount       BIGINT,
  reference_id TEXT,
  created_at   TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT l.entry_id, l.workspace_id, l.direction, l.amount, l.reference_id, l.created_at
  FROM dna_ledger l
  WHERE l.workspace_id = p_workspace_id
  ORDER BY l.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- dna_outbox_pending: get unprocessed outbox messages
CREATE OR REPLACE FUNCTION dna_outbox_pending(p_limit INT DEFAULT 100)
RETURNS TABLE(id TEXT, topic TEXT, payload JSONB, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.topic, o.payload, o.created_at
  FROM dna_outbox o
  WHERE o.processed = FALSE
  ORDER BY o.created_at
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Migration: backfill DNA wallet for existing paid users ──────────────────
-- Only run if subscriptions table exists (skip if schema is partial)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public') THEN
    INSERT INTO dna_wallets (workspace_id, balance)
    SELECT u.id, 0
    FROM users u
    JOIN subscriptions s ON s.user_id = u.id
    WHERE s.plan NOT IN ('free')
    ON CONFLICT (workspace_id) DO NOTHING;
  ELSE
    RAISE NOTICE 'subscriptions table not found — skipping backfill';
  END IF;
END $$;

COMMIT;
