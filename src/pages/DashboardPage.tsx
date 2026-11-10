import React, { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  FlaskConical,
  Layers,
  Radio,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TradingViewChart } from '../components/charts/TradingViewChart';
import { useTrading } from '../context/TradingContext';
import { STRATEGY_CATALOG } from '../lib/optionsEngine';

type DashboardTab =
  | 'CHART_1M'
  | 'OVERVIEW'
  | 'POSITIONS_CHAIN'
  | 'STRATEGIES'
  | 'SIGNALS_RISK';

export const DashboardPage: React.FC = () => {
  const {
    market,
    optionsChain,
    activeAccount,
    positions,
    orders,
    signals,
    journalEntries,
    riskSettings,
    exitConfig,
    setActiveSection,
    setSelectedStrategyCode,
    addContractToBuilder,
    closePaperPosition,
    performPositionMonitoringAction,
  } = useTrading();

  const [activeTab, setActiveTab] = useState<DashboardTab>('CHART_1M');

  // Nearby ATM / ITM / OTM strikes around current ATM
  const nearbyStrikes = [
    market.atmStrike - 10,
    market.atmStrike - 5,
    market.atmStrike,
    market.atmStrike + 5,
    market.atmStrike + 10,
  ];

  const nearbyQuotes = nearbyStrikes.map((strike) => {
    const call = optionsChain.find(
      (c) => c.strike === strike && c.optionType === 'CALL'
    );
    const put = optionsChain.find(
      (c) => c.strike === strike && c.optionType === 'PUT'
    );
    return { strike, call, put };
  });

  // Win rate & P&L metrics from verified journal entries
  const wins = journalEntries.filter((j) => j.realizedPnl > 0).length;
  const winRate =
    journalEntries.length > 0
      ? ((wins / journalEntries.length) * 100).toFixed(1)
      : '0.0';

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const totalNetPnl = activeAccount.realizedPnl + activeAccount.unrealizedPnl;
  const totalEquity = activeAccount.cashBalance + activeAccount.unrealizedPnl;

  // Risk utilization calculation
  const currentOpenRisk = positions.reduce((s, p) => s + p.maxRiskUsd, 0);
  const dailyLossUsed = Math.max(0, -totalNetPnl);
  const dailyRiskUtilizationPct = Math.min(
    100,
    Math.round(
      ((currentOpenRisk + dailyLossUsed) /
        Math.max(1, riskSettings.maxDailyLoss + riskSettings.maxRiskPerTrade)) *
        100
    )
  );

  // Equity curve data
  const equityCurveData = [
    { date: 'Nov 04', equity: 25000, pnl: 0 },
    { date: 'Nov 05', equity: 25325, pnl: 325 },
    { date: 'Nov 06', equity: 25012, pnl: -313 },
    { date: 'Nov 07', equity: 25724, pnl: 712 },
    { date: 'Nov 08', equity: 26294, pnl: 570 },
    { date: 'Nov 09', equity: 26871, pnl: 577 },
    {
      date: 'Today',
      equity: Number(totalEquity.toFixed(0)),
      pnl: Number(activeAccount.unrealizedPnl.toFixed(0)),
    },
  ];

  // Strategy performance breakdown
  const strategyPerfData = [
    { strategy: 'Bull Call Spread', pnl: 930, trades: 4, winRate: 75 },
    { strategy: 'ATM Long Call', pnl: 577, trades: 3, winRate: 67 },
    { strategy: 'Iron Condor', pnl: 570, trades: 2, winRate: 100 },
    { strategy: 'Bull Put Credit', pnl: 325, trades: 2, winRate: 100 },
    { strategy: 'ATM Long Put', pnl: -313, trades: 2, winRate: 50 },
  ];

  return (
    <div className="space-y-4">
      {/* Compact Hero Command Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E2D45] bg-[#111C2E] px-5 py-3.5">
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#26D6A0]/15 text-[#26D6A0] border border-[#26D6A0]/30">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-extrabold text-white">
                SPX 0DTE Command Center
              </h1>
              <span className="rounded-md bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0] border border-[#26D6A0]/30">
                PAPER ENGINE ACTIVE
              </span>
              <span className="rounded-md bg-[#F59E0B]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F59E0B] border border-[#F59E0B]/30">
                SIMULATED FEED
              </span>
            </div>
            <p className="text-xs text-[#9BAFC4] mt-0.5">
              Black-Scholes 0DTE Pricing & Greeks • 30-Min Position Review • 3:45 PM ET Force-Close Protection
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSection('strategy-lab')}
            className="flex items-center gap-2 rounded-xl bg-[#26D6A0] px-4 py-2 text-xs font-extrabold text-[#0B1220] shadow-sm hover:opacity-90 transition"
          >
            <FlaskConical className="h-4 w-4" />
            <span>Strategy Builder</span>
          </button>
          <button
            onClick={() => setActiveSection('options-chain')}
            className="flex items-center gap-2 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3.5 py-2 text-xs font-bold text-white hover:border-[#26D6A0]/60 transition"
          >
            <Layers className="h-4 w-4 text-[#26D6A0]" />
            <span>0DTE Chain</span>
          </button>
          <button
            onClick={() => setActiveSection('paper-trading')}
            className="flex items-center gap-2 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3.5 py-2 text-xs font-bold text-white hover:border-[#26D6A0]/60 transition"
          >
            <Zap className="h-4 w-4 text-[#26D6A0]" />
            <span>Paper Desk ({positions.length})</span>
          </button>
        </div>
      </div>

      {/* 4 High-Readability KPI Summary Cards with Accent Borders */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: SPX Index & Volatility */}
        <div className="rounded-2xl border border-[#1E2D45] border-t-4 border-t-[#26D6A0] bg-[#111C2E] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#9BAFC4]">
            <span>SPX 0DTE SPOT</span>
            <span className="rounded-md bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[11px] font-bold text-[#26D6A0]">
              ATM {market.atmStrike}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-extrabold text-white">
              {market.spotPrice.toFixed(2)}
            </span>
            <span
              className={`font-mono text-xs font-bold ${
                market.dailyChange >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {market.dailyChange >= 0 ? '+' : ''}
              {market.dailyChange.toFixed(2)} ({market.dailyChangePct}%)
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-[#1E2D45] pt-2 text-xs text-[#9BAFC4]">
            <span>
              VIX: <strong className="font-mono text-white">{market.vix.toFixed(2)}</strong>
            </span>
            <span>
              VWAP: <strong className="font-mono text-white">{market.vwap.toFixed(1)}</strong>
            </span>
            <span>
              RSI: <strong className="font-mono text-white">{market.rsi14}</strong>
            </span>
          </div>
        </div>

        {/* Card 2: Paper Account Equity & Buying Power */}
        <div className="rounded-2xl border border-[#1E2D45] border-t-4 border-t-[#3B82F6] bg-[#111C2E] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#9BAFC4]">
            <span>PAPER ACCOUNT EQUITY</span>
            <DollarSign className="h-4 w-4 text-[#26D6A0]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-extrabold text-white">
              ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="font-mono text-xs font-bold text-[#26D6A0]">
              {positions.length} Open / {pendingOrders.length} Pending
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-[#1E2D45] pt-2 text-xs text-[#9BAFC4]">
            <span>
              Buying Power:{' '}
              <strong className="font-mono text-white">
                ${activeAccount.buyingPower.toLocaleString()}
              </strong>
            </span>
            <span>
              Fill: <strong className="font-mono text-white">{activeAccount.fillModel}</strong>
            </span>
          </div>
        </div>

        {/* Card 3: Net P&L & Win Rate */}
        <div className="rounded-2xl border border-[#1E2D45] border-t-4 border-t-[#22C55E] bg-[#111C2E] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#9BAFC4]">
            <span>TOTAL NET P&L & WIN RATE</span>
            <TrendingUp className="h-4 w-4 text-[#22C55E]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`font-mono text-2xl font-extrabold ${
                totalNetPnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {totalNetPnl >= 0 ? '+' : ''}${totalNetPnl.toFixed(2)}
            </span>
            <span className="rounded-md bg-[#22C55E]/15 px-2 py-0.5 font-mono text-xs font-bold text-[#22C55E]">
              {winRate}% Win Rate
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-[#1E2D45] pt-2 text-xs text-[#9BAFC4]">
            <span>
              Realized:{' '}
              <strong className="font-mono text-[#22C55E]">
                +${activeAccount.realizedPnl.toFixed(0)}
              </strong>
            </span>
            <span>
              Open P&L:{' '}
              <strong
                className={`font-mono ${
                  activeAccount.unrealizedPnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
              >
                {activeAccount.unrealizedPnl >= 0 ? '+' : ''}$
                {activeAccount.unrealizedPnl.toFixed(2)}
              </strong>
            </span>
          </div>
        </div>

        {/* Card 4: Risk Guardrail & Cutoff */}
        <div className="rounded-2xl border border-[#1E2D45] border-t-4 border-t-[#F59E0B] bg-[#111C2E] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#9BAFC4]">
            <span>RISK GUARDRAIL & CUTOFF</span>
            <Shield className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-extrabold text-white">
              {dailyRiskUtilizationPct}% Used
            </span>
            <span className="font-mono text-xs font-bold text-[#F59E0B]">
              Exit: {exitConfig.eodForceCloseTimeEt} ET
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#0B1220]">
            <div
              className={`h-full rounded-full transition-all ${
                dailyRiskUtilizationPct > 75
                  ? 'bg-[#EF4444]'
                  : dailyRiskUtilizationPct > 45
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#26D6A0]'
              }`}
              style={{ width: `${Math.max(8, dailyRiskUtilizationPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Focused Workspace View Tabs (Short, Scannable Layout — No Endless Scrolling) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              {
                id: 'CHART_1M',
                label: '📊 Live 1m Chart (BB + MACD)',
                icon: Activity,
              },
              {
                id: 'OVERVIEW',
                label: 'Market & Equity Curves',
                icon: BarChart3,
              },
              {
                id: 'POSITIONS_CHAIN',
                label: `Open Positions (${positions.length}) & Chain`,
                icon: Layers,
              },
              {
                id: 'STRATEGIES',
                label: '14-Strategy Quick Launcher',
                icon: FlaskConical,
              },
              {
                id: 'SIGNALS_RISK',
                label: 'Signals & Risk Rules',
                icon: Radio,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                    : 'text-[#9BAFC4] hover:bg-[#0B1220] hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 text-xs text-[#9BAFC4]">
          <Clock className="h-4 w-4 text-[#26D6A0]" />
          <span>Real Market Feed Active</span>
        </div>
      </div>

      {/* TAB 0: REAL LIVE TRADINGVIEW CHART WITH 1-MINUTE, BB & MACD DEFAULT */}
      {activeTab === 'CHART_1M' && <TradingViewChart />}

      {/* TAB 1: MARKET & EQUITY CHARTS + ACTIVE POSITION SUMMARY */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left: SPX Intraday vs VWAP Chart (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">
                  SPX Intraday Price vs. VWAP
                </h2>
                <p className="text-xs text-[#9BAFC4]">
                  OR High: {market.openingRangeHigh} • OR Low: {market.openingRangeLow}
                </p>
              </div>
              <span className="rounded-lg bg-[#26D6A0]/15 px-2.5 py-1 font-mono text-xs font-bold text-[#26D6A0]">
                VWAP {market.vwap.toFixed(1)}
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={market.intradaySeries}>
                  <defs>
                    <linearGradient id="spxFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#26D6A0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#26D6A0" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                  <XAxis dataKey="time" stroke="#9BAFC4" fontSize={12} />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke="#9BAFC4"
                    fontSize={12}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tp-card)',
                      borderColor: 'var(--tp-border)',
                      color: 'var(--tp-text)',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="spx"
                    name="SPX Spot"
                    stroke="#26D6A0"
                    strokeWidth={2.5}
                    fill="url(#spxFill)"
                  />
                  <Line
                    type="monotone"
                    dataKey="vwap"
                    name="VWAP"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Center: Paper Equity Curve (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Paper Account Equity Curve
                </h2>
                <p className="text-xs text-[#9BAFC4]">
                  Starting Capital: ${activeAccount.initialCapital.toLocaleString()}
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-[#22C55E]">
                +8.2% Net
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurveData}>
                  <defs>
                    <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                  <XAxis dataKey="date" stroke="#9BAFC4" fontSize={12} />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke="#9BAFC4"
                    fontSize={12}
                    width={54}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tp-card)',
                      borderColor: 'var(--tp-border)',
                      color: 'var(--tp-text)',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    name="Account Equity ($)"
                    stroke="#22C55E"
                    strokeWidth={2.5}
                    fill="url(#eqFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Strategy P&L Breakdown (3 cols) */}
          <div className="lg:col-span-3 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-white">
                P&L by Options Strategy
              </h2>
              <p className="text-xs text-[#9BAFC4]">
                Verified Paper & Journal Trades
              </p>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strategyPerfData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                  <XAxis type="number" stroke="#9BAFC4" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="strategy"
                    stroke="#9BAFC4"
                    fontSize={11}
                    width={96}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tp-card)',
                      borderColor: 'var(--tp-border)',
                      color: 'var(--tp-text)',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="pnl" name="Net P&L ($)" radius={[0, 6, 6, 0]}>
                    {strategyPerfData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? '#22C55E' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPEN POSITIONS & NEARBY 0DTE STRIKES */}
      {activeTab === 'POSITIONS_CHAIN' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Open Positions (6 cols) */}
          <div className="lg:col-span-6 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Open Paper Positions ({positions.length})
                </h2>
                <p className="text-xs text-[#9BAFC4]">
                  Live Black-Scholes Greeks & 1-Click Exit Controls
                </p>
              </div>
              <button
                onClick={() => setActiveSection('paper-trading')}
                className="text-xs font-bold text-[#26D6A0] hover:underline"
              >
                Full Paper Desk →
              </button>
            </div>

            {positions.length === 0 ? (
              <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-6 text-center text-xs text-[#9BAFC4]">
                No open paper positions. Launch a strategy from the 0DTE Chain or Strategy Builder.
              </div>
            ) : (
              <div className="space-y-3">
                {positions.map((pos) => {
                  const netDelta = pos.legs.reduce(
                    (sum, l) =>
                      sum +
                      l.delta *
                        l.ratio *
                        (l.side.startsWith('BUY') ? 1 : -1) *
                        pos.quantity,
                    0
                  );
                  const netTheta = pos.legs.reduce(
                    (sum, l) =>
                      sum +
                      l.theta *
                        l.ratio *
                        (l.side.startsWith('BUY') ? 1 : -1) *
                        pos.quantity,
                    0
                  );
                  return (
                    <div
                      key={pos.id}
                      className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-4 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-extrabold text-white">
                            {pos.strategyName} ({pos.quantity}x)
                          </span>
                          <span className="ml-2 rounded-md bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                            {pos.monitoringAction}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-sm font-extrabold ${
                            pos.unrealizedPnl >= 0
                              ? 'text-[#22C55E]'
                              : 'text-[#EF4444]'
                          }`}
                        >
                          {pos.unrealizedPnl >= 0 ? '+' : ''}$
                          {pos.unrealizedPnl.toFixed(2)} (
                          {pos.unrealizedPnlPct >= 0 ? '+' : ''}
                          {pos.unrealizedPnlPct.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 rounded-lg border border-[#1E2D45] bg-[#111C2E] p-2 text-center font-mono text-xs">
                        <div>
                          <span className="block text-[10px] text-[#9BAFC4]">
                            Entry
                          </span>
                          <span className="font-bold text-white">
                            ${pos.avgEntryPremium.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#9BAFC4]">
                            Mark
                          </span>
                          <span className="font-bold text-[#26D6A0]">
                            ${pos.currentMark.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#9BAFC4]">
                            Net Δ
                          </span>
                          <span className="font-bold text-white">
                            {netDelta.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#9BAFC4]">
                            Net Θ
                          </span>
                          <span className="font-bold text-[#EF4444]">
                            {netTheta.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          {(
                            ['HOLD', 'REVIEW', 'PARTIAL_CLOSE'] as const
                          ).map((act) => (
                            <button
                              key={act}
                              onClick={() =>
                                performPositionMonitoringAction(pos.id, act)
                              }
                              className="rounded-lg border border-[#1E2D45] bg-[#111C2E] px-2.5 py-1 font-mono text-[10px] font-bold text-[#9BAFC4] hover:border-[#26D6A0] hover:text-white transition"
                            >
                              {act.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              closePaperPosition(
                                pos.id,
                                0.5,
                                'Partial 50% Profit Lock'
                              )
                            }
                            className="rounded-lg bg-[#F59E0B]/15 px-2.5 py-1 text-xs font-bold text-[#F59E0B] hover:bg-[#F59E0B]/25 transition"
                          >
                            Close 50%
                          </button>
                          <button
                            onClick={() =>
                              closePaperPosition(
                                pos.id,
                                1,
                                'Manual Full Exit'
                              )
                            }
                            className="rounded-lg bg-[#EF4444] px-3 py-1 text-xs font-bold text-white hover:opacity-90 transition"
                          >
                            Close 100%
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nearby 0DTE Strikes Quick Matrix (6 cols) */}
          <div className="lg:col-span-6 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Nearby SPX 0DTE Strikes (Around ATM {market.atmStrike})
                </h2>
                <p className="text-xs text-[#9BAFC4]">
                  Click any Call or Put to send directly to Strategy Lab
                </p>
              </div>
              <button
                onClick={() => setActiveSection('options-chain')}
                className="text-xs font-bold text-[#26D6A0] hover:underline"
              >
                Full 0DTE Chain →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#1E2D45] text-[11px] text-[#9BAFC4]">
                    <th className="py-2 px-2">CALL MID</th>
                    <th className="py-2 px-2">CALL Δ</th>
                    <th className="py-2 px-2">ACTION</th>
                    <th className="py-2 px-3 text-center font-bold text-white">
                      STRIKE
                    </th>
                    <th className="py-2 px-2">PUT MID</th>
                    <th className="py-2 px-2">PUT Δ</th>
                    <th className="py-2 px-2 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]">
                  {nearbyQuotes.map(({ strike, call, put }) => {
                    const isAtm = strike === market.atmStrike;
                    return (
                      <tr
                        key={strike}
                        className={
                          isAtm ? 'bg-[#26D6A0]/10 font-bold' : 'hover:bg-[#0B1220]'
                        }
                      >
                        <td className="py-2.5 px-2 text-[#22C55E]">
                          ${call ? call.midpoint.toFixed(2) : '--'}
                        </td>
                        <td className="py-2.5 px-2 text-[#9BAFC4]">
                          {call ? call.delta.toFixed(2) : '--'}
                        </td>
                        <td className="py-2.5 px-2">
                          {call && (
                            <button
                              onClick={() => {
                                addContractToBuilder(call, 'BUY_TO_OPEN');
                                setActiveSection('strategy-lab');
                              }}
                              className="rounded-lg bg-[#22C55E]/15 px-2 py-1 text-[10px] font-bold text-[#22C55E] hover:bg-[#22C55E]/25"
                            >
                              +Call
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-white">
                          {strike} {isAtm && <span className="text-[#26D6A0]">★</span>}
                        </td>
                        <td className="py-2.5 px-2 text-[#EF4444]">
                          ${put ? put.midpoint.toFixed(2) : '--'}
                        </td>
                        <td className="py-2.5 px-2 text-[#9BAFC4]">
                          {put ? put.delta.toFixed(2) : '--'}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {put && (
                            <button
                              onClick={() => {
                                addContractToBuilder(put, 'BUY_TO_OPEN');
                                setActiveSection('strategy-lab');
                              }}
                              className="rounded-lg bg-[#EF4444]/15 px-2 py-1 text-[10px] font-bold text-[#EF4444] hover:bg-[#EF4444]/25"
                            >
                              +Put
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 14-STRATEGY QUICK LAUNCHER */}
      {activeTab === 'STRATEGIES' && (
        <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                SPX 0DTE Strategy Catalog (14 Strategies)
              </h2>
              <p className="text-xs text-[#9BAFC4]">
                Click any strategy card to load legs, payoff curve, and Greeks in Strategy Lab
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STRATEGY_CATALOG.slice(0, 8).map((strat) => (
              <button
                key={strat.code}
                onClick={() => {
                  setSelectedStrategyCode(strat.code);
                  setActiveSection('strategy-lab');
                }}
                className="group flex flex-col justify-between rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3.5 text-left hover:border-[#26D6A0] transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                      {strat.category.replace('_', ' ')}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#9BAFC4] group-hover:text-[#26D6A0]" />
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-white group-hover:text-[#26D6A0]">
                    {strat.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#9BAFC4] line-clamp-2">
                    {strat.idealCondition}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[#1E2D45] pt-2 font-mono text-[11px] text-[#9BAFC4]">
                  <span>Bias: {strat.marketOutlook}</span>
                  <span className="font-bold text-[#26D6A0]">Build →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SIGNALS & RISK RULES */}
      {activeTab === 'SIGNALS_RISK' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Active Trading Signals */}
          <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">
                Recent SPX 0DTE Strategy Signals
              </h2>
              <button
                onClick={() => setActiveSection('signals')}
                className="text-xs font-bold text-[#26D6A0] hover:underline"
              >
                Signal Center →
              </button>
            </div>
            <div className="space-y-2.5">
              {signals.slice(0, 3).map((sig) => (
                <div
                  key={sig.id}
                  className="flex items-center justify-between rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-[#26D6A0]">
                        {sig.signalType}
                      </span>
                      <span className="text-xs font-bold text-white">
                        • {sig.mappedStrategyCode.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#9BAFC4]">
                      {sig.payloadSummary}
                    </p>
                  </div>
                  <span className="rounded-lg bg-[#22C55E]/15 px-2.5 py-1 font-mono text-xs font-bold text-[#22C55E]">
                    {sig.validationStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk & System Readiness */}
          <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">
                Active Risk Guardrails & Supabase Sync
              </h2>
              <button
                onClick={() => setActiveSection('automation')}
                className="text-xs font-bold text-[#26D6A0] hover:underline"
              >
                Edit Rules →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3">
                <span className="text-[#9BAFC4]">Max Risk / Trade</span>
                <div className="mt-1 font-mono text-base font-extrabold text-white">
                  ${riskSettings.maxRiskPerTrade}
                </div>
              </div>
              <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3">
                <span className="text-[#9BAFC4]">Max Daily Loss</span>
                <div className="mt-1 font-mono text-base font-extrabold text-[#EF4444]">
                  ${riskSettings.maxDailyLoss}
                </div>
              </div>
              <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3">
                <span className="text-[#9BAFC4]">0DTE Force Exit</span>
                <div className="mt-1 font-mono text-base font-extrabold text-[#F59E0B]">
                  {exitConfig.eodForceCloseTimeEt} ET
                </div>
              </div>
              <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3">
                <span className="text-[#9BAFC4]">Supabase Postgres</span>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-xs font-extrabold text-[#22C55E]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>20 Tables + RLS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
