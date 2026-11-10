import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Filter,
  FlaskConical,
  Layers,
  Search,
  Trash2,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { EXPIRATION_DATES } from '../lib/optionsEngine';
import { Moneyness, OptionContract } from '../types/trading';

export const OptionsChainPage: React.FC = () => {
  const {
    market,
    optionsChain,
    selectedExpiration,
    setSelectedExpiration,
    customBuilderLegs,
    addContractToBuilder,
    clearBuilderLegs,
    setActiveSection,
  } = useTrading();

  const [moneynessFilter, setMoneynessFilter] = useState<'ALL' | Moneyness>(
    'ALL'
  );
  const [sideFilter, setSideFilter] = useState<'BOTH' | 'CALLS' | 'PUTS'>(
    'BOTH'
  );
  const [strikeSearch, setStrikeSearch] = useState<string>('');

  const strikes = useMemo(() => {
    const unique = Array.from(
      new Set(optionsChain.map((c) => c.strike))
    ).sort((a, b) => a - b);

    return unique.filter((strike) => {
      if (strikeSearch && !String(strike).includes(strikeSearch.trim())) {
        return false;
      }
      if (moneynessFilter === 'ATM') {
        return Math.abs(strike - market.atmStrike) <= 5;
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
  }, [optionsChain, strikeSearch, moneynessFilter, sideFilter, market]);

  const getContract = (
    strike: number,
    type: 'CALL' | 'PUT'
  ): OptionContract | undefined =>
    optionsChain.find((c) => c.strike === strike && c.optionType === type);

  return (
    <div className="space-y-4">
      {/* Header & Provider Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#26D6A0]/15 text-[#26D6A0]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">
                SPX Interactive Options Chain (Multiplier: 100)
              </h1>
              <span className="rounded bg-[#F59E0B]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#F59E0B]">
                DATA SOURCE: SIMULATED_DEMO
              </span>
            </div>
            <p className="text-xs text-[#9BAFC4]">
              SPX Index Spot: {market.spotPrice.toFixed(2)} • ATM Strike:{' '}
              {market.atmStrike} • Quote Timestamp:{' '}
              {new Date(market.lastUpdated).toLocaleTimeString()} • Click Bid to SELL or Ask to BUY into Multi-Leg Builder
            </p>
          </div>
        </div>

        {/* Expiration Selector */}
        <div className="flex items-center gap-2">
          {EXPIRATION_DATES.map((exp) => (
            <button
              key={exp.date}
              onClick={() => setSelectedExpiration(exp.date)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition ${
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

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] p-3">
        <div className="flex flex-wrap items-center gap-2">
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

          <span className="text-xs font-semibold text-[#9BAFC4]">Display:</span>
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
              {side}
            </button>
          ))}
        </div>

        {/* Strike Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#9BAFC4]" />
          <input
            type="text"
            placeholder="Filter strike (e.g. 5985)..."
            value={strikeSearch}
            onChange={(e) => setStrikeSearch(e.target.value)}
            className="rounded-lg border border-[#1E2D45] bg-[#0B1220] pl-8 pr-3 py-1 font-mono text-xs text-white focus:border-[#26D6A0] focus:outline-none"
          />
        </div>
      </div>

      {/* Multi-Leg Selection Basket (When legs selected) */}
      {customBuilderLegs.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#26D6A0] bg-[#26D6A0]/10 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#26D6A0]">
              Selected Multi-Leg Basket ({customBuilderLegs.length}):
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
                {leg.contract.strike} {leg.contract.optionType} @ $
                {leg.entryPrice.toFixed(2)}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearBuilderLegs}
              className="flex items-center gap-1 rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 text-xs text-[#9BAFC4] hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
            <button
              onClick={() => setActiveSection('strategy-lab')}
              className="flex items-center gap-1.5 rounded-lg bg-[#26D6A0] px-3 py-1.5 text-xs font-bold text-[#0B1220]"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Analyze & Trade in Strategy Lab</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Options Chain Table */}
      <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] overflow-hidden">
        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="sticky top-0 z-10 bg-[#0B1220] border-b border-[#1E2D45] text-[10px] uppercase text-[#9BAFC4]">
              <tr>
                {sideFilter !== 'PUTS' && (
                  <>
                    <th className="py-2.5 px-2">OI / Vol</th>
                    <th className="py-2.5 px-2">IV</th>
                    <th className="py-2.5 px-2">Δ / Γ</th>
                    <th className="py-2.5 px-2">Θ / V</th>
                    <th className="py-2.5 px-2 text-right">Call Bid (Sell)</th>
                    <th className="py-2.5 px-2 text-right">Call Mid</th>
                    <th className="py-2.5 px-2 text-right">Call Ask (Buy)</th>
                  </>
                )}
                <th className="py-2.5 px-3 text-center bg-[#16243B] text-white font-bold border-x border-[#1E2D45]">
                  STRIKE
                </th>
                {sideFilter !== 'CALLS' && (
                  <>
                    <th className="py-2.5 px-2">Put Bid (Sell)</th>
                    <th className="py-2.5 px-2">Put Mid</th>
                    <th className="py-2.5 px-2">Put Ask (Buy)</th>
                    <th className="py-2.5 px-2">Δ / Γ</th>
                    <th className="py-2.5 px-2">Θ / V</th>
                    <th className="py-2.5 px-2">IV</th>
                    <th className="py-2.5 px-2 text-right">Vol / OI</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D45]/60">
              {strikes.map((strike) => {
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
                    {sideFilter !== 'PUTS' && call && (
                      <>
                        <td
                          className={`py-2 px-2 text-[#9BAFC4] ${
                            callItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          {call.openInterest.toLocaleString()} / {call.volume}
                        </td>
                        <td
                          className={`py-2 px-2 text-[#9BAFC4] ${
                            callItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          {(call.impliedVolatility * 100).toFixed(1)}%
                        </td>
                        <td
                          className={`py-2 px-2 text-white ${
                            callItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          {call.delta.toFixed(2)} / {call.gamma.toFixed(3)}
                        </td>
                        <td
                          className={`py-2 px-2 text-[#9BAFC4] ${
                            callItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          {call.theta.toFixed(1)} / {call.vega.toFixed(1)}
                        </td>
                        <td
                          className={`py-2 px-2 text-right ${
                            callItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          <button
                            onClick={() =>
                              addContractToBuilder(call, 'SELL_TO_OPEN')
                            }
                            className="rounded bg-[#EF4444]/15 px-2 py-0.5 text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition"
                            title="Sell to Open Call"
                          >
                            {call.bid.toFixed(2)}
                          </button>
                        </td>
                        <td
                          className={`py-2 px-2 text-right font-bold text-white ${
                            callItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          {call.midpoint.toFixed(2)}
                        </td>
                        <td
                          className={`py-2 px-2 text-right ${
                            callItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          <button
                            onClick={() =>
                              addContractToBuilder(call, 'BUY_TO_OPEN')
                            }
                            className="rounded bg-[#22C55E]/15 px-2 py-0.5 text-[#22C55E] hover:bg-[#22C55E] hover:text-[#0B1220] transition"
                            title="Buy to Open Call"
                          >
                            {call.ask.toFixed(2)}
                          </button>
                        </td>
                      </>
                    )}

                    {/* Center Strike Column */}
                    <td className="py-2 px-3 text-center bg-[#0B1220] font-bold text-white border-x border-[#1E2D45]">
                      <span>{strike}</span>
                      {isAtm && (
                        <span className="ml-1.5 rounded bg-[#26D6A0] px-1.5 py-0.5 text-[9px] font-bold text-[#0B1220]">
                          ATM
                        </span>
                      )}
                    </td>

                    {sideFilter !== 'CALLS' && put && (
                      <>
                        <td
                          className={`py-2 px-2 ${
                            putItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          <button
                            onClick={() =>
                              addContractToBuilder(put, 'SELL_TO_OPEN')
                            }
                            className="rounded bg-[#EF4444]/15 px-2 py-0.5 text-[#EF4444] hover:bg-[#EF4444] hover:text-white transition"
                            title="Sell to Open Put"
                          >
                            {put.bid.toFixed(2)}
                          </button>
                        </td>
                        <td
                          className={`py-2 px-2 font-bold text-white ${
                            putItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          {put.midpoint.toFixed(2)}
                        </td>
                        <td
                          className={`py-2 px-2 ${
                            putItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          <button
                            onClick={() =>
                              addContractToBuilder(put, 'BUY_TO_OPEN')
                            }
                            className="rounded bg-[#22C55E]/15 px-2 py-0.5 text-[#22C55E] hover:bg-[#22C55E] hover:text-[#0B1220] transition"
                            title="Buy to Open Put"
                          >
                            {put.ask.toFixed(2)}
                          </button>
                        </td>
                        <td
                          className={`py-2 px-2 text-white ${
                            putItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          {put.delta.toFixed(2)} / {put.gamma.toFixed(3)}
                        </td>
                        <td
                          className={`py-2 px-2 text-[#9BAFC4] ${
                            putItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          {put.theta.toFixed(1)} / {put.vega.toFixed(1)}
                        </td>
                        <td
                          className={`py-2 px-2 text-[#9BAFC4] ${
                            putItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          {(put.impliedVolatility * 100).toFixed(1)}%
                        </td>
                        <td
                          className={`py-2 px-2 text-right text-[#9BAFC4] ${
                            putItm ? 'bg-[#26D6A0]/5' : ''
                          }`}
                        >
                          {put.volume} / {put.openInterest.toLocaleString()}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
