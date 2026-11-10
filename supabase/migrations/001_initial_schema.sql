-- ============================================================================
-- TradePilot – Intelligent Options Trading Command Center
-- Migration: 001_initial_schema.sql
-- Complete PostgreSQL Schema with RLS, Foreign Keys, Indexes & Audit Logging
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function for updated_at timestamps (SECURITY INVOKER + pinned search_path)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  display_timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  market_timezone TEXT NOT NULL DEFAULT 'America/New_York',
  trading_mode TEXT NOT NULL DEFAULT 'PAPER' CHECK (trading_mode IN ('READ_ONLY', 'PAPER', 'LIVE_DISABLED')),
  live_trading_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. broker_connections (Backend-managed credentials never stored in client-readable fields)
CREATE TABLE IF NOT EXISTS public.broker_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  broker_name TEXT NOT NULL DEFAULT 'ROBINHOOD_MCP',
  server_endpoint TEXT,
  connection_status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (connection_status IN ('CONNECTED', 'DISCONNECTED', 'ERROR', 'AUTH_REQUIRED')),
  permission_mode TEXT NOT NULL DEFAULT 'PAPER' CHECK (permission_mode IN ('READ_ONLY', 'PAPER', 'LIVE')),
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. broker_accounts
CREATE TABLE IF NOT EXISTS public.broker_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  broker_connection_id UUID NOT NULL REFERENCES public.broker_connections(id) ON DELETE CASCADE,
  external_account_number TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'MARGIN',
  buying_power NUMERIC(14, 2) NOT NULL DEFAULT 0,
  options_buying_power NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_liquidation_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. market_snapshots
CREATE TABLE IF NOT EXISTS public.market_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL DEFAULT 'SPX',
  price NUMERIC(12, 2) NOT NULL,
  change_pct NUMERIC(8, 4) NOT NULL DEFAULT 0,
  vix NUMERIC(8, 2),
  vwap NUMERIC(12, 2),
  ema_9 NUMERIC(12, 2),
  ema_21 NUMERIC(12, 2),
  rsi_14 NUMERIC(6, 2),
  market_status TEXT NOT NULL CHECK (market_status IN ('PRE-MARKET', 'OPEN', 'CLOSED', 'AFTER-HOURS')),
  data_source TEXT NOT NULL DEFAULT 'SIMULATED_DEMO',
  is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. option_contracts
CREATE TABLE IF NOT EXISTS public.option_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occ_symbol TEXT NOT NULL UNIQUE,
  underlying_symbol TEXT NOT NULL DEFAULT 'SPX',
  expiration_date DATE NOT NULL,
  strike NUMERIC(12, 2) NOT NULL,
  option_type TEXT NOT NULL CHECK (option_type IN ('CALL', 'PUT')),
  multiplier INTEGER NOT NULL DEFAULT 100,
  bid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ask NUMERIC(12, 2) NOT NULL DEFAULT 0,
  midpoint NUMERIC(12, 2) NOT NULL DEFAULT 0,
  last_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  volume INTEGER NOT NULL DEFAULT 0,
  open_interest INTEGER NOT NULL DEFAULT 0,
  implied_volatility NUMERIC(8, 4) NOT NULL DEFAULT 0,
  delta NUMERIC(8, 4),
  gamma NUMERIC(8, 4),
  theta NUMERIC(8, 4),
  vega NUMERIC(8, 4),
  data_source TEXT NOT NULL DEFAULT 'SIMULATED_DEMO',
  quote_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. strategies
CREATE TABLE IF NOT EXISTS public.strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('DIRECTIONAL', 'VOLATILITY', 'DEBIT_SPREAD', 'CREDIT_SPREAD', 'MULTI_LEG')),
  market_outlook TEXT NOT NULL,
  description TEXT,
  is_defined_risk BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. strategy_configs
