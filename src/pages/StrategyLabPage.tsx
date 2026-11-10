import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Layers,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTrading } from '../context/TradingContext';
import {
  analyzeStrategy,
  buildStrategyLegs,
  EXPIRATION_DATES,
  STRATEGY_CATALOG,
} from '../lib/optionsEngine';
import {
  OptionType,
  OrderSide,
  OrderType,
  StrategyCategory,
  StrategyCode,
  StrategyLeg,
} from '../types/trading';

const CATEGORY_LABELS: { id: StrategyCategory; label: string }[] = [
  { id: 'DIRECTIONAL', label: 'Directional (6)' },
  { id: 'VOLATILITY', label: 'Volatility (2)' },
  { id: 'DEBIT_SPREAD', label: 'Debit Spreads (2)' },
  { id: 'CREDIT_SPREAD', label: 'Credit Spreads (2)' },
  { id: 'MULTI_LEG', label: 'Multi-Leg Condors/Flies (2)' },
];

export const StrategyLabPage: React.FC = () => {
  const {
    market,
    optionsChain,
    selectedExpiration,
    setSelectedExpiration,
    selectedStrategyCode,
    setSelectedStrategyCode,
    customBuilderLegs,
    setCustomBuilderLegs,
    clearBuilderLegs,
    activeAccount,
    placePaperOrder,
    exitConfig,
    setActiveSection,
  } = useTrading();

  const [activeCategory, setActiveCategory] =
    useState<StrategyCategory>('DEBIT_SPREAD');
  const [contractsCount, setContractsCount] = useState<number>(2);
  const [wingWidthPts, setWingWidthPts] = useState<number>(15);
  const [strikeOffsetSteps, setStrikeOffsetSteps] = useState<number>(0);
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [limitPriceInput, setLimitPriceInput] = useState<string>('');
  const [simulatePartial, setSimulatePartial] = useState<boolean>(false);
  const [orderFeedback, setOrderFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Sync category tab when selectedStrategyCode changes
  useEffect(() => {
    const found = STRATEGY_CATALOG.find(
      (s) => s.code === selectedStrategyCode
    );
    if (found) {
      setActiveCategory(found.category);
    }
  }, [selectedStrategyCode]);

  // Build default strategy legs whenever strategy, expiration, wing width, or offset changes
  const generatedLegs = useMemo(
    () =>
      buildStrategyLegs(
        selectedStrategyCode,
        optionsChain,
        market.spotPrice,
        contractsCount,
        wingWidthPts,
        strikeOffsetSteps
      ),
    [
      selectedStrategyCode,
      optionsChain,
      market.spotPrice,
      contractsCount,
      wingWidthPts,
      strikeOffsetSteps,
    ]
  );

  // Use customBuilderLegs if the user added legs from the Options Chain or customized individual legs
  const activeLegs: StrategyLeg[] =
    customBuilderLegs.length > 0 ? customBuilderLegs : generatedLegs;

  const analysis = useMemo(
    () =>
      analyzeStrategy(
        selectedStrategyCode,
        activeLegs,
        market.spotPrice,
        contractsCount,
        activeAccount.buyingPower,
        activeAccount.commissionPerContract,
        activeAccount.slippagePerContract
      ),
    [
      selectedStrategyCode,
      activeLegs,
      market.spotPrice,
      contractsCount,
      activeAccount,
    ]
  );

  const availableStrikes = useMemo(
    () =>
      Array.from(new Set(optionsChain.map((c) => c.strike))).sort(
        (a, b) => a - b
      ),
    [optionsChain]
  );

  const handleLegChange = (
    index: number,
    updates: {
      side?: OrderSide;
      strike?: number;
      optionType?: OptionType;
      ratio?: number;
    }
  ) => {
    const base = [...activeLegs];
    const current = base[index];
    const targetStrike = updates.strike ?? current.contract.strike;
    const targetType = updates.optionType ?? current.contract.optionType;

    const matchedContract =
      optionsChain.find(
        (c) => c.strike === targetStrike && c.optionType === targetType
      ) || current.contract;

    base[index] = {
      ...current,
      side: updates.side ?? current.side,
      ratio: updates.ratio ?? current.ratio,
      contract: matchedContract,
      entryPrice: matchedContract.midpoint,
    };
    setCustomBuilderLegs(base);
  };

  const handleRemoveLeg = (index: number) => {
    const base = activeLegs.filter((_, idx) => idx !== index);
    setCustomBuilderLegs(base);
  };

  const handleAddLeg = () => {
    const atmCall =
      optionsChain.find(
        (c) => c.strike === market.atmStrike && c.optionType === 'CALL'
      ) || optionsChain[0];
    setCustomBuilderLegs([
      ...activeLegs,
      {
        id: `${atmCall.occSymbol}_${Date.now()}`,
        contract: atmCall,
        side: 'BUY_TO_OPEN',
        ratio: 1,
        contracts: contractsCount,
        entryPrice: atmCall.midpoint,
      },
    ]);
  };

  const handleSubmitPaperTrade = () => {
    const parsedLimit =
      orderType === 'LIMIT' && limitPriceInput
        ? Number(limitPriceInput)
        : analysis.netPremiumPerSpread;

    const result = placePaperOrder({
      accountId: activeAccount.id,
      strategyCode: selectedStrategyCode,
      strategyName:
        customBuilderLegs.length > 0
          ? `${analysis.strategy.name} (Custom)`
          : analysis.strategy.name,
      legs: activeLegs,
      contracts: contractsCount,
      orderType,
      limitPrice: parsedLimit,
      simulatePartialFill: simulatePartial,
      entryReason: `Strategy Lab (${analysis.strategy.name} @ SPX ${market.spotPrice})`,
      profitTargetPct: exitConfig.profitTargetPct,
      stopLossPct: exitConfig.stopLossPct,
      trailingStopPct: exitConfig.trailingStopPct,
    });

    setOrderFeedback(result);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#26D6A0]/15 text-[#26D6A0]">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">
              Strategy Lab — SPX Options Strategy Builder & Payoff Analyzer
            </h1>
            <p className="text-xs text-[#9BAFC4]">
              Configure all 14 directional, volatility, vertical & multi-leg strategies with real-time Black-Scholes Greeks and defined-risk validation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('options-chain')}
            className="flex items-center gap-1.5 rounded-lg border border-[#1E2D45] bg-[#0B1220] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#26D6A0]"
          >
            <Layers className="h-3.5 w-3.5 text-[#26D6A0]" />
            <span>Pick Contracts from Chain</span>
          </button>
          {customBuilderLegs.length > 0 && (
            <button
              onClick={clearBuilderLegs}
              className="flex items-center gap-1 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/15 px-3 py-1.5 text-xs font-semibold text-[#F59E0B]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Preset Legs</span>
            </button>
          )}
        </div>
      </div>

      {/* Strategy Category Tabs & 14 Strategy Selector */}
      <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4 space-y-3">
        <div className="flex flex-wrap gap-2 border-b border-[#1E2D45] pb-3">
          {CATEGORY_LABELS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                const firstInCat = STRATEGY_CATALOG.find(
                  (s) => s.category === cat.id
                );
                if (firstInCat) {
                  clearBuilderLegs();
                  setSelectedStrategyCode(firstInCat.code);
                }
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat.id
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'bg-[#0B1220] text-[#9BAFC4] hover:text-white border border-[#1E2D45]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Strategy Cards within selected Category */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {STRATEGY_CATALOG.filter((s) => s.category === activeCategory).map(
            (strat) => {
              const isSelected = selectedStrategyCode === strat.code;
              return (
                <button
                  key={strat.code}
                  onClick={() => {
                    clearBuilderLegs();
                    setSelectedStrategyCode(strat.code);
                    setOrderFeedback(null);
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? 'border-[#26D6A0] bg-[#26D6A0]/10 shadow-md'
                      : 'border-[#1E2D45] bg-[#0B1220] hover:border-[#26D6A0]/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {strat.name}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                          strat.isCreditStrategy
                            ? 'bg-[#22C55E]/15 text-[#22C55E]'
                            : 'bg-[#26D6A0]/15 text-[#26D6A0]'
                        }`}
                      >
                        {strat.isCreditStrategy ? 'CREDIT' : 'DEBIT'} •{' '}
                        {strat.defaultLegsCount}L
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#9BAFC4] line-clamp-2">
                      {strat.description}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#1E2D45]/70 flex items-center justify-between text-[10px]">
                    <span className="text-[#26D6A0] font-medium">
                      Outlook: {strat.marketOutlook}
                    </span>
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Main Strategy Configuration & Payoff Grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left 7 Columns: Parameters + Option Legs Table + Suitability Warnings */}
        <div className="xl:col-span-7 space-y-4">
          {/* Strategy Parameters Bar */}
          <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-[11px] font-medium text-[#9BAFC4] mb-1">
                  Expiration Date
                </label>
                <select
                  value={selectedExpiration}
                  onChange={(e) => {
                    clearBuilderLegs();
                    setSelectedExpiration(e.target.value);
                  }}
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[#26D6A0] focus:outline-none"
                >
                  {EXPIRATION_DATES.map((exp) => (
                    <option key={exp.date} value={exp.date}>
                      {exp.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#9BAFC4] mb-1">
                  Contracts (Multiplier 100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={contractsCount}
                  onChange={(e) =>
                    setContractsCount(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[#26D6A0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#9BAFC4] mb-1">
                  Spread / Wing Width
                </label>
                <select
                  value={wingWidthPts}
                  onChange={(e) => {
                    clearBuilderLegs();
                    setWingWidthPts(Number(e.target.value));
                  }}
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[#26D6A0] focus:outline-none"
                >
                  <option value={5}>5 pts Wide</option>
                  <option value={10}>10 pts Wide</option>
                  <option value={15}>15 pts Wide</option>
                  <option value={20}>20 pts Wide</option>
                  <option value={25}>25 pts Wide</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#9BAFC4] mb-1">
                  Strike Shift from ATM
                </label>
                <select
                  value={strikeOffsetSteps}
                  onChange={(e) => {
                    clearBuilderLegs();
                    setStrikeOffsetSteps(Number(e.target.value));
                  }}
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[#26D6A0] focus:outline-none"
                >
                  <option value={-2}>-10 pts (Lower Strikes)</option>
                  <option value={-1}>-5 pts (1 Strike Lower)</option>
                  <option value={0}>0 pts (Centered at ATM {market.atmStrike})</option>
                  <option value={1}>+5 pts (1 Strike Higher)</option>
                  <option value={2}>+10 pts (Higher Strikes)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Individual Option Legs Table */}
          <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Individual Option Legs ({activeLegs.length})
                </h2>
                <p className="text-xs text-[#9BAFC4]">
                  Adjust strikes, Call/Put type, or Buy/Sell side to customize your multi-leg structure
                </p>
              </div>
              <button
                onClick={handleAddLeg}
                className="flex items-center gap-1 rounded-lg border border-[#26D6A0]/40 bg-[#26D6A0]/15 px-2.5 py-1 text-xs font-semibold text-[#26D6A0] hover:bg-[#26D6A0]/25"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Leg</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E2D45] text-[10px] uppercase text-[#9BAFC4]">
                    <th className="py-2 px-2">Side</th>
                    <th className="py-2 px-2">Strike</th>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2">Bid / Ask</th>
                    <th className="py-2 px-2">Mid Entry</th>
                    <th className="py-2 px-2">IV</th>
                    <th className="py-2 px-2">Δ / Θ</th>
                    <th className="py-2 px-2 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]/60 font-mono">
                  {activeLegs.map((leg, idx) => {
                    const isBuy = leg.side.startsWith('BUY');
                    return (
                      <tr key={leg.id} className="hover:bg-[#16243B]">
                        <td className="py-2 px-2">
                          <select
                            value={leg.side}
                            onChange={(e) =>
                              handleLegChange(idx, {
                                side: e.target.value as OrderSide,
                              })
                            }
                            className={`rounded px-2 py-1 text-[11px] font-bold ${
                              isBuy
                                ? 'bg-[#22C55E]/15 text-[#22C55E]'
                                : 'bg-[#EF4444]/15 text-[#EF4444]'
                            }`}
                          >
                            <option value="BUY_TO_OPEN">BUY TO OPEN</option>
                            <option value="SELL_TO_OPEN">SELL TO OPEN</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={leg.contract.strike}
                            onChange={(e) =>
                              handleLegChange(idx, {
                                strike: Number(e.target.value),
                              })
                            }
                            className="rounded border border-[#1E2D45] bg-[#0B1220] px-2 py-1 text-xs text-white"
                          >
                            {availableStrikes.map((st) => (
                              <option key={st} value={st}>
                                {st} {st === market.atmStrike ? '(ATM)' : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={leg.contract.optionType}
                            onChange={(e) =>
                              handleLegChange(idx, {
                                optionType: e.target.value as OptionType,
                              })
                            }
                            className="rounded border border-[#1E2D45] bg-[#0B1220] px-2 py-1 text-xs text-white"
                          >
                            <option value="CALL">CALL</option>
                            <option value="PUT">PUT</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-[#9BAFC4]">
                          ${leg.contract.bid.toFixed(2)} / $
                          {leg.contract.ask.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 font-bold text-white">
                          ${leg.entryPrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-[#9BAFC4]">
                          {(leg.contract.impliedVolatility * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-2 text-[11px] text-[#9BAFC4]">
                          {leg.contract.delta.toFixed(2)} /{' '}
                          {leg.contract.theta.toFixed(1)}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {activeLegs.length > 1 && (
                            <button
                              onClick={() => handleRemoveLeg(idx)}
                              className="text-[#9BAFC4] hover:text-[#EF4444]"
                              title="Remove leg"
                            >
                              <Trash2 className="h-3.5 w-3.5 inline" />
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

          {/* Market Suitability & Buying Power Validation Card */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-3.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                <span>Market Regime Suitability Warning</span>
              </div>
              <p className="mt-1.5 text-[#9BAFC4]">
                <strong className="text-white">Ideal Setup:</strong>{' '}
                {analysis.strategy.idealCondition}
              </p>
              <p className="mt-1 text-[#F59E0B]">
                <strong>Caution:</strong> {analysis.strategy.unsuitableWarning}
              </p>
            </div>

            <div
              className={`rounded-xl border p-3.5 text-xs ${
                analysis.buyingPowerValid
                  ? 'border-[#22C55E]/40 bg-[#22C55E]/10'
                  : 'border-[#EF4444]/50 bg-[#EF4444]/15'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-white">
                <ShieldCheck
                  className={`h-4 w-4 ${
                    analysis.buyingPowerValid
                      ? 'text-[#22C55E]'
                      : 'text-[#EF4444]'
                  }`}
                />
                <span>Defined-Risk & Buying Power Check</span>
              </div>
              <p className="mt-1.5 text-[#9BAFC4]">
                {analysis.buyingPowerMessage}
              </p>
              <div className="mt-2 font-mono text-[11px] text-white">
                Est. Fees: ${analysis.estimatedFees.toFixed(2)} • Est. Slippage: $
                {analysis.estimatedSlippage.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Payoff Chart + Combined Economics + Paper Execution Box */}
        <div className="xl:col-span-5 space-y-4">
          {/* Economics Metrics Grid */}
          <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
            <h2 className="text-sm font-bold text-white mb-3">
              Combined Strategy Economics ({contractsCount}x Spread)
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 font-mono">
              <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-2.5">
                <span className="block font-sans text-[10px] text-[#9BAFC4]">
                  {analysis.isCredit ? 'NET CREDIT' : 'NET DEBIT'}
                </span>
                <span className="text-sm font-bold text-white">
                  ${analysis.netPremiumPerSpread.toFixed(2)}
                </span>
                <span className="block text-[10px] text-[#26D6A0]">
                  ${analysis.netDebitOrCreditTotal.toLocaleString()} total
                </span>
              </div>

              <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-2.5">
                <span className="block font-sans text-[10px] text-[#9BAFC4]">
                  MAX PROFIT
                </span>
                <span className="text-sm font-bold text-[#22C55E]">
                  {analysis.maxProfit === 'UNLIMITED'
                    ? 'UNLIMITED'
                    : `$${analysis.maxProfit.toLocaleString()}`}
                </span>
                <span className="block text-[10px] text-[#9BAFC4]">
                  After fees
                </span>
              </div>

              <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-2.5">
                <span className="block font-sans text-[10px] text-[#9BAFC4]">
                  MAX LOSS (RISK)
                </span>
                <span className="text-sm font-bold text-[#EF4444]">
                  -${analysis.maxLoss.toLocaleString()}
                </span>
                <span className="block text-[10px] text-[#9BAFC4]">
                  Defined risk
                </span>
              </div>

              <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-2.5">
                <span className="block font-sans text-[10px] text-[#9BAFC4]">
                  BREAKEVEN(S)
                </span>
                <span className="text-xs font-bold text-white">
                  {analysis.breakevens.length > 0
                    ? analysis.breakevens.join(' / ')
                    : 'N/A'}
                </span>
                <span className="block text-[10px] text-[#9BAFC4]">
                  SPX Index Level
                </span>
              </div>

              <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-2.5">
                <span className="block font-sans text-[10px] text-[#9BAFC4]">
                  RISK / REWARD
                </span>
                <span className="text-xs font-bold text-[#26D6A0]">
                  {analysis.riskRewardRatio}
                </span>
                <span className="block text-[10px] text-[#9BAFC4]">
                  Net ratio
                </span>
              </div>

              <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-2.5">
                <span className="block font-sans text-[10px] text-[#9BAFC4]">
                  NET GREEKS
                </span>
                <span className="text-[11px] font-bold text-white">
                  Δ {analysis.netGreeks.delta} | Θ {analysis.netGreeks.theta}
                </span>
                <span className="block text-[10px] text-[#9BAFC4]">
                  Γ {analysis.netGreeks.gamma} | V {analysis.netGreeks.vega}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive P&L Payoff Chart */}
          <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  P&L Payoff Diagram at Expiration vs. Intraday T+0
                </h3>
                <p className="text-[11px] text-[#9BAFC4]">
                  Solid Green: Expiration P&L • Dashed Cyan: Intraday Theoretical P&L
                </p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analysis.payoffCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                  <XAxis
                    dataKey="underlyingPrice"
                    stroke="#9BAFC4"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#9BAFC4" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1220',
                      borderColor: '#1E2D45',
                      fontSize: '11px',
                    }}
                    formatter={(val: number) => [`$${val.toFixed(2)}`, '']}
                    labelFormatter={(lbl) => `SPX @ ${lbl}`}
                  />
                  <ReferenceLine y={0} stroke="#9BAFC4" strokeDasharray="3 3" />
                  <ReferenceLine
                    x={Math.round(market.spotPrice)}
                    stroke="#F59E0B"
                    label={{
                      value: `Spot ${market.spotPrice}`,
                      fill: '#F59E0B',
                      fontSize: 10,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expirationPnl"
                    name="Expiration P&L"
                    stroke="#26D6A0"
                    strokeWidth={2.4}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="currentTheoPnl"
                    name="Current T+0 Theo"
                    stroke="#38BDF8"
                    strokeWidth={1.6}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Paper Order Submission Box */}
          <div className="rounded-xl border border-[#26D6A0]/40 bg-[#111C2E] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                Send to Paper Trading Engine ({activeAccount.name})
              </span>
              <span className="rounded bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#26D6A0]">
                SIMULATED FILL
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#9BAFC4] mb-1">
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-xs text-white"
                >
                  <option value="MARKET">MARKET ({activeAccount.fillModel})</option>
                  <option value="LIMIT">LIMIT ORDER</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#9BAFC4] mb-1">
                  {orderType === 'LIMIT'
                    ? 'Limit Price ($)'
                    : 'Est. Fill Price ($)'}
                </label>
                <input
                  type="number"
                  step="0.05"
                  disabled={orderType === 'MARKET'}
                  placeholder={analysis.netPremiumPerSpread.toFixed(2)}
                  value={
                    orderType === 'MARKET'
                      ? analysis.netPremiumPerSpread.toFixed(2)
                      : limitPriceInput
                  }
                  onChange={(e) => setLimitPriceInput(e.target.value)}
                  className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-xs text-white disabled:opacity-60"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[#9BAFC4] cursor-pointer">
              <input
                type="checkbox"
                checked={simulatePartial}
                onChange={(e) => setSimulatePartial(e.target.checked)}
                className="rounded border-[#1E2D45] bg-[#0B1220]"
              />
              <span>
                Simulate partial fill execution (fills 50% of contracts initially)
              </span>
            </label>

            <button
              onClick={handleSubmitPaperTrade}
              disabled={!analysis.buyingPowerValid}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#26D6A0] py-2.5 text-xs font-bold text-[#0B1220] hover:bg-[#26D6A0]/90 disabled:opacity-40 transition"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>
                Submit Simulated Paper Order ({contractsCount}x{' '}
                {analysis.strategy.name})
              </span>
            </button>

            {orderFeedback && (
              <div
                className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${
                  orderFeedback.success
                    ? 'border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]'
                    : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">{orderFeedback.message}</div>
                  {orderFeedback.success && (
                    <button
                      onClick={() => setActiveSection('paper-trading')}
                      className="mt-1 underline text-white"
                    >
                      View in Paper Trading Desk →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
