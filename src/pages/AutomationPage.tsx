import React from 'react';
import {
  AlertOctagon,
  Bot,
  Clock,
  KeyRound,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { MonitoringAction } from '../types/trading';

export const AutomationPage: React.FC = () => {
  const {
    entryConfig,
    setEntryConfig,
    exitConfig,
    setExitConfig,
    riskSettings,
    setRiskSettings,
    positions,
    triggerEmergencyKillSwitch,
    resetKillSwitch,
    authorizeCloseAllPositions,
    automationEvents,
    activeLocks,
    runAutomationEvaluationPass,
    resetAutomationLocks,
    auditLogs,
  } = useTrading();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#26D6A0]/15 text-[#26D6A0]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">
              Automation Center — Idempotent Worker, Execution Locks & Risk Engine (Phase 5)
            </h1>
            <p className="text-xs text-[#9BAFC4]">
              Configure idempotent SPX 0DTE entry rules, 30-minute review actions, profit/stop rules, and Emergency Kill Switch controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runAutomationEvaluationPass(false)}
            className="flex items-center gap-1.5 rounded-lg bg-[#26D6A0] px-3.5 py-2 text-xs font-bold text-[#0B1220] hover:bg-[#26D6A0]/90"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run Idempotent Worker Evaluation Cycle</span>
          </button>
          <button
            onClick={resetAutomationLocks}
            className="flex items-center gap-1 rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-xs font-semibold text-[#9BAFC4] hover:text-white"
            title="Clear idempotency locks to test re-evaluation in same minute"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Locks ({activeLocks.length})</span>
          </button>
        </div>
      </div>

      {/* Emergency Kill Switch Command Panel (Section 11) */}
      <div
        className={`rounded-xl border p-4 ${
          riskSettings.killSwitchActive
            ? 'border-[#EF4444] bg-[#EF4444]/15'
            : 'border-[#1E2D45] bg-[#111C2E]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertOctagon
              className={`h-6 w-6 shrink-0 mt-0.5 ${
                riskSettings.killSwitchActive
                  ? 'text-[#EF4444]'
                  : 'text-[#F59E0B]'
              }`}
            />
            <div>
              <h2 className="text-sm font-bold text-white">
                Emergency Trading Kill Switch & Stale-Data Circuit Breaker
              </h2>
              <p className="text-xs text-[#9BAFC4] mt-0.5">
                1. Immediately disables new entries • 2. Cancels eligible pending orders • 3. Displays existing positions • 4. Requires separate authorization to close open positions • 5. Records every action in Audit Logs.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {riskSettings.killSwitchActive ? (
              <>
                {positions.length > 0 && (
                  <button
                    onClick={authorizeCloseAllPositions}
                    className="rounded-lg bg-[#F59E0B] px-3.5 py-2 text-xs font-bold text-[#0B1220] hover:bg-[#F59E0B]/90"
                  >
                    Authorize Close All ({positions.length}) Open Positions
                  </button>
                )}
                <button
                  onClick={resetKillSwitch}
                  className="flex items-center gap-1.5 rounded-lg bg-[#22C55E] px-3.5 py-2 text-xs font-bold text-[#0B1220]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Reset Kill Switch</span>
                </button>
              </>
            ) : (
              <button
                onClick={triggerEmergencyKillSwitch}
                className="flex items-center gap-1.5 rounded-lg bg-[#EF4444] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#EF4444]/25 hover:bg-[#EF4444]/90"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>ACTIVATE EMERGENCY KILL SWITCH</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-Column Configuration Grid: Entry Rules | Exit Rules | Global Risk Rules */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Column 1: Entry Configuration (Section 9) */}
        <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#1E2D45] pb-2.5">
            <Clock className="h-4 w-4 text-[#26D6A0]" />
            <h3 className="text-sm font-bold text-white">
              Entry Rule Configuration (America/New_York)
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#9BAFC4] mb-1">
                Entry Trigger Mode
              </label>
              <select
                value={entryConfig.triggerType}
                onChange={(e) =>
                  setEntryConfig((prev) => ({
                    ...prev,
                    triggerType: e.target.value as typeof prev.triggerType,
                  }))
                }
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-1.5 text-white"
              >
                <option value="MARKET_OPEN">Market Open Entry (09:30 ET)</option>
                <option value="MARKET_AFTER_TIME">
                  Market Entry After Configured Time (Default 09:35 ET)
                </option>
                <option value="LIMIT_PRICE">Limit Price Entry</option>
                <option value="VWAP_BREAKOUT">VWAP Breakout Confirmation</option>
                <option value="EMA_CROSSOVER">9/21 EMA Crossover</option>
                <option value="ORB_15M">15-Minute Opening Range Breakout</option>
                <option value="RSI_CONFIRMATION">RSI Momentum Confirmation</option>
                <option value="TRADINGVIEW_WEBHOOK">TradingView Webhook Signal</option>
                <option value="MANUAL">Manual Entry Only</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[#9BAFC4] mb-1">
                  Evaluation Time (ET)
                </label>
                <input
                  type="time"
                  value={entryConfig.evaluationTimeEt}
                  onChange={(e) =>
                    setEntryConfig((prev) => ({
                      ...prev,
                      evaluationTimeEt: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[#9BAFC4] mb-1">
                  Entry Cutoff (ET)
                </label>
                <input
                  type="time"
                  value={entryConfig.entryCutoffEt}
                  onChange={(e) =>
                    setEntryConfig((prev) => ({
                      ...prev,
                      entryCutoffEt: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[#9BAFC4] mb-1">
                  SPX Strike Selection
                </label>
                <select
                  value={entryConfig.strikeSelection}
                  onChange={(e) =>
                    setEntryConfig((prev) => ({
                      ...prev,
                      strikeSelection: e.target.value as typeof prev.strikeSelection,
                    }))
                  }
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
                >
                  <option value="ATM">ATM Strike</option>
                  <option value="ITM_1">1 Strike ITM</option>
                  <option value="ITM_2">2 Strikes ITM</option>
                  <option value="OTM_1">1 Strike OTM</option>
                  <option value="OTM_2">2 Strikes OTM</option>
                  <option value="DELTA_BASED">Delta-Based Selection</option>
                </select>
              </div>
              <div>
                <label className="block text-[#9BAFC4] mb-1">
                  Target Delta (if Delta-based)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.10"
                  max="0.90"
                  value={entryConfig.targetDelta}
                  onChange={(e) =>
                    setEntryConfig((prev) => ({
                      ...prev,
                      targetDelta: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Exit & 30-Min Monitoring Rules (Section 10) */}
        <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#1E2D45] pb-2.5">
            <Sliders className="h-4 w-4 text-[#26D6A0]" />
            <h3 className="text-sm font-bold text-white">
              Exit Rules & 30-Min Checkpoint Manager
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[#9BAFC4] mb-1">
                  Profit Target (+%)
                </label>
                <input
                  type="number"
                  value={exitConfig.profitTargetPct}
                  onChange={(e) =>
                    setExitConfig((prev) => ({
                      ...prev,
                      profitTargetPct: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-[#22C55E]"
                />
              </div>
              <div>
                <label className="block text-[#9BAFC4] mb-1">
                  Fixed Stop Loss (-%)
                </label>
                <input
                  type="number"
                  value={exitConfig.stopLossPct}
                  onChange={(e) =>
                    setExitConfig((prev) => ({
                      ...prev,
                      stopLossPct: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-[#EF4444]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[#9BAFC4] mb-1">
                  Trailing Stop (%)
                </label>
                <input
                  type="number"
                  value={exitConfig.trailingStopPct}
                  onChange={(e) =>
                    setExitConfig((prev) => ({
                      ...prev,
                      trailingStopPct: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[#9BAFC4] mb-1">
                  Force-Close Cutoff (ET)
                </label>
                <input
                  type="time"
                  value={exitConfig.eodForceCloseTimeEt}
                  onChange={(e) =>
                    setExitConfig((prev) => ({
                      ...prev,
                      eodForceCloseTimeEt: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[#9BAFC4] mb-1">
                  Monitoring Interval (Min)
                </label>
                <input
                  type="number"
                  value={exitConfig.reviewIntervalMinutes}
                  onChange={(e) =>
                    setExitConfig((prev) => ({
                      ...prev,
                      reviewIntervalMinutes: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[#9BAFC4] mb-1">
                  Interval Default Action
                </label>
                <select
                  value={exitConfig.reviewIntervalAction}
                  onChange={(e) =>
                    setExitConfig((prev) => ({
                      ...prev,
                      reviewIntervalAction: e.target.value as MonitoringAction,
                    }))
                  }
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-[#26D6A0]"
                >
                  <option value="HOLD">HOLD (Keep Open)</option>
                  <option value="REVIEW">REVIEW (Alert Operator)</option>
                  <option value="PARTIAL_CLOSE">PARTIAL CLOSE (50%)</option>
                  <option value="FULL_CLOSE">FULL CLOSE (100%)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Global Risk Management Limits (Section 11) */}
        <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-[#1E2D45] pb-2.5">
            <ShieldAlert className="h-4 w-4 text-[#F59E0B]" />
            <h3 className="text-sm font-bold text-white">
              Global Risk Limits & Liquidity Filters
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-[#9BAFC4] mb-1">
                Max Daily Loss ($)
              </label>
              <input
                type="number"
                value={riskSettings.maxDailyLoss}
                onChange={(e) =>
                  setRiskSettings((prev) => ({
                    ...prev,
                    maxDailyLoss: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-[#9BAFC4] mb-1">
                Max Risk / Trade ($)
              </label>
              <input
                type="number"
                value={riskSettings.maxRiskPerTrade}
                onChange={(e) =>
                  setRiskSettings((prev) => ({
                    ...prev,
                    maxRiskPerTrade: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-[#9BAFC4] mb-1">
                Max Trades / Day
              </label>
              <input
                type="number"
                value={riskSettings.maxTradesPerDay}
                onChange={(e) =>
                  setRiskSettings((prev) => ({
                    ...prev,
                    maxTradesPerDay: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-[#9BAFC4] mb-1">
                Max Open Positions
              </label>
              <input
                type="number"
                value={riskSettings.maxSimultaneousPositions}
                onChange={(e) =>
                  setRiskSettings((prev) => ({
                    ...prev,
                    maxSimultaneousPositions: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-[#9BAFC4] mb-1">
                Max Contracts / Trade
              </label>
              <input
                type="number"
                value={riskSettings.maxContractsPerTrade}
                onChange={(e) =>
                  setRiskSettings((prev) => ({
                    ...prev,
                    maxContractsPerTrade: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-[#9BAFC4] mb-1">
                Max Bid/Ask Spread ($)
              </label>
              <input
                type="number"
                step="0.1"
                value={riskSettings.maxBidAskSpread}
                onChange={(e) =>
                  setRiskSettings((prev) => ({
                    ...prev,
                    maxBidAskSpread: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Phase 5 Idempotent Automation Worker Event Log & Execution Locks */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#26D6A0]" />
              <span>Idempotent Automation Worker Event Ledger ({automationEvents.length})</span>
            </h3>
            <button
              onClick={() => runAutomationEvaluationPass(true)}
              className="rounded-lg border border-[#26D6A0]/40 bg-[#26D6A0]/15 px-3 py-1 text-xs font-semibold text-[#26D6A0]"
            >
              Run Cycle & Auto-Execute Triggered Exits
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto space-y-2 font-mono text-xs">
            {automationEvents.map((ev) => (
              <div
                key={ev.id}
                className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#26D6A0]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#26D6A0]">
                      {ev.eventType}
                    </span>
                    <span className="font-bold text-white">{ev.strategyName}</span>
                    <span className="rounded bg-[#111C2E] px-1.5 py-0.5 text-[10px] text-[#F59E0B]">
                      Action: {ev.actionTaken}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#9BAFC4]">
                    Lock: {ev.executionLockKey}
                  </span>
                </div>
                <p className="mt-1 font-sans text-[11px] text-[#9BAFC4]">
                  {ev.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Immutable Audit Log Stream */}
        <div className="xl:col-span-4 rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
          <h3 className="text-sm font-bold text-white mb-2">
            System Audit Log ({auditLogs.length})
          </h3>
          <div className="max-h-56 overflow-y-auto space-y-1.5 font-mono text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded border border-[#1E2D45] bg-[#0B1220] p-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#26D6A0]">{log.action}</span>
                  <span className="text-[10px] text-[#9BAFC4]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-0.5 font-sans text-[11px] text-[#9BAFC4]">
                  {log.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
