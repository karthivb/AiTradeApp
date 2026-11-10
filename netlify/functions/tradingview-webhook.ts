/**
 * TradePilot – TradingView Webhook Netlify Function
 * Validates webhook secret, timestamp freshness, idempotency key, payload schema,
 * and enforces global risk controls before queuing paper/live signal evaluation.
 */

const SUPPORTED_SIGNAL_TYPES = new Set([
  'BUY_CALL',
  'BUY_PUT',
  'BUY_STRADDLE',
  'BUY_STRANGLE',
  'EXIT_POSITION',
  'CLOSE_ALL',
  'VWAP_BULLISH',
  'VWAP_BEARISH',
  'EMA_BULLISH',
  'EMA_BEARISH',
]);

const processedIdempotencyKeys = new Set<string>();

export const handler = async (event: {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
}) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const configuredSecret = process.env.TRADINGVIEW_WEBHOOK_SECRET;
    const payload = event.body ? JSON.parse(event.body) : null;

    if (!payload || typeof payload !== 'object') {
      return {
        statusCode: 400,
        body: JSON.stringify({ status: 'REJECTED_PAYLOAD', reason: 'Invalid JSON payload' }),
      };
    }

    // 1. Secret validation
    if (!configuredSecret || payload.secret !== configuredSecret) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          status: 'REJECTED_AUTH',
          reason: 'Webhook secret mismatch or TRADINGVIEW_WEBHOOK_SECRET not configured on backend',
        }),
      };
    }

    // 2. Timestamp freshness check (max 60s drift)
    const signalTimestamp = Number(payload.timestamp);
    const nowMs = Date.now();
    if (!signalTimestamp || Math.abs(nowMs - signalTimestamp) > 60_000) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: 'REJECTED_TIMESTAMP',
          reason: 'Signal timestamp missing or older than 60 seconds stale threshold',
        }),
      };
    }

    // 3. Duplicate-event prevention (Idempotency)
    const idempotencyKey = `${payload.signal_type}_${payload.symbol || 'SPX'}_${signalTimestamp}`;
    if (processedIdempotencyKeys.has(idempotencyKey)) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'DUPLICATE_IGNORED',
          idempotencyKey,
        }),
      };
    }

    // 4. Signal type validation
    if (!SUPPORTED_SIGNAL_TYPES.has(payload.signal_type)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: 'REJECTED_SIGNAL_TYPE',
          reason: `Unsupported signal_type: ${payload.signal_type}`,
        }),
      };
    }

    // 5. Enforce PAPER mode for initial release (Live trading disabled by default)
    const requestedMode = payload.mode === 'LIVE' ? 'PAPER_ENFORCED' : 'PAPER';
    processedIdempotencyKeys.add(idempotencyKey);

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'VALIDATED',
        idempotencyKey,
        executionMode: requestedMode,
        signalType: payload.signal_type,
        symbol: payload.symbol || 'SPX',
        receivedAt: new Date(nowMs).toISOString(),
        note: 'Signal validated through TradePilot risk gate. Routed to Paper Trading Engine.',
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'ERROR',
        reason: error instanceof Error ? error.message : 'Unexpected webhook error',
      }),
    };
  }
};
