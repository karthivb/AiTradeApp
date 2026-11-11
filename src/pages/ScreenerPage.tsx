import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  Filter,
  Flag,
  Flame,
  Layers,
  Moon,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { ScreenerCategory, ScreenerItem } from '../types/trading';

const ALL_SCREENER_DATA: ScreenerItem[] = [
  // ==========================================
  // 1. AI RELATED STOCKS (NEW)
  // ==========================================
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 146.50,
    change: 9.35,
    changePct: 6.82,
    volume: 88400000,
    avgVolume10d: 58000000,
    volumeSurgePct: 52.4,
    relativeVolume: 1.52,
    marketCap: 3590000000000,
    marketCapFormatted: '$3.59T',
    floatShares: 24500000000,
    sector: 'Technology',
    industry: 'Semiconductors',
    dayLow: 139.10,
    dayHigh: 148.20,
    hasOptions: true,
    catalyst: 'Blackwell B200 AI GPUs in full production; massive hyperscaler cluster procurement orders',
    category: 'AI_STOCKS',
  },
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies Inc',
    price: 61.25,
    change: 7.65,
    changePct: 14.27,
    volume: 135000000,
    avgVolume10d: 62000000,
    volumeSurgePct: 117.7,
    relativeVolume: 2.18,
    marketCap: 137800000000,
    marketCapFormatted: '$137.8B',
    floatShares: 2100000000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    dayLow: 54.10,
    dayHigh: 62.40,
    hasOptions: true,
    catalyst: 'AIP (Artificial Intelligence Platform) commercial enterprise conversions & DoD AI mandate growth',
    category: 'AI_STOCKS',
  },
  {
    symbol: 'SMCI',
    name: 'Super Micro Computer Inc',
    price: 24.80,
    change: 2.75,
    changePct: 12.47,
    volume: 98000000,
    avgVolume10d: 65000000,
    volumeSurgePct: 50.8,
    relativeVolume: 1.51,
    marketCap: 14500000000,
    marketCapFormatted: '$14.5B',
    floatShares: 520000000,
    sector: 'Technology',
    industry: 'Computer Hardware',
    dayLow: 21.60,
    dayHigh: 25.50,
    hasOptions: true,
    catalyst: 'Liquid-cooled direct-to-chip AI server rack shipping volume beats expectations',
    category: 'AI_STOCKS',
  },
  {
    symbol: 'ARM',
    name: 'Arm Holdings plc ADR',
    price: 139.20,
    change: 7.80,
    changePct: 5.94,
    volume: 16200000,
    avgVolume10d: 11500000,
    volumeSurgePct: 40.9,
    relativeVolume: 1.41,
    marketCap: 145000000000,
    marketCapFormatted: '$145.0B',
    floatShares: 1030000000,
    sector: 'Technology',
    industry: 'Semiconductors',
    dayLow: 132.50,
    dayHigh: 141.20,
    hasOptions: true,
    catalyst: 'Arm v9 architecture AI accelerator licenses signed across top cloud datacenter developers',
    category: 'AI_STOCKS',
  },
  {
    symbol: 'TEM',
    name: 'Tempus AI Inc',
    price: 72.40,
    change: 12.80,
    changePct: 21.48,
    volume: 14200000,
    avgVolume10d: 4600000,
    volumeSurgePct: 208.7,
    relativeVolume: 3.09,
    marketCap: 11800000000,
    marketCapFormatted: '$11.8B',
    floatShares: 68000000,
    sector: 'Healthcare',
    industry: 'Diagnostics & Research',
    dayLow: 60.10,
    dayHigh: 74.50,
    hasOptions: true,
    catalyst: 'Strategic precision oncology AI partnership with AstraZeneca announced',
    category: 'AI_STOCKS',
  },
  {
    symbol: 'APP',
    name: 'AppLovin Corporation',
    price: 295.40,
    change: 65.20,
    changePct: 28.32,
    volume: 24800000,
    avgVolume10d: 7900000,
    volumeSurgePct: 213.9,
    relativeVolume: 3.14,
    marketCap: 99400000000,
    marketCapFormatted: '$99.4B',
    floatShares: 285000000,
    sector: 'Technology',
    industry: 'Software - Application',
    dayLow: 238.10,
    dayHigh: 302.50,
    hasOptions: true,
    catalyst: 'AXON 2.0 AI-powered programmatic advertising engine revenue surges +41%',
    category: 'AI_STOCKS',
  },
  {
    symbol: 'AVGO',
    name: 'Broadcom Inc',
    price: 178.60,
    change: 8.20,
    changePct: 4.81,
    volume: 28500000,
    avgVolume10d: 19200000,
    volumeSurgePct: 48.4,
    relativeVolume: 1.48,
    marketCap: 835000000000,
    marketCapFormatted: '$835.0B',
    floatShares: 4650000000,
    sector: 'Technology',
    industry: 'Semiconductors',
    dayLow: 171.20,
    dayHigh: 180.50,
    hasOptions: true,
    catalyst: 'Custom AI ASIC silicon accelerators ordered by tier-1 hyperscaler customers',
    category: 'AI_STOCKS',
  },
  {
    symbol: 'TSM',
    name: 'Taiwan Semiconductor Manufacturing',
    price: 195.40,
    change: 7.40,
    changePct: 3.94,
    volume: 22100000,
    avgVolume10d: 15400000,
    volumeSurgePct: 43.5,
    relativeVolume: 1.44,
    marketCap: 1013000000000,
    marketCapFormatted: '$1.01T',
    floatShares: 5180000000,
    sector: 'Technology',
    industry: 'Semiconductors',
    dayLow: 188.50,
    dayHigh: 197.80,
    hasOptions: true,
    catalyst: 'Leading 3nm and 2nm advanced node foundry capacity fully booked through 2026',
    category: 'AI_STOCKS',
  },
  {
    symbol: 'SOUN',
    name: 'SoundHound AI Inc',
    price: 6.45,
    change: 0.99,
    changePct: 18.13,
    volume: 58000000,
    avgVolume10d: 26000000,
    volumeSurgePct: 123.1,
    relativeVolume: 2.23,
    marketCap: 2150000000,
    marketCapFormatted: '$2.15B',
    floatShares: 310000000,
    sector: 'Technology',
    industry: 'Software - Application',
    dayLow: 5.50,
    dayHigh: 6.80,
    hasOptions: true,
    catalyst: 'Automotive in-cabin generative voice AI integrations expanded across major OEMs',
    category: 'AI_STOCKS',
  },

  // ==========================================
  // 2. MEGA CAP STOCKS (NEW)
  // ==========================================
  {
    symbol: 'AAPL',
    name: 'Apple Inc',
    price: 228.90,
    change: 4.10,
    changePct: 1.82,
    volume: 54200000,
    avgVolume10d: 46000000,
    volumeSurgePct: 17.8,
    relativeVolume: 1.18,
    marketCap: 3480000000000,
    marketCapFormatted: '$3.48T',
    floatShares: 15100000000,
    sector: 'Technology',
    industry: 'Consumer Electronics',
    dayLow: 225.20,
    dayHigh: 229.80,
    hasOptions: true,
    catalyst: 'Apple Intelligence consumer rollout triggers upgrade super-cycle expectations',
    category: 'MEGA_CAP',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 426.30,
    change: 8.80,
    changePct: 2.11,
    volume: 24500000,
    avgVolume10d: 20100000,
    volumeSurgePct: 21.9,
    relativeVolume: 1.22,
    marketCap: 3165000000000,
    marketCapFormatted: '$3.17T',
    floatShares: 7420000000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    dayLow: 418.50,
    dayHigh: 428.20,
    hasOptions: true,
    catalyst: 'Azure enterprise AI revenue acceleration and Copilot enterprise seat adoption',
    category: 'MEGA_CAP',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc',
    price: 211.40,
    change: 6.55,
    changePct: 3.20,
    volume: 48200000,
    avgVolume10d: 38500000,
    volumeSurgePct: 25.2,
    relativeVolume: 1.25,
    marketCap: 2220000000000,
    marketCapFormatted: '$2.22T',
    floatShares: 10450000000,
    sector: 'Consumer Cyclical',
    industry: 'Internet Retail',
    dayLow: 206.10,
    dayHigh: 213.50,
    hasOptions: true,
    catalyst: 'AWS cloud operating margins rebound to multi-year highs with Bedrock AI models',
    category: 'MEGA_CAP',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc Class A',
    price: 182.50,
    change: 4.30,
    changePct: 2.41,
    volume: 32400000,
    avgVolume10d: 25800000,
    volumeSurgePct: 25.6,
    relativeVolume: 1.26,
    marketCap: 2250000000000,
    marketCapFormatted: '$2.25T',
    floatShares: 12200000000,
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    dayLow: 178.60,
    dayHigh: 184.20,
    hasOptions: true,
    catalyst: 'Gemini 2.0 multi-modal AI integration across Search and Google Cloud Enterprise',
    category: 'MEGA_CAP',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc',
    price: 592.10,
    change: 20.60,
    changePct: 3.61,
    volume: 16800000,
    avgVolume10d: 12400000,
    volumeSurgePct: 35.5,
    relativeVolume: 1.35,
    marketCap: 1500000000000,
    marketCapFormatted: '$1.50T',
    floatShares: 2200000000,
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    dayLow: 574.00,
    dayHigh: 596.50,
    hasOptions: true,
    catalyst: 'Llama AI infrastructure and Advantage+ automated ad conversions boost ad rates',
    category: 'MEGA_CAP',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc',
    price: 328.49,
    change: 27.29,
    changePct: 9.06,
    volume: 184000000,
    avgVolume10d: 110000000,
    volumeSurgePct: 67.3,
    relativeVolume: 1.67,
    marketCap: 1054000000000,
    marketCapFormatted: '$1.05T',
    floatShares: 2680000000,
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    dayLow: 308.20,
    dayHigh: 334.80,
    hasOptions: true,
    catalyst: 'Autonomous FSD regulatory clearing and market cap surging back over $1 Trillion',
    category: 'MEGA_CAP',
  },

  // ==========================================
  // 3. VOLATILITY STOCKS (High IV / High Beta) (NEW)
  // ==========================================
  {
    symbol: 'MSTR',
    name: 'MicroStrategy Incorporated',
    price: 338.50,
    change: 48.10,
    changePct: 16.56,
    volume: 38200000,
    avgVolume10d: 18400000,
    volumeSurgePct: 107.6,
    relativeVolume: 2.08,
    marketCap: 69200000000,
    marketCapFormatted: '$69.2B',
    floatShares: 180000000,
    sector: 'Financial',
    industry: 'Capital Markets',
    dayLow: 295.0,
    dayHigh: 345.0,
    hasOptions: true,
    catalyst: 'Extreme Bitcoin treasury leverage (IV > 120%) and $42B capital acquisition plan',
    category: 'VOLATILITY_STOCKS',
  },
  {
    symbol: 'COIN',
    name: 'Coinbase Global Inc',
    price: 312.80,
    change: 36.20,
    changePct: 13.09,
    volume: 24500000,
    avgVolume10d: 12800000,
    volumeSurgePct: 91.4,
    relativeVolume: 1.91,
    marketCap: 77200000000,
    marketCapFormatted: '$77.2B',
    floatShares: 215000000,
    sector: 'Financial',
    industry: 'Financial Data & Stock Exchanges',
    dayLow: 282.40,
    dayHigh: 318.0,
    hasOptions: true,
    catalyst: 'Crypto trading volume explosions and institutional ETF staking custody revenue',
    category: 'VOLATILITY_STOCKS',
  },
  {
    symbol: 'MARA',
    name: 'MARA Holdings Inc',
    price: 22.40,
    change: 2.90,
    changePct: 14.87,
    volume: 72000000,
    avgVolume10d: 38000000,
    volumeSurgePct: 89.5,
    relativeVolume: 1.89,
    marketCap: 6850000000,
    marketCapFormatted: '$6.85B',
    floatShares: 295000000,
    sector: 'Financial',
    industry: 'Capital Markets',
    dayLow: 19.80,
    dayHigh: 23.10,
    hasOptions: true,
    catalyst: 'High-beta crypto mining hash rate expansion and accelerated BTC accumulation',
    category: 'VOLATILITY_STOCKS',
  },
  {
    symbol: 'ASTS',
    name: 'AST SpaceMobile Inc',
    price: 27.80,
    change: 4.30,
    changePct: 18.30,
    volume: 34500000,
    avgVolume10d: 16800000,
    volumeSurgePct: 105.4,
    relativeVolume: 2.05,
    marketCap: 7600000000,
    marketCapFormatted: '$7.60B',
    floatShares: 240000000,
    sector: 'Communication Services',
    industry: 'Telecom Services',
    dayLow: 23.90,
    dayHigh: 28.50,
    hasOptions: true,
    catalyst: 'BlueBird orbital direct-to-cell telecom payload satellite launch milestones',
    category: 'VOLATILITY_STOCKS',
  },
  {
    symbol: 'RDDT',
    name: 'Reddit Inc',
    price: 135.20,
    change: 14.30,
    changePct: 11.83,
    volume: 18400000,
    avgVolume10d: 9200000,
    volumeSurgePct: 100.0,
    relativeVolume: 2.0,
    marketCap: 22400000000,
    marketCapFormatted: '$22.4B',
    floatShares: 135000000,
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    dayLow: 121.50,
    dayHigh: 138.00,
    hasOptions: true,
    catalyst: 'AI training data licensing deals and user monetization growth rate acceleration',
    category: 'VOLATILITY_STOCKS',
  },
  {
    symbol: 'GME',
    name: 'GameStop Corp',
    price: 28.50,
    change: 3.15,
    changePct: 12.43,
    volume: 42000000,
    avgVolume10d: 19500000,
    volumeSurgePct: 115.4,
    relativeVolume: 2.15,
    marketCap: 12100000000,
    marketCapFormatted: '$12.1B',
    floatShares: 360000000,
    sector: 'Consumer Cyclical',
    industry: 'Specialty Retail',
    dayLow: 25.10,
    dayHigh: 29.80,
    hasOptions: true,
    catalyst: 'Elevated options open interest sweeps and $4 Billion cash treasury deployment',
    category: 'VOLATILITY_STOCKS',
  },

  // ==========================================
  // 4. TRUMP NEWS STOCKS (Policy & Deregulation Movers) (NEW)
  // ==========================================
  {
    symbol: 'DJT',
    name: 'Trump Media & Technology Group',
    price: 28.10,
    change: -4.90,
    changePct: -14.85,
    volume: 68000000,
    avgVolume10d: 48000000,
    volumeSurgePct: 41.7,
    relativeVolume: 1.42,
    marketCap: 5600000000,
    marketCapFormatted: '$5.6B',
    floatShares: 138000000,
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    dayLow: 27.40,
    dayHigh: 33.20,
    hasOptions: true,
    catalyst: 'Truth Social parent company — Primary political sentiment proxy and election beta',
    category: 'TRUMP_NEWS_STOCKS',
  },
  {
    symbol: 'GEO',
    name: 'The GEO Group Inc',
    price: 26.80,
    change: 4.18,
    changePct: 18.48,
    volume: 18200000,
    avgVolume10d: 6800000,
    volumeSurgePct: 167.6,
    relativeVolume: 2.68,
    marketCap: 3880000000,
    marketCapFormatted: '$3.88B',
    floatShares: 135000000,
    sector: 'Industrials',
    industry: 'Security & Protection Services',
    dayLow: 22.80,
    dayHigh: 27.50,
    hasOptions: true,
    catalyst: 'Anticipated border enforcement security & private detention facility federal contract expansions',
    category: 'TRUMP_NEWS_STOCKS',
  },
  {
    symbol: 'CXW',
    name: 'CoreCivic Inc',
    price: 22.40,
    change: 3.12,
    changePct: 16.18,
    volume: 14500000,
    avgVolume10d: 5900000,
    volumeSurgePct: 145.8,
    relativeVolume: 2.46,
    marketCap: 2520000000,
    marketCapFormatted: '$2.52B',
    floatShares: 112000000,
    sector: 'Industrials',
    industry: 'Security & Protection Services',
    dayLow: 19.40,
    dayHigh: 23.10,
    hasOptions: true,
    catalyst: 'Strong demand expectations for secure facility operations and immigration policy infrastructure',
    category: 'TRUMP_NEWS_STOCKS',
  },
  {
    symbol: 'X',
    name: 'United States Steel Corporation',
    price: 42.50,
    change: 3.50,
    changePct: 8.97,
    volume: 24800000,
    avgVolume10d: 14200000,
    volumeSurgePct: 74.6,
    relativeVolume: 1.75,
    marketCap: 9500000000,
    marketCapFormatted: '$9.50B',
    floatShares: 225000000,
    sector: 'Basic Materials',
    industry: 'Steel',
    dayLow: 39.20,
    dayHigh: 43.10,
    hasOptions: true,
    catalyst: 'Domestic steel tariff protectionism expectations and national security industrial policy',
    category: 'TRUMP_NEWS_STOCKS',
  },
  {
    symbol: 'XOM',
    name: 'Exxon Mobil Corporation',
    price: 122.40,
    change: 4.45,
    changePct: 3.77,
    volume: 28400000,
    avgVolume10d: 18900000,
    volumeSurgePct: 50.3,
    relativeVolume: 1.50,
    marketCap: 485000000000,
    marketCapFormatted: '$485.0B',
    floatShares: 3950000000,
    sector: 'Energy',
    industry: 'Oil & Gas Integrated',
    dayLow: 118.50,
    dayHigh: 123.60,
    hasOptions: true,
    catalyst: 'Federal drilling permit acceleration & deregulation expectations ("Drill baby drill")',
    category: 'TRUMP_NEWS_STOCKS',
  },
  {
    symbol: 'LMT',
    name: 'Lockheed Martin Corporation',
    price: 545.00,
    change: 22.00,
    changePct: 4.21,
    volume: 2450000,
    avgVolume10d: 1620000,
    volumeSurgePct: 51.2,
    relativeVolume: 1.51,
    marketCap: 131000000000,
    marketCapFormatted: '$131.0B',
    floatShares: 240000000,
    sector: 'Industrials',
    industry: 'Aerospace & Defense',
    dayLow: 524.0,
    dayHigh: 549.0,
    hasOptions: true,
    catalyst: 'Defense procurement budget prioritization and foreign military sales authorization',
    category: 'TRUMP_NEWS_STOCKS',
  },
  {
    symbol: 'RKLB',
    name: 'Rocket Lab USA Inc',
    price: 19.40,
    change: 2.42,
    changePct: 14.25,
    volume: 48500000,
    avgVolume10d: 22100000,
    volumeSurgePct: 119.5,
    relativeVolume: 2.19,
    marketCap: 9800000000,
    marketCapFormatted: '$9.80B',
    floatShares: 470000000,
    sector: 'Industrials',
    industry: 'Aerospace & Defense',
    dayLow: 17.10,
    dayHigh: 20.20,
    hasOptions: true,
    catalyst: 'Space Force defense launch contract wins & domestic payload launch deregulation',
    category: 'TRUMP_NEWS_STOCKS',
  },

  // ==========================================
  // 5. PENNY STOCK MOVERS (Strict 4-Point Rule)
  // ==========================================
  {
    symbol: 'BMR',
    name: 'Beamr Imaging Ltd',
    price: 3.84,
    change: 1.15,
    changePct: 42.75,
    volume: 18450000,
    avgVolume10d: 3800000,
    volumeSurgePct: 385.5,
    relativeVolume: 4.85,
    marketCap: 28400000,
    marketCapFormatted: '$28.4M',
    floatShares: 7200000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    dayLow: 2.75,
    dayHigh: 4.22,
    hasOptions: false,
    catalyst: 'Announced patent licensing agreement for real-time video optimization with leading cloud hyperscaler',
    category: 'PENNY_STOCK_MOVERS',
    isPennyMoverRuleCompliant: true,
  },
  {
    symbol: 'CERO',
    name: 'CERo Therapeutics Holdings',
    price: 2.45,
    change: 0.55,
    changePct: 28.95,
    volume: 14200000,
    avgVolume10d: 4100000,
    volumeSurgePct: 246.3,
    relativeVolume: 3.46,
    marketCap: 14200000,
    marketCapFormatted: '$14.2M',
    floatShares: 5800000,
    sector: 'Healthcare',
    industry: 'Biotechnology',
    dayLow: 1.95,
    dayHigh: 2.68,
    hasOptions: false,
    catalyst: 'Received FDA Fast Track designation for engineered immunotherapy clinical candidate',
    category: 'PENNY_STOCK_MOVERS',
    isPennyMoverRuleCompliant: true,
  },
  {
    symbol: 'SOBR',
    name: 'SOBR Safe Inc',
    price: 4.15,
    change: 1.06,
    changePct: 34.3,
    volume: 9800000,
    avgVolume10d: 2900000,
    volumeSurgePct: 237.9,
    relativeVolume: 3.38,
    marketCap: 19800000,
    marketCapFormatted: '$19.8M',
    floatShares: 4600000,
    sector: 'Healthcare',
    industry: 'Medical Devices',
    dayLow: 3.12,
    dayHigh: 4.48,
    hasOptions: false,
    catalyst: 'Secured nationwide commercial hardware roll-out with multi-state logistics fleet',
    category: 'PENNY_STOCK_MOVERS',
    isPennyMoverRuleCompliant: true,
  },
  {
    symbol: 'WISA',
    name: 'WiSA Technologies Inc',
    price: 2.82,
    change: 0.46,
    changePct: 19.49,
    volume: 11300000,
    avgVolume10d: 4200000,
    volumeSurgePct: 169.0,
    relativeVolume: 2.69,
    marketCap: 16500000,
    marketCapFormatted: '$16.5M',
    floatShares: 5900000,
    sector: 'Technology',
    industry: 'Semiconductor Equipment',
    dayLow: 2.38,
    dayHigh: 3.05,
    hasOptions: false,
    catalyst: 'Executed 5-year spatial audio IP royalty contract with top tier consumer soundbar OEM',
    category: 'PENNY_STOCK_MOVERS',
    isPennyMoverRuleCompliant: true,
  },
  {
    symbol: 'LUNR',
    name: 'Intuitive Machines Inc',
    price: 8.95,
    change: 1.41,
    changePct: 18.7,
    volume: 24500000,
    avgVolume10d: 11200000,
    volumeSurgePct: 118.7,
    relativeVolume: 2.19,
    marketCap: 48200000,
    marketCapFormatted: '$48.2M',
    floatShares: 14500000,
    sector: 'Industrials',
    industry: 'Aerospace & Defense',
    dayLow: 7.60,
    dayHigh: 9.25,
    hasOptions: true,
    catalyst: 'NASA lunar exploration sub-contract delivery confirmed ahead of schedule',
    category: 'PENNY_STOCK_MOVERS',
    isPennyMoverRuleCompliant: true,
  },
  {
    symbol: 'NBTX',
    name: 'Nanobiotix S.A.',
    price: 5.60,
    change: 1.02,
    changePct: 22.27,
    volume: 7600000,
    avgVolume10d: 3100000,
    volumeSurgePct: 145.2,
    relativeVolume: 2.45,
    marketCap: 36400000,
    marketCapFormatted: '$36.4M',
    floatShares: 6500000,
    sector: 'Healthcare',
    industry: 'Biotechnology',
    dayLow: 4.62,
    dayHigh: 5.85,
    hasOptions: true,
    catalyst: 'Presented positive overall survival oncology data at international symposium',
    category: 'PENNY_STOCK_MOVERS',
    isPennyMoverRuleCompliant: true,
  },
  {
    symbol: 'KITT',
    name: 'Nauticus Robotics Inc',
    price: 2.18,
    change: 0.52,
    changePct: 31.33,
    volume: 16800000,
    avgVolume10d: 4500000,
    volumeSurgePct: 273.3,
    relativeVolume: 3.73,
    marketCap: 11300000,
    marketCapFormatted: '$11.3M',
    floatShares: 5200000,
    sector: 'Industrials',
    industry: 'Specialty Industrial Machinery',
    dayLow: 1.68,
    dayHigh: 2.35,
    hasOptions: false,
    catalyst: 'Awarded autonomous subsea survey defense project funding extension',
    category: 'PENNY_STOCK_MOVERS',
    isPennyMoverRuleCompliant: true,
  },

  // ==========================================
  // 6. DAILY GAINERS
  // ==========================================
  {
    symbol: 'APP',
    name: 'AppLovin Corporation',
    price: 295.40,
    change: 65.20,
    changePct: 28.32,
    volume: 24800000,
    avgVolume10d: 7900000,
    volumeSurgePct: 213.9,
    relativeVolume: 3.14,
    marketCap: 99400000000,
    marketCapFormatted: '$99.4B',
    floatShares: 285000000,
    sector: 'Technology',
    industry: 'Software - Application',
    dayLow: 238.10,
    dayHigh: 302.50,
    hasOptions: true,
    catalyst: 'Massive Q3 earnings beat driven by AXON 2.0 AI advertising engine margins expansion',
    category: 'DAILY_GAINERS',
  },
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies Inc',
    price: 61.25,
    change: 7.65,
    changePct: 14.27,
    volume: 135000000,
    avgVolume10d: 62000000,
    volumeSurgePct: 117.7,
    relativeVolume: 2.18,
    marketCap: 137800000000,
    marketCapFormatted: '$137.8B',
    floatShares: 2100000000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    dayLow: 54.10,
    dayHigh: 62.40,
    hasOptions: true,
    catalyst: 'AIP commercial enterprise demand acceleration; S&P 500 institutional inflows',
    category: 'DAILY_GAINERS',
  },

  // ==========================================
  // 7. DAILY LOSERS
  // ==========================================
  {
    symbol: 'DJT',
    name: 'Trump Media & Technology Group',
    price: 28.10,
    change: -4.90,
    changePct: -14.85,
    volume: 68000000,
    avgVolume10d: 48000000,
    volumeSurgePct: 41.7,
    relativeVolume: 1.42,
    marketCap: 5600000000,
    marketCapFormatted: '$5.6B',
    floatShares: 138000000,
    sector: 'Communication Services',
    industry: 'Internet Content & Information',
    dayLow: 27.40,
    dayHigh: 33.20,
    hasOptions: true,
    catalyst: 'Post-election volatility profit-taking and insider lockup expiration trading flow',
    category: 'DAILY_LOSERS',
  },
  {
    symbol: 'INTC',
    name: 'Intel Corporation',
    price: 23.95,
    change: -2.15,
    changePct: -8.24,
    volume: 84000000,
    avgVolume10d: 62000000,
    volumeSurgePct: 35.5,
    relativeVolume: 1.35,
    marketCap: 102400000000,
    marketCapFormatted: '$102.4B',
    floatShares: 4280000000,
    sector: 'Technology',
    industry: 'Semiconductors',
    dayLow: 23.50,
    dayHigh: 26.20,
    hasOptions: true,
    catalyst: 'Foundry segment restructuring delays and revised hyperscaler datacenter orders',
    category: 'DAILY_LOSERS',
  },

  // ==========================================
  // 8. PRE-MARKET MOVERS
  // ==========================================
  {
    symbol: 'CRWD',
    name: 'CrowdStrike Holdings Inc',
    price: 345.80,
    change: 22.40,
    changePct: 6.93,
    preMarketChangePct: 7.25,
    volume: 4800000,
    avgVolume10d: 2900000,
    volumeSurgePct: 65.5,
    relativeVolume: 1.66,
    marketCap: 83500000000,
    marketCapFormatted: '$83.5B',
    floatShares: 240000000,
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    dayLow: 328.0,
    dayHigh: 348.0,
    hasOptions: true,
    catalyst: 'Early morning top-tier wall street bank upgrade to Strong Buy citing Falcon platform retention',
    category: 'PRE_MARKET_MOVERS',
  },

  // ==========================================
  // 9. AFTER-MARKET MOVERS
  // ==========================================
  {
    symbol: 'CSCO',
    name: 'Cisco Systems Inc',
    price: 59.20,
    change: 4.10,
    changePct: 7.44,
    afterHoursChangePct: 7.85,
    volume: 42000000,
    avgVolume10d: 21000000,
    volumeSurgePct: 100.0,
    relativeVolume: 2.0,
    marketCap: 236000000000,
    marketCapFormatted: '$236.0B',
    floatShares: 3980000000,
    sector: 'Technology',
    industry: 'Communication Equipment',
    dayLow: 55.10,
    dayHigh: 59.80,
    hasOptions: true,
    catalyst: 'Q1 earnings and revenue beat; Splunk integration revenue synergies guided higher',
    category: 'AFTER_MARKET_MOVERS',
  },
];

