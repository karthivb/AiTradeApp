/**
 * TradePilot – Robinhood MCP Backend Adapter Function
 * Performs capability discovery against a configured MCP server without exposing
 * credentials to the frontend. Never fabricates broker connectivity.
 * Live order submission is hard-disabled in initial release.
 */

export const handler = async (event: {
  httpMethod: string;
  body: string | null;
}) => {
  const mcpServerUrl = process.env.ROBINHOOD_MCP_SERVER_URL;
  const mcpAuthToken = process.env.ROBINHOOD_MCP_AUTH_TOKEN;

  if (!mcpServerUrl || !mcpAuthToken) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        connected: false,
        status: 'NOT_CONNECTED',
        permissionMode: 'PAPER',
        liveTradingEnabled: false,
        message:
          'ROBINHOOD_MCP_SERVER_URL and ROBINHOOD_MCP_AUTH_TOKEN are not configured on the backend. Running in disconnected / paper-only mode.',
        capabilities: {
          serverConnection: 'NOT_CONFIGURED',
          authentication: 'NOT_CONFIGURED',
          accountReadAccess: 'UNAVAILABLE',
          positionReadAccess: 'UNAVAILABLE',
          orderReadAccess: 'UNAVAILABLE',
          historicalTransactionAccess: 'UNAVAILABLE',
          optionsQuoteAccess: 'UNAVAILABLE',
          orderSubmissionCapability: 'DISABLED_BY_POLICY',
        },
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      connected: false,
      status: 'DISCONNECTED',
      permissionMode: 'READ_ONLY',
      liveTradingEnabled: false,
      message: 'MCP endpoint configured; live order execution remains locked by TradePilot policy.',
    }),
  };
};