CREATE TABLE IF NOT EXISTS public.strategy_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  entry_trigger TEXT NOT NULL DEFAULT 'MARKET_AFTER_TIME',
  entry_time_et TEXT NOT NULL DEFAULT '09:35',
  entry_cutoff_et TEXT NOT NULL DEFAULT '14:30',
  strike_selection TEXT NOT NULL DEFAULT 'ATM',
  target_delta NUMERIC(6, 2),
  contracts INTEGER NOT NULL DEFAULT 1,
  profit_target_pct NUMERIC(6, 2) NOT NULL DEFAULT 30.00,
  stop_loss_pct NUMERIC(6, 2) NOT NULL DEFAULT 20.00,
  trailing_stop_pct NUMERIC(6, 2),
  breakeven_trigger_pct NUMERIC(6, 2),
  monitoring_interval_min INTEGER NOT NULL DEFAULT 30,
  monitoring_action TEXT NOT NULL DEFAULT 'REVIEW' CHECK (monitoring_action IN ('HOLD', 'REVIEW', 'PARTIAL_CLOSE', 'FULL_CLOSE')),
  force_close_time_et TEXT NOT NULL DEFAULT '15:45',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. trading_signals
CREATE TABLE IF NOT EXISTS public.trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'TRADINGVIEW',
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'BUY_CALL', 'BUY_PUT', 'BUY_STRADDLE', 'BUY_STRANGLE',
    'EXIT_POSITION', 'CLOSE_ALL', 'VWAP_BULLISH', 'VWAP_BEARISH',
    'EMA_BULLISH', 'EMA_BEARISH'
  )),
  symbol TEXT NOT NULL DEFAULT 'SPX',
  mapped_strategy_code TEXT,
  trading_mode TEXT NOT NULL DEFAULT 'PAPER',
  validation_status TEXT NOT NULL DEFAULT 'VALIDATED' CHECK (validation_status IN ('VALIDATED', 'REJECTED_RISK', 'REJECTED_AUTH', 'DUPLICATE', 'EXECUTED')),
  rejection_reason TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. paper_accounts
