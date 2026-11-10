// ============================================================================
// TradePilot – Phase 3: Market Data Provider Adapter & Real-Time Tick Engine
// ============================================================================

import { DataSourceMode, MarketSnapshot } from '../types/trading';
import { getNearestAtmStrike } from './optionsEngine';

export interface MarketProviderConfig {
  provider: DataSourceMode;
  apiKey?: string;
  endpointUrl?: string;
  autoStreamSimulated: boolean;
  streamIntervalMs: number;
}

export interface ProviderConnectionStatus {
  provider: DataSourceMode;
  connected: boolean;
  statusLabel: 'SIMULATED / DEMO' | 'CONNECTED' | 'NOT CONFIGURED' | 'ERROR';
  latencyMs: number | null;
  lastCheckedAt: string;
  message: string;
}

/**
 * Probes the selected external market data provider.
 * Never fabricates live connectivity if API credentials are missing or invalid.
 */
export async function probeMarketDataProvider(
  config: MarketProviderConfig
): Promise<ProviderConnectionStatus> {
  const nowIso = new Date().toISOString();

  if (config.provider === 'SIMULATED_DEMO') {
    return {
      provider: 'SIMULATED_DEMO',
      connected: true,
      statusLabel: 'SIMULATED / DEMO',
      latencyMs: 4,
      lastCheckedAt: nowIso,
      message:
        'Using internal Black-Scholes SPX 0DTE Pricing & Volatility Skew Engine (SIMULATED).',
    };
  }

  if (!config.apiKey || config.apiKey.trim().length < 8) {
    return {
      provider: config.provider,
      connected: false,
      statusLabel: 'NOT CONFIGURED',
      latencyMs: null,
      lastCheckedAt: nowIso,
      message: `${config.provider} API key is not configured. Displaying SIMULATED_DEMO quotes with explicit status banners.`,
    };
  }

  return {
    provider: config.provider,
    connected: false,
    statusLabel: 'NOT CONFIGURED',
    latencyMs: null,
    lastCheckedAt: nowIso,
    message: `${config.provider} adapter requires backend proxy environment variable MARKET_DATA_API_KEY. Currently running in safe SIMULATED fallback.`,
  };
}

/**
 * Generates a realistic mean-reverting intraday tick for SIMULATED_DEMO mode.
 */
export function generateSimulatedMarketTick(
  current: MarketSnapshot
): { spotDelta: number; vixDelta: number } {
  // Subtle mean-reverting random walk around VWAP with occasional momentum bursts
  const vwapSpread = current.vwap - current.spotPrice;
  const meanReversionPull = Math.max(-0.6, Math.min(0.6, vwapSpread * 0.04));
  const noise = (Math.random() - 0.485) * 2.4;
  const spotDelta = Number((meanReversionPull + noise).toFixed(2));

  // VIX moves inversely to SPX spot ~75% of the time
  const vixNoise = (Math.random() - 0.5) * 0.12;
  const vixDelta = Number((-spotDelta * 0.06 + vixNoise).toFixed(2));

  return { spotDelta, vixDelta };
}

export function computeUpdatedMarketSnapshot(
  prev: MarketSnapshot,
  spotDelta: number,
  vixDelta: number
): MarketSnapshot {
  const newSpot = Number((prev.spotPrice + spotDelta).toFixed(2));
  const newVix = Number(Math.max(9.5, prev.vix + vixDelta).toFixed(2));
  const baseOpen = 5966.5;
  const dailyChange = Number((newSpot - baseOpen).toFixed(2));
  const dailyChangePct = Number(((dailyChange / baseOpen) * 100).toFixed(2));
  const newVwap = Number((prev.vwap + spotDelta * 0.32).toFixed(2));

  const timeLabel = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return {
    ...prev,
    spotPrice: newSpot,
    dailyChange,
    dailyChangePct,
    vix: newVix,
    vwap: newVwap,
    ema9: Number((prev.ema9 + spotDelta * 0.45).toFixed(2)),
    ema21: Number((prev.ema21 + spotDelta * 0.22).toFixed(2)),
    rsi14: Number(
      Math.min(88, Math.max(18, prev.rsi14 + spotDelta * 0.65)).toFixed(1)
    ),
    openingRangeHigh: Math.max(prev.openingRangeHigh, newSpot),
    openingRangeLow: Math.min(prev.openingRangeLow, newSpot),
    atmStrike: getNearestAtmStrike(newSpot),
    lastUpdated: new Date().toISOString(),
    intradaySeries: [
      ...prev.intradaySeries.slice(-19),
      { time: timeLabel, spx: newSpot, vwap: newVwap, vix: newVix },
    ],
  };
}
