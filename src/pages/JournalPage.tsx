import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit3,
  FileUp,
  Plus,
  Trash2,
  TrendingUp,
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
    'DAILY_PROFIT' | 'TRADES_LEDGER' | 'CSV_IMPORT'
  >('DAILY_PROFIT');

  // Daily Profit / Adjustment Form State
  const todayStr = new Date().toISOString().slice(0, 10);
  const [dpDate, setDpDate] = useState(todayStr);
  const [dpManualProfit, setDpManualProfit] = useState<number>(250);
  const [dpAccountAdjust, setDpAccountAdjust] = useState<number>(0);
  const [dpBrokerSource, setDpBrokerSource] = useState<
    'ROBINHOOD_LIVE' | 'PAPER_ENGINE' | 'COMBINED'
  >('COMBINED');
  const [dpTradesCount, setDpTradesCount] = useState<number>(2);
  const [dpMood, setDpMood] = useState<DisciplineMood>('CALM_DISCIPLINED');
  const [dpFollowedPlan, setDpFollowedPlan] = useState<boolean>(true);
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
  const [contracts, setContracts] = useState(2);
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
        'Logged via Daily Profit & Manual P&L Tracker.',
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
      entryTime: '09:35 ET',
      exitTime: '10:40 ET',
      fees,
      slippage: 10,
      realizedPnl: finalPnl,
      returnPct,
      strategy,
      moneyness: 'ATM',
      tradingMode: 'LIVE',
      entryReason: 'Manual Trade Entry',
      exitReason: 'Target / Manual Adjustment',
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

  // Combine Dates from dailyProfitRecords & journalEntries
  const allDates = Array.from(
    new Set([
      ...dailyProfitRecords.map((r) => r.tradeDate),
      ...journalEntries.map((j) => j.tradeDate),
    ])
  ).sort((a, b) => b.localeCompare(a));

  const dailySummaryRows = allDates.map((date) => {
    const tradesForDay = journalEntries.filter((j) => j.tradeDate === date);
    const autoTradesPnl = tradesForDay.reduce(
      (sum, j) => sum + j.realizedPnl,
      0
    );
    const manualRec = dailyProfitRecords.find((r) => r.tradeDate === date);
    const manualPnl = manualRec ? manualRec.manualProfitUsd : 0;
    const adjustment = manualRec ? manualRec.accountAdjustmentUsd : 0;
    const combinedDailyNet = Number(
      (autoTradesPnl + manualPnl + adjustment).toFixed(2)
    );
    return {
      date,
      autoTradesPnl: Number(autoTradesPnl.toFixed(2)),
      autoTradesCount: tradesForDay.length,
      manualRec,
      manualPnl,
      adjustment,
      combinedDailyNet,
    };
  });

  const cumulativeNetPnl = dailySummaryRows.reduce(
    (sum, r) => sum + r.combinedDailyNet,
    0
  );

  return (
    <div className="space-y-4">
      {/* Header & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E2D45] bg-[#111C2E] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#26D6A0]/15 text-[#26D6A0]">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">
              Daily Profit Tracker, Manual P&L Adjustments & Trade Journal
            </h1>
            <p className="text-xs text-[#9BAFC4]">
              Track daily profit manually, adjust live Robinhood/Paper P&L alongside automated trades, and edit any trade inline
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('DAILY_PROFIT')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'DAILY_PROFIT'
                ? 'bg-[#26D6A0] text-[#0B1220]'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Daily Profit & Manual Adjust</span>
          </button>

          <button
            onClick={() => setActiveTab('TRADES_LEDGER')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'TRADES_LEDGER'
                ? 'bg-[#26D6A0] text-[#0B1220]'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Individual Trades ({journalEntries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CSV_IMPORT')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'CSV_IMPORT'
                ? 'bg-[#26D6A0] text-[#0B1220]'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
          >
            <FileUp className="h-4 w-4" />
            <span>CSV Multi-Leg Importer</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4">
          <span className="text-xs font-semibold text-[#9BAFC4]">
            COMBINED CUMULATIVE PROFIT (AUTO + MANUAL)
          </span>
          <div
            className={`mt-1 font-mono text-2xl font-extrabold ${
              cumulativeNetPnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
            }`}
          >
            {cumulativeNetPnl >= 0 ? '+' : ''}${cumulativeNetPnl.toFixed(2)}
          </div>
          <span className="text-xs text-[#9BAFC4]">
            Across {dailySummaryRows.length} tracked trading session(s)
          </span>
        </div>

        <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4">
          <span className="text-xs font-semibold text-[#9BAFC4]">
            ACTIVE ACCOUNT CASH & BUYING POWER
          </span>
          <div className="mt-1 font-mono text-2xl font-extrabold text-white">
            ${activeAccount.cashBalance.toLocaleString()}
          </div>
          <span className="text-xs text-[#26D6A0]">
            Buying Power: ${activeAccount.buyingPower.toLocaleString()}
          </span>
        </div>

        <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4">
          <span className="text-xs font-semibold text-[#9BAFC4]">
            TOTAL LOGGED STRATEGY TRADES
          </span>
          <div className="mt-1 font-mono text-2xl font-extrabold text-white">
            {journalEntries.length} Trades
          </div>
          <span className="text-xs text-[#9BAFC4]">
            Click any row to edit or adjust dollar P&L inline
          </span>
        </div>
      </div>

      {/* TAB 1: DAILY PROFIT & MANUAL P&L ADJUSTMENT TRACKER */}
      {activeTab === 'DAILY_PROFIT' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left: Manual Daily Profit Logger & Balance Adjuster (5 cols) */}
          <form
            onSubmit={handleSaveDailyProfit}
            className="lg:col-span-5 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-[#1E2D45] pb-2.5">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#26D6A0]" />
                <h2 className="text-sm font-extrabold text-white">
                  Log or Adjust Daily Profit Manually
                </h2>
              </div>
              <span className="rounded-md bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                LIVE + PAPER
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
                  Source / Broker
                </label>
                <select
                  value={dpBrokerSource}
                  onChange={(e) =>
                    setDpBrokerSource(
                      e.target.value as
                        | 'ROBINHOOD_LIVE'
                        | 'PAPER_ENGINE'
                        | 'COMBINED'
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
                  Manual Daily Profit / Loss ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dpManualProfit}
                  onChange={(e) => setDpManualProfit(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 font-mono font-bold text-white"
                  placeholder="e.g. 350 or -120"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#9BAFC4] mb-1">
                  Balance Adjustment / Cash ($)
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
                  Trades Taken Today
                </label>
                <input
                  type="number"
                  min={0}
                  value={dpTradesCount}
                  onChange={(e) => setDpTradesCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 font-mono text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#9BAFC4] mb-1">
                  Dominant Mood Today
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
                  <option value="CLEAR_ALL_DEBT_ONE_TRADE">
                    💣 All-In / Clear Debt Urge
                  </option>
                  <option value="AVERAGING_DOWN_URGE">
                    📉 Averaged Down Loser
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BAFC4] mb-1">
                Daily Review & Execution Notes
              </label>
              <textarea
                rows={2}
                value={dpNotes}
                onChange={(e) => setDpNotes(e.target.value)}
                placeholder="How did you trade today? Did you respect your daily budget and stop on time for your family?"
                className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-white font-semibold">
                <input
                  type="checkbox"
                  checked={dpFollowedPlan}
                  onChange={(e) => setDpFollowedPlan(e.target.checked)}
                  className="accent-[#26D6A0]"
                />
                <span>I followed my position-sizing & stop-loss rules today</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#26D6A0] font-semibold">
                <input
                  type="checkbox"
                  checked={syncToBalance}
                  onChange={(e) => setSyncToBalance(e.target.checked)}
                  className="accent-[#26D6A0]"
                />
                <span>
                  Also add this Manual P&L / Adjustment directly to Active Account Balance
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#26D6A0] py-2.5 text-xs font-extrabold text-[#0B1220] shadow-md hover:opacity-95 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Save / Update Daily Profit Record</span>
            </button>
          </form>

          {/* Right: Day-by-Day Combined Profit Ledger (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5">
            <h2 className="text-sm font-extrabold text-white mb-3">
              Day-by-Day Combined Profit Ledger (Auto Trades + Manual Adjustments)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E2D45] text-[11px] font-bold uppercase text-[#9BAFC4]">
                    <th className="py-2.5 px-2.5">Date</th>
                    <th className="py-2.5 px-2.5">Auto/Trade P&L</th>
                    <th className="py-2.5 px-2.5">Manual P&L / Adj</th>
                    <th className="py-2.5 px-2.5">Combined Net</th>
                    <th className="py-2.5 px-2.5">Mood / Discipline</th>
                    <th className="py-2.5 px-2.5">Notes</th>
                    <th className="py-2.5 px-2 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]">
                  {dailySummaryRows.map((row) => (
                    <tr key={row.date} className="hover:bg-[#0B1220]">
                      <td className="py-3 px-2.5 font-mono font-bold text-white whitespace-nowrap">
                        {row.date}
                      </td>
                      <td
                        className={`py-3 px-2.5 font-mono font-semibold ${
                          row.autoTradesPnl >= 0
                            ? 'text-[#22C55E]'
                            : 'text-[#EF4444]'
                        }`}
                      >
                        {row.autoTradesPnl >= 0 ? '+' : ''}$
                        {row.autoTradesPnl.toFixed(2)}{' '}
                        <span className="text-[10px] text-[#9BAFC4]">
                          ({row.autoTradesCount}t)
                        </span>
                      </td>
                      <td
                        className={`py-3 px-2.5 font-mono font-semibold ${
                          row.manualPnl + row.adjustment >= 0
                            ? 'text-[#26D6A0]'
                            : 'text-[#EF4444]'
                        }`}
                      >
                        {row.manualPnl + row.adjustment >= 0 ? '+' : ''}$
                        {(row.manualPnl + row.adjustment).toFixed(2)}
                      </td>
                      <td
                        className={`py-3 px-2.5 font-mono text-sm font-extrabold ${
                          row.combinedDailyNet >= 0
                            ? 'text-[#22C55E]'
                            : 'text-[#EF4444]'
                        }`}
                      >
                        {row.combinedDailyNet >= 0 ? '+' : ''}$
                        {row.combinedDailyNet.toFixed(2)}
                      </td>
                      <td className="py-3 px-2.5">
                        <span className="rounded-md bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                          {row.manualRec?.dominantMood.replace(/_/g, ' ') ||
                            'LOGGED'}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-[#9BAFC4] max-w-xs truncate">
                        {row.manualRec?.notes ||
                          'Auto-aggregated from trade executions'}
                      </td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setDpDate(row.date);
                            setDpManualProfit(row.manualPnl);
                            setDpAccountAdjust(row.adjustment);
                            if (row.manualRec) {
                              setDpMood(row.manualRec.dominantMood);
                              setDpNotes(row.manualRec.notes);
                              setDpTradesCount(row.manualRec.tradesCount);
                            }
                          }}
                          className="rounded-lg p-1.5 text-[#26D6A0] hover:bg-[#0B1220]"
                          title="Load this date into editor to adjust P&L"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {row.manualRec && (
                          <button
                            type="button"
                            onClick={() =>
                              deleteDailyProfitRecord(row.manualRec!.id)
                            }
                            className="rounded-lg p-1.5 text-[#9BAFC4] hover:text-[#EF4444]"
                            title="Delete manual entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INDIVIDUAL TRADES LEDGER WITH INLINE P&L ADJUSTMENT */}
      {activeTab === 'TRADES_LEDGER' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowManualTradeForm(!showManualTradeForm)}
              className="flex items-center gap-1.5 rounded-xl bg-[#26D6A0] px-4 py-2 text-xs font-extrabold text-[#0B1220]"
            >
              <Plus className="h-4 w-4" />
              <span>Add Manual Option Trade</span>
            </button>
          </div>

          {showManualTradeForm && (
            <form
              onSubmit={handleManualTradeSubmit}
              className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3"
            >
              <div className="text-sm font-extrabold text-white">
                Log Individual Option Trade (Paper or Live Robinhood Fill)
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
                  placeholder="Trade notes, catalyst, or execution review..."
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
                    <th className="py-2.5 px-2">Realized P&L (Editable)</th>
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
                        <td className="py-3 px-2 text-white">{j.contracts}x</td>
                        <td className="py-3 px-2 text-[#9BAFC4]">
                          ${j.entryPrice.toFixed(2)} → ${j.exitPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-2">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editPnlVal}
                              onChange={(e) =>
                                setEditPnlVal(Number(e.target.value))
                              }
                              className="w-28 rounded-lg border border-[#26D6A0] bg-[#0B1220] px-2 py-1 font-mono font-bold text-white"
                            />
                          ) : (
                            <span
                              className={`font-bold ${
                                j.realizedPnl >= 0
                                  ? 'text-[#22C55E]'
                                  : 'text-[#EF4444]'
                              }`}
                            >
                              {j.realizedPnl >= 0 ? '+' : ''}$
                              {j.realizedPnl.toFixed(2)}
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
                                title="Adjust P&L or Notes"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteJournalEntry(j.id)}
                                className="rounded-lg p-1.5 text-[#9BAFC4] hover:text-[#EF4444]"
                                title="Delete Trade"
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

      {/* TAB 3: CSV MULTI-LEG IMPORTER */}
      {activeTab === 'CSV_IMPORT' && (
        <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Import Executions CSV (Auto-Groups Multi-Leg Fills by Order Group ID)
              </h3>
              <p className="text-xs text-[#9BAFC4]">
                Columns: order_group_id, trade_date, symbol, option_type, strike, expiration, contracts, entry_price, exit_price, fees, strategy, notes
              </p>
            </div>
            <button
              onClick={() => {
                const res = importCsvExecutions(csvInput);
                setImportStatus(
                  `Imported ${res.importedTrades} strategy trade(s) (${res.reconstructedMultiLeg} multi-leg reconstructed).`
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
