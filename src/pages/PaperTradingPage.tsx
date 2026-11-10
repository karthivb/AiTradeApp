import React, { useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  DollarSign,
  FlaskConical,
  Plus,
  Sliders,
  XCircle,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { FillModel } from '../types/trading';

export const PaperTradingPage: React.FC = () => {
  const {
    paperAccounts,
    activeAccountId,
    setActiveAccountId,
    activeAccount,
    createPaperAccount,
    updateAccountSettings,
    positions,
    orders,
    executions,
    closePaperPosition,
    performPositionMonitoringAction,
    fillPendingOrder,
    cancelPendingOrder,
    setActiveSection,
  } = useTrading();

  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccName, setNewAccName] = useState('SPX 0DTE Scalping Desk');
  const [newAccCapital, setNewAccCapital] = useState(25000);
  const [newAccFillModel, setNewAccFillModel] = useState<FillModel>('MIDPOINT');
  const [activeTab, setActiveTab] = useState<
    'POSITIONS' | 'ORDERS' | 'EXECUTIONS'
  >('POSITIONS');

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    createPaperAccount(newAccName.trim(), newAccCapital, newAccFillModel);
    setShowNewAccountModal(false);
  };

  const accountPositions = positions.filter(
    (p) => p.accountId === activeAccount.id
  );
  const accountOrders = orders.filter((o) => o.accountId === activeAccount.id);
  const accountExecutions = executions.filter(
    (ex) => ex.accountId === activeAccount.id
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#26D6A0]/15 text-[#26D6A0]">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">
                Paper Trading Engine & Execution Desk
              </h1>
              <span className="rounded bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#26D6A0]">
                100% SIMULATED • NO ROBINHOOD ORDERS
              </span>
            </div>
            <p className="text-xs text-[#9BAFC4]">
              Multi-account simulation with configurable Midpoint, Bid/Ask & Slippage fill models, SPX 100x multiplier validation, and leg-level execution tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeAccountId}
            onChange={(e) => setActiveAccountId(e.target.value)}
            className="rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-1.5 font-mono text-xs text-white focus:border-[#26D6A0]"
          >
            {paperAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (${acc.buyingPower.toLocaleString()} BP)
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewAccountModal(!showNewAccountModal)}
            className="flex items-center gap-1 rounded-lg border border-[#26D6A0]/40 bg-[#26D6A0]/15 px-3 py-1.5 text-xs font-semibold text-[#26D6A0] hover:bg-[#26D6A0]/25"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Paper Account</span>
          </button>

          <button
            onClick={() => setActiveSection('strategy-lab')}
            className="flex items-center gap-1.5 rounded-lg bg-[#26D6A0] px-3 py-1.5 text-xs font-bold text-[#0B1220]"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>New Options Order</span>
          </button>
        </div>
      </div>

      {/* Create New Paper Account Form */}
      {showNewAccountModal && (
        <form
          onSubmit={handleCreateAccount}
          className="rounded-xl border border-[#26D6A0]/50 bg-[#111C2E] p-4 space-y-3"
        >
          <div className="text-xs font-bold text-white">
            Create New Paper Account
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] text-[#9BAFC4] mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9BAFC4] mb-1">
                Initial Virtual Capital ($)
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={newAccCapital}
                onChange={(e) => setNewAccCapital(Number(e.target.value))}
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-1.5 font-mono text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9BAFC4] mb-1">
                Default Fill Model
              </label>
              <select
                value={newAccFillModel}
                onChange={(e) => setNewAccFillModel(e.target.value as FillModel)}
                className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-1.5 font-mono text-xs text-white"
              >
                <option value="MIDPOINT">MIDPOINT (Bid/Ask Mid)</option>
                <option value="NATURAL_BID_ASK">NATURAL BID/ASK</option>
                <option value="SLIPPAGE_ADJUSTED">SLIPPAGE ADJUSTED</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewAccountModal(false)}
              className="rounded-lg border border-[#1E2D45] px-3 py-1.5 text-xs text-[#9BAFC4]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#26D6A0] px-4 py-1.5 text-xs font-bold text-[#0B1220]"
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {/* Account Balance & Execution Model Settings Strip */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-3.5">
            <span className="text-[10px] uppercase text-[#9BAFC4]">
              INITIAL CAPITAL
            </span>
            <div className="mt-1 font-mono text-lg font-bold text-white">
              ${activeAccount.initialCapital.toLocaleString()}
            </div>
            <span className="text-[10px] text-[#9BAFC4]">Virtual allocation</span>
          </div>

          <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-3.5">
            <span className="text-[10px] uppercase text-[#9BAFC4]">
              AVAILABLE BUYING POWER
            </span>
            <div className="mt-1 font-mono text-lg font-bold text-[#26D6A0]">
              ${activeAccount.buyingPower.toLocaleString()}
            </div>
            <span className="text-[10px] text-[#9BAFC4]">
              Cash: ${activeAccount.cashBalance.toLocaleString()}
            </span>
          </div>

          <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-3.5">
            <span className="text-[10px] uppercase text-[#9BAFC4]">
              REALIZED P&L
            </span>
            <div
              className={`mt-1 font-mono text-lg font-bold ${
                activeAccount.realizedPnl >= 0
                  ? 'text-[#22C55E]'
                  : 'text-[#EF4444]'
              }`}
            >
              {activeAccount.realizedPnl >= 0 ? '+' : ''}$
              {activeAccount.realizedPnl.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#9BAFC4]">Closed paper trades</span>
          </div>

          <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-3.5">
            <span className="text-[10px] uppercase text-[#9BAFC4]">
              UNREALIZED P&L
            </span>
            <div
              className={`mt-1 font-mono text-lg font-bold ${
                activeAccount.unrealizedPnl >= 0
                  ? 'text-[#22C55E]'
                  : 'text-[#EF4444]'
              }`}
            >
              {activeAccount.unrealizedPnl >= 0 ? '+' : ''}$
              {activeAccount.unrealizedPnl.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#9BAFC4]">
              {accountPositions.length} open position(s)
            </span>
          </div>
        </div>

        {/* Execution Fill Model Configuration */}
        <div className="xl:col-span-4 rounded-xl border border-[#1E2D45] bg-[#111C2E] p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2">
            <Sliders className="h-3.5 w-3.5 text-[#26D6A0]" />
            <span>Simulated Execution Model Settings</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-[#9BAFC4] mb-1">
                Fill Model
              </label>
              <select
                value={activeAccount.fillModel}
                onChange={(e) =>
                  updateAccountSettings(activeAccount.id, {
                    fillModel: e.target.value as FillModel,
                  })
                }
                className="w-full rounded border border-[#1E2D45] bg-[#0B1220] px-2 py-1 font-mono text-[11px] text-white"
              >
                <option value="MIDPOINT">MIDPOINT</option>
                <option value="NATURAL_BID_ASK">BID / ASK</option>
                <option value="SLIPPAGE_ADJUSTED">SLIPPAGE</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#9BAFC4] mb-1">
                Fee / Contract ($)
              </label>
              <input
                type="number"
                step="0.05"
                value={activeAccount.commissionPerContract}
                onChange={(e) =>
                  updateAccountSettings(activeAccount.id, {
                    commissionPerContract: Number(e.target.value),
                  })
                }
                className="w-full rounded border border-[#1E2D45] bg-[#0B1220] px-2 py-1 font-mono text-[11px] text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#9BAFC4] mb-1">
                Slippage (pts)
              </label>
              <input
                type="number"
                step="0.05"
                value={activeAccount.slippagePerContract}
                onChange={(e) =>
                  updateAccountSettings(activeAccount.id, {
                    slippagePerContract: Number(e.target.value),
                  })
                }
                className="w-full rounded border border-[#1E2D45] bg-[#0B1220] px-2 py-1 font-mono text-[11px] text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Open Positions | Order Book | Execution Fills */}
      <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2D45] pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('POSITIONS')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'POSITIONS'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'bg-[#0B1220] text-[#9BAFC4] hover:text-white'
              }`}
            >
              Open Paper Positions ({accountPositions.length})
            </button>
            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'ORDERS'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'bg-[#0B1220] text-[#9BAFC4] hover:text-white'
              }`}
            >
              Paper Order Book ({accountOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('EXECUTIONS')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'EXECUTIONS'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'bg-[#0B1220] text-[#9BAFC4] hover:text-white'
              }`}
            >
              Individual Leg Executions ({accountExecutions.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Open Positions */}
        {activeTab === 'POSITIONS' && (
          <div>
            {accountPositions.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#9BAFC4]">
                No open positions in {activeAccount.name}. Use Strategy Lab or Options Chain to open a simulated trade.
              </div>
            ) : (
              <div className="space-y-3">
                {accountPositions.map((pos) => (
                  <div
                    key={pos.id}
                    className="rounded-xl border border-[#1E2D45] bg-[#0B1220] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2D45] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {pos.strategyName}
                          </span>
                          <span className="rounded bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#26D6A0]">
                            {pos.quantity}x Contracts • Multiplier 100
                          </span>
                          <span className="rounded bg-[#111C2E] px-2 py-0.5 font-mono text-[10px] text-[#9BAFC4]">
                            Last Review Action: {pos.monitoringAction}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#9BAFC4]">
                          Entry Reason: {pos.entryReason} • Opened:{' '}
                          {new Date(pos.openedAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right font-mono">
                          <span className="block text-[10px] text-[#9BAFC4]">
                            UNREALIZED P&L
                          </span>
                          <span
                            className={`text-base font-bold ${
                              pos.unrealizedPnl >= 0
                                ? 'text-[#22C55E]'
                                : 'text-[#EF4444]'
                            }`}
                          >
                            {pos.unrealizedPnl >= 0 ? '+' : ''}$
                            {pos.unrealizedPnl.toFixed(2)} ({pos.unrealizedPnlPct >= 0 ? '+' : ''}
                            {pos.unrealizedPnlPct.toFixed(2)}%)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              performPositionMonitoringAction(pos.id, 'HOLD')
                            }
                            className="rounded-lg border border-[#1E2D45] bg-[#111C2E] px-2.5 py-1.5 text-xs font-semibold text-[#9BAFC4] hover:text-white"
                          >
                            HOLD
                          </button>
                          <button
                            onClick={() =>
                              performPositionMonitoringAction(pos.id, 'REVIEW')
                            }
                            className="rounded-lg border border-[#26D6A0]/40 bg-[#26D6A0]/10 px-2.5 py-1.5 text-xs font-semibold text-[#26D6A0]"
                          >
                            REVIEW
                          </button>
                          <button
                            onClick={() =>
                              closePaperPosition(
                                pos.id,
                                0.5,
                                'Manual 50% Partial Close'
                              )
                            }
                            className="rounded-lg bg-[#F59E0B]/20 px-2.5 py-1.5 text-xs font-semibold text-[#F59E0B] hover:bg-[#F59E0B]/30"
                          >
                            PARTIAL CLOSE (50%)
                          </button>
                          <button
                            onClick={() =>
                              closePaperPosition(
                                pos.id,
                                1,
                                'Manual 100% Full Close'
                              )
                            }
                            className="rounded-lg bg-[#EF4444] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#EF4444]/90"
                          >
                            FULL CLOSE
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Position Legs Breakdown */}
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
                      {pos.legs.map((leg) => (
                        <div
                          key={leg.occSymbol}
                          className="rounded-lg border border-[#1E2D45] bg-[#111C2E] p-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={
                                leg.side.startsWith('BUY')
                                  ? 'text-[#22C55E] font-bold'
                                  : 'text-[#EF4444] font-bold'
                              }
                            >
                              {leg.side.startsWith('BUY') ? 'LONG' : 'SHORT'}{' '}
                              {leg.strike} {leg.optionType}
                            </span>
                            <span className="text-[10px] text-[#9BAFC4]">
                              {leg.occSymbol}
                            </span>
                          </div>
                          <div className="mt-1 flex justify-between text-[11px] text-[#9BAFC4]">
                            <span>Entry: ${leg.entryPrice.toFixed(2)}</span>
                            <span className="text-white">
                              Mark: ${leg.currentMark.toFixed(2)}
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] text-[#9BAFC4]">
                            Δ {leg.delta} | Γ {leg.gamma} | Θ {leg.theta}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Paper Orders */}
        {activeTab === 'ORDERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#1E2D45] text-[10px] uppercase text-[#9BAFC4]">
                  <th className="py-2 px-2">Order ID</th>
                  <th className="py-2 px-2">Action / Strategy</th>
                  <th className="py-2 px-2">Type / Model</th>
                  <th className="py-2 px-2">Qty</th>
                  <th className="py-2 px-2">Fill / Limit Px</th>
                  <th className="py-2 px-2">Fees / Slippage</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2D45]/60">
                {accountOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#16243B]">
                    <td className="py-2.5 px-2 font-bold text-[#26D6A0]">
                      {ord.id}
                    </td>
                    <td className="py-2.5 px-2 font-sans">
                      <div className="font-semibold text-white">
                        {ord.action} — {ord.strategyName}
                      </div>
                      <div className="font-mono text-[11px] text-[#9BAFC4]">
                        {ord.legsSummary}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-[#9BAFC4]">
                      {ord.orderType} ({ord.fillModelUsed})
                    </td>
                    <td className="py-2.5 px-2 text-white">
                      {ord.filledQty}/{ord.requestedQty}
                    </td>
                    <td className="py-2.5 px-2 text-white">
                      $
                      {(
                        ord.filledAvgPrice ??
                        ord.limitPrice ??
                        ord.naturalMidpoint
                      ).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-[#9BAFC4]">
                      ${ord.fees.toFixed(2)} / ${ord.slippage.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          ord.status === 'FILLED'
                            ? 'bg-[#22C55E]/15 text-[#22C55E]'
                            : ord.status === 'PENDING'
                              ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                              : ord.status === 'PARTIALLY_FILLED'
                                ? 'bg-[#38BDF8]/15 text-[#38BDF8]'
                                : 'bg-[#EF4444]/15 text-[#EF4444]'
                        }`}
                      >
                        {ord.status} (SIMULATED)
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {ord.status === 'PENDING' && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => fillPendingOrder(ord.id)}
                            className="flex items-center gap-1 rounded bg-[#22C55E]/20 px-2 py-1 text-[10px] font-bold text-[#22C55E]"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Sim Fill
                          </button>
                          <button
                            onClick={() => cancelPendingOrder(ord.id)}
                            className="flex items-center gap-1 rounded bg-[#EF4444]/20 px-2 py-1 text-[10px] font-bold text-[#EF4444]"
                          >
                            <XCircle className="h-3 w-3" /> Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Individual Leg Executions */}
        {activeTab === 'EXECUTIONS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#1E2D45] text-[10px] uppercase text-[#9BAFC4]">
                  <th className="py-2 px-2">Execution ID</th>
                  <th className="py-2 px-2">Order ID</th>
                  <th className="py-2 px-2">OCC Contract Symbol</th>
                  <th className="py-2 px-2">Side</th>
                  <th className="py-2 px-2">Fill Qty</th>
                  <th className="py-2 px-2">Fill Price</th>
                  <th className="py-2 px-2">Commission</th>
                  <th className="py-2 px-2">Fill Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2D45]/60">
                {accountExecutions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-[#16243B]">
                    <td className="py-2 px-2 text-[#26D6A0]">{ex.id}</td>
                    <td className="py-2 px-2 text-white">{ex.orderId}</td>
                    <td className="py-2 px-2 font-bold text-white">
                      {ex.occSymbol}
                    </td>
                    <td
                      className={`py-2 px-2 font-bold ${
                        ex.side.startsWith('BUY')
                          ? 'text-[#22C55E]'
                          : 'text-[#EF4444]'
                      }`}
                    >
                      {ex.side}
                    </td>
                    <td className="py-2 px-2 text-white">{ex.fillQty}</td>
                    <td className="py-2 px-2 text-white">
                      ${ex.fillPrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-[#9BAFC4]">
                      ${ex.fee.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-[#9BAFC4]">
                      {ex.fillModel} (SIM)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
