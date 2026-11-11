import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  FlaskConical,
  Layers,
  Percent,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { EXPIRATION_DATES } from '../lib/optionsEngine';
import { Moneyness, OptionContract, OrderSide } from '../types/trading';

const QUICK_STOCK_SYMBOLS = [
  'SPX',
  'SPY',
  'QQQ',
  'NVDA',
  'AAPL',
  'TSLA',
  'MSFT',
  'META',
  'AMD',
  'AMZN',
  'PLTR',
  'SMCI',
  'IWM',
  'COIN',
  'SOFI',
  'BMR',
  'LUNR',
];

export const OptionsChainPage: React.FC = () => {
  const {
    market,
    activeSymbol,
    selectTradingSymbol,
    optionsChain,
    selectedExpiration,
    setSelectedExpiration,
    customBuilderLegs,
    addContractToBuilder,
    clearBuilderLegs,
    setActiveSection,
    placePaperOrder,
    activeAccount,
  } = useTrading();

  // Custom symbol input
  const [symbolInput, setSymbolInput] = useState<string>(activeSymbol);
  const [moneynessFilter, setMoneynessFilter] = useState<'ALL' | Moneyness>('ALL');
  const [sideFilter, setSideFilter] = useState<'BOTH' | 'CALLS' | 'PUTS'>('BOTH');
  const [strikeSearch, setStrikeSearch] = useState<string>('');
  const [strikeRangeLimit, setStrikeRangeLimit] = useState<number>(30); // 10, 20, 30, or all

  // 1-Contract Order Confirmation Modal
  const [pendingOrderContract, setPendingOrderContract] = useState<{
    contract: OptionContract;
    side: OrderSide;
  } | null>(null);
  const [orderSubmittedMessage, setOrderSubmittedMessage] = useState<string | null>(null);

  const handleSymbolSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = symbolInput.trim().toUpperCase();
    if (clean) {
      selectTradingSymbol(clean);
    }
  };

  const handleSelectQuickSymbol = (sym: string) => {
    setSymbolInput(sym);
    selectTradingSymbol(sym);
  };

  const strikes = useMemo(() => {
    const unique = Array.from(new Set(optionsChain.map((c) => c.strike))).sort(
      (a, b) => a - b
    );

    let filtered = unique.filter((strike) => {
      if (strikeSearch && !String(strike).includes(strikeSearch.trim())) {
        return false;
      }
      if (moneynessFilter === 'ATM') {
        const threshold = market.spotPrice > 500 ? 15 : 2.5;
        return Math.abs(strike - market.atmStrike) <= threshold;
      }
      if (moneynessFilter === 'ITM') {
        return sideFilter === 'PUTS'
          ? strike > market.spotPrice
          : strike < market.spotPrice;
      }
      if (moneynessFilter === 'OTM') {
        return sideFilter === 'PUTS'
          ? strike < market.spotPrice
          : strike > market.spotPrice;
      }
      return true;
    });

    if (strikeRangeLimit && filtered.length > strikeRangeLimit) {
      // Keep strikes centered around ATM
      const atmIndex = filtered.findIndex((s) => s >= market.atmStrike);
      const half = Math.floor(strikeRangeLimit / 2);
      const start = Math.max(0, (atmIndex === -1 ? 0 : atmIndex) - half);
      filtered = filtered.slice(start, start + strikeRangeLimit);
    }

    return filtered;
  }, [
    optionsChain,
    strikeSearch,
    moneynessFilter,
    sideFilter,
    market,
    strikeRangeLimit,
  ]);

  const getContract = (
    strike: number,
    type: 'CALL' | 'PUT'
  ): OptionContract | undefined =>
    optionsChain.find((c) => c.strike === strike && c.optionType === type);

  // Instant 1-Contract Execution (Strict 1-Quantity Rule)
  const handleQuickOrderClick = (contract: OptionContract, side: OrderSide) => {
    setPendingOrderContract({ contract, side });
  };

  const handleConfirmSingleContractOrder = () => {
    if (!pendingOrderContract) return;
    const { contract, side } = pendingOrderContract;

    const res = placePaperOrder({
      accountId: activeAccount.id,
      strategyCode: contract.optionType === 'CALL' ? 'ATM_LONG_CALL' : 'ATM_LONG_PUT',
      strategyName: `${contract.underlyingSymbol} 1-Qty ${contract.optionType}`,
      legs: [
        {
          id: `leg-${Date.now()}`,
          contract,
          side,
          ratio: 1,
          contracts: 1,
          entryPrice: side.startsWith('BUY') ? contract.ask : contract.bid,
        },
      ],
      contracts: 1, // STRICT 1 QUANTITY RULE
      orderType: 'LIMIT',
      limitPrice: side.startsWith('BUY') ? contract.ask : contract.bid,
      entryReason: 'Strict 1-contract options chain execution',
    });

    setPendingOrderContract(null);
    if (res.success && res.order) {
      const priceStr =
        res.order.limitPrice !== undefined
          ? res.order.limitPrice.toFixed(2)
          : contract.midpoint.toFixed(2);
      setOrderSubmittedMessage(
        `✓ Filled 1 Contract ${contract.underlyingSymbol} $${contract.strike} ${contract.optionType} @ $${priceStr}`
      );
      setTimeout(() => setOrderSubmittedMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Stock Symbol Input & Live Market Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#26D6A0]/15 text-[#26D6A0]">
            <Layers className="h-6 w-6" />
          </div>

          {/* Symbol Input Form */}
          <div>
            <form onSubmit={handleSymbolSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9BAFC4]" />
                <input
                  type="text"
                  placeholder="Enter Stock Symbol (e.g. NVDA, TSLA, AAPL, PLTR)..."
                  value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                  className="w-56 rounded-xl border border-[#26D6A0]/40 bg-[#0B1220] pl-9 pr-3 py-1.5 font-mono text-sm font-black text-[#26D6A0] placeholder-[#9BAFC4]/60 focus:border-[#26D6A0] focus:ring-1 focus:ring-[#26D6A0] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-[#26D6A0] px-3.5 py-1.5 font-mono text-xs font-black text-[#0B1220] hover:bg-[#22C55E] transition"
              >
                Load Chain
              </button>
            </form>

            <div className="mt-1 flex items-center gap-2 text-xs text-[#9BAFC4]">
              <span>Active: <strong className="text-white font-mono text-sm">{activeSymbol}</strong></span>
              <span>•</span>
              <span>Spot: <strong className="text-white font-mono">${market.spotPrice.toFixed(2)}</strong></span>
              <span
                className={`font-mono font-bold ${
                  market.dailyChange >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
              >
                {market.dailyChange >= 0 ? '+' : ''}
                {market.dailyChange.toFixed(2)} ({market.dailyChangePct.toFixed(2)}%)
              </span>
              <span>•</span>
              <span>ATM Strike: <strong className="text-[#26D6A0] font-mono">{market.atmStrike}</strong></span>
              <span>•</span>
              <span>IV30: <strong className="text-white font-mono">{market.vix.toFixed(1)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Open Chart & Screener */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center gap-1.5 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 font-mono text-xs font-bold text-[#9BAFC4] hover:border-[#26D6A0] hover:text-[#26D6A0] transition"
            title="Open 1m BB/MACD Chart for this symbol"
          >
            <BarChart2 className="h-4 w-4" />
            <span>Open Chart</span>
          </button>

          <button
            onClick={() => setActiveSection('screener')}
            className="flex items-center gap-1.5 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3 py-2 font-mono text-xs font-bold text-[#9BAFC4] hover:border-[#F59E0B] hover:text-[#F59E0B] transition"
            title="Open Market Screener"
          >
            <Flame className="h-4 w-4" />
            <span>Screener</span>
          </button>
        </div>
      </div>

      {/* Quick Symbol Chips */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#1E2D45] bg-[#111C2E] p-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BAFC4] mr-1.5">
          Quick Symbols:
        </span>
        {QUICK_STOCK_SYMBOLS.map((sym) => (
          <button
            key={sym}
            onClick={() => handleSelectQuickSymbol(sym)}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
              activeSymbol === sym
                ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white hover:border-[#26D6A0]/50'
            }`}
          >
            {sym}
          </button>
        ))}
      </div>

      {/* Expirations Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#26D6A0]" />
          <span className="text-xs font-bold text-[#9BAFC4]">Expiration Dates:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {EXPIRATION_DATES.map((exp) => (
            <button
              key={exp.date}
              onClick={() => setSelectedExpiration(exp.date)}
              className={`rounded-lg px-3 py-1 font-mono text-xs font-bold transition ${
                selectedExpiration === exp.date
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
              }`}
            >
              {exp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Moneyness Filter */}
          <span className="flex items-center gap-1 text-xs font-semibold text-[#9BAFC4]">
            <Filter className="h-3.5 w-3.5 text-[#26D6A0]" /> Moneyness:
          </span>
          {(['ALL', 'ATM', 'ITM', 'OTM'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMoneynessFilter(m)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                moneynessFilter === m
                  ? 'bg-[#26D6A0]/20 text-[#26D6A0] border border-[#26D6A0]/40'
                  : 'bg-[#0B1220] text-[#9BAFC4] hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}

          <div className="h-5 w-px bg-[#1E2D45] mx-1" />

          {/* Side Filter */}
          <span className="text-xs font-semibold text-[#9BAFC4]">Side:</span>
          {(['BOTH', 'CALLS', 'PUTS'] as const).map((side) => (
            <button
              key={side}
              onClick={() => setSideFilter(side)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                sideFilter === side
                  ? 'bg-[#26D6A0]/20 text-[#26D6A0] border border-[#26D6A0]/40'
                  : 'bg-[#0B1220] text-[#9BAFC4] hover:text-white'
              }`}
            >
              {side === 'BOTH' ? 'Calls & Puts' : side}
            </button>
          ))}

          <div className="h-5 w-px bg-[#1E2D45] mx-1" />

          {/* Strikes Range Selector */}
          <span className="text-xs font-semibold text-[#9BAFC4]">Strikes:</span>
          {[10, 20, 30, 0].map((num) => (
            <button
              key={num}
              onClick={() => setStrikeRangeLimit(num)}
              className={`rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${
                strikeRangeLimit === num
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'bg-[#0B1220] text-[#9BAFC4] hover:text-white'
              }`}
            >
              {num === 0 ? 'All' : `±${num}`}
            </button>
          ))}
        </div>

        {/* Strike Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#9BAFC4]" />
          <input
            type="text"
            placeholder="Search strike..."
            value={strikeSearch}
            onChange={(e) => setStrikeSearch(e.target.value)}
            className="rounded-lg border border-[#1E2D45] bg-[#0B1220] pl-8 pr-3 py-1 font-mono text-xs text-white focus:border-[#26D6A0] focus:outline-none"
          />
        </div>
      </div>

      {/* Order Confirmed Toast */}
      {orderSubmittedMessage && (
        <div className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/15 p-3 font-mono text-xs font-extrabold text-[#22C55E] animate-bounce">
          {orderSubmittedMessage}
        </div>
      )}

      {/* Multi-Leg Basket Banner if Legs Selected */}
      {customBuilderLegs.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#26D6A0] bg-[#26D6A0]/10 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#26D6A0]">
              Multi-Leg Strategy Builder ({customBuilderLegs.length} Legs):
            </span>
            {customBuilderLegs.map((leg) => (
              <span
                key={leg.id}
                className="rounded border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1 font-mono text-xs text-white"
              >
                <strong
                  className={
                    leg.side.startsWith('BUY')
                      ? 'text-[#22C55E]'
                      : 'text-[#EF4444]'
                  }
                >
                  {leg.side.startsWith('BUY') ? 'BUY' : 'SELL'}
                </strong>{' '}
                {leg.contract.underlyingSymbol} ${leg.contract.strike}{' '}
                {leg.contract.optionType}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('strategy-lab')}
              className="flex items-center gap-1 rounded-lg bg-[#26D6A0] px-3 py-1.5 font-mono text-xs font-black text-[#0B1220] hover:bg-[#22C55E] transition"
            >
              <span>Analyze in Strategy Lab</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={clearBuilderLegs}
              className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/15 p-1.5 text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition"
              title="Clear multi-leg basket"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Options Chain Data Table */}
      <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              {/* Primary Calls vs Puts Group Header */}
              <tr className="border-b border-[#1E2D45] bg-[#0B1220] text-center text-xs font-extrabold uppercase">
                {sideFilter !== 'PUTS' && (
                  <th
                    colSpan={7}
                    className="py-2.5 text-[#22C55E] border-r border-[#1E2D45]"
                  >
                    CALLS (Click Ask to BUY 1-Qty • Click Bid to SELL)
                  </th>
                )}
                <th className="py-2.5 px-4 text-white bg-[#111C2E]">STRIKE</th>
                {sideFilter !== 'CALLS' && (
                  <th
                    colSpan={7}
                    className="py-2.5 text-[#EF4444] border-l border-[#1E2D45]"
                  >
                    PUTS (Click Ask to BUY 1-Qty • Click Bid to SELL)
                  </th>
                )}
              </tr>

              {/* Column Level Headers */}
              <tr className="border-b border-[#1E2D45] bg-[#16243B] text-[10px] font-bold uppercase text-[#9BAFC4]">
                {sideFilter !== 'PUTS' && (
                  <>
                    <th className="py-2 px-2">OI / Vol</th>
                    <th className="py-2 px-2">IV</th>
                    <th className="py-2 px-2">Delta / Gamma</th>
                    <th className="py-2 px-2">Theta</th>
                    <th className="py-2 px-2 text-right">Bid (SELL)</th>
                    <th className="py-2 px-2 text-right text-white">Mid</th>
                    <th className="py-2 px-2 text-right">Ask (BUY)</th>
                  </>
                )}
                <th className="py-2 px-3 text-center bg-[#0B1220] text-white">
                  Moneyness
                </th>
                {sideFilter !== 'CALLS' && (
                  <>
                    <th className="py-2 px-2">Bid (SELL)</th>
                    <th className="py-2 px-2 text-white">Mid</th>
                    <th className="py-2 px-2">Ask (BUY)</th>
                    <th className="py-2 px-2">Delta / Gamma</th>
                    <th className="py-2 px-2">Theta</th>
                    <th className="py-2 px-2">IV</th>
                    <th className="py-2 px-2 text-right">Vol / OI</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D45]/50">
              {strikes.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-sm text-[#9BAFC4]">
                    No option contracts found for strike filter. Try resetting filters.
                  </td>
                </tr>
              ) : (
                strikes.map((strike) => {
                  const call = getContract(strike, 'CALL');
                  const put = getContract(strike, 'PUT');
                  const isAtm = strike === market.atmStrike;
                  const callItm = strike < market.spotPrice;
                  const putItm = strike > market.spotPrice;

                  return (
                    <tr
                      key={strike}
                      className={`${
                        isAtm
                          ? 'bg-[#26D6A0]/15 font-semibold'
                          : 'hover:bg-[#16243B]'
                      }`}
                    >
                      {/* Calls Data Columns */}
                      {sideFilter !== 'PUTS' && call && (
                        <>
                          <td className={`py-2 px-2 text-[#9BAFC4] ${callItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            {call.openInterest.toLocaleString()} / {call.volume}
                          </td>
                          <td className={`py-2 px-2 text-[#9BAFC4] ${callItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            {(call.impliedVolatility * 100).toFixed(1)}%
                          </td>
                          <td className={`py-2 px-2 text-white ${callItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            {call.delta.toFixed(2)} / {call.gamma.toFixed(3)}
                          </td>
                          <td className={`py-2 px-2 text-[#9BAFC4] ${callItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            {call.theta.toFixed(1)}
                          </td>
                          <td className={`py-2 px-2 text-right ${callItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            <button
                              onClick={() => handleQuickOrderClick(call, 'SELL_TO_OPEN')}
                              className="rounded bg-[#EF4444]/15 px-2 py-0.5 text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition"
                              title="Sell Call (Strict 1-Qty Limit)"
                            >
                              ${call.bid.toFixed(2)}
                            </button>
                          </td>
                          <td className={`py-2 px-2 text-right font-bold text-white ${callItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            ${call.midpoint.toFixed(2)}
                          </td>
                          <td className={`py-2 px-2 text-right ${callItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            <button
                              onClick={() => handleQuickOrderClick(call, 'BUY_TO_OPEN')}
                              className="rounded bg-[#22C55E]/15 px-2 py-0.5 font-bold text-[#22C55E] hover:bg-[#22C55E] hover:text-[#0B1220] transition"
                              title="Buy Call (Strict 1-Qty Limit)"
                            >
                              ${call.ask.toFixed(2)}
                            </button>
                          </td>
                        </>
                      )}

                      {/* Center Strike Column */}
                      <td className="py-2 px-3 text-center bg-[#0B1220] font-bold text-white border-x border-[#1E2D45]">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono text-sm">${strike}</span>
                          {isAtm && (
                            <span className="rounded bg-[#26D6A0] px-1.5 py-0.2 font-mono text-[9px] font-black text-[#0B1220]">
                              ATM
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Puts Data Columns */}
                      {sideFilter !== 'CALLS' && put && (
                        <>
                          <td className={`py-2 px-2 ${putItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            <button
                              onClick={() => handleQuickOrderClick(put, 'SELL_TO_OPEN')}
                              className="rounded bg-[#EF4444]/15 px-2 py-0.5 text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition"
                              title="Sell Put (Strict 1-Qty Limit)"
                            >
                              ${put.bid.toFixed(2)}
                            </button>
                          </td>
                          <td className={`py-2 px-2 font-bold text-white ${putItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            ${put.midpoint.toFixed(2)}
                          </td>
                          <td className={`py-2 px-2 ${putItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            <button
                              onClick={() => handleQuickOrderClick(put, 'BUY_TO_OPEN')}
                              className="rounded bg-[#22C55E]/15 px-2 py-0.5 font-bold text-[#22C55E] hover:bg-[#22C55E] hover:text-[#0B1220] transition"
                              title="Buy Put (Strict 1-Qty Limit)"
                            >
                              ${put.ask.toFixed(2)}
                            </button>
                          </td>
                          <td className={`py-2 px-2 text-white ${putItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            {put.delta.toFixed(2)} / {put.gamma.toFixed(3)}
                          </td>
                          <td className={`py-2 px-2 text-[#9BAFC4] ${putItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            {put.theta.toFixed(1)}
                          </td>
                          <td className={`py-2 px-2 text-[#9BAFC4] ${putItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            {(put.impliedVolatility * 100).toFixed(1)}%
                          </td>
                          <td className={`py-2 px-2 text-right text-[#9BAFC4] ${putItm ? 'bg-[#26D6A0]/5' : ''}`}>
                            {put.volume} / {put.openInterest.toLocaleString()}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1-Contract Order Confirmation Modal (Discipline Enforced) */}
      {pendingOrderContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-[#26D6A0] bg-[#111C2E] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-[#1E2D45] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#26D6A0]/15 text-[#26D6A0]">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Confirm Single-Contract Execution
                  </h3>
                  <span className="rounded bg-[#22C55E]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#22C55E]">
                    STRICT 1-QUANTITY DISCIPLINE ENFORCED
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPendingOrderContract(null)}
                className="rounded-lg p-1.5 text-[#9BAFC4] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between rounded-xl bg-[#0B1220] p-3 border border-[#1E2D45]">
                <span className="text-[#9BAFC4]">Contract:</span>
                <span className="font-extrabold text-white">
                  {pendingOrderContract.contract.underlyingSymbol} ${pendingOrderContract.contract.strike} {pendingOrderContract.contract.optionType}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#0B1220] p-3 border border-[#1E2D45]">
                <span className="text-[#9BAFC4]">Action:</span>
                <span className={pendingOrderContract.side.startsWith('BUY') ? 'text-[#22C55E] font-black' : 'text-[#EF4444] font-black'}>
                  {pendingOrderContract.side} (1 CONTRACT ONLY)
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#0B1220] p-3 border border-[#1E2D45]">
                <span className="text-[#9BAFC4]">Premium / Limit:</span>
                <span className="font-extrabold text-white">
                  ${(pendingOrderContract.side.startsWith('BUY')
                    ? pendingOrderContract.contract.ask
                    : pendingOrderContract.contract.bid
                  ).toFixed(2)}{' '}
                  (${(
                    (pendingOrderContract.side.startsWith('BUY')
                      ? pendingOrderContract.contract.ask
                      : pendingOrderContract.contract.bid) * 100
                  ).toFixed(2)}{' '}
                  Total Capital)
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#0B1220] p-3 border border-[#1E2D45]">
                <span className="text-[#9BAFC4]">Greeks (Delta / Theta):</span>
                <span className="text-[#26D6A0]">
                  Δ {pendingOrderContract.contract.delta.toFixed(2)} • Θ ${pendingOrderContract.contract.theta.toFixed(1)}/day
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#1E2D45] pt-3">
              <button
                type="button"
                onClick={() => {
                  addContractToBuilder(pendingOrderContract.contract, pendingOrderContract.side);
                  setPendingOrderContract(null);
                }}
                className="rounded-xl border border-[#1E2D45] bg-[#0B1220] px-4 py-2 font-mono text-xs font-bold text-[#9BAFC4] hover:text-white"
              >
                + Add to Multi-Leg Basket
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleContractOrder}
                className="flex items-center gap-1.5 rounded-xl bg-[#26D6A0] px-5 py-2 font-mono text-xs font-black text-[#0B1220] hover:bg-[#22C55E] shadow-lg shadow-[#26D6A0]/25 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Fill 1-Contract Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OptionsChainPage;
