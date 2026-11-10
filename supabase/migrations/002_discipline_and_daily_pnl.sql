-- ============================================================================
-- TradePilot – Migration 002: Discipline 10-Min Check-In Logs & Daily P&L Tracker
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discipline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  brain_fog TEXT NOT NULL DEFAULT 'CLEAR' CHECK (brain_fog IN ('CLEAR', 'MILD_FATIGUE', 'BRAIN_FOG', 'EXHAUSTED')),
  mood TEXT NOT NULL DEFAULT 'CALM_DISCIPLINED',
  secondary_moods TEXT[] NOT NULL DEFAULT '{}',
  urge_intensity INTEGER NOT NULL DEFAULT 2 CHECK (urge_intensity BETWEEN 1 AND 10),
  remaining_daily_budget_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  action_taken TEXT NOT NULL DEFAULT 'Followed Plan',
  family_reminder_checked BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discipline_logs_user_date ON public.discipline_logs(user_id, trade_date DESC);

ALTER TABLE public.discipline_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own discipline_logs" ON public.discipline_logs;
CREATE POLICY "Users manage own discipline_logs"
  ON public.discipline_logs
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.daily_pnl_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  manual_profit_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  account_adjustment_usd NUMERIC(14,2) NOT NULL DEFAULT 0,
  broker_source TEXT NOT NULL DEFAULT 'COMBINED',
  trades_count INTEGER NOT NULL DEFAULT 0,
  dominant_mood TEXT NOT NULL DEFAULT 'CALM_DISCIPLINED',
  followed_plan BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_pnl_logs_user_date ON public.daily_pnl_logs(user_id, trade_date DESC);

ALTER TABLE public.daily_pnl_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own daily_pnl_logs" ON public.daily_pnl_logs;
CREATE POLICY "Users manage own daily_pnl_logs"
  ON public.daily_pnl_logs
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
