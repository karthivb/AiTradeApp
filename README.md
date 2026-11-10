# 🚀 TradePilot — Intelligent Options Trading Command Center & Real-Time Psychological Risk Firewall

> *"Trade Smarter. Measure Everything. Protect Tomorrow."*

TradePilot is an institutional-grade, full-stack options command center engineered specifically for active retail options traders, 0DTE (Zero Days to Expiration) index desks, and systematic swing traders. It seamlessly unites **live market feeds**, **Black-Scholes analytical Greeks**, **14 multi-leg options strategy architectures**, **interactive TradingView charts (1m default with Bollinger Bands & MACD)**, a **10-minute discipline & brain-fog firewall**, and a **multi-account execution router** into one ultra-fast, zero-friction web application.

---

## 🌟 Why Full-Stack Programming Was Chosen & Core Architecture Benefits

### 1. Unified TypeScript Domain Across Client & Server
Modern options trading demands microsecond-accurate data contracts. By choosing full-stack TypeScript (React + Vite + Tailwind on frontend; Node.js Serverless Functions + Supabase Postgres 17 on backend):
- **Zero Type Drift**: The exact same TypeScript types govern the client-side options payoff engine, real-time Black-Scholes Greek computations ($\Delta, \Gamma, \Theta, \mathcal{V}$), webhook payloads, and database records.
- **Maximum Execution Speed**: Vite 6 provides sub-millisecond hot-module replacement and optimized tree-shaking, resulting in a blisteringly fast client terminal with no lag when switching timeframes or strikes.
- **Safe Sandboxing & Zero Secret Leakage**: Browser code *never* touches broker credentials, private OAuth tokens, or service role keys. All privileged integrations (CBOE delayed quote scraper, Yahoo real-time candle aggregators, Robinhood FastMCP adapters) run exclusively inside isolated backend serverless runtimes.

### 2. High-Performance Client-Side Computational Engine
Unlike legacy brokers that recalculate option payoffs on remote web servers causing UI freeze:
- TradePilot calculates analytical Black-Scholes Greeks, 15-strike options chains, multi-leg breakevens, and risk-reward ratios **locally in-memory** using vector math and Abramowitz & Stegun normal CDF algorithms.
- Sliders and market moves update instantly at 60 FPS without server roundtrips.

---

## ☁️ Cloud & SaaS Services Used & Architectural Rationale

| Service / Cloud Provider | Role in TradePilot | Why It Was Chosen |
| :--- | :--- | :--- |
| **Netlify Global Edge CDN** | Frontend Hosting & Production Deployment | Zero-config continuous deployment, instant rollback, automatic Brotli compression, and single-click SSL at the edge. |
| **Netlify Serverless Functions** | Live Market Data Engine (`/api/market-data`) & Webhook Ingestion (`/api/webhook/tradingview`) | Runs Node.js functions on AWS Lambda infrastructure behind Netlify. Eliminates server management, scales from 0 to 10,000 requests effortlessly, and bypasses browser CORS restrictions when fetching live quotes. |
| **Supabase (PostgreSQL 17)** | Relational Database & State Persistence | Managed Postgres 17 in AWS `us-east-1` with 20 relational tables, foreign key constraints, automated audit logs, and transaction-safe schema migrations. |
| **Supabase Auth & Row-Level Security (RLS)** | Identity & Granular Data Isolation | Every single table is locked with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Users can only query and mutate rows matching `auth.uid() = user_id`, guaranteeing multi-tenant security by default. |
| **TradingView Advanced Chart Widget** | Real-Time Technical Analysis | Industry-standard candlestick charting engine embedded with **1-minute intraday default**, pre-loaded **Bollinger Bands (BB)** and **MACD** indicators, and 1-click symbol switching (SPX, SPY, QQQ, NVDA, AAPL, TSLA, etc.). |
| **CBOE & Yahoo Finance Data Bridge** | Real Live Delayed Index & Equity Feeds | Fetches authentic live underlying quotes, 5-minute intraday candles, VWAP, 30-day implied volatility (IV30), and VIX—ensuring traders see real prices rather than simulated dummy numbers. |
| **Robinhood FastMCP Protocol Bridge** | Broker Connectivity & Historical Sync | Implements Model Context Protocol (MCP) tool schemas (`robinhood_get_account`, `robinhood_get_option_positions`, `robinhood_place_option_order`) with two-step operator gatekeeping to prevent unintended live orders. |

---

## 🛡️ The Psychological Risk & 10-Minute Discipline System

Retail options traders rarely fail due to technical ignorance; **they fail due to emotional dysregulation**—specifically *revenge trading*, *over-trading after a win*, *brain fog*, and the destructive urge to *"clear all debt in one trade."*

TradePilot directly addresses this with the **Discipline Module**:
1. **10-Minute Recurring Check-In Coach**: A persistent countdown timer alerts the trader every 10 minutes to pause, rate their brain fog (Clear / Mild Fatigue / Brain Fog / Exhausted), and select their dominant emotional state.
2. **Real-Time Psychological Intervention**: Selecting dangerous states like *Revenge Trading*, *Averaging Down*, or *Clear Debt in One Trade* triggers immediate coaching prompts reminding the trader:
   > *"You only have $X left today. You have your family. You have tomorrow. Base hits build wealth; gambling destroys accounts."*
3. **Emergency Kill Switch**: One-click terminal lockout that cancels pending orders and blocks new entries when emotional control slips.
4. **Daily Profit & Manual P&L Tracker**: Manually log and reconcile daily live or paper profits, track streak compliance, and adjust balances without touching raw code.

---

## 📈 Supported Assets & Multi-Leg Options Catalog

- **Instant Symbol Selector**: `SPX`, `SPY`, `QQQ`, `NVDA`, `AAPL`, `TSLA`, `MSFT`, `META`, `AMD`, `AMZN`, `IWM`, `COIN`, and any custom ticker.
- **14 Built-In Option Strategies**:
  1. ATM Long Call & Put
  2. ITM Long Call & Put
  3. OTM Long Call & Put
  4. ATM Long Straddle
  5. OTM Long Strangle
  6. Bull Call Debit Spread
  7. Bear Put Debit Spread
  8. Bull Put Credit Spread
  9. Bear Call Credit Spread
  10. Iron Condor (4 Legs)
  11. Iron Butterfly (4 Legs)
  12. Custom Multi-Leg Spread Builder

---

## 🛠️ Local Development & Deployment

### Prerequisites
- Node.js 20+ / 24+
- Git

### Installation
```bash
git clone https://github.com/karthivb/AiTradeApp.git
cd AiTradeApp
npm install
```

### Local Development Server
```bash
npm run dev
# Terminal runs at http://localhost:5173
```

### Production Build
```bash
npm run build
```

### Deploy to Netlify
```bash
npx netlify-cli deploy --prod --dir=dist --functions=netlify/functions
```

---

## 🔒 Security Best Practices
- `.env` and `.netlify/` are strictly ignored by `.gitignore`.
- RLS enforces `(select auth.uid()) = user_id` on all 20 Supabase tables.
- Public client keys use restricted `anon` publishable scope; `service_role` keys are only used in serverless environments.
