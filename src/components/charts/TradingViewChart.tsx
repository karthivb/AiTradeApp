import React, { useEffect, useRef, useState } from 'react';
import {
  Columns,
  ExternalLink,
  Maximize,
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
  {
    symbol: 'PLTR',
    tvSymbol: 'NYSE:PLTR',
    name: 'Palantir Technologies',
    defaultSpot: 61.25,
    strikeStep: 1,
    category: 'MAG7',
  },
  {
    symbol: 'SMCI',
    tvSymbol: 'NASDAQ:SMCI',
    name: 'Super Micro Computer',
    defaultSpot: 24.8,
    strikeStep: 1,
    category: 'MAG7',
  },
  {
    symbol: 'SOFI',
    tvSymbol: 'NASDAQ:SOFI',
    name: 'SoFi Technologies',
    defaultSpot: 14.5,
    strikeStep: 0.5,
    category: 'ETF',
  },
  {
    symbol: 'BMR',
    tvSymbol: 'NASDAQ:BMR',
    name: 'Beamr Imaging (Penny)',
    defaultSpot: 3.84,
    strikeStep: 0.5,
    category: 'INDEX',
  },
  {
    symbol: 'LUNR',
    tvSymbol: 'NASDAQ:LUNR',
    name: 'Intuitive Machines (Penny)',
    defaultSpot: 8.95,
    strikeStep: 0.5,
    category: 'INDEX',
  },
];

const KNOWN_EXCHANGE_MAP: Record<string, string> = {
  PLTR: 'NYSE:PLTR',
  DIS: 'NYSE:DIS',
  BABA: 'NYSE:BABA',
  NIO: 'NYSE:NIO',
  DJT: 'NASDAQ:DJT',
  INTC: 'NASDAQ:INTC',
  RIVN: 'NASDAQ:RIVN',
  MRNA: 'NASDAQ:MRNA',
  LULU: 'NASDAQ:LULU',
  APP: 'NASDAQ:APP',
  MSTR: 'NASDAQ:MSTR',
  TEM: 'NASDAQ:TEM',
  CRWD: 'NASDAQ:CRWD',
  ARM: 'NASDAQ:ARM',
  DKNG: 'NASDAQ:DKNG',
  CSCO: 'NASDAQ:CSCO',
  PANW: 'NASDAQ:PANW',
  SPX: 'SP:SPX',
  SPY: 'AMEX:SPY',
  QQQ: 'NASDAQ:QQQ',
  IWM: 'AMEX:IWM',
  VIX: 'CBOE:VIX',
  BMR: 'NASDAQ:BMR',
  CERO: 'NASDAQ:CERO',
  SOBR: 'NASDAQ:SOBR',
  WISA: 'NASDAQ:WISA',
  LUNR: 'NASDAQ:LUNR',
  NBTX: 'NASDAQ:NBTX',
  OPTX: 'NASDAQ:OPTX',
  KITT: 'NASDAQ:KITT',
  ABVC: 'NASDAQ:ABVC',
  MRAI: 'NASDAQ:MRAI',
};

const SingleTvWidget: React.FC<{
  tvSymbol: string;
  interval: string;
  theme: 'dark' | 'light';
  showBB: boolean;
  showMACD: boolean;
  showVWAP: boolean;
  height: string | number;
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
    widgetContainer.style.height = typeof height === 'number' ? `${height}px` : height;
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
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
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
  const [customInput, setCustomInput] = useState<string>('');

  // 3-way height mode: NORMAL (380px) -> HALF_EXPANDED (560px) -> FULLSCREEN (fixed overlay or 820px)
  const [chartViewMode, setChartViewMode] = useState<'NORMAL' | 'HALF' | 'FULL'>('HALF');

  // Next Symbol quick cycling (Hotkey 'n' support)
  const cycleNextSymbol = () => {
    const currentIndex = SYMBOL_PRESETS.findIndex((p) => p.symbol === activeSymbol);
    const nextIndex = (currentIndex + 1) % SYMBOL_PRESETS.length;
    selectTradingSymbol(SYMBOL_PRESETS[nextIndex].symbol);
  };

  // Keyboard shortcut listener: Press 'n' to cycle next symbol
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        cycleNextSymbol();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setChartViewMode((prev) => (prev === 'FULL' ? 'HALF' : 'FULL'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSymbol]);

  const currentPreset = SYMBOL_PRESETS.find((p) => p.symbol === activeSymbol);
  const tvSymbol = currentPreset
    ? currentPreset.tvSymbol
    : activeSymbol.includes(':')
      ? activeSymbol
      : `NASDAQ:${activeSymbol}`;

  const chartHeight = chartViewMode === 'FULL' ? 'calc(100vh - 140px)' : chartViewMode === 'HALF' ? 560 : 380;

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
    <div
      className={`rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4 space-y-3 transition-all ${
        chartViewMode === 'FULL'
          ? 'fixed inset-3 z-50 overflow-y-auto shadow-2xl bg-[#0B1220]'
          : ''
      }`}
    >
      {/* Row 1: Symbol Switcher + Hotkey 'N' Badge + Full/Half Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#1E2D45] pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#9BAFC4]">
              Symbol:
            </span>
            {/* Quick Cycle Button [N] */}
            <button
              type="button"
              onClick={cycleNextSymbol}
              className="flex items-center gap-1 rounded-lg border border-[#26D6A0]/50 bg-[#26D6A0]/15 px-2 py-1 font-mono text-[11px] font-bold text-[#26D6A0] hover:bg-[#26D6A0] hover:text-[#0B1220] transition"
              title="Next Symbol (Press 'N' on keyboard)"
            >
              <span>Next [N]</span>
            </button>
          </div>

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

        {/* View Height Controls: Compact / Half / Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Half / Fullscreen Toggle Segment */}
          <div className="flex items-center rounded-xl border border-[#1E2D45] bg-[#0B1220] p-1">
            <button
              type="button"
              onClick={() => setChartViewMode('NORMAL')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                chartViewMode === 'NORMAL'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
              title="Standard Compact Height (380px)"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('HALF')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                chartViewMode === 'HALF'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
              title="Half-Page View (560px)"
            >
              Half
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode(chartViewMode === 'FULL' ? 'HALF' : 'FULL')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                chartViewMode === 'FULL'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
              title="Fullscreen Chart (Press 'F' or click)"
            >
              {chartViewMode === 'FULL' ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Exit Full</span>
                </>
              ) : (
                <>
                  <Maximize className="h-3.5 w-3.5" />
                  <span>Fullscreen</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={openExternalTradingView}
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[#26D6A0]/15 border border-[#26D6A0]/40 px-3 py-1.5 text-xs font-bold text-[#26D6A0] hover:bg-[#26D6A0] hover:text-[#0B1220] transition"
            title="Open Full Interactive Chart in TradingView Tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in TV</span>
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