CREATE TABLE IF NOT EXISTS public.paper_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'SPX 0DTE Primary Paper Account',
  initial_capital NUMERIC(14, 2) NOT NULL DEFAULT 25000.00,
  cash_balance NUMERIC(14, 2) NOT NULL DEFAULT 25000.00,
  buying_power NUMERIC(14, 2) NOT NULL DEFAULT 25000.00,
  realized_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  unrealized_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  fill_model TEXT NOT NULL DEFAULT 'MIDPOINT' CHECK (fill_model IN ('MIDPOINT', 'NATURAL_BID_ASK', 'SLIPPAGE_ADJUSTED')),
  commission_per_contract NUMERIC(8, 2) NOT NULL DEFAULT 0.65,
  slippage_per_contract NUMERIC(8, 2) NOT NULL DEFAULT 0.10,
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. trade_sessions
CREATE TABLE IF NOT EXISTS public.trade_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trading_mode TEXT NOT NULL DEFAULT 'PAPER',
  trades_count INTEGER NOT NULL DEFAULT 0,
  daily_realized_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  daily_max_drawdown NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  kill_switch_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. trades (Strategy-level grouped trade)
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  paper_account_id UUID REFERENCES public.paper_accounts(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.trade_sessions(id) ON DELETE SET NULL,
  strategy_code TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  underlying_symbol TEXT NOT NULL DEFAULT 'SPX',
  trading_mode TEXT NOT NULL DEFAULT 'PAPER' CHECK (trading_mode IN ('PAPER', 'LIVE', 'IMPORTED')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('PENDING', 'OPEN', 'PARTIAL', 'CLOSED', 'CANCELLED', 'REJECTED')),
  quantity INTEGER NOT NULL DEFAULT 1,
  net_entry_premium NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  net_exit_premium NUMERIC(12, 2),
  total_fees NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_slippage NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  realized_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  unrealized_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  max_risk NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  max_reward NUMERIC(14, 2),
  entry_reason TEXT,
  exit_reason TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. trade_legs
CREATE TABLE IF NOT EXISTS public.trade_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  occ_symbol TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  strike NUMERIC(12, 2) NOT NULL,
  option_type TEXT NOT NULL CHECK (option_type IN ('CALL', 'PUT')),
  side TEXT NOT NULL CHECK (side IN ('BUY_TO_OPEN', 'SELL_TO_OPEN', 'BUY_TO_CLOSE', 'SELL_TO_CLOSE')),
  ratio INTEGER NOT NULL DEFAULT 1,
  contracts INTEGER NOT NULL DEFAULT 1,
  entry_price NUMERIC(12, 2) NOT NULL,
  exit_price NUMERIC(12, 2),
  current_mark NUMERIC(12, 2),
  delta NUMERIC(8, 4),
  gamma NUMERIC(8, 4),
  theta NUMERIC(8, 4),
  vega NUMERIC(8, 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  paper_account_id UUID REFERENCES public.paper_accounts(id) ON DELETE SET NULL,
  execution_lock_key TEXT UNIQUE,
  order_type TEXT NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'MULTI_LEG_DEBIT', 'MULTI_LEG_CREDIT')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED')),
  limit_price NUMERIC(12, 2),
  filled_avg_price NUMERIC(12, 2),
  requested_qty INTEGER NOT NULL DEFAULT 1,
  filled_qty INTEGER NOT NULL DEFAULT 0,
  is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. executions
CREATE TABLE IF NOT EXISTS public.executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  occ_symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  fill_qty INTEGER NOT NULL,
  fill_price NUMERIC(12, 2) NOT NULL,
  fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  slippage NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  fill_model TEXT NOT NULL DEFAULT 'MIDPOINT',
  is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. paper_positions
CREATE TABLE IF NOT EXISTS public.paper_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  paper_account_id UUID NOT NULL REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  underlying_symbol TEXT NOT NULL DEFAULT 'SPX',
  quantity INTEGER NOT NULL DEFAULT 1,
  avg_entry_premium NUMERIC(12, 2) NOT NULL,
  current_mark NUMERIC(12, 2) NOT NULL,
  unrealized_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  unrealized_pnl_pct NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  profit_target_pct NUMERIC(8, 2) NOT NULL DEFAULT 30.00,
  stop_loss_pct NUMERIC(8, 2) NOT NULL DEFAULT 20.00,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. risk_rules
CREATE TABLE IF NOT EXISTS public.risk_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_daily_loss NUMERIC(14, 2) NOT NULL DEFAULT 1000.00,
  max_risk_per_trade NUMERIC(14, 2) NOT NULL DEFAULT 500.00,
  max_trades_per_day INTEGER NOT NULL DEFAULT 5,
  max_simultaneous_positions INTEGER NOT NULL DEFAULT 3,
  max_contracts_per_trade INTEGER NOT NULL DEFAULT 5,
  max_portfolio_exposure_pct NUMERIC(6, 2) NOT NULL DEFAULT 25.00,
  max_bid_ask_spread NUMERIC(8, 2) NOT NULL DEFAULT 1.50,
  max_slippage NUMERIC(8, 2) NOT NULL DEFAULT 0.35,
  min_volume INTEGER NOT NULL DEFAULT 100,
  min_open_interest INTEGER NOT NULL DEFAULT 250,
  entry_cutoff_et TEXT NOT NULL DEFAULT '14:45',
  max_holding_duration_min INTEGER NOT NULL DEFAULT 180,
  cooldown_after_loss_min INTEGER NOT NULL DEFAULT 15,
  stale_quote_threshold_sec INTEGER NOT NULL DEFAULT 30,
  kill_switch_active BOOLEAN NOT NULL DEFAULT FALSE,
  kill_switch_activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. journal_entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  trade_date DATE NOT NULL,
  symbol TEXT NOT NULL DEFAULT 'SPX',
  instrument_type TEXT NOT NULL DEFAULT 'MULTI_LEG_OPTION' CHECK (instrument_type IN ('STOCK', 'CALL', 'PUT', 'MULTI_LEG_OPTION')),
  option_type TEXT,
  strike_summary TEXT NOT NULL,
  expiration_date DATE,
  contracts INTEGER NOT NULL DEFAULT 1,
  entry_price NUMERIC(12, 2) NOT NULL,
  exit_price NUMERIC(12, 2),
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ,
  fees NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  realized_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  strategy TEXT NOT NULL,
  trading_mode TEXT NOT NULL DEFAULT 'PAPER' CHECK (trading_mode IN ('PAPER', 'LIVE', 'CSV_IMPORT', 'ROBINHOOD_SYNC')),
  entry_reason TEXT,
  exit_reason TEXT,
  notes TEXT,
  order_ids TEXT[] DEFAULT '{}',
  execution_ids TEXT[] DEFAULT '{}',
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. performance_snapshots
CREATE TABLE IF NOT EXISTS public.performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  paper_account_id UUID REFERENCES public.paper_accounts(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  equity NUMERIC(14, 2) NOT NULL,
  daily_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  cumulative_pnl NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  win_rate NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  profit_factor NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  max_drawdown NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. automation_events
CREATE TABLE IF NOT EXISTS public.automation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  strategy_code TEXT,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('HOLD', 'REVIEW', 'PARTIAL_CLOSE', 'FULL_CLOSE', 'ENTRY_OPENED', 'BLOCKED_BY_RISK', 'KILL_SWITCH')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('ORDER', 'RISK', 'KILL_SWITCH', 'BROKER_MCP', 'WEBHOOK', 'AUTH', 'SETTINGS')),
  severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARN', 'CRITICAL')),
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_option_contracts_exp_strike ON public.option_contracts(expiration_date, strike);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON public.trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON public.journal_entries(user_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_user_received ON public.trading_signals(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- User-owned RLS policies (Using TO authenticated + (select auth.uid()) caching + explicit WITH CHECK)
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users read own broker connections" ON public.broker_connections
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users read own broker accounts" ON public.broker_accounts
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users read market snapshots" ON public.market_snapshots
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users read option contracts" ON public.option_contracts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users manage own strategies" ON public.strategies
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users manage own strategy configs" ON public.strategy_configs
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users read own signals" ON public.trading_signals
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users manage own paper accounts" ON public.paper_accounts
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users manage own trade sessions" ON public.trade_sessions
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users manage own trades" ON public.trades
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users manage own trade legs" ON public.trade_legs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trades t
      WHERE t.id = trade_legs.trade_id AND t.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trades t
      WHERE t.id = trade_legs.trade_id AND t.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users manage own orders" ON public.orders
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users manage own executions" ON public.executions
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users manage own paper positions" ON public.paper_positions
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users manage own risk rules" ON public.risk_rules
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users manage own journal entries" ON public.journal_entries
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users manage own performance snapshots" ON public.performance_snapshots
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users read own automation events" ON public.automation_events
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users read own audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- Automatic Profile, Default Paper Account & Risk Rules Provisioning on Signup
-- Follows Supabase Security Checklist:
-- 1. Pinned search_path = ''
-- 2. Never uses user_metadata for authorization (hardcodes PAPER & live_trading_authorized = FALSE)
-- 3. Revokes EXECUTE from PUBLIC, anon, and authenticated so it is not callable via Data API RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    display_timezone,
    market_timezone,
    trading_mode,
    live_trading_authorized
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, 'trader@tradepilot.local'),
    SPLIT_PART(COALESCE(NEW.email, 'trader'), '@', 1),
    'America/Los_Angeles',
    'America/New_York',
    'PAPER',
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.paper_accounts (
    user_id,
    name,
    initial_capital,
    cash_balance,
    buying_power,
    fill_model,
    commission_per_contract,
    slippage_per_contract,
    is_default
  ) VALUES (
    NEW.id,
    'SPX 0DTE Primary Paper ($25k)',
    25000.00,
    25000.00,
    25000.00,
    'MIDPOINT',
    0.65,
    0.10,
    TRUE
  );

  INSERT INTO public.risk_rules (
    user_id,
    max_daily_loss,
    max_risk_per_trade,
    max_trades_per_day,
    max_simultaneous_positions,
    max_contracts_per_trade
  ) VALUES (
    NEW.id,
    1000.00,
    1500.00,
    6,
    4,
    5
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

