import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  KeyRound,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const LiveTradingPage: React.FC = () => {
  const {
    setActiveSection,
    liveTradingAuthorized,
    setLiveTradingAuthorized,
    orders,
  } = useTrading();

  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [authStepMessage, setAuthStepMessage] = useState<string | null>(null);

  const handleAuthorizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPhrase.trim().toUpperCase() === 'ENABLE LIVE GATEKEEPER') {
      setLiveTradingAuthorized(true);
      setAuthStepMessage(
        'Operator pre-authorization verified. Note: Actual broker order transmission remains safely blocked until Robinhood MCP Server is connected and verified.'
      );
    } else {
      setAuthStepMessage(
        'Confirmation phrase mismatch. Type ENABLE LIVE GATEKEEPER to pre-authorize.'
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F59E0B]/15 text-[#F59E0B]">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">
                Live Trading Authorization & Broker Order Gatekeeper (Phase 5)
              </h1>
              <span className="rounded bg-[#EF4444]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#EF4444]">
                REAL ORDERS BLOCKED • MCP DISCONNECTED
              </span>
            </div>
            <p className="text-xs text-[#9BAFC4]">
              Two-step explicit operator authorization and broker order lifecycle manager. Never fabricates live fills.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveSection('paper-trading')}
          className="flex items-center gap-1.5 rounded-lg bg-[#26D6A0] px-3.5 py-2 text-xs font-bold text-[#0B1220]"
        >
          <Cpu className="h-4 w-4" />
          <span>Go to Active Paper Trading Engine</span>
        </button>
      </div>

      {/* Two-Step Live Authorization & Readiness Checklist */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Lock className="h-4 w-4 text-[#F59E0B]" />
            <span>Live Execution Gatekeeper Readiness Checklist</span>
          </div>
          <p className="text-xs text-[#9BAFC4] leading-relaxed">
            TradePilot never fabricates live broker executions or pretends that an unconfigured broker adapter is submitting real orders. All strategies built in Strategy Lab and signals received from TradingView are currently routed to your Paper Trading Engine.
          </p>
          <div className="space-y-2 pt-2 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-[#1E2D45] bg-[#0B1220] p-2.5">
              <span className="text-white">
                1. Options Strategy Lab & Payoff Engine (14 Strategies)
              </span>
              <span className="flex items-center gap-1 text-[#22C55E] font-mono font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> OPERATIONAL
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#1E2D45] bg-[#0B1220] p-2.5">
              <span className="text-white">
                2. Multi-Account Paper Trading Engine & Risk Controls
              </span>
              <span className="flex items-center gap-1 text-[#22C55E] font-mono font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> OPERATIONAL
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#1E2D45] bg-[#0B1220] p-2.5">
              <span className="text-white">
                3. Operator Two-Step Pre-Authorization
              </span>
              <span
                className={`font-mono font-bold ${
                  liveTradingAuthorized ? 'text-[#22C55E]' : 'text-[#F59E0B]'
                }`}
              >
                {liveTradingAuthorized ? 'PRE-AUTHORIZED' : 'NOT AUTHORIZED'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#1E2D45] bg-[#0B1220] p-2.5">
              <span className="text-white">
                4. Robinhood MCP Live Order Submission Adapter
              </span>
              <span className="flex items-center gap-1 text-[#EF4444] font-mono font-bold">
                <ShieldAlert className="h-3.5 w-3.5" /> DISCONNECTED (SAFE LOCK)
              </span>
            </div>
          </div>
        </div>

        {/* Two-Step Explicit Operator Authorization Box */}
        <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <KeyRound className="h-4 w-4 text-[#26D6A0]" />
            <span>Explicit Live Trading Two-Step Authorization</span>
          </div>
          <p className="text-xs text-[#9BAFC4]">
            Per Section 13: Live trading remains disabled by default. Type <code className="text-[#26D6A0]">ENABLE LIVE GATEKEEPER</code> below to test the operator authorization workflow. Even when authorized, orders will not be transmitted while Robinhood MCP is disconnected.
          </p>
          <form onSubmit={handleAuthorizeSubmit} className="space-y-3 text-xs">
            <input
              type="text"
              placeholder="Type ENABLE LIVE GATEKEEPER"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-2 font-mono text-white"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-[#26D6A0] px-4 py-2 font-bold text-[#0B1220]"
              >
                Verify Authorization Phrase
              </button>
              {liveTradingAuthorized && (
                <button
                  type="button"
                  onClick={() => {
                    setLiveTradingAuthorized(false);
                    setAuthStepMessage('Live pre-authorization revoked.');
                  }}
                  className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/15 px-3 py-2 font-semibold text-[#EF4444]"
                >
                  Revoke Authorization
                </button>
              )}
            </div>
          </form>
          {authStepMessage && (
            <div className="rounded-lg border border-[#26D6A0]/30 bg-[#0B1220] p-2.5 text-xs text-[#26D6A0]">
              {authStepMessage}
            </div>
          )}
        </div>
      </div>

      {/* Broker Order Lifecycle & Execution Lock Inspection Table */}
      <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
        <h2 className="text-sm font-bold text-white mb-2">
          Order Management & Execution Routing Audit ({orders.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#1E2D45] text-[10px] uppercase text-[#9BAFC4]">
                <th className="py-2 px-2">Order ID</th>
                <th className="py-2 px-2">Strategy</th>
                <th className="py-2 px-2">Legs Summary</th>
                <th className="py-2 px-2">Execution Route</th>
                <th className="py-2 px-2">Broker Confirmation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D45]/60">
              {orders.map((ord) => (
                <tr key={ord.id}>
                  <td className="py-2 px-2 font-bold text-[#26D6A0]">
                    {ord.id}
                  </td>
                  <td className="py-2 px-2 font-sans text-white">
                    {ord.strategyName}
                  </td>
                  <td className="py-2 px-2 text-[#9BAFC4]">{ord.legsSummary}</td>
                  <td className="py-2 px-2">
                    <span className="rounded bg-[#26D6A0]/15 px-2 py-0.5 text-[10px] font-bold text-[#26D6A0]">
                      PAPER ENGINE ({ord.fillModelUsed})
                    </span>
                  </td>
                  <td className="py-2 px-2 text-[#F59E0B]">
                    SIMULATED FILL ONLY (No Live Broker Order Sent)
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
