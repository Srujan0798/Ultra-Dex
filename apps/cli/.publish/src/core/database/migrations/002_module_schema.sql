-- Ultra-Dex Module-Specific Schema Extensions
-- Additional tables for audit, billing, and execution tracking

-- Clerk user sync table (maps Clerk IDs to internal users)
CREATE TABLE IF NOT EXISTS clerk_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing transactions history
CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'completed',
  type TEXT NOT NULL, -- 'charge', 'refund', 'adjustment'
  stripe_transaction_id TEXT UNIQUE,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost tracking by agent and model
CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  agent TEXT NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  total_cost_usd DECIMAL(10,6) NOT NULL,
  total_tokens_in INTEGER DEFAULT 0,
  total_tokens_out INTEGER DEFAULT 0,
  request_count INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent execution logs
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_trace_id UUID REFERENCES execution_traces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  agent TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info', -- 'debug', 'info', 'warn', 'error'
  message TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tool execution history
CREATE TABLE IF NOT EXISTS tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_trace_id UUID REFERENCES execution_traces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  input_params JSONB,
  output JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed', 'timeout'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Governance policy violations
CREATE TABLE IF NOT EXISTS policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  policy_id TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  resource TEXT,
  action_taken TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval workflow history
CREATE TABLE IF NOT EXISTS approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL, -- 'pending', 'approved', 'rejected'
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_clerk_syncs_clerk_id ON clerk_syncs(clerk_id);
CREATE INDEX IF NOT EXISTS idx_clerk_syncs_user_id ON clerk_syncs(user_id);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_user ON billing_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_created ON billing_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_status ON billing_transactions(status);

CREATE INDEX IF NOT EXISTS idx_cost_tracking_user ON cost_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_period ON cost_tracking(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_agent_logs_trace ON agent_logs(execution_trace_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_user ON agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_tool_executions_trace ON tool_executions(execution_trace_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_tool ON tool_executions(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_executions_created ON tool_executions(created_at);

CREATE INDEX IF NOT EXISTS idx_policy_violations_user ON policy_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_policy ON policy_violations(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_created ON policy_violations(created_at);

CREATE INDEX IF NOT EXISTS idx_approval_history_request ON approval_history(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_user ON approval_history(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_status ON approval_history(status);
