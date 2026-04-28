-- Migration 008: AI Agent Jobs & Steps
-- Ref: modulajar-master-v3.jsx — Migration 008
BEGIN;

-- Agent Jobs
CREATE TABLE agent_jobs (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type       job_type NOT NULL,
  status         job_status NOT NULL DEFAULT 'queued',

  input          jsonb NOT NULL DEFAULT '{}',
  output         jsonb,

  -- Resource yang dibuat/diupdate
  module_id           uuid REFERENCES modules(id) ON DELETE SET NULL,
  teaching_class_id   uuid REFERENCES teaching_classes(id) ON DELETE SET NULL,

  -- Cost tracking
  tokens_used  int NOT NULL DEFAULT 0,
  cost_idr     int NOT NULL DEFAULT 0,

  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Agent Steps
CREATE TABLE agent_steps (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id       uuid NOT NULL REFERENCES agent_jobs(id) ON DELETE CASCADE,
  agent        agent_name NOT NULL,
  status       job_status NOT NULL DEFAULT 'pending',
  step_order   int NOT NULL DEFAULT 0,
  output       jsonb,
  error        text,
  attempt      int NOT NULL DEFAULT 1,
  max_attempts int NOT NULL DEFAULT 3,
  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_agent_jobs_user ON agent_jobs(user_id);
CREATE INDEX idx_agent_jobs_status ON agent_jobs(status);
CREATE INDEX idx_agent_jobs_user_status ON agent_jobs(user_id, status);
CREATE INDEX idx_agent_steps_job ON agent_steps(job_id);
CREATE INDEX idx_agent_steps_job_order ON agent_steps(job_id, step_order);

COMMIT;