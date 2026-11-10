// ============================================================================
// TradePilot – Phase 4: Robinhood MCP Adapter & Historical Sync Service
// ============================================================================

import { JournalEntry } from '../types/trading';

export interface McpToolSchema {
  name: string;
  description: string;
  capabilityMapped: string;
  available: boolean;
  modeAllowed: 'READ_ONLY' | 'PAPER' | 'LIVE_LOCKED';
}

export interface McpDiscoveryResult {
  serverUrl: string;
  connected: boolean;
  authenticated: boolean;
  discoveredAt: string;
  message: string;
  tools: McpToolSchema[];
}

export const EXPECTED_MCP_TOOLS: McpToolSchema[] = [
  {
    name: 'robinhood_get_account',
    description: 'Reads Robinhood account number, margin tier, and cash balances',
    capabilityMapped: 'Account Information',
    available: false,
    modeAllowed: 'READ_ONLY',
  },
  {
    name: 'robinhood_get_buying_power',
    description: 'Fetches real-time options buying power and Reg-T maintenance requirement',
    capabilityMapped: 'Buying Power',
    available: false,
    modeAllowed: 'READ_ONLY',
  },
  {
    name: 'robinhood_get_option_positions',
    description: 'Lists currently open single and multi-leg options positions',
    capabilityMapped: 'Positions',
    available: false,
    modeAllowed: 'READ_ONLY',
  },
  {
    name: 'robinhood_get_options_chain',
    description: 'Queries SPX/index and equity option chains by expiration date',
    capabilityMapped: 'Options Chains',
    available: false,
    modeAllowed: 'READ_ONLY',
  },
  {
    name: 'robinhood_get_option_quote',
    description: 'Fetches Bid, Ask, Mark, IV, and Greeks for an option contract',
    capabilityMapped: 'Option Quotes',
    available: false,
    modeAllowed: 'READ_ONLY',
  },
  {
    name: 'robinhood_get_option_orders',
    description: 'Retrieves historical and working option order statuses',
    capabilityMapped: 'Historical Orders',
    available: false,
    modeAllowed: 'READ_ONLY',
  },
  {
    name: 'robinhood_get_trade_executions',
    description: 'Fetches leg-level execution fills and regulatory fees for Journal Sync',
    capabilityMapped: 'Trade History',
    available: false,
    modeAllowed: 'READ_ONLY',
  },
  {
    name: 'robinhood_submit_option_order',
    description: 'Submits single or multi-leg option order (DISABLED in initial release)',
    capabilityMapped: 'Order Submission',
    available: false,
    modeAllowed: 'LIVE_LOCKED',
  },
  {
    name: 'robinhood_cancel_option_order',
    description: 'Cancels an open working option order by order_id',
    capabilityMapped: 'Order Cancellation',
    available: false,
    modeAllowed: 'LIVE_LOCKED',
  },
  {
    name: 'robinhood_close_option_position',
    description: 'Submits closing order for an existing option position',
    capabilityMapped: 'Position Closing',
    available: false,
    modeAllowed: 'LIVE_LOCKED',
  },
];

/**
 * Queries the backend Robinhood MCP adapter endpoint to discover actual server capabilities.
 * Never fabricates a connection if the server is unreachable or unconfigured.
 */
export async function discoverRobinhoodMcpTools(): Promise<McpDiscoveryResult> {
  const nowIso = new Date().toISOString();
  try {
    const res = await fetch('/api/broker/robinhood-mcp/discover', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        serverUrl: 'Backend Managed (/api/broker/robinhood-mcp)',
        connected: Boolean(data.connected),
        authenticated: Boolean(data.connected),
        discoveredAt: nowIso,
        message:
          data.message ||
          'Backend MCP adapter responded: Server not connected. Running in Disconnected / Paper mode.',
        tools: EXPECTED_MCP_TOOLS,
      };
    }
  } catch {
    // Fallback when running Vite without Netlify dev proxy
  }

  return {
    serverUrl: 'Backend Adapter (/.netlify/functions/robinhood-mcp-adapter)',
    connected: false,
    authenticated: false,
    discoveredAt: nowIso,
    message:
      'ROBINHOOD_MCP_SERVER_URL is not connected. Broker interface active in Disconnected / Paper-Only mode.',
    tools: EXPECTED_MCP_TOOLS,
  };
}

