import React, { useState } from 'react';
import { Code, Play, Radio, ShieldCheck } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { STRATEGY_CATALOG } from '../lib/optionsEngine';
import { SignalType, StrategyCode } from '../types/trading';

const SIGNAL_TYPES: SignalType[] = [
  'BUY_CALL',
  'BUY_PUT',
  'BUY_STRADDLE',
  'BUY_STRANGLE',
  'EXIT_POSITION',
  'CLOSE_ALL',
  'VWAP_BULLISH',
  'VWAP_BEARISH',
  'EMA_BULLISH',
  'EMA_BEARISH',
];

const SAMPLE_PINE_JSON = `{
  "secret": "{{WEBHOOK_SECRET}}",
  "signal_type": "VWAP_BULLISH",
  "symbol": "SPX",
  "price": {{close}},
  "timestamp": {{timenow}},
  "mapped_strategy": "BULL_CALL_DEBIT_SPREAD",
  "mode": "PAPER"
}`;

export const SignalsPage: React.FC = () => {
  const { signals, simulateTradingViewWebhook } = useTrading();
  const [selectedSignal, setSelectedSignal] =
    useState<SignalType>('VWAP_BULLISH');
  const [mappedStrategy, setMappedStrategy] = useState<StrategyCode>(
    'BULL_CALL_DEBIT_SPREAD'
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#26D6A0]/15 text-[#26D6A0]">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">
              TradingView Signal Webhook Integration
            </h1>
            <p className="text-xs text-[#9BAFC4]">
              Authenticated webhook endpoint with secret validation, 60s timestamp freshness, idempotency deduplication, and mandatory TradePilot Risk Gate
            </p>
          </div>
        </div>
        <span className="rounded bg-[#26D6A0]/15 px-2.5 py-1 font-mono text-xs font-semibold text-[#26D6A0]">
          POST /api/webhooks/tradingview
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left: Interactive Webhook Dispatch Simulator & Signal Mapping */}
        <div className="xl:col-span-6 rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              Simulate Incoming TradingView Alert Payload
            </h2>
            <span className="flex items-center gap-1 text-[11px] text-[#22C55E]">
              <ShieldCheck className="h-3.5 w-3.5" /> Risk Controls Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            <div>
              <label className="block text-[#9BAFC4] mb-1">
                Supported Signal Type (10 Types)
              </label>
              <select
                value={selectedSignal}
                onChange={(e) =>
                  setSelectedSignal(e.target.value as SignalType)
                }
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-2 font-mono text-white"
              >
                {SIGNAL_TYPES.map((sig) => (
                  <option key={sig} value={sig}>
                    {sig}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#9BAFC4] mb-1">
                Mapped SPX Strategy
              </label>
              <select
                value={mappedStrategy}
                onChange={(e) =>
                  setMappedStrategy(e.target.value as StrategyCode)
                }
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-2 text-white"
              >
                {STRATEGY_CATALOG.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                simulateTradingViewWebhook(selectedSignal, mappedStrategy, true)
              }
              className="flex items-center gap-1.5 rounded-lg bg-[#26D6A0] px-4 py-2 text-xs font-bold text-[#0B1220] hover:bg-[#26D6A0]/90"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Fire Authenticated Signal → Paper Engine</span>
            </button>

            <button
              onClick={() =>
                simulateTradingViewWebhook(
                  selectedSignal,
                  mappedStrategy,
                  false
                )
              }
              className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/15 px-3 py-2 text-xs font-semibold text-[#EF4444]"
            >
              Test Invalid Secret Rejection
            </button>
          </div>
        </div>

        {/* Right: Sample Pine Script JSON Configuration */}
        <div className="xl:col-span-6 rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Code className="h-4 w-4 text-[#26D6A0]" />
            <span>Sample Pine Script Alert Webhook JSON Template</span>
          </div>
          <p className="text-xs text-[#9BAFC4]">
            Configure in TradingView Alert → Webhook URL: <code className="text-[#26D6A0]">/api/webhooks/tradingview</code>
          </p>
          <pre className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-3 font-mono text-xs text-[#26D6A0] overflow-x-auto">
            {SAMPLE_PINE_JSON}
          </pre>
        </div>
      </div>

      {/* Signal Audit Log Table */}
      <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
        <h3 className="text-sm font-bold text-white mb-3">
          Incoming Webhook Signal Log ({signals.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#1E2D45] text-[10px] uppercase text-[#9BAFC4]">
                <th className="py-2 px-2">Time</th>
                <th className="py-2 px-2">Idempotency Key</th>
                <th className="py-2 px-2">Signal Type</th>
                <th className="py-2 px-2">Mapped Strategy</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Payload / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D45]/60">
              {signals.map((sig) => (
                <tr key={sig.id} className="hover:bg-[#16243B]">
                  <td className="py-2.5 px-2 text-[#9BAFC4]">
                    {sig.receivedAt}
                  </td>
                  <td className="py-2.5 px-2 text-white">
                    {sig.idempotencyKey}
                  </td>
                  <td className="py-2.5 px-2 font-bold text-[#26D6A0]">
                    {sig.signalType}
                  </td>
                  <td className="py-2.5 px-2 text-white">
                    {sig.mappedStrategyCode}
                  </td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        sig.validationStatus.startsWith('REJECTED')
                          ? 'bg-[#EF4444]/20 text-[#EF4444]'
                          : 'bg-[#22C55E]/20 text-[#22C55E]'
                      }`}
                    >
                      {sig.validationStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-[11px] text-[#9BAFC4]">
                    {sig.rejectionReason || sig.payloadSummary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
