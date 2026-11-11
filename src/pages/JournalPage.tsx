import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Edit3,
  FileUp,
  Flame,
  Plus,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { DisciplineMood, JournalEntry } from '../types/trading';

const SAMPLE_MULTI_LEG_CSV = `order_group_id,trade_date,symbol,option_type,strike,expiration,contracts,entry_price,exit_price,fees,strategy,notes
ORD-CSV-501,2026-11-09,SPX,CALL,5980,2026-11-09,2,9.20,12.40,1.30,Bull Call Debit Spread,Long ATM leg execution
ORD-CSV-501,2026-11-09,SPX,CALL,5995,2026-11-09,2,3.40,2.10,1.30,Bull Call Debit Spread,Short OTM leg execution
ORD-CSV-502,2026-11-09,SPX,PUT,5970,2026-11-09,1,6.80,8.95,0.65,ATM Long Put,Single leg bearish momentum execution`;

export const JournalPage: React.FC = () => {
  const {
    journalEntries,
    addManualJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    adjustAccountBalance,
    activeAccount,
    dailyProfitRecords,
    upsertDailyProfitRecord,
    deleteDailyProfitRecord,
    importCsvExecutions,
  } = useTrading();

  const [activeTab, setActiveTab] = useState<
    'CALENDAR_MONTH' | 'HYPOTHETICAL_CONSISTENCY' | 'DAILY_PROFIT' | 'TRADES_LEDGER' | 'CSV_IMPORT'
  >('CALENDAR_MONTH');

  // Month navigation for Calendar View
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11

  // Hypothetical Consistency Parameters
  const [targetBaseHitPerDay, setTargetBaseHitPerDay] = useState<number>(200); // e.g. $200 / day base hit
  const [estimatedWinRatePct, setEstimatedWinRatePct] = useState<number>(80); // 80% disciplined win rate
  const [averageLossPerDay, setAverageLossPerDay] = useState<number>(100); // Strict stop loss
  const [strictSingleContractRule, setStrictSingleContractRule] = useState<boolean>(true);

  // Daily Profit / Adjustment Form State
  const todayStr = today.toISOString().slice(0, 10);
  const [dpDate, setDpDate] = useState(todayStr);
  const [dpManualProfit, setDpManualProfit] = useState<number>(250);
  const [dpAccountAdjust, setDpAccountAdjust] = useState<number>(0);
  const [dpBrokerSource, setDpBrokerSource] = useState<
    'ROBINHOOD_LIVE' | 'PAPER_ENGINE' | 'COMBINED'
  >('COMBINED');
  const [dpTradesCount, setDpTradesCount] = useState<number>(1);
  const [dpMood, setDpMood] = useState<DisciplineMood>('CALM_DISCIPLINED');
  const [dpFollowedPlan, setDpFollowedPlan] = useState<boolean>(true);
  const [dpStoppedAfter830, setDpStoppedAfter830] = useState<boolean>(true);
  const [dpNotes, setDpNotes] = useState<string>('');
  const [syncToBalance, setSyncToBalance] = useState<boolean>(false);

  // Inline Trade Edit State
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [editPnlVal, setEditPnlVal] = useState<number>(0);
  const [editNotesVal, setEditNotesVal] = useState<string>('');

  // Manual Individual Trade Form State
  const [showManualTradeForm, setShowManualTradeForm] = useState(false);
  const [tradeDate, setTradeDate] = useState(todayStr);
  const [symbol, setSymbol] = useState('SPX');
  const [strategy, setStrategy] = useState('Bull Call Debit Spread');
  const [strikeSummary, setStrikeSummary] = useState('5985C / 6000C');
  const [contracts, setContracts] = useState(1);
  const [entryPrice, setEntryPrice] = useState(6.4);
  const [exitPrice, setExitPrice] = useState(8.5);
  const [manualOverridePnl, setManualOverridePnl] = useState<string>('');
  const [notes, setNotes] = useState('');

  // CSV State
  const [csvInput, setCsvInput] = useState(SAMPLE_MULTI_LEG_CSV);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Save Daily Profit / Manual Adjustment
  const handleSaveDailyProfit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertDailyProfitRecord({
      tradeDate: dpDate,
      manualProfitUsd: Number(dpManualProfit),
      accountAdjustmentUsd: Number(dpAccountAdjust),
      brokerSource: dpBrokerSource,
      tradesCount: Number(dpTradesCount),
      dominantMood: dpMood,
      followedPlan: dpFollowedPlan,
      notes:
        dpNotes.trim() ||
        `Stopped after 8:30 AM PT: ${dpStoppedAfter830 ? 'Yes' : 'No'} | Strict 1-Contract rule respected.`,
    });

    if (syncToBalance && (dpManualProfit !== 0 || dpAccountAdjust !== 0)) {
      adjustAccountBalance(
        activeAccount.id,
        Number(dpManualProfit) + Number(dpAccountAdjust),
        `Daily P&L / Adjustment for ${dpDate}`
      );
    }
    setDpNotes('');
  };

  // Save Individual Manual Trade
  const handleManualTradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fees = Number((contracts * 1.3).toFixed(2));
    const computedPnl = Number(
      ((exitPrice - entryPrice) * 100 * contracts - fees).toFixed(2)
    );
    const finalPnl =
      manualOverridePnl.trim() !== ''
        ? Number(manualOverridePnl)
        : computedPnl;
    const returnPct = Number(
      (((exitPrice - entryPrice) / Math.max(0.05, entryPrice)) * 100).toFixed(2)
    );

    addManualJournalEntry({
      tradeDate,
      symbol,
      instrumentType: 'CALL',
      optionType: 'CALL',
      strikeSummary,
      expirationDate: tradeDate,
      contracts,
      entryPrice,
      exitPrice,
      entryTime: '06:35 PT / 09:35 ET',
      exitTime: '07:45 PT / 10:45 ET',
      fees,
      slippage: 10,
      realizedPnl: finalPnl,
      returnPct,
      strategy,
      moneyness: 'ATM',
      tradingMode: 'LIVE',
      entryReason: 'Morning Power Hour Entry (Strict 1-Contract)',
      exitReason: 'Target Locked / Stopped Before Mid-Day Chop',
      notes: notes || 'Logged manually in TradePilot Journal.',
      orderIds: [`ORD-MAN-${Date.now()}`],
      executionIds: [`EXEC-MAN-${Date.now()}`],
      legsCount: 1,
      isVerified: true,
    });
    setShowManualTradeForm(false);
    setManualOverridePnl('');
    setNotes('');
  };

  const startEditTrade = (t: JournalEntry) => {
    setEditingTradeId(t.id);
    setEditPnlVal(t.realizedPnl);
    setEditNotesVal(t.notes);
  };

  const saveEditTrade = (id: string) => {
    updateJournalEntry(id, {
      realizedPnl: Number(editPnlVal),
      notes: editNotesVal,
    });
    setEditingTradeId(null);
  };

  // Helper: Month Data for Calendar
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('default', { month: 'long' });

  // P&L lookup by Date string YYYY-MM-DD
  const getDayMetrics = (dayNum: number) => {
    const formatted = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayTrades = journalEntries.filter((j) => j.tradeDate === formatted);
    const dayTradePnl = dayTrades.reduce((sum, j) => sum + j.realizedPnl, 0);
    const manualRec = dailyProfitRecords.find((r) => r.tradeDate === formatted);
    const manualPnl = manualRec ? manualRec.manualProfitUsd + manualRec.accountAdjustmentUsd : 0;
    const totalNet = Number((dayTradePnl + manualPnl).toFixed(2));
    const count = dayTrades.length + (manualRec ? manualRec.tradesCount : 0);
    const hasData = dayTrades.length > 0 || Boolean(manualRec);
    return { formatted, totalNet, count, hasData, manualRec };
  };

  // Month Totals
  let monthGreenDays = 0;
  let monthRedDays = 0;
  let monthTotalPnl = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const { totalNet, hasData } = getDayMetrics(d);
    if (hasData) {
      monthTotalPnl += totalNet;
      if (totalNet > 0) monthGreenDays++;
      else if (totalNet < 0) monthRedDays++;
    }
  }

  // Hypothetical Consistency Calculations
  // Trading days per month = ~21 days. Trading days per year = ~252 days.
  const tradingDaysPerMonth = 21;
  const remainingDaysThisMonth = Math.max(1, 21 - (monthGreenDays + monthRedDays));
  const expectedValuePerDay = (estimatedWinRatePct / 100) * targetBaseHitPerDay - ((100 - estimatedWinRatePct) / 100) * averageLossPerDay;
  const projectedMonthEndPnl = monthTotalPnl + expectedValuePerDay * remainingDaysThisMonth;
  const projectedYearlyConsistencyPnl = expectedValuePerDay * 252;

  return (
    <div className="space-y-4">
      {/* 1. TOP ANCHOR: STRICT RULES & POWER HOURS PROTOCOL */}
      <div className="rounded-2xl border-2 border-[#26D6A0]/50 bg-[#111C2E] p-4 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 max-w-4xl">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#26D6A0]/15 text-[#26D6A0] border border-[#26D6A0]/40">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-extrabold text-white">
                  Consistency Calendar & The 8:30 AM / Strict 1-Quantity Rule
                </h1>
                <span className="rounded-md bg-[#EF4444]/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#EF4444]">
                  MANDATORY DISCIPLINE
                </span>
                <span className="rounded-md bg-[#26D6A0]/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                  STRICT 1 CONTRACT
                </span>
              </div>
              <p className="mt-1 text-xs text-[#9BAFC4] leading-relaxed">
                <strong className="text-white">Golden Consistency Rule:</strong>{' '}
                <span className="text-[#26D6A0] font-bold">1. Trade ONLY 1 contract.</span> Never oversize. Base hits build accounts. <br />
                <span className="text-[#F59E0B] font-bold">2. STOP TRADING at 8:30 AM PT (11:30 AM ET).</span> If you are green, lock it and walk away. If you miss the morning move, <span className="underline font-bold text-[#EF4444]">DO NOT CHOP</span> through lunch—wait for the <strong>Afternoon Power Hour (12:30 PM – 1:45 PM PT / 3:30 PM – 3:45 PM ET)</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDpDate(todayStr);
                setActiveTab('DAILY_PROFIT');
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#26D6A0] px-4 py-2 text-xs font-extrabold text-[#0B1220] shadow-md hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Log Today’s Result</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION VIEW TABS */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('CALENDAR_MONTH')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'CALENDAR_MONTH'
                ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                : 'text-[#9BAFC4] hover:bg-[#0B1220] hover:text-white'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>📅 Daily Calendar View</span>
          </button>

          <button
            onClick={() => setActiveTab('HYPOTHETICAL_CONSISTENCY')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'HYPOTHETICAL_CONSISTENCY'
                ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                : 'text-[#9BAFC4] hover:bg-[#0B1220] hover:text-white'
            }`}
          >
            <Target className="h-4 w-4" />
            <span>📈 Consistency Projections (Month / Year)</span>
          </button>

          <button
            onClick={() => setActiveTab('DAILY_PROFIT')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'DAILY_PROFIT'
                ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                : 'text-[#9BAFC4] hover:bg-[#0B1220] hover:text-white'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Daily Profit / Balance Adjuster</span>
          </button>

          <button
            onClick={() => setActiveTab('TRADES_LEDGER')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'TRADES_LEDGER'
                ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                : 'text-[#9BAFC4] hover:bg-[#0B1220] hover:text-white'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Individual Trades ({journalEntries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CSV_IMPORT')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'CSV_IMPORT'
                ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                : 'text-[#9BAFC4] hover:bg-[#0B1220] hover:text-white'
            }`}
          >
            <FileUp className="h-4 w-4" />
            <span>CSV Import</span>
          </button>
        </div>

        <div className="flex items-center gap-3 px-3 text-xs">
          <span className="text-[#9BAFC4]">Month Total:</span>
          <span
            className={`font-mono text-sm font-extrabold ${
              monthTotalPnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
            }`}
          >
            {monthTotalPnl >= 0 ? '+' : ''}${monthTotalPnl.toFixed(2)}
          </span>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE DAILY CALENDAR VIEW */}
      {activeTab === 'CALENDAR_MONTH' && (
        <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-4">
          {/* Calendar Header with Month Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2D45] pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear((y) => y - 1);
                  } else {
                    setCurrentMonth((m) => m - 1);
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="font-mono text-base font-extrabold text-white">
                {monthName} {currentYear}
              </h2>
              <button
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear((y) => y + 1);
                  } else {
                    setCurrentMonth((m) => m + 1);
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Monthly Summary Badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/15 px-3 py-1 font-mono font-bold text-[#22C55E]">
                🟢 {monthGreenDays} Green Days
              </span>
              <span className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/15 px-3 py-1 font-mono font-bold text-[#EF4444]">
                🔴 {monthRedDays} Red Days
              </span>
              <span className="rounded-xl border border-[#26D6A0]/40 bg-[#0B1220] px-3 py-1 font-mono font-bold text-[#26D6A0]">
                Win Rate:{' '}
                {monthGreenDays + monthRedDays > 0
                  ? ((monthGreenDays / (monthGreenDays + monthRedDays)) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
          </div>

          {/* Calendar 7-Day Grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="py-1.5 font-bold uppercase tracking-wider text-[#9BAFC4]"
              >
                {d}
              </div>
            ))}

            {/* Empty Offset Days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-24 rounded-xl border border-[#1E2D45]/30 bg-[#0B1220]/30 opacity-30"
              />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const { formatted, totalNet, count, hasData, manualRec } = getDayMetrics(dayNum);
              const isToday =
                today.getDate() === dayNum &&
                today.getMonth() === currentMonth &&
                today.getFullYear() === currentYear;

              const isWeekend = (firstDayOfMonth + i) % 7 === 0 || (firstDayOfMonth + i) % 7 === 6;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => {
                    setDpDate(formatted);
                    setActiveTab('DAILY_PROFIT');
                  }}
                  className={`group relative flex flex-col justify-between h-24 p-2.5 rounded-xl border transition cursor-pointer ${
                    isToday
                      ? 'border-[#26D6A0] bg-[#26D6A0]/10 shadow-sm'
                      : hasData
                        ? totalNet >= 0
                          ? 'border-[#22C55E]/40 bg-[#22C55E]/10 hover:border-[#22C55E]'
                          : 'border-[#EF4444]/40 bg-[#EF4444]/10 hover:border-[#EF4444]'
                        : isWeekend
                          ? 'border-[#1E2D45]/40 bg-[#0B1220]/50'
                          : 'border-[#1E2D45] bg-[#0B1220] hover:border-[#26D6A0]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-xs font-bold ${
                        isToday ? 'text-[#26D6A0]' : 'text-white'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {hasData && (
                      <span className="font-mono text-[10px] text-[#9BAFC4]">
                        {count}t
                      </span>
                    )}
                  </div>

                  {hasData ? (
                    <div className="space-y-0.5 text-left">
                      <div
                        className={`font-mono text-xs sm:text-sm font-extrabold ${
                          totalNet >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                        }`}
                      >
                        {totalNet >= 0 ? '+' : ''}${totalNet.toFixed(0)}
                      </div>
                      <div className="text-[10px] text-[#9BAFC4] truncate">
                        {manualRec?.dominantMood.replace(/_/g, ' ') || 'Disciplined'}
                      </div>
                    </div>
                  ) : (
                    !isWeekend && (
                      <div className="text-[10px] text-[#9BAFC4]/50 group-hover:text-[#26D6A0]">
                        + Log Day
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-[#9BAFC4] pt-2 border-t border-[#1E2D45]">
            <span>💡 Click any calendar cell to edit or log daily results.</span>
            <span>Stop after 8:30 AM PT / 11:30 AM ET • Strict 1-Quantity Rule</span>
          </div>
        </div>
      )}

      {/* TAB 2: HYPOTHETICAL CONSISTENCY MODEL (REST OF MONTH & YEAR) */}
      {activeTab === 'HYPOTHETICAL_CONSISTENCY' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-4">
            <div className="flex items-center gap-3 border-b border-[#1E2D45] pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#26D6A0]/15 text-[#26D6A0]">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white">
                  Hypothetical Consistency Math: The Power of Strict 1-Quantity & Morning-Only Trading
                </h2>
                <p className="text-xs text-[#9BAFC4]">
                  See why you do NOT need to gamble or clear all debt in one trade. Consistent single-contract base hits compound dramatically over 250 trading days.
                </p>
              </div>
            </div>

            {/* Inputs: Target Base Hit & Strict Stop Loss */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-4 text-xs">
              <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3.5">
                <label className="block text-[#9BAFC4] mb-1 font-semibold">
                  Target Daily Base Hit ($)
                </label>
                <input
                  type="number"
                  step="25"
                  value={targetBaseHitPerDay}
                  onChange={(e) => setTargetBaseHitPerDay(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#111C2E] px-3 py-2 font-mono font-bold text-white"
                />
                <span className="text-[10px] text-[#26D6A0] mt-1 block">
                  1 contract @ +20% on $1,000 spread = $200
                </span>
              </div>

              <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3.5">
                <label className="block text-[#9BAFC4] mb-1 font-semibold">
                  Disciplined Win Rate (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="95"
                  value={estimatedWinRatePct}
                  onChange={(e) => setEstimatedWinRatePct(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#111C2E] px-3 py-2 font-mono font-bold text-white"
                />
                <span className="text-[10px] text-[#9BAFC4] mt-1 block">
                  Morning power hour A+ setups average 75-85%
                </span>
              </div>

              <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3.5">
                <label className="block text-[#9BAFC4] mb-1 font-semibold">
                  Strict Max Loss per Red Day ($)
                </label>
                <input
                  type="number"
                  step="25"
                  value={averageLossPerDay}
                  onChange={(e) => setAverageLossPerDay(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#111C2E] px-3 py-2 font-mono font-bold text-[#EF4444]"
                />
                <span className="text-[10px] text-[#EF4444] mt-1 block">
                  Cut loser early! Never average down.
                </span>
              </div>

              <div className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3.5">
                <label className="block text-[#9BAFC4] mb-1 font-semibold">
                  Single-Contract Rule
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={strictSingleContractRule}
                    onChange={(e) => setStrictSingleContractRule(e.target.checked)}
                    className="accent-[#26D6A0] h-4 w-4"
                  />
                  <span className="text-white font-bold">1 Contract Strict</span>
                </div>
                <span className="text-[10px] text-[#26D6A0] mt-1 block">
                  Zero oversized gambles
                </span>
              </div>
            </div>

            {/* Projections Matrix */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[#1E2D45] border-t-4 border-t-[#26D6A0] bg-[#0B1220] p-4">
                <span className="text-xs font-bold text-[#9BAFC4]">
                  EXPECTED VALUE PER TRADING DAY
                </span>
                <div className="mt-2 font-mono text-2xl font-extrabold text-[#26D6A0]">
                  +${expectedValuePerDay.toFixed(2)} / Day
                </div>
                <p className="mt-2 text-[11px] text-[#9BAFC4] leading-relaxed">
                  Calculated from: ({estimatedWinRatePct}% × ${targetBaseHitPerDay}) - ({100 - estimatedWinRatePct}% × ${averageLossPerDay}).
                </p>
              </div>

              <div className="rounded-xl border border-[#1E2D45] border-t-4 border-t-[#3B82F6] bg-[#0B1220] p-4">
                <span className="text-xs font-bold text-[#9BAFC4]">
                  PROJECTED REST OF MONTH P&L
                </span>
                <div className="mt-2 font-mono text-2xl font-extrabold text-white">
                  ${projectedMonthEndPnl.toFixed(2)}
                </div>
                <p className="mt-2 text-[11px] text-[#9BAFC4] leading-relaxed">
                  Current logged (${monthTotalPnl.toFixed(0)}) + {remainingDaysThisMonth} remaining trading days × ${expectedValuePerDay.toFixed(0)}.
                </p>
              </div>

              <div className="rounded-xl border border-[#1E2D45] border-t-4 border-t-[#22C55E] bg-[#0B1220] p-4">
                <span className="text-xs font-bold text-[#9BAFC4]">
                  ANNUAL HYPOTHETICAL CONSISTENCY (252 DAYS)
                </span>
                <div className="mt-2 font-mono text-2xl font-extrabold text-[#22C55E]">
                  +${projectedYearlyConsistencyPnl.toLocaleString('en-US', { maximumFractionDigits: 0 })} / Year
                </div>
                <p className="mt-2 text-[11px] text-[#9BAFC4] leading-relaxed">
                  Trading <strong>JUST 1 CONTRACT</strong> with strict morning exits. You never need to gamble or clear all debt in one day!
                </p>
              </div>
            </div>
          </div>

          {/* Golden Rules Checklist */}
          <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-white">
              The Two Golden Rules to Achieve This Consistency
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-xs">
              <div className="rounded-xl border border-[#26D6A0]/40 bg-[#0B1220] p-4 space-y-1.5">
                <div className="flex items-center gap-2 font-extrabold text-[#26D6A0]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Rule 1: Strict One-Quantity Rule</span>
                </div>
                <p className="text-[#9BAFC4] leading-relaxed">
                  Never buy 5, 10, or 20 contracts trying to make up for a red day. Oversizing creates anxiety, causes you to panic-sell dips, and blows accounts. One contract is completely stress-free.
                </p>
              </div>

              <div className="rounded-xl border border-[#F59E0B]/40 bg-[#0B1220] p-4 space-y-1.5">
                <div className="flex items-center gap-2 font-extrabold text-[#F59E0B]">
                  <Clock className="h-4 w-4" />
                  <span>Rule 2: Stop After 8:30 AM PT (11:30 AM ET)</span>
                </div>
                <p className="text-[#9BAFC4] leading-relaxed">
                  The clean morning momentum ends by 8:30 AM PT. Mid-day is institutional premium collection chop. If you are green, lock it. If you need a trade, wait until the <strong>Afternoon Power Hour (12:30 PM PT / 3:30 PM ET)</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAILY PROFIT & MANUAL ADJUSTMENT FORM */}
      {activeTab === 'DAILY_PROFIT' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Form */}
          <form
            onSubmit={handleSaveDailyProfit}
            className="lg:col-span-5 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-[#1E2D45] pb-2.5">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#26D6A0]" />
                <h2 className="text-sm font-extrabold text-white">
                  Log / Adjust Daily Profit Manually
                </h2>
              </div>
              <span className="rounded-md bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                DAILY LEDGER
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#9BAFC4] mb-1">
                  Trading Date
                </label>
                <input
                  type="date"
                  value={dpDate}
                  onChange={(e) => setDpDate(e.target.value)}
                  className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 font-mono text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#9BAFC4] mb-1">
                  Broker / Source
                </label>
                <select
                  value={dpBrokerSource}
                  onChange={(e) =>
                    setDpBrokerSource(
                      e.target.value as 'ROBINHOOD_LIVE' | 'PAPER_ENGINE' | 'COMBINED'
                    )
                  }
                  className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-white"
                >
                  <option value="COMBINED">Combined (Live + Paper)</option>
                  <option value="ROBINHOOD_LIVE">Robinhood Live Account</option>
                  <option value="PAPER_ENGINE">Paper Trading Desk</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#9BAFC4] mb-1">
                  Manual Profit / Loss ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dpManualProfit}
                  onChange={(e) => setDpManualProfit(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 font-mono font-bold text-white"
                  placeholder="e.g. 250 or -100"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#9BAFC4] mb-1">
                  Cash Adjustment ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dpAccountAdjust}
                  onChange={(e) => setDpAccountAdjust(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 font-mono text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#9BAFC4] mb-1">
                  Quantity (Strict 1 Rule)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1}
                  value={dpTradesCount}
                  onChange={(e) => setDpTradesCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#26D6A0]/50 bg-[#0B1220] px-3 py-2 font-mono font-bold text-[#26D6A0]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#9BAFC4] mb-1">
                  Dominant Mood
                </label>
                <select
                  value={dpMood}
                  onChange={(e) => setDpMood(e.target.value as DisciplineMood)}
                  className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-white"
                >
                  <option value="CALM_DISCIPLINED">✅ Calm & Disciplined</option>
                  <option value="PROFIT_CONFIDENT">😎 Profit Confident</option>
                  <option value="OVER_TRADE">⚡ Over-Traded</option>
                  <option value="REVENGE">🔥 Revenge Mood</option>
                  <option value="FOMO">🏃 FOMO Chasing</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-white font-semibold">
                <input
                  type="checkbox"
                  checked={dpStoppedAfter830}
                  onChange={(e) => setDpStoppedAfter830(e.target.checked)}
                  className="accent-[#26D6A0]"
                />
                <span>Stopped trading before 8:30 AM PT (avoided lunch chop)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#26D6A0] font-semibold">
                <input
                  type="checkbox"
                  checked={syncToBalance}
                  onChange={(e) => setSyncToBalance(e.target.checked)}
                  className="accent-[#26D6A0]"
                />
                <span>Sync this Manual P&L directly to Active Account Cash Balance</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BAFC4] mb-1">
                Execution Notes
              </label>
              <textarea
                rows={2}
                value={dpNotes}
                onChange={(e) => setDpNotes(e.target.value)}
                placeholder="Took 1 base hit spread, locked green day, stopped at 8:20 AM PT."
                className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] p-2.5 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#26D6A0] py-2.5 text-xs font-extrabold text-[#0B1220] shadow-md hover:opacity-95 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Save Daily Profit Entry</span>
            </button>
          </form>

          {/* History */}
          <div className="lg:col-span-7 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5">
            <h2 className="text-sm font-extrabold text-white mb-3">
              Daily Profit Records ({dailyProfitRecords.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E2D45] text-[11px] font-bold uppercase text-[#9BAFC4]">
                    <th className="py-2.5 px-2.5">Date</th>
                    <th className="py-2.5 px-2.5">Profit / Loss</th>
                    <th className="py-2.5 px-2.5">Qty</th>
                    <th className="py-2.5 px-2.5">Mood</th>
                    <th className="py-2.5 px-2.5">Notes</th>
                    <th className="py-2.5 px-2 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]">
                  {dailyProfitRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-[#0B1220]">
                      <td className="py-3 px-2.5 font-mono font-bold text-white">
                        {r.tradeDate}
                      </td>
                      <td
                        className={`py-3 px-2.5 font-mono text-sm font-extrabold ${
                          r.manualProfitUsd >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                        }`}
                      >
                        {r.manualProfitUsd >= 0 ? '+' : ''}${r.manualProfitUsd.toFixed(2)}
                      </td>
                      <td className="py-3 px-2.5 font-mono font-bold text-[#26D6A0]">
                        1 Contract
                      </td>
                      <td className="py-3 px-2.5">
                        <span className="rounded-md bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                          {r.dominantMood.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-[#9BAFC4] max-w-xs truncate">
                        {r.notes}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => deleteDailyProfitRecord(r.id)}
                          className="rounded-lg p-1.5 text-[#9BAFC4] hover:text-[#EF4444]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INDIVIDUAL TRADES LEDGER */}
      {activeTab === 'TRADES_LEDGER' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowManualTradeForm(!showManualTradeForm)}
              className="flex items-center gap-1.5 rounded-xl bg-[#26D6A0] px-4 py-2 text-xs font-extrabold text-[#0B1220]"
            >
              <Plus className="h-4 w-4" />
              <span>Add Manual 1-Contract Trade</span>
            </button>
          </div>

          {showManualTradeForm && (
            <form
              onSubmit={handleManualTradeSubmit}
              className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3"
            >
              <div className="text-sm font-extrabold text-white">
                Log Individual Option Trade (Strict 1-Contract Rule)
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-7 text-xs">
                <div>
                  <label className="block text-[#9BAFC4] mb-1">Date</label>
                  <input
                    type="date"
                    value={tradeDate}
                    onChange={(e) => setTradeDate(e.target.value)}
                    className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#9BAFC4] mb-1">Symbol</label>
                  <input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#9BAFC4] mb-1">Strategy</label>
                  <input
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#9BAFC4] mb-1">Strikes</label>
                  <input
                    value={strikeSummary}
                    onChange={(e) => setStrikeSummary(e.target.value)}
                    className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#9BAFC4] mb-1">Entry ($)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#9BAFC4] mb-1">Exit ($)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#26D6A0] font-bold mb-1">
                    Custom Net P&L ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Auto if blank"
                    value={manualOverridePnl}
                    onChange={(e) => setManualOverridePnl(e.target.value)}
                    className="w-full rounded-xl border border-[#26D6A0]/50 bg-[#0B1220] px-2.5 py-2 font-mono text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  placeholder="Trade notes, morning power hour entry..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex-1 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#26D6A0] px-5 py-2 text-xs font-extrabold text-[#0B1220]"
                >
                  Save Trade
                </button>
              </div>
            </form>
          )}

          <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#1E2D45] text-[11px] uppercase text-[#9BAFC4]">
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Strategy</th>
                    <th className="py-2.5 px-2">Strikes</th>
                    <th className="py-2.5 px-2">Qty</th>
                    <th className="py-2.5 px-2">Entry / Exit</th>
                    <th className="py-2.5 px-2">Realized P&L</th>
                    <th className="py-2.5 px-2">Notes</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]">
                  {journalEntries.map((j) => {
                    const isEditing = editingTradeId === j.id;
                    return (
                      <tr key={j.id} className="hover:bg-[#0B1220]">
                        <td className="py-3 px-2 text-white">{j.tradeDate}</td>
                        <td className="py-3 px-2 font-sans font-bold text-white">
                          {j.strategy}
                        </td>
                        <td className="py-3 px-2 text-[#26D6A0]">
                          {j.strikeSummary}
                        </td>
                        <td className="py-3 px-2 text-white font-bold">{j.contracts}x</td>
                        <td className="py-3 px-2 text-[#9BAFC4]">
                          ${j.entryPrice.toFixed(2)} → ${j.exitPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-2">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editPnlVal}
                              onChange={(e) => setEditPnlVal(Number(e.target.value))}
                              className="w-28 rounded-lg border border-[#26D6A0] bg-[#0B1220] px-2 py-1 font-mono font-bold text-white"
                            />
                          ) : (
                            <span
                              className={`font-bold ${
                                j.realizedPnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                              }`}
                            >
                              {j.realizedPnl >= 0 ? '+' : ''}${j.realizedPnl.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 font-sans text-[#9BAFC4] max-w-xs">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editNotesVal}
                              onChange={(e) => setEditNotesVal(e.target.value)}
                              className="w-full rounded-lg border border-[#26D6A0] bg-[#0B1220] px-2 py-1 text-white"
                            />
                          ) : (
                            j.notes
                          )}
                        </td>
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          {isEditing ? (
                            <button
                              onClick={() => saveEditTrade(j.id)}
                              className="rounded-lg bg-[#26D6A0] px-2.5 py-1 font-sans text-xs font-bold text-[#0B1220]"
                            >
                              Save
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => startEditTrade(j)}
                                className="rounded-lg p-1.5 text-[#26D6A0] hover:bg-[#0B1220]"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteJournalEntry(j.id)}
                                className="rounded-lg p-1.5 text-[#9BAFC4] hover:text-[#EF4444]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
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

      {/* TAB 5: CSV IMPORTER */}
      {activeTab === 'CSV_IMPORT' && (
        <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Import Executions CSV
              </h3>
              <p className="text-xs text-[#9BAFC4]">
                Columns: order_group_id, trade_date, symbol, option_type, strike, expiration, contracts, entry_price, exit_price, fees, strategy, notes
              </p>
            </div>
            <button
              onClick={() => {
                const res = importCsvExecutions(csvInput);
                setImportStatus(
                  `Imported ${res.importedTrades} trade(s) (${res.reconstructedMultiLeg} multi-leg reconstructed).`
                );
              }}
              className="rounded-xl bg-[#26D6A0] px-4 py-2 text-xs font-extrabold text-[#0B1220]"
            >
              Reconstruct & Import CSV
            </button>
          </div>
          <textarea
            rows={5}
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3 font-mono text-xs text-white"
          />
          {importStatus && (
            <div className="rounded-xl bg-[#22C55E]/15 p-3 text-xs font-bold text-[#22C55E]">
              {importStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
