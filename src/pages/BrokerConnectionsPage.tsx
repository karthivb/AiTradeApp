import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  FileJson,
  Link2,
  Lock,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Terminal,
  WifiOff,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import {
  discoverRobinhoodMcpTools,
  EXPECTED_MCP_TOOLS,
  McpToolSchema,
  SAMPLE_ROBINHOOD_HISTORY_JSON,
} from '../lib/robinhoodMcpClient';
import { TradingPermissionMode } from '../types/trading';

const MCP_SETUP_STEPS = [
  {
    step: 'Step 1: Install & Create the Robinhood MCP Server',
    desc: 'Robinhood does not offer a public browser CORS API, so a lightweight Python/Node MCP server using robin_stocks + FastMCP bridges Robinhood safely to TradePilot.',
    code: `# Create folder & install FastMCP + robin_stocks + pyotp
mkdir robinhood-mcp-server && cd robinhood-mcp-server
pip install fastmcp robin_stocks pyotp uvicorn

# Run the MCP HTTP bridge on port 8787
python server.py`,
  },
  {
    step: 'Step 2: Configure Robinhood TOTP (2FA Authenticator Secret)',
    desc: 'In Robinhood App → Security & Privacy → Two-Factor Authentication → Authenticator App → Copy your 16-character setup key so the MCP server can generate 2FA codes automatically.',
    code: `ROBINHOOD_USERNAME=your_robinhood_email@gmail.com
ROBINHOOD_PASSWORD=your_robinhood_password
ROBINHOOD_TOTP_SECRET=YOUR16CHARTOTPKEY
ROBINHOOD_MCP_AUTH_TOKEN=tp_secret_bridge_token_2026`,
  },
  {
    step: 'Step 3: Wire MCP Server into TradePilot Netlify Backend',
    desc: 'Point your Netlify serverless adapter (/.netlify/functions/robinhood-mcp-adapter) to your running MCP server URL and token:',
    code: `npx.cmd --yes netlify-cli env:set ROBINHOOD_MCP_SERVER_URL "https://your-mcp-tunnel.ngrok-free.app"
npx.cmd --yes netlify-cli env:set ROBINHOOD_MCP_AUTH_TOKEN "tp_secret_bridge_token_2026"`,
  },
];

const BETTER_OPTIONS_PLAYBOOK = [
  {
    title: '1. Trade 0.40–0.55 Delta (ATM / Slight ITM) — Never Cheap OTM Lottos',
    badge: 'STRIKE SELECTION',
    body: 'Cheap far-OTM 0DTE options ($0.50–$1.20) have extreme negative Theta and low Delta—even if SPX/SPY moves in your direction, IV crush + time decay can make you lose money. Stick to ATM (0.45–0.55 Δ) where options move dollar-for-dollar with momentum.',
  },
  {
    title: '2. Use Vertical Debit Spreads in High VIX (>16) Instead of Naked Calls/Puts',
    badge: 'SPREAD EDGE',
    body: 'On Robinhood, buying a Bull Call Debit Spread (e.g., Buy 5985C / Sell 5995C) cuts your entry cost by 35–45% and neutralizes Theta decay and IV crush because the short leg decays in your favor.',
  },
  {
    title: '3. Trade Only the 9:35 AM – 11:00 AM ET Window (Avoid Mid-Day Chop)',
    badge: 'TIMING EDGE',
    body: '80% of clean directional 0DTE moves happen in the first 90 minutes after the 9:30 AM ET bell. Between 11:30 AM and 1:45 PM ET, algorithms pin strikes to burn premium—step away during lunch!',
  },
  {
    title: '4. Always Use Limit Orders at Midpoint + Pre-Set +25% / -20% Brackets',
    badge: 'EXECUTION EDGE',
    body: 'Never use Market Orders on options. Place Limit Orders at the Natural Midpoint, take 50% off at +20% profit, move your stop to breakeven, and NEVER average down a losing 0DTE contract.',
  },
];

