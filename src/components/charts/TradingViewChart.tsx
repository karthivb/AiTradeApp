import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Columns,
  ExternalLink,
  Maximize,
  Maximize2,
  Minimize2,
  Search,
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
  showRSI: boolean;
  showSupertrend: boolean;
  showADX: boolean;
  showEMA: boolean;
  height: string | number;
}> = ({
  tvSymbol,
  interval,
  theme,
  showBB,
  showMACD,
  showVWAP,
  showRSI,
  showSupertrend,
  showADX,
  showEMA,
  height,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heightPx = typeof height === 'number' ? `${height}px` : height;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    const studies: (string | object)[] = [];
    if (showBB) studies.push('BB@tv-basicstudies');
    if (showMACD) studies.push('MACD@tv-basicstudies');
    if (showVWAP) studies.push('VWAP@tv-basicstudies');
    if (showRSI) studies.push('RSI@tv-basicstudies');
    if (showSupertrend) studies.push('VSTOP@tv-basicstudies');
    if (showADX) studies.push('DM@tv-basicstudies');

    // 9, 21, 200 Exponential Moving Averages for Crossover Trading
    if (showEMA) {
      studies.push({
        id: 'MAExp@tv-basicstudies',
        inputs: { length: 9 },
      });
      studies.push({
        id: 'MAExp@tv-basicstudies',
        inputs: { length: 21 },
      });
      studies.push({
        id: 'MAExp@tv-basicstudies',
        inputs: { length: 200 },
      });
    }

    const uniqueId = `tv-${Math.random().toString(36).substring(2, 9)}`;
    const widgetContainer = document.createElement('div');
    widgetContainer.id = uniqueId;
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = heightPx;
    widgetContainer.style.minHeight = heightPx;
    widgetContainer.style.width = '100%';
    el.appendChild(widgetContainer);

    // Force internal widget elements and iframe to fill specified height
    const tvStyle = document.createElement('style');
    tvStyle.innerHTML = `
      #${uniqueId},
      #${uniqueId} iframe,
      .tradingview-widget-container,
      .tradingview-widget-container__widget,
      .tradingview-widget-container iframe {
        height: ${heightPx} !important;
        min-height: ${heightPx} !important;
        max-height: ${heightPx} !important;
      }
    `;
    el.appendChild(tvStyle);

    // Thick line styles and high-contrast colors for 9/21/200 EMA Cross
    const studiesOverrides: Record<string, string | number> = {};
    if (showEMA) {
      // General thick line override
      studiesOverrides['moving average exponential.plot.linewidth'] = 3;
      // 9 EMA: Fast trigger line in high-vis Emerald Green (width: 3)
      studiesOverrides['moving average exponential.0.plot.linewidth'] = 3;
      studiesOverrides['moving average exponential.0.plot.color'] = '#00E676';
      // 21 EMA: Trend pullback / baseline in bright Amber/Gold (width: 3)
      studiesOverrides['moving average exponential.1.plot.linewidth'] = 3;
      studiesOverrides['moving average exponential.1.plot.color'] = '#FFB300';
      // 200 EMA: Macro institutional bull/bear line in Vivid Neon Purple (width: 4)
      studiesOverrides['moving average exponential.2.plot.linewidth'] = 4;
      studiesOverrides['moving average exponential.2.plot.color'] = '#E040FB';
    }

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: false,
      width: '100%',
      height: typeof height === 'number' ? height : parseInt(String(height)) || 680,
      symbol: tvSymbol,
      interval: interval,
      timezone: 'America/New_York',
      theme: theme === 'light' ? 'light' : 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      hide_legend: false,
      withdateranges: true,
      save_image: true,
      calendar: false,
      studies: studies,
      ...(Object.keys(studiesOverrides).length > 0
        ? { studies_overrides: studiesOverrides }
        : {}),
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
      support_host: 'https://www.tradingview.com',
    });

    el.appendChild(script);

    return () => {
      if (el) el.innerHTML = '';
    };
  }, [
    tvSymbol,
    interval,
    theme,
    showBB,
    showMACD,
    showVWAP,
    showRSI,
    showSupertrend,
    showADX,
    showEMA,
    heightPx,
  ]);

  const studiesFingerprint = [
    showBB ? 'bb' : '',
    showMACD ? 'macd' : '',
    showVWAP ? 'vwap' : '',
    showRSI ? 'rsi' : '',
    showSupertrend ? 'supertrend' : '',
    showADX ? 'adx' : '',
    showEMA ? 'ema' : '',
  ]
    .filter(Boolean)
    .join('-');

  return (
    <div
      key={`tv-widget-${tvSymbol}-${interval}-${heightPx}-${studiesFingerprint}`}
      ref={containerRef}
      className="tradingview-widget-container w-full overflow-hidden rounded-xl border border-[#1E2D45]"
      style={{
        height: heightPx,
        minHeight: heightPx,
      }}
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
  const [showRSI, setShowRSI] = useState<boolean>(true);
  const [showSupertrend, setShowSupertrend] = useState<boolean>(false);
  const [showADX, setShowADX] = useState<boolean>(false);
  const [showEMA9_21_200, setShowEMA9_21_200] = useState<boolean>(true);
  const [customInput, setCustomInput] = useState<string>('');

  // 4-way height mode: NORMAL (520px) -> EXPANDED (680px) -> TALL (840px) -> FULLSCREEN (100vh)
  const [chartViewMode, setChartViewMode] = useState<'NORMAL' | 'EXPANDED' | 'TALL' | 'FULL'>('EXPANDED');

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
        setChartViewMode((prev) => (prev === 'FULL' ? 'EXPANDED' : 'FULL'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSymbol]);

  // Synchronize when the user changes symbol inside the TradingView iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (!event.data) return;
        let payload = event.data;
        if (typeof payload === 'string' && (payload.startsWith('{') || payload.startsWith('['))) {
          payload = JSON.parse(payload);
        }
        if (payload && typeof payload === 'object') {
          const rawSymbol =
            payload.name === 'tv-widget-symbol-change'
              ? payload.data?.symbol || payload.data
              : payload.event === 'symbol_change'
              ? payload.symbol
              : payload.data?.name || payload.symbol;

          if (typeof rawSymbol === 'string' && rawSymbol.trim()) {
            const clean = rawSymbol.includes(':') ? rawSymbol.split(':')[1] : rawSymbol;
            if (clean && clean.toUpperCase() !== activeSymbol) {
              selectTradingSymbol(clean.toUpperCase());
            }
          }
        }
      } catch {
        // Ignore cross-origin non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeSymbol, selectTradingSymbol]);

  const currentPreset = SYMBOL_PRESETS.find((p) => p.symbol === activeSymbol);
  const tvSymbol = currentPreset
    ? currentPreset.tvSymbol
    : activeSymbol.includes(':')
      ? activeSymbol
      : `NASDAQ:${activeSymbol}`;

  // USER REQUEST: Split chart no showing long height. Also regular chart also should be in better height to display.
  // We provide generous, professional trading heights: Normal: 520px, Expanded: 680px, Tall: 840px, Full: calc(100vh - 120px)
  const chartHeight =
    chartViewMode === 'FULL'
      ? 'calc(100vh - 130px)'
      : chartViewMode === 'TALL'
      ? 840
      : chartViewMode === 'EXPANDED'
      ? 680
      : 520;

  // For Split view (1m + Daily side-by-side), ensure ample vertical headroom so indicators like RSI, Supertrend, ADX, and BB all fit comfortably
  const splitChartHeight =
    chartViewMode === 'FULL'
      ? 'calc(100vh - 150px)'
      : chartViewMode === 'TALL'
      ? 800
      : chartViewMode === 'EXPANDED'
      ? 650
      : 520;

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

        {/* View Height Controls: Normal (520px) / Expanded (680px) / Tall (840px) / Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Height Segment */}
          <div className="flex items-center rounded-xl border border-[#1E2D45] bg-[#0B1220] p-1">
            <button
              type="button"
              onClick={() => setChartViewMode('NORMAL')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                chartViewMode === 'NORMAL'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
              title="Standard View (520px)"
            >
              520px
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('EXPANDED')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                chartViewMode === 'EXPANDED'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
              title="Expanded Height View (680px)"
            >
              680px
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('TALL')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                chartViewMode === 'TALL'
                  ? 'bg-[#26D6A0] text-[#0B1220]'
                  : 'text-[#9BAFC4] hover:text-white'
              }`}
              title="Tall Multi-Indicator Height View (840px)"
            >
              840px
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode(chartViewMode === 'FULL' ? 'EXPANDED' : 'FULL')}
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

        {/* Pre-Loaded Indicators Toggle (BB, MACD, RSI, Supertrend, ADX, VWAP) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Sliders className="h-3.5 w-3.5 text-[#26D6A0] mr-0.5" />
          <span className="text-[#9BAFC4] font-semibold">Indicators:</span>
          <button
            type="button"
            onClick={() => setShowRSI(!showRSI)}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
              showRSI
                ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
            title="Toggle Relative Strength Index (RSI)"
          >
            RSI {showRSI ? '✓' : ''}
          </button>
          <button
            type="button"
            onClick={() => setShowSupertrend(!showSupertrend)}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
              showSupertrend
                ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
            title="Toggle Supertrend ATR Volatility Overlay"
          >
            Supertrend {showSupertrend ? '✓' : ''}
          </button>
          <button
            type="button"
            onClick={() => setShowADX(!showADX)}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
              showADX
                ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
            title="Toggle Average Directional Index (ADX Trend Strength)"
          >
            ADX {showADX ? '✓' : ''}
          </button>
          <button
            type="button"
            onClick={() => setShowBB(!showBB)}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
              showBB
                ? 'bg-[#26D6A0]/20 text-[#26D6A0] border border-[#26D6A0]/50'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4]'
            }`}
          >
            BB {showBB ? '✓' : ''}
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
          <button
            type="button"
            onClick={() => setShowEMA9_21_200(!showEMA9_21_200)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition ${
              showEMA9_21_200
                ? 'bg-[#26D6A0] text-[#0B1220] shadow-sm'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
            title="Toggle 9 / 21 / 200 EMA Crossover with Thick Lines (9=Green, 21=Amber, 200=Purple)"
          >
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#00E676]" />
              <span className="inline-block h-2 w-2 rounded-full bg-[#FFB300]" />
              <span className="inline-block h-2 w-2 rounded-full bg-[#E040FB]" />
            </span>
            <span>9/21/200 EMA {showEMA9_21_200 ? '✓' : ''}</span>
          </button>
        </div>
      </div>

      {/* 9/21/200 EMA Crossover Legend & In-Iframe Symbol Change Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#26D6A0]/30 bg-[#111C2E] px-3.5 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* EMA Crossover Legend Pills */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase tracking-wide text-white flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-[#00E676] animate-pulse" />
              9/21/200 EMA Cross:
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span
                className="inline-flex items-center gap-1 rounded bg-[#00E676]/15 border border-[#00E676]/40 px-2 py-0.5 font-bold text-[#00E676]"
                title="Fast Trigger EMA (Length: 9, Thick Line: 3px)"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-[#00E676]" />
                9 EMA (Fast)
              </span>
              <span
                className="inline-flex items-center gap-1 rounded bg-[#FFB300]/15 border border-[#FFB300]/40 px-2 py-0.5 font-bold text-[#FFB300]"
                title="Trend Baseline EMA (Length: 21, Thick Line: 3px)"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-[#FFB300]" />
                21 EMA (Trend)
              </span>
              <span
                className="inline-flex items-center gap-1 rounded bg-[#E040FB]/15 border border-[#E040FB]/40 px-2 py-0.5 font-bold text-[#E040FB]"
                title="Macro Bull/Bear Boundary (Length: 200, Extra-Thick Line: 4px)"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-[#E040FB]" />
                200 EMA (Macro)
              </span>
            </div>
          </div>

          <span className="hidden md:inline text-[#1E2D45]">|</span>

          {/* Strategy Rule Explanation */}
          <span className="text-[11px] text-[#9BAFC4]">
            <strong className="text-white">Rule:</strong> Bullish Cross when 9 crosses above 21 over 200 • Bearish breakdown when 9 crosses below 21 under 200
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-[#9BAFC4] flex items-center gap-1">
            <Search className="h-3.5 w-3.5 text-[#26D6A0]" />
            Click symbol in chart ({activeSymbol}) to search
          </span>
        </div>
      </div>

      {/* Active Indicators Pill Tray */}
      <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
        <span className="text-[11px] font-bold text-[#9BAFC4]">Active Chart Indicators:</span>
        {showEMA9_21_200 && (
          <span className="rounded bg-[#00E676]/15 border border-[#00E676]/40 px-2 py-0.5 text-[11px] font-mono font-bold text-[#00E676]">
            EMA 9/21/200 (3px/4px)
          </span>
        )}
        {showRSI && (
          <span className="rounded bg-[#26D6A0]/15 border border-[#26D6A0]/40 px-2 py-0.5 text-[11px] font-mono font-bold text-[#26D6A0]">
            RSI (14)
          </span>
        )}
        {showMACD && (
          <span className="rounded bg-[#26D6A0]/15 border border-[#26D6A0]/40 px-2 py-0.5 text-[11px] font-mono font-bold text-[#26D6A0]">
            MACD (12, 26, 9)
          </span>
        )}
        {showBB && (
          <span className="rounded bg-[#26D6A0]/15 border border-[#26D6A0]/40 px-2 py-0.5 text-[11px] font-mono font-bold text-[#26D6A0]">
            Bollinger Bands (20, 2)
          </span>
        )}
        {showVWAP && (
          <span className="rounded bg-[#26D6A0]/15 border border-[#26D6A0]/40 px-2 py-0.5 text-[11px] font-mono font-bold text-[#26D6A0]">
            VWAP
          </span>
        )}
        {showSupertrend && (
          <span className="rounded bg-[#26D6A0]/15 border border-[#26D6A0]/40 px-2 py-0.5 text-[11px] font-mono font-bold text-[#26D6A0]">
            Supertrend / Volatility Stop
          </span>
        )}
        {showADX && (
          <span className="rounded bg-[#26D6A0]/15 border border-[#26D6A0]/40 px-2 py-0.5 text-[11px] font-mono font-bold text-[#26D6A0]">
            ADX / Directional Movement
          </span>
        )}
        {!showEMA9_21_200 && !showRSI && !showMACD && !showBB && !showVWAP && !showSupertrend && !showADX && (
          <span className="text-[11px] text-[#9BAFC4] italic">
            None selected (Click indicator buttons above or 'fx' in chart toolbar)
          </span>
        )}
      </div>

      {/* Row 3: Live TradingView Chart(s) with Generous Viewing Headroom */}
      {dualDailyAnd1m ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#26D6A0]">
              <span>{activeSymbol} — 1-Minute Intraday (Execution View)</span>
              <span className="font-mono text-[11px] text-[#9BAFC4]">
                Height: {typeof splitChartHeight === 'number' ? `${splitChartHeight}px` : splitChartHeight}
              </span>
            </div>
            <SingleTvWidget
              tvSymbol={tvSymbol}
              interval="1"
              theme={theme}
              showBB={showBB}
              showMACD={showMACD}
              showVWAP={showVWAP}
              showRSI={showRSI}
              showSupertrend={showSupertrend}
              showADX={showADX}
              showEMA={showEMA9_21_200}
              height={splitChartHeight}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#F59E0B]">
              <span>{activeSymbol} — Daily Timeframe (Macro Trend & Levels)</span>
              <span className="font-mono text-[11px] text-[#9BAFC4]">
                Height: {typeof splitChartHeight === 'number' ? `${splitChartHeight}px` : splitChartHeight}
              </span>
            </div>
            <SingleTvWidget
              tvSymbol={tvSymbol}
              interval="D"
              theme={theme}
              showBB={showBB}
              showMACD={showMACD}
              showVWAP={showVWAP}
              showRSI={showRSI}
              showSupertrend={showSupertrend}
              showADX={showADX}
              showEMA={showEMA9_21_200}
              height={splitChartHeight}
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
          showRSI={showRSI}
          showSupertrend={showSupertrend}
          showADX={showADX}
          showEMA={showEMA9_21_200}
          height={chartHeight}
        />
      )}
    </div>
  );
};