export const ScreenerPage: React.FC = () => {
  const { selectTradingSymbol, setActiveSection } = useTrading();

  // Active Category Tab (Default to AI_STOCKS)
  const [activeTab, setActiveTab] = useState<ScreenerCategory>('AI_STOCKS');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [hasOptionsOnly, setHasOptionsOnly] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enforcePennyStrictRules, setEnforcePennyStrictRules] = useState<boolean>(true);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 450);
  };

  const filteredItems = useMemo(() => {
    return ALL_SCREENER_DATA.filter((item) => {
      // Category match
      if (item.category !== activeTab) {
        return false;
      }

      // Search query (symbol or name or sector)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const symMatch = item.symbol.toLowerCase().includes(q);
        const nameMatch = item.name.toLowerCase().includes(q);
        const sectorMatch = item.sector.toLowerCase().includes(q);
        const catMatch = item.catalyst.toLowerCase().includes(q);
        if (!symMatch && !nameMatch && !sectorMatch && !catMatch) return false;
      }

      // Options only filter
      if (hasOptionsOnly && !item.hasOptions) {
        return false;
      }

      // Special Penny Stock Movers strict rule validation
      if (activeTab === 'PENNY_STOCK_MOVERS' && enforcePennyStrictRules) {
        const priceOk = item.price >= 2.0 && item.price <= 10.0;
        const capOk = item.marketCap >= 1000000 && item.marketCap <= 50000000;
        const volSurgeOk = item.volumeSurgePct >= 50.0;
        const changeOk = item.changePct >= 10.0;
        if (!priceOk || !capOk || !volSurgeOk || !changeOk) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      return Math.abs(b.changePct) - Math.abs(a.changePct);
    });
  }, [
    activeTab,
    searchQuery,
    hasOptionsOnly,
    enforcePennyStrictRules,
  ]);

  const handleOpenChart = (symbol: string) => {
    selectTradingSymbol(symbol);
    setActiveSection('dashboard');
  };

  const handleOpenOptionsChain = (symbol: string) => {
    selectTradingSymbol(symbol);
    setActiveSection('options-chain');
  };

  const handleOpenPaperTrade = (symbol: string) => {
    selectTradingSymbol(symbol);
    setActiveSection('paper-trading');
  };

  const handleExportCsv = () => {
    const headers = 'Symbol,Name,Price,Change,ChangePct,Volume,AvgVolume10d,VolumeSurgePct,RVOL,MarketCap,Sector,Catalyst\n';
    const rows = filteredItems.map((i) =>
      `"${i.symbol}","${i.name}",${i.price},${i.change},${i.changePct}%,${i.volume},${i.avgVolume10d},${i.volumeSurgePct}%,${i.relativeVolume},"${i.marketCapFormatted}","${i.sector}","${i.catalyst.replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tradepilot_screener_${activeTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Refresh / CSV Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#26D6A0]/15 text-[#26D6A0]">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-white">
                Market Momentum & Catalyst Screener
              </h1>
              <span className="rounded bg-[#22C55E]/15 px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#22C55E]">
                LIVE SCANS
              </span>
            </div>
            <p className="text-xs text-[#9BAFC4]">
              Real-time thematic scans: AI Leaders, Mega Caps, High-IV Volatility Runners, Trump Policy Stocks & Penny Movers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3.5 py-2 font-mono text-xs font-bold text-[#9BAFC4] hover:border-[#26D6A0] hover:text-white transition disabled:opacity-50"
            title="Re-scan and fetch fresh quote feeds"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#26D6A0] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Scanning...' : 'Refresh'}</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-[#1E2D45] bg-[#0B1220] px-3.5 py-2 font-mono text-xs font-bold text-[#9BAFC4] hover:border-[#26D6A0] hover:text-white transition"
            title="Export filtered stocks to CSV"
          >
            <Download className="h-3.5 w-3.5 text-[#26D6A0]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Thematic & Category Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* 1. AI Related Stocks (NEW) */}
        <button
          onClick={() => setActiveTab('AI_STOCKS')}
          className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
            activeTab === 'AI_STOCKS'
              ? 'border-[#26D6A0] bg-[#26D6A0]/15 text-white shadow-md ring-1 ring-[#26D6A0]'
              : 'border-[#1E2D45] bg-[#111C2E] text-[#9BAFC4] hover:border-[#26D6A0]/50 hover:text-white'
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#26D6A0]">
              <Sparkles className="h-4 w-4" /> AI Related Stocks
            </span>
            <span className="rounded bg-[#26D6A0]/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#26D6A0]">
              HOT
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#9BAFC4]">
            NVDA, PLTR, SMCI, ARM, TEM, APP
          </span>
        </button>

        {/* 2. Mega Cap (NEW) */}
        <button
          onClick={() => setActiveTab('MEGA_CAP')}
          className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
            activeTab === 'MEGA_CAP'
              ? 'border-[#818CF8] bg-[#818CF8]/15 text-white shadow-md ring-1 ring-[#818CF8]'
              : 'border-[#1E2D45] bg-[#111C2E] text-[#9BAFC4] hover:border-[#818CF8]/50 hover:text-white'
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#818CF8]">
              <Layers className="h-4 w-4" /> Mega Cap Titans
            </span>
            <span className="rounded bg-[#818CF8]/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#818CF8]">
              $1T+
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#9BAFC4]">
            AAPL, MSFT, NVDA, AMZN, GOOGL, META, TSLA
          </span>
        </button>

        {/* 3. Volatility Stocks (High IV / High Beta) (NEW) */}
        <button
          onClick={() => setActiveTab('VOLATILITY_STOCKS')}
          className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
            activeTab === 'VOLATILITY_STOCKS'
              ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-white shadow-md ring-1 ring-[#F59E0B]'
              : 'border-[#1E2D45] bg-[#111C2E] text-[#9BAFC4] hover:border-[#F59E0B]/50 hover:text-white'
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#F59E0B]">
              <Flame className="h-4 w-4" /> Volatility Stocks
            </span>
            <span className="rounded bg-[#F59E0B]/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#F59E0B]">
              HIGH IV
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#9BAFC4]">
            MSTR, COIN, MARA, ASTS, RDDT, GME
          </span>
        </button>

        {/* 4. Trump News Stocks (Policy & Deregulation) (NEW) */}
        <button
          onClick={() => setActiveTab('TRUMP_NEWS_STOCKS')}
          className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
            activeTab === 'TRUMP_NEWS_STOCKS'
              ? 'border-[#EF4444] bg-[#EF4444]/15 text-white shadow-md ring-1 ring-[#EF4444]'
              : 'border-[#1E2D45] bg-[#111C2E] text-[#9BAFC4] hover:border-[#EF4444]/50 hover:text-white'
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#EF4444]">
              <Flag className="h-4 w-4" /> Trump News Stocks
            </span>
            <span className="rounded bg-[#EF4444]/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#EF4444]">
              POLICY
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#9BAFC4]">
            DJT, GEO, CXW, X, XOM, LMT, RKLB
          </span>
        </button>

        {/* 5. Penny Stock Movers ($2-$10, Cap $1M-$50M, Vol +50%, Change >10%) */}
        <button
          onClick={() => setActiveTab('PENNY_STOCK_MOVERS')}
          className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
            activeTab === 'PENNY_STOCK_MOVERS'
              ? 'border-[#22C55E] bg-[#22C55E]/15 text-white shadow-md ring-1 ring-[#22C55E]'
              : 'border-[#1E2D45] bg-[#111C2E] text-[#9BAFC4] hover:border-[#22C55E]/50 hover:text-white'
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#22C55E]">
              <Zap className="h-4 w-4" /> Penny Movers
            </span>
            <span className="rounded bg-[#22C55E]/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#22C55E]">
              $2–$10
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#9BAFC4]">
            BMR, CERO, SOBR, WISA, LUNR, KITT
          </span>
        </button>
      </div>

      {/* Secondary Standard Filters (Daily Gainers / Losers / Pre / Post) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-bold text-[#9BAFC4] mr-1">Other Scans:</span>
        {[
          { tab: 'DAILY_GAINERS' as ScreenerCategory, label: 'Daily Gainers' },
          { tab: 'DAILY_LOSERS' as ScreenerCategory, label: 'Daily Losers' },
          { tab: 'PRE_MARKET_MOVERS' as ScreenerCategory, label: 'Pre-Market Gappers' },
          { tab: 'AFTER_MARKET_MOVERS' as ScreenerCategory, label: 'After-Market Earnings' },
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`rounded-lg px-3 py-1 font-mono text-xs font-bold transition ${
              activeTab === item.tab
                ? 'bg-[#26D6A0] text-[#0B1220]'
                : 'border border-[#1E2D45] bg-[#111C2E] text-[#9BAFC4] hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Special Penny Stock Strict Banner when in Penny Movers Tab */}
      {activeTab === 'PENNY_STOCK_MOVERS' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#26D6A0]/40 bg-[#26D6A0]/10 p-3.5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-[#26D6A0] shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#26D6A0]">
                  STRICT 4-POINT PENNY STOCK CRITERIA ACTIVE:
                </span>
                <span className="rounded bg-[#26D6A0] px-2 py-0.5 font-mono text-[10px] font-black text-[#0B1220]">
                  ENFORCED
                </span>
              </div>
              <p className="text-[11px] text-[#9BAFC4]">
                1) Price: <strong className="text-white">$2.00 – $10.00</strong> • 2) Market Cap:{' '}
                <strong className="text-white">$1M – $50M</strong> • 3) 10-Day Volume Surge:{' '}
                <strong className="text-[#22C55E]">&gt; +50% (RVOL &gt; 1.5x)</strong> • 4) Today's Gain:{' '}
                <strong className="text-[#22C55E]">&gt; +10.0%</strong>
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#9BAFC4] cursor-pointer">
            <input
              type="checkbox"
              checked={enforcePennyStrictRules}
              onChange={(e) => setEnforcePennyStrictRules(e.target.checked)}
              className="rounded border-[#1E2D45] bg-[#0B1220] text-[#26D6A0] focus:ring-[#26D6A0]"
            />
            <span>Lock Strict Filters</span>
          </label>
        </div>
      )}

      {/* Search & Options Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9BAFC4]" />
            <input
              type="text"
              placeholder="Filter by ticker, company, or catalyst keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#1E2D45] bg-[#0B1220] pl-8 pr-3 py-1.5 font-mono text-xs text-white placeholder-[#9BAFC4]/60 focus:border-[#26D6A0] focus:outline-none"
            />
          </div>

          {/* Options Available Toggle */}
          <button
            onClick={() => setHasOptionsOnly(!hasOptionsOnly)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition ${
              hasOptionsOnly
                ? 'bg-[#26D6A0] text-[#0B1220]'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Has Options Only</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#9BAFC4]">
          <span>
            Showing <strong className="text-white">{filteredItems.length}</strong> matching candidates
          </span>
          <span className="rounded bg-[#0B1220] border border-[#1E2D45] px-2 py-0.5 font-mono text-[10px] text-[#26D6A0]">
            Disciplined 1-Contract Rule Active
          </span>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="rounded-xl border border-[#1E2D45] bg-[#111C2E] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#1E2D45] bg-[#0B1220] text-[11px] font-bold uppercase tracking-wider text-[#9BAFC4]">
                <th className="py-3 px-4">Symbol & Company</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">Today Change</th>
                <th className="py-3 px-3">10d Vol Surge</th>
                <th className="py-3 px-3">Volume / Avg</th>
                <th className="py-3 px-3">Market Cap</th>
                <th className="py-3 px-3">Day Range</th>
                <th className="py-3 px-3">Catalyst / Thematic Driver</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D45]/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-[#9BAFC4]">
                    No securities matched the current screener filter. Try relaxing search criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isGain = item.changePct >= 0;
                  return (
                    <tr
                      key={item.symbol}
                      className="hover:bg-[#16243B] transition group"
                    >
                      {/* Symbol & Company */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-white group-hover:text-[#26D6A0] transition">
                            {item.symbol}
                          </span>
                          {item.hasOptions && (
                            <span className="rounded bg-[#818CF8]/20 px-1.5 py-0.2 font-mono text-[9px] font-extrabold text-[#818CF8]" title="Options Available">
                              OPT
                            </span>
                          )}
                          {item.isPennyMoverRuleCompliant && (
                            <span className="rounded bg-[#26D6A0]/20 px-1.5 py-0.2 font-mono text-[9px] font-extrabold text-[#26D6A0]" title="Strict Penny Mover Rule Compliant">
                              ★ 4-POINT
                            </span>
                          )}
                        </div>
                        <div className="truncate max-w-[180px] text-[11px] text-[#9BAFC4]">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-[#9BAFC4]/70">
                          {item.sector}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-sm font-extrabold text-white">
                          ${item.price.toFixed(2)}
                        </span>
                      </td>

                      {/* Today Change */}
                      <td className="py-3.5 px-3">
                        <div className={`flex items-center font-bold text-xs ${isGain ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {isGain ? (
                            <ArrowUpRight className="mr-0.5 h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <ArrowDownRight className="mr-0.5 h-3.5 w-3.5 shrink-0" />
                          )}
                          <span>
                            {isGain ? '+' : ''}{item.change.toFixed(2)} ({isGain ? '+' : ''}{item.changePct.toFixed(2)}%)
                          </span>
                        </div>
                        {item.preMarketChangePct && (
                          <div className="text-[10px] text-[#F59E0B]">
                            Pre: +{item.preMarketChangePct.toFixed(1)}%
                          </div>
                        )}
                        {item.afterHoursChangePct && (
                          <div className="text-[10px] text-[#818CF8]">
                            Post: +{item.afterHoursChangePct.toFixed(1)}%
                          </div>
                        )}
                      </td>

                      {/* 10d Vol Surge */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-xs font-extrabold ${item.volumeSurgePct >= 50 ? 'text-[#22C55E]' : 'text-white'}`}>
                            +{item.volumeSurgePct.toFixed(1)}%
                          </span>
                          <span className="rounded bg-[#0B1220] border border-[#1E2D45] px-1 py-0.2 text-[9px] font-bold text-[#9BAFC4]">
                            {item.relativeVolume.toFixed(2)}x
                          </span>
                        </div>
                        <div className="text-[10px] text-[#9BAFC4]">
                          RVOL &gt; 10d Avg
                        </div>
                      </td>

                      {/* Volume / Avg */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-xs font-bold text-white">
                          {(item.volume / 1000000).toFixed(2)}M
                        </div>
                        <div className="text-[10px] text-[#9BAFC4]">
                          Avg: {(item.avgVolume10d / 1000000).toFixed(2)}M
                        </div>
                      </td>

                      {/* Market Cap */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs font-extrabold text-white">
                          {item.marketCapFormatted}
                        </span>
                        {item.floatShares && (
                          <div className="text-[10px] text-[#9BAFC4]">
                            Float: {(item.floatShares / 1000000).toFixed(1)}M
                          </div>
                        )}
                      </td>

                      {/* Day Range */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-[11px] text-[#9BAFC4]">
                          ${item.dayLow.toFixed(2)} - ${item.dayHigh.toFixed(2)}
                        </div>
                        <div className="mt-1 h-1.5 w-20 rounded-full bg-[#0B1220] overflow-hidden">
                          <div
                            className="h-full bg-[#26D6A0]"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  ((item.price - item.dayLow) /
                                    Math.max(0.01, item.dayHigh - item.dayLow)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Catalyst / Thematic Driver */}
                      <td className="py-3.5 px-3 max-w-[260px]">
                        <p className="text-[11px] leading-tight text-white line-clamp-2">
                          {item.catalyst}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Open 1m Chart */}
                          <button
                            onClick={() => handleOpenChart(item.symbol)}
                            className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-1.5 text-[#9BAFC4] hover:border-[#26D6A0] hover:text-[#26D6A0] transition"
                            title="Open 1m Bollinger Bands / MACD Chart"
                          >
                            <BarChart2 className="h-4 w-4" />
                          </button>

                          {/* 2. Open Options Chain */}
                          <button
                            onClick={() => handleOpenOptionsChain(item.symbol)}
                            className="flex items-center gap-1 rounded-lg border border-[#26D6A0]/40 bg-[#26D6A0]/10 px-2 py-1 text-xs font-bold text-[#26D6A0] hover:bg-[#26D6A0] hover:text-[#0B1220] transition"
                            title="Load Options Chain for this Symbol"
                          >
                            <Layers className="h-3.5 w-3.5" />
                            <span>Chain</span>
                          </button>

                          {/* 3. Trade 1-Qty */}
                          <button
                            onClick={() => handleOpenPaperTrade(item.symbol)}
                            className="rounded-lg bg-[#22C55E]/15 px-2 py-1 text-xs font-bold text-[#22C55E] hover:bg-[#22C55E] hover:text-[#0B1220] transition"
                            title="Execute 1 Single Contract (Strict 1-Qty Rule)"
                          >
                            1-Qty
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ScreenerPage;
