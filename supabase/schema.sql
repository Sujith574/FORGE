-- ============================================================
-- FORGE — Supabase Database Setup
-- Run this entire script in Supabase → SQL Editor → New Query
-- Run it once when setting up your project.
-- ============================================================


-- ─── TABLE 1: USERS ──────────────────────────────────────────────────────────
-- Stores founder profile info. Created on first login (onboarding).

CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: founders can only see and edit their own row
CREATE POLICY "Users can manage own profile"
  ON public.users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ─── TABLE 2: BRAIN_NODES ────────────────────────────────────────────────────
-- Stores every node on the founder's Brain Map canvas.

CREATE TABLE IF NOT EXISTS public.brain_nodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  x           FLOAT NOT NULL DEFAULT 400,
  y           FLOAT NOT NULL DEFAULT 300,
  status      TEXT NOT NULL DEFAULT 'unknown'
                CHECK (status IN ('unknown', 'in-progress', 'validated', 'at-risk')),
  is_core     BOOLEAN NOT NULL DEFAULT FALSE,
  connections JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brain_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nodes"
  ON public.brain_nodes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS brain_nodes_user_id_idx ON public.brain_nodes(user_id);


-- ─── TABLE 3: WORK_ITEMS ─────────────────────────────────────────────────────
-- Stores every work item logged inside a Brain Map node.

CREATE TABLE IF NOT EXISTS public.work_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id    UUID NOT NULL REFERENCES public.brain_nodes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL
               CHECK (type IN ('decision', 'insight', 'blocker', 'milestone', 'question', 'note')),
  text       TEXT NOT NULL,
  author     TEXT NOT NULL DEFAULT 'Founder',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own work items"
  ON public.work_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS work_items_node_id_idx ON public.work_items(node_id);
CREATE INDEX IF NOT EXISTS work_items_user_id_idx ON public.work_items(user_id);


-- ─── TABLE 4: DOCUMENTS ──────────────────────────────────────────────────────
-- Stores each individual field the founder fills in on the Documents screen.
-- Each field is its own row (not a JSON blob) for easy upsert.

CREATE TABLE IF NOT EXISTS public.documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL
               CHECK (section_id IN ('market', 'product', 'business', 'technology')),
  field_id   TEXT NOT NULL,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Enforce one row per user + section + field combination
  UNIQUE (user_id, section_id, field_id)
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
  ON public.documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.documents(user_id);


-- ─── TABLE 5: DECISION_LOGS ──────────────────────────────────────────────────
-- Stores every Decision Log with its full lifecycle history.

CREATE TABLE IF NOT EXISTS public.decision_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_id      TEXT NOT NULL
                     CHECK (employee_id IN ('destroyer', 'researcher', 'engineer', 'strategist', 'fundraiser')),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('generating', 'pending', 'accepted', 'rejected', 'revised', 'pushback', 'error')),
  version          INTEGER NOT NULL DEFAULT 1,

  -- Log content
  title            TEXT NOT NULL DEFAULT '',
  situation        TEXT NOT NULL DEFAULT '',
  recommendation   TEXT NOT NULL DEFAULT '',
  reasoning        TEXT NOT NULL DEFAULT '',
  risk_if_ignored  TEXT NOT NULL DEFAULT '',
  confidence       INTEGER DEFAULT 75 CHECK (confidence >= 0 AND confidence <= 100),
  urgency          TEXT NOT NULL DEFAULT 'MEDIUM'
                     CHECK (urgency IN ('HIGH', 'MEDIUM', 'LOW')),
  node_ref         TEXT NOT NULL DEFAULT 'other',

  -- Sub-AI quality review (Situation 2)
  review_score     INTEGER CHECK (review_score >= 0 AND review_score <= 100),
  review_note      TEXT,

  -- Rejection/pushback (Situation 3)
  pushback_reason  TEXT,

  -- Full event history — append-only JSON array
  -- Each entry: { action, reason?, timestamp, version, ai_response? }
  history          JSONB NOT NULL DEFAULT '[]',

  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.decision_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own decision logs"
  ON public.decision_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS decision_logs_user_id_idx ON public.decision_logs(user_id);
CREATE INDEX IF NOT EXISTS decision_logs_status_idx ON public.decision_logs(status);


-- ============================================================
-- DONE — All 5 tables created with RLS enabled.
-- Now go to Supabase Dashboard → Authentication → Providers
-- and make sure Email provider is enabled.
-- ============================================================