export const BrokerConnectionsPage: React.FC = () => {
  const {
    permissionMode,
    setPermissionMode,
    liveTradingAuthorized,
    setLiveTradingAuthorized,
    importRobinhoodHistoryJson,
  } = useTrading();

  const [activeTab, setActiveTab] = useState<
    'SETUP_GUIDE' | 'BETTER_PLAYBOOK' | 'MCP_SCHEMA_SYNC'
  >('SETUP_GUIDE');
  const [probing, setProbing] = useState(false);
  const [probeMessage, setProbeMessage] = useState<string | null>(null);
  const [discoveredTools, setDiscoveredTools] =
    useState<McpToolSchema[]>(EXPECTED_MCP_TOOLS);
  const [rhJsonInput, setRhJsonInput] = useState(SAMPLE_ROBINHOOD_HISTORY_JSON);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleDiscoverCapabilities = async () => {
    setProbing(true);
    const result = await discoverRobinhoodMcpTools();
    setProbing(false);
    setDiscoveredTools(result.tools);
    setProbeMessage(
      `${result.message} (Checked at ${new Date(
        result.discoveredAt
      ).toLocaleTimeString()})`
    );
  };

  const handleSyncRobinhoodHistory = () => {
    const res = importRobinhoodHistoryJson(rhJsonInput);
    if (res.error) {
      setSyncFeedback(`Error: ${res.error}`);
    } else {
      setSyncFeedback(
        `Successfully imported & reconstructed ${res.importedCount} multi-leg strategy trade(s) into Trading Journal.`
      );
    }
  };

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E2D45] bg-[#111C2E] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#26D6A0]/15 text-[#26D6A0]">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-extrabold text-white">
                Robinhood MCP Server Setup, Live Adapter & Better Options Playbook
              </h1>
              <span className="rounded-md bg-[#F59E0B]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F59E0B]">
                ADAPTER READY • PAPER DEFAULT
              </span>
            </div>
            <p className="text-xs text-[#9BAFC4]">
              Step-by-step guide to connect Robinhood MCP, sync trades, and apply high-probability 0DTE options execution rules
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('SETUP_GUIDE')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'SETUP_GUIDE'
                ? 'bg-[#26D6A0] text-[#0B1220]'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>1. Robinhood MCP Setup Steps</span>
          </button>

          <button
            onClick={() => setActiveTab('BETTER_PLAYBOOK')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'BETTER_PLAYBOOK'
                ? 'bg-[#26D6A0] text-[#0B1220]'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>2. Better Options Playbook</span>
          </button>

          <button
            onClick={() => setActiveTab('MCP_SCHEMA_SYNC')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'MCP_SCHEMA_SYNC'
                ? 'bg-[#26D6A0] text-[#0B1220]'
                : 'border border-[#1E2D45] bg-[#0B1220] text-[#9BAFC4] hover:text-white'
            }`}
          >
            <FileJson className="h-4 w-4" />
            <span>3. MCP Probe & History Sync</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STEP-BY-STEP ROBINHOOD MCP SERVER SETUP */}
      {activeTab === 'SETUP_GUIDE' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {MCP_SETUP_STEPS.map((s, idx) => (
              <div
                key={s.step}
                className="flex flex-col justify-between rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-[#26D6A0]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                      STEP {idx + 1}
                    </span>
                    <button
                      onClick={() => copyText(s.code, idx)}
                      className="flex items-center gap-1 rounded-lg border border-[#1E2D45] bg-[#0B1220] px-2.5 py-1 text-[11px] font-bold text-[#9BAFC4] hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedIdx === idx ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <h2 className="text-sm font-extrabold text-white">
                    {s.step}
                  </h2>
                  <p className="text-xs text-[#9BAFC4] leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <pre className="overflow-x-auto rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3 font-mono text-[11px] text-[#26D6A0]">
                  {s.code}
                </pre>
              </div>
            ))}
          </div>

          {/* Trading Permission Modes */}
          <div className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-white">
                Select Active Broker Execution Mode
              </h2>
              <button
                onClick={handleDiscoverCapabilities}
                className="flex items-center gap-1.5 rounded-xl bg-[#26D6A0] px-4 py-2 text-xs font-extrabold text-[#0B1220]"
              >
                <RefreshCw
                  className={`h-4 w-4 ${probing ? 'animate-spin' : ''}`}
                />
                <span>Test Robinhood MCP Connection Now</span>
              </button>
            </div>

            {probeMessage && (
              <div className="rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-3 text-xs text-[#F59E0B]">
                {probeMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              {(
                [
                  {
                    mode: 'READ_ONLY' as TradingPermissionMode,
                    title: '1. Read-Only Sync Mode',
                    desc: 'Syncs Robinhood account balances, open positions & trade history into your Daily Journal. Blocks all order placement.',
                  },
                  {
                    mode: 'PAPER' as TradingPermissionMode,
                    title: '2. Paper Trading Mode (Active Default)',
                    desc: 'Routes all manual and automated strategy orders to the TradePilot Paper Engine with real-time Black-Scholes Greeks.',
                  },
                  {
                    mode: 'LIVE' as TradingPermissionMode,
                    title: '3. Live Robinhood Execution Mode',
                    desc: 'Requires two-step pre-authorization + connected Robinhood MCP bridge + passing the 10-Min Discipline Check.',
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.mode}
                  onClick={() => {
                    if (item.mode === 'LIVE' && !liveTradingAuthorized) return;
                    setPermissionMode(item.mode);
                  }}
                  className={`rounded-xl border p-4 text-left transition ${
                    permissionMode === item.mode
                      ? 'border-[#26D6A0] bg-[#26D6A0]/15'
                      : 'border-[#1E2D45] bg-[#0B1220]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{item.title}</span>
                    {item.mode === 'LIVE' ? (
                      <Lock className="h-4 w-4 text-[#F59E0B]" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-[#26D6A0]" />
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-[#9BAFC4]">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3 text-xs">
              <div className="flex items-center gap-2 text-[#9BAFC4]">
                <ShieldAlert className="h-4 w-4 text-[#F59E0B]" />
                <span>
                  Pre-Authorize Live Adapter Mode (Safe while MCP server is offline):
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
                <input
                  type="checkbox"
                  checked={liveTradingAuthorized}
                  onChange={(e) => setLiveTradingAuthorized(e.target.checked)}
                  className="accent-[#26D6A0]"
                />
                <span>Authorize Live Mode</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BETTER OPTIONS TRADING PLAYBOOK */}
      {activeTab === 'BETTER_PLAYBOOK' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {BETTER_OPTIONS_PLAYBOOK.map((rule) => (
            <div
              key={rule.title}
              className="rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-[#26D6A0]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0]">
                  {rule.badge}
                </span>
                <BookOpen className="h-4 w-4 text-[#26D6A0]" />
              </div>
              <h3 className="text-sm font-extrabold text-white">
                {rule.title}
              </h3>
              <p className="text-xs text-[#9BAFC4] leading-relaxed">
                {rule.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: MCP TOOL SCHEMA REGISTRY & ROBINHOOD JSON IMPORTER */}
      {activeTab === 'MCP_SCHEMA_SYNC' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-6 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5">
            <h2 className="text-sm font-extrabold text-white mb-3">
              Robinhood MCP Tool Schema Registry ({discoveredTools.length} Tools)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-[#1E2D45] text-[10px] uppercase text-[#9BAFC4]">
                  <tr>
                    <th className="py-2 px-2">MCP Tool Name</th>
                    <th className="py-2 px-2">Capability</th>
                    <th className="py-2 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]">
                  {discoveredTools.map((tool) => (
                    <tr key={tool.name}>
                      <td className="py-2.5 px-2 font-bold text-[#26D6A0]">
                        {tool.name}
                      </td>
                      <td className="py-2.5 px-2 font-sans text-xs text-[#9BAFC4]">
                        {tool.description}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="inline-flex items-center gap-1 rounded bg-[#F59E0B]/15 px-2 py-0.5 text-[10px] font-bold text-[#F59E0B]">
                          <WifiOff className="h-3 w-3" /> {tool.modeAllowed}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-[#1E2D45] bg-[#111C2E] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-white">
                  Import Robinhood Option History JSON
                </h2>
                <p className="text-xs text-[#9BAFC4]">
                  Reconstructs multi-leg spreads and syncs them directly into your Daily Journal
                </p>
              </div>
              <button
                onClick={handleSyncRobinhoodHistory}
                className="rounded-xl bg-[#26D6A0] px-4 py-2 text-xs font-extrabold text-[#0B1220]"
              >
                Import to Journal
              </button>
            </div>
            <textarea
              rows={8}
              value={rhJsonInput}
              onChange={(e) => setRhJsonInput(e.target.value)}
              className="w-full rounded-xl border border-[#1E2D45] bg-[#0B1220] p-3 font-mono text-xs text-white"
            />
            {syncFeedback && (
              <div className="rounded-xl bg-[#22C55E]/15 p-3 text-xs font-bold text-[#22C55E]">
                {syncFeedback}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
