import React, { useState } from 'react';
import { Check, Database, Settings } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { isSupabaseConfigured } from '../lib/supabase';

const SETTINGS_CATEGORIES = [
  '1. General & Branding',
  '2. Market Data Provider',
  '3. Robinhood MCP Adapter',
  '4. TradingView Webhooks',
  '5. Paper Account Defaults',
  '6. Live Trading Permissions',
  '7. Strategy Defaults',
  '8. Entry Rules',
  '9. Exit Rules',
  '10. Risk Management',
  '11. Fees & Slippage',
  '12. Notifications',
  '13. Timezone Configuration',
];

export const SettingsPage: React.FC = () => {
  const {
    displayTimezone,
    setDisplayTimezone,
    activeAccount,
    updateAccountSettings,
    entryConfig,
    exitConfig,
    riskSettings,
  } = useTrading();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    SETTINGS_CATEGORIES[0]
  );
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSave = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2D45] bg-[#111C2E] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#26D6A0]/15 text-[#26D6A0]">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">
              Centralized Command Settings (13 Categories)
            </h1>
            <p className="text-xs text-[#9BAFC4]">
              Default Display Timezone: {displayTimezone} • Market Calculations Timezone: America/New_York (ET)
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg bg-[#26D6A0] px-4 py-2 text-xs font-bold text-[#0B1220]"
        >
          <Check className="h-4 w-4" />
          <span>Save All Settings</span>
        </button>
      </div>

      {savedBanner && (
        <div className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/15 p-3 text-xs font-semibold text-[#22C55E]">
          Settings saved and persisted to local state & active session configuration.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left Category List */}
        <div className="xl:col-span-4 rounded-xl border border-[#1E2D45] bg-[#111C2E] p-3 space-y-1">
          {SETTINGS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-[#26D6A0]/15 text-[#26D6A0] border border-[#26D6A0]/30'
                  : 'text-[#9BAFC4] hover:bg-[#0B1220] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right Configuration Inspector */}
        <div className="xl:col-span-8 rounded-xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2D45] pb-3">
            <h2 className="text-sm font-bold text-white">{selectedCategory}</h2>
            <span className="font-mono text-xs text-[#26D6A0]">
              ACTIVE CONFIGURATION
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-3.5">
              <label className="block text-[#9BAFC4] mb-1">
                Display Timezone (Section 19)
              </label>
              <select
                value={displayTimezone}
                onChange={(e) => setDisplayTimezone(e.target.value)}
                className="w-full rounded border border-[#1E2D45] bg-[#111C2E] px-2.5 py-1.5 font-mono text-white"
              >
                <option value="America/Los_Angeles">
                  America/Los_Angeles (PT Default)
                </option>
                <option value="America/New_York">
                  America/New_York (ET Market Time)
                </option>
                <option value="America/Chicago">America/Chicago (CT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-3.5">
              <label className="block text-[#9BAFC4] mb-1">
                Market Engine Calculation Timezone
              </label>
              <input
                disabled
                value="America/New_York (09:30 - 16:00 ET Locked)"
                className="w-full rounded border border-[#1E2D45] bg-[#111C2E] px-2.5 py-1.5 font-mono text-[#26D6A0]"
              />
            </div>

            <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-3.5">
              <label className="block text-[#9BAFC4] mb-1">
                Default Commission Per Contract ($)
              </label>
              <input
                type="number"
                step="0.05"
                value={activeAccount.commissionPerContract}
                onChange={(e) =>
                  updateAccountSettings(activeAccount.id, {
                    commissionPerContract: Number(e.target.value),
                  })
                }
                className="w-full rounded border border-[#1E2D45] bg-[#111C2E] px-2.5 py-1.5 font-mono text-white"
              />
            </div>

            <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-3.5">
              <label className="block text-[#9BAFC4] mb-1">
                Default Slippage Per Contract (SPX Pts)
              </label>
              <input
                type="number"
                step="0.05"
                value={activeAccount.slippagePerContract}
                onChange={(e) =>
                  updateAccountSettings(activeAccount.id, {
                    slippagePerContract: Number(e.target.value),
                  })
                }
                className="w-full rounded border border-[#1E2D45] bg-[#111C2E] px-2.5 py-1.5 font-mono text-white"
              />
            </div>
          </div>

          {/* Database & Supabase Schema Status */}
          <div className="rounded-lg border border-[#1E2D45] bg-[#0B1220] p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <Database className="h-4 w-4 text-[#26D6A0]" />
                <span>Supabase PostgreSQL & Auth Status</span>
              </span>
              <span className="rounded bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                {isSupabaseConfigured
                  ? 'CONNECTED TO SUPABASE'
                  : 'LOCAL STORAGE DEMO FALLBACK'}
              </span>
            </div>
            <p className="text-[#9BAFC4]">
              All 20 tables (`profiles`, `broker_connections`, `broker_accounts`, `market_snapshots`, `option_contracts`, `strategies`, `strategy_configs`, `trading_signals`, `trade_sessions`, `trades`, `trade_legs`, `orders`, `executions`, `paper_accounts`, `paper_positions`, `risk_rules`, `journal_entries`, `performance_snapshots`, `automation_events`, `audit_logs`) with Row Level Security are generated in <code className="text-white">supabase/migrations/001_initial_schema.sql</code>.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-[#9BAFC4]">
              <div>Entry Eval: {entryConfig.evaluationTimeEt} ET</div>
              <div>Force Close: {exitConfig.eodForceCloseTimeEt} ET</div>
              <div>Max Daily Loss: ${riskSettings.maxDailyLoss}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
