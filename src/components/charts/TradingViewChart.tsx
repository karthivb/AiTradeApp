import React, { useEffect, useRef, useState } from 'react';
import {
  Columns,
  ExternalLink,
  Maximize2,
  Minimize2,
  Sliders,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export interface SymbolPreset {
  symbol: string;
  tvSymbol: string;
  name: string;
  defaultSpot: number;
  strikeStep: number;
  category: 'INDEX' | 'ETF' | 'MAG7';
}

export const SYMBOL_PRESETS: SymbolPreset[] = [
  {
    symbol: 'SPX',
    tvSymbol: 'SP:SPX',
    name: 'S&P 500 Index',
    defaultSpot: 5985.25,
    strikeStep: 5,
    category: 'INDEX',
  },
  {
    symbol: 'SPY',
    tvSymbol: 'AMEX:SPY',
    name: 'SPDR S&P 500 ETF',
    defaultSpot: 597.4,
    strikeStep: 1,
    category: 'ETF',
  },
  {
    symbol: 'QQQ',
    tvSymbol: 'NASDAQ:QQQ',
    name: 'Invesco QQQ Trust',
    defaultSpot: 514.8,
    strikeStep: 1,
    category: 'ETF',
  },
  {
    symbol: 'NVDA',
    tvSymbol: 'NASDAQ:NVDA',
    name: 'NVIDIA Corp',
    defaultSpot: 146.5,
    strikeStep: 2.5,
    category: 'MAG7',
  },
  {
    symbol: 'AAPL',
    tvSymbol: 'NASDAQ:AAPL',
    name: 'Apple Inc',
    defaultSpot: 228.9,
    strikeStep: 2.5,
    category: 'MAG7',
  },
  {
    symbol: 'TSLA',
    tvSymbol: 'NASDAQ:TSLA',
    name: 'Tesla Inc',
    defaultSpot: 324.6,
    strikeStep: 5,
    category: 'MAG7',
  },
  {
    symbol: 'MSFT',
    tvSymbol: 'NASDAQ:MSFT',
    name: 'Microsoft Corp',
    defaultSpot: 426.3,
    strikeStep: 5,
    category: 'MAG7',
  },
  {
    symbol: 'META',
    tvSymbol: 'NASDAQ:META',
    name: 'Meta Platforms',
    defaultSpot: 592.1,
    strikeStep: 5,
    category: 'MAG7',
  },
  {
    symbol: 'AMD',
    tvSymbol: 'NASDAQ:AMD',
    name: 'AMD Inc',
    defaultSpot: 141.2,
    strikeStep: 2.5,
    category: 'MAG7',
  },
  {
    symbol: 'AMZN',
    tvSymbol: 'NASDAQ:AMZN',
    name: 'Amazon.com Inc',
    defaultSpot: 211.4,
    strikeStep: 2.5,
    category: 'MAG7',
  },
  {
    symbol: 'IWM',
    tvSymbol: 'AMEX:IWM',
    name: 'Russell 2000 ETF',
    defaultSpot: 238.5,
    strikeStep: 1,
    category: 'ETF',
  },
  {
    symbol: 'COIN',
    tvSymbol: 'NASDAQ:COIN',
    name: 'Coinbase Global',
    defaultSpot: 298.0,
    strikeStep: 5,
    category: 'MAG7',
  },
];

const SingleTvWidget: React.FC<{
  tvSymbol: string;
  interval: string;
  theme: 'dark' | 'light';
  showBB: boolean;
  showMACD: boolean;
  showVWAP: boolean;
  height: number;
}> = ({ tvSymbol, interval, theme, showBB, showMACD, showVWAP, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    const studies: string[] = [];
    if (showBB) studies.push('STD;Bollinger_Bands');
    if (showMACD) studies.push('STD;MACD');
    if (showVWAP) studies.push('STD;VWAP');

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = `${height}px`;
    widgetContainer.style.width = '100%';
    el.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: interval,
      timezone: 'America/New_York',
      theme: theme === 'light' ? 'light' : 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      withdateranges: true,
      save_image: false,
      calendar: false,
      studies: studies,
      support_host: 'https://www.tradingview.com',
    });

    el.appendChild(script);

    return () => {
      if (el) el.innerHTML = '';
    };
  }, [tvSymbol, interval, theme, showBB, showMACD, showVWAP, height]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full overflow-hidden rounded-xl border border-[#1E2D45]"
      style={{ height: `${height}px` }}
    />
  );
};

export const TradingViewChart: React.FC = () => {
  const { activeSymbol, selectTradingSymbol, theme, market } = useTrading();

  // Default to 1-Minute ('1') chart with BB and MACD enabled by default!
  const [interval, setIntervalState] = useState<'1' | '5' | '15' | '60' | 'D'>(
    '1'
  );
  const [dualDailyAnd1m, setDualDailyAnd1m] = useState<boolean>(false);
  const [showBB, setShowBB] = useState<boolean>(true);
  const [showMACD, setShowMACD] = useState<boolean>(true);
  const [showVWAP, setShowVWAP] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');

  const currentPreset = SYMBOL_PRESETS.find((p) => p.symbol === activeSymbol);
  const tvSymbol = currentPreset
    ? currentPreset.tvSymbol
    : activeSymbol.includes(':')
      ? activeSymbol
      : `NASDAQ:${activeSymbol}`;

  const chartHeight = expanded ? 620 : 440;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    selectTradingSymbol(customInput.trim().toUpperCase());
    setCustomInput('');
  };

  const openExternalTradingView = () => {
    const url = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(
      tvSymbol
    )}&interval=${interval}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4 space-y-3">
      {/* Row 1: Quick Symbol Pills (SPX, SPY, QQQ, NVDA, AAPL, TSLA, MSFT, META, AMD, AMZN, IWM, COIN) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#1E2D45] pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#9BAFC4] mr-1">
            Symbol:
          </span>
          {SYMBOL_PRESETS.map((item) => {
            const isActive = activeSymbol === item.symbol;
            return (
              <button
                key={item.symbol}
                type="button"
                onClick={() => selectTradingSymbol(item.symbol)}
                className={`rounded-xl px-3 py-1.5 font-mono text-xs font-extrabold transition ${
                  isActive
                    ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                    : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:border-[#26D6A0]/50 hover:text-white'
                }`}
                title={`${item.name} (${item.tvSymbol})`}
              >
                {item.symbol}
              </button>
            );
          })}

          {/* Custom Symbol Input */}
          <form onSubmit={handleCustomSubmit} className="flex items-center">
            <input
              type="text"
              placeholder="Other (e.g. NFLX)"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-28 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[#26D6A0] focus:outline-none"
            />
          </form>
        </div>

        {/* Open in TradingView External Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openExternalTradingView}
            className="flex items-center gap-1.5 rounded-xl bg-[#26D6A0]/15 border border-[#26D6A0]/40 px-3 py-1.5 text-xs font-bold text-[#26D6A0] hover:bg-[#26D6A0] hover:text-[#0B1220] transition"
            title="Open Full Interactive Chart in TradingView Tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open {activeSymbol} in TradingView</span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center rounded-xl border border-[#1E2D45] bg-[#0B1220] p-2 text-[#9BAFC4] hover:text-white"
            title={expanded ? 'Compact Chart Height' : 'Expand Chart Height'}
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Row 2: Interval (1m Default, 5m, 15m, 1H, Daily) + Indicators (BB + MACD Default) + Dual 1m/Daily Split */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-white mr-1">
            {activeSymbol} (${market.spotPrice.toFixed(2)}) Timeframe:
          </span>
          {(
            [
              { id: '1', label: '1m (Default)' },
              { id: '5', label: '5m' },
              { id: '15', label: '15m' },
              { id: '60', label: '1H' },
              { id: 'D', label: '1D (Daily)' },
            ] as const
          ).map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => {
                setIntervalState(tf.id);
                setDualDailyAnd1m(false);
              }}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
                !dualDailyAnd1m && interval === tf.id
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setDualDailyAnd1m(!dualDailyAnd1m)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
              dualDailyAnd1m
                ? 'bg-[#26D6A0] text-[#0B1220]'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
            title="Show 1-Minute Intraday + Daily Chart Side by Side"
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Split: 1m + Daily</span>
          </button>
        </div>

        {/* Pre-Loaded Indicators Toggle (BB + MACD On by Default) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Sliders className="h-3.5 w-3.5 text-[#26D6A0] mr-0.5" />
          <span className="text-[#9BAFC4] font-semibold">Indicators:</span>
          <button
            type="button"
            onClick={() => setShowBB(!showBB)}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
              showBB
                ? 'bg-[#26D6A0]/20 text-[#26D6A0] border border-[#26D6A0]/50'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4]'
            }`}
          >
            BB (Bollinger Bands) {showBB ? '✓' : ''}
          </button>
          <button
            type="button"
            onClick={() => setShowMACD(!showMACD)}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
              showMACD
                ? 'bg-[#26D6A0]/20 text-[#26D6A0] border border-[#26D6A0]/50'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4]'
            }`}
          >
            MACD {showMACD ? '✓' : ''}
          </button>
          <button
            type="button"
            onClick={() => setShowVWAP(!showVWAP)}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
              showVWAP
                ? 'bg-[#26D6A0]/20 text-[#26D6A0] border border-[#26D6A0]/50'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4]'
            }`}
          >
            VWAP {showVWAP ? '✓' : ''}
          </button>
        </div>
      </div>

      {/* Row 3: Live TradingView Chart(s) */}
      {dualDailyAnd1m ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#26D6A0]">
              <span>{activeSymbol} — 1-Minute Intraday (BB + MACD)</span>
              <span className="font-mono text-[11px] text-[#9BAFC4]">
                1m Execution View
              </span>
            </div>
            <SingleTvWidget
              tvSymbol={tvSymbol}
              interval="1"
              theme={theme}
              showBB={showBB}
              showMACD={showMACD}
              showVWAP={showVWAP}
              height={chartHeight}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#F59E0B]">
              <span>{activeSymbol} — Daily Timeframe (BB + MACD)</span>
              <span className="font-mono text-[11px] text-[#9BAFC4]">
                Daily Trend & Key Levels
              </span>
            </div>
            <SingleTvWidget
              tvSymbol={tvSymbol}
              interval="D"
              theme={theme}
              showBB={showBB}
              showMACD={showMACD}
              showVWAP={showVWAP}
              height={chartHeight}
            />
          </div>
        </div>
      ) : (
        <SingleTvWidget
          tvSymbol={tvSymbol}
          interval={interval}
          theme={theme}
          showBB={showBB}
          showMACD={showMACD}
          showVWAP={showVWAP}
          height={chartHeight}
        />
      )}
    </div>
  );
};