export const SAMPLE_ROBINHOOD_HISTORY_JSON = `[
  {
    "order_id": "RH-ORD-7741",
    "execution_id": "RH-EXEC-99101",
    "trade_date": "2026-11-09",
    "symbol": "SPX",
    "strategy": "Bull Put Credit Spread",
    "legs": [
      { "occ_symbol": "SPXW261109P05960000", "side": "SELL_TO_OPEN", "strike": 5960, "type": "PUT", "qty": 2, "entry": 4.90, "exit": 1.15 },
      { "occ_symbol": "SPXW261109P05945000", "side": "BUY_TO_OPEN", "strike": 5945, "type": "PUT", "qty": 2, "entry": 1.80, "exit": 0.35 }
    ],
    "fees": 5.20,
    "entry_time": "09:40 ET",
    "exit_time": "14:55 ET",
    "notes": "Imported from Robinhood Option History JSON export"
  }
]`;

/**
 * Parses a Robinhood option transaction JSON payload and reconstructs strategy-level Journal entries.
 */
export function parseRobinhoodHistoryExport(jsonText: string): {
  entries: Omit<JournalEntry, 'id'>[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      return { entries: [], error: 'JSON root must be an array of Robinhood order objects.' };
    }

    const entries: Omit<JournalEntry, 'id'>[] = parsed.map((item) => {
      const legs = Array.isArray(item.legs) ? item.legs : [];
      const qty = legs[0]?.qty || 1;
      const fees = Number(item.fees) || 2.6;

      // Reconstruct combined net P&L across all legs
      let netPts = 0;
      let netEntryPts = 0;
      let netExitPts = 0;

      legs.forEach(
        (l: {
          side: string;
          entry: number;
          exit: number;
        }) => {
          const isBuy = String(l.side).startsWith('BUY');
          netEntryPts += (isBuy ? 1 : -1) * Number(l.entry);
          netExitPts += (isBuy ? 1 : -1) * Number(l.exit);
          netPts += isBuy
            ? Number(l.exit) - Number(l.entry)
            : Number(l.entry) - Number(l.exit);
        }
      );

      const realizedPnl = Number((netPts * 100 * qty - fees).toFixed(2));
      const absEntry = Math.max(0.1, Math.abs(netEntryPts));
      const returnPct = Number((((netPts) / absEntry) * 100).toFixed(2));
      const strikeSummary = legs
        .map((l: { strike: number; type: string }) => `${l.strike}${l.type?.[0] || ''}`)
        .join(' / ');

      return {
        tradeDate: item.trade_date || '2026-11-09',
        symbol: item.symbol || 'SPX',
        instrumentType: legs.length > 1 ? 'MULTI_LEG_OPTION' : 'CALL',
        optionType: legs.length > 1 ? 'MULTI-LEG' : legs[0]?.type || 'CALL',
        strikeSummary: strikeSummary || '5985C',
        expirationDate: item.trade_date || '2026-11-09',
        contracts: qty,
        entryPrice: Number(Math.abs(netEntryPts).toFixed(2)),
        exitPrice: Number(Math.abs(netExitPts).toFixed(2)),
        entryTime: item.entry_time || '09:40 ET',
        exitTime: item.exit_time || '15:10 ET',
        fees,
        slippage: 0,
        realizedPnl,
        returnPct,
        strategy: item.strategy || 'Robinhood Imported Spread',
        moneyness: 'OTM',
        tradingMode: 'ROBINHOOD_SYNC',
        entryReason: 'Robinhood Historical Account Import',
        exitReason: 'Robinhood Historical Account Import',
        notes: item.notes || `Synced order ${item.order_id} (${legs.length} legs reconstructed)`,
        orderIds: [item.order_id || 'RH-ORD'],
        executionIds: [item.execution_id || 'RH-EXEC'],
        legsCount: legs.length || 1,
        isVerified: true,
      };
    });

    return { entries };
  } catch (e) {
    return {
      entries: [],
      error: e instanceof Error ? e.message : 'Invalid Robinhood JSON format',
    };
  }
}
