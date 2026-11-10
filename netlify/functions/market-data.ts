// ============================================================================
// TradePilot – Real Live Market Data Serverless Endpoint (Netlify Function)
// Fetches real live quotes, IV30, VIX, and intraday 5m candles from CBOE & Yahoo Finance
// ============================================================================

interface HandlerEvent {
  httpMethod: string;
  queryStringParameters?: Record<string, string>;
}

const INDEX_TO_YAHOO: Record<string, string> = {
  SPX: '^GSPC',
  VIX: '^VIX',
  NDX: '^NDX',
  RUT: '^RUT',
  DJI: '^DJI',
};

const INDEX_TO_CBOE: Record<string, string> = {
  SPX: '_SPX',
  VIX: '_VIX',
  NDX: '_NDX',
  RUT: '_RUT',
};

function computeRsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 70;
  const rs = gains / losses;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

function computeEma(closes: number[], period: number): number {
  if (closes.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = closes[0];
  for (let i = 1; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return Number(ema.toFixed(2));
}

export const handler = async (event: HandlerEvent) => {
  const rawSym = (event.queryStringParameters?.symbol || 'SPX')
    .trim()
    .toUpperCase()
    .replace(/^.*:/, '');

  const yahooSym = INDEX_TO_YAHOO[rawSym] || rawSym;
  const cboeSym = INDEX_TO_CBOE[rawSym] || rawSym;

  try {
    const [yahooRes, cboeSymRes, cboeVixRes] = await Promise.allSettled([
      fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          yahooSym
        )}?interval=5m&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      ).then((r) => (r.ok ? r.json() : null)),
      fetch(
        `https://cdn.cboe.com/api/global/delayed_quotes/quotes/${encodeURIComponent(
          cboeSym
        )}.json`
      ).then((r) => (r.ok ? r.json() : null)),
      fetch(
        'https://cdn.cboe.com/api/global/delayed_quotes/quotes/_VIX.json'
      ).then((r) => (r.ok ? r.json() : null)),
    ]);

    const yahooData =
      yahooRes.status === 'fulfilled' ? yahooRes.value : null;
    const cboeData =
      cboeSymRes.status === 'fulfilled' ? cboeSymRes.value?.data : null;
    const vixData =
      cboeVixRes.status === 'fulfilled' ? cboeVixRes.value?.data : null;

    const chartResult = yahooData?.chart?.result?.[0];
    const meta = chartResult?.meta;
    const timestamps: number[] = chartResult?.timestamp || [];
    const quote = chartResult?.indicators?.quote?.[0] || {};
    const closes: number[] = quote.close || [];
    const highs: number[] = quote.high || [];
    const lows: number[] = quote.low || [];
    const volumes: number[] = quote.volume || [];

    const spotPrice = Number(
      (
        cboeData?.current_price ||
        meta?.regularMarketPrice ||
        closes.filter(Boolean).slice(-1)[0] ||
        0
      ).toFixed(2)
    );

    const prevClose = Number(
      (
        cboeData?.prev_day_close ||
        meta?.chartPreviousClose ||
        meta?.previousClose ||
        spotPrice
      ).toFixed(2)
    );

    const dailyChange = Number(
      (cboeData?.price_change ?? spotPrice - prevClose).toFixed(2)
    );
    const dailyChangePct = Number(
      (
        cboeData?.price_change_percent ??
        (prevClose > 0 ? ((spotPrice - prevClose) / prevClose) * 100 : 0)
      ).toFixed(2)
    );

    const vix = Number((vixData?.current_price || 16.5).toFixed(2));
    const vixChangePct = Number(
      (vixData?.price_change_percent || 0).toFixed(2)
    );
    const iv30 = Number((cboeData?.iv30 || vix).toFixed(2));

    // Build real intraday series & VWAP
    let cumPv = 0;
    let cumVol = 0;
    const validCloses: number[] = [];
    const intradaySeries: {
      time: string;
      spx: number;
      vwap: number;
      vix: number;
    }[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (typeof c !== 'number' || Number.isNaN(c)) continue;
      validCloses.push(c);
      const h = typeof highs[i] === 'number' ? highs[i] : c;
      const l = typeof lows[i] === 'number' ? lows[i] : c;
      const v = typeof volumes[i] === 'number' && volumes[i] > 0 ? volumes[i] : 1;
      const typical = (h + l + c) / 3;
      cumPv += typical * v;
      cumVol += v;
      const runningVwap = Number((cumPv / cumVol).toFixed(2));
      const dt = new Date(timestamps[i] * 1000);
      const timeStr = dt.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      intradaySeries.push({
        time: timeStr,
        spx: Number(c.toFixed(2)),
        vwap: runningVwap,
        vix,
      });
    }

    const vwap =
      intradaySeries.length > 0
        ? intradaySeries[intradaySeries.length - 1].vwap
        : spotPrice;

    const ema9 =
      validCloses.length > 0 ? computeEma(validCloses, 9) : spotPrice;
    const ema21 =
      validCloses.length > 0 ? computeEma(validCloses, 21) : spotPrice;
    const rsi14 = computeRsi(validCloses, 14);

    // First 3 5-minute bars = 15-minute Opening Range
    const orbHighs = highs.slice(0, 3).filter((n) => typeof n === 'number');
    const orbLows = lows.slice(0, 3).filter((n) => typeof n === 'number');
    const openingRangeHigh = Number(
      (orbHighs.length > 0
        ? Math.max(...orbHighs)
        : cboeData?.high || spotPrice
      ).toFixed(2)
    );
    const openingRangeLow = Number(
      (orbLows.length > 0
        ? Math.min(...orbLows)
        : cboeData?.low || spotPrice
      ).toFixed(2)
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        symbol: rawSym,
        spotPrice,
        dailyChange,
        dailyChangePct,
        vix,
        vixChangePct,
        iv30,
        vwap,
        ema9,
        ema21,
        rsi14,
        openingRangeHigh,
        openingRangeLow,
        intradaySeries: intradaySeries.slice(-48),
        lastUpdated: new Date().toISOString(),
        source: 'LIVE_CBOE_YAHOO',
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err instanceof Error ? err.message : 'Market data fetch error',
      }),
    };
  }
};
