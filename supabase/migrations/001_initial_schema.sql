-- ============================================================
-- AI Task Supervisor — Supabase Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- USERS (extends Supabase Auth)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  quota_tasks_per_day INTEGER NOT NULL DEFAULT 20,
  quota_ai_calls_per_day INTEGER NOT NULL DEFAULT 50,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TASKS
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  raw_input TEXT,                         -- original free-text from user
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  urgency INTEGER NOT NULL DEFAULT 5      -- 1-10 scale
    CHECK (urgency BETWEEN 1 AND 10),
  importance INTEGER NOT NULL DEFAULT 5   -- 1-10 scale
    CHECK (importance BETWEEN 1 AND 10),
  -- Eisenhower quadrant: 1=Do Now, 2=Schedule, 3=Delegate, 4=Eliminate
  quadrant INTEGER NOT NULL DEFAULT 1
    CHECK (quadrant BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done', 'archived')),
  sort_order REAL NOT NULL DEFAULT 0,     -- for manual reordering
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- AI INSIGHTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- type: parse | prioritize | suggest | daily_plan
  type TEXT NOT NULL
    CHECK (type IN ('parse', 'prioritize', 'suggest', 'daily_plan')),
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  response_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- USAGE LOGS (daily aggregate per user)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_created INTEGER NOT NULL DEFAULT 0,
  ai_calls INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- ────────────────────────────────────────────────────────────
-- FEATURE FLAGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default feature flags
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('ai_execution_suggestions', true, 'Enable the "Actionable Suggestions" AI feature'),
  ('ai_daily_optimizer', true, 'Enable the Daily Workflow Optimizer AI feature'),
  ('ai_nlp_parse', true, 'Enable NLP task parsing on input'),
  ('project_sunset', false, 'Show sunset alert and disable new signups (auto-set by sustainability monitor)');

-- ────────────────────────────────────────────────────────────
-- CSAT RESPONSES
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.csat_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  context TEXT, -- e.g. 'post_task_5', 'weekly_prompt'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- SUSTAINABILITY METRICS
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.sustainability_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  revenue_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  operating_cost_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  new_signups INTEGER NOT NULL DEFAULT 0,
  churn_count INTEGER NOT NULL DEFAULT 0,
  total_ai_tokens INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_tasks_updated
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_feature_flags_updated
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ────────────────────────────────────────────────────────────
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csat_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_metrics ENABLE ROW LEVEL SECURITY;

-- Users: can only read/update own row
CREATE POLICY "users_own_row" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Tasks: users own their tasks
CREATE POLICY "tasks_own" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- AI Insights: users own their insights
CREATE POLICY "ai_insights_own" ON public.ai_insights
  FOR ALL USING (auth.uid() = user_id);

-- Usage Logs: users can read own logs
CREATE POLICY "usage_logs_own" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Feature Flags: anyone can read (to check if features are enabled)
CREATE POLICY "feature_flags_read" ON public.feature_flags
  FOR SELECT USING (true);

-- CSAT: users own their responses
CREATE POLICY "csat_own" ON public.csat_responses
  FOR ALL USING (auth.uid() = user_id);

-- Sustainability metrics: read-only for authenticated users
CREATE POLICY "sustainability_read" ON public.sustainability_metrics
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_quadrant ON public.tasks(quadrant);
CREATE INDEX idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX idx_ai_insights_task_id ON public.ai_insights(task_id);
CREATE INDEX idx_usage_logs_user_date ON public.usage_logs(user_id, log_date);
CREATE INDEX idx_sustainability_date ON public.sustainability_metrics(metric_date);
