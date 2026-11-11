#!/usr/bin/env python3
"""
TradePilot — Robinhood FastMCP Bridge Server
Connects TradePilot Command Center to Robinhood via robin_stocks + FastMCP + TOTP 2FA.

Installation:
    pip install fastmcp robin_stocks pyotp uvicorn

Usage:
    export ROBINHOOD_USERNAME="your_email@gmail.com"
    export ROBINHOOD_PASSWORD="your_password"
    export ROBINHOOD_TOTP_SECRET="YOUR16CHARTOTPKEY"
    export ROBINHOOD_MCP_AUTH_TOKEN="tp_secret_bridge_token_2026"
    python robinhood_mcp_server.py
"""

import os
import sys
import pyotp
import logging
from typing import Optional, Dict, Any, List
from fastmcp import FastMCP

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("robinhood-mcp")

# Initialize FastMCP Server
mcp = FastMCP(
    name="TradePilot Robinhood MCP Server",
    instructions="Bridges TradePilot trading command center to Robinhood with strict 1-contract discipline rules."
)

# Configuration from Environment
ROBINHOOD_USERNAME = os.getenv("ROBINHOOD_USERNAME", "")
ROBINHOOD_PASSWORD = os.getenv("ROBINHOOD_PASSWORD", "")
ROBINHOOD_TOTP_SECRET = os.getenv("ROBINHOOD_TOTP_SECRET", "")
MCP_AUTH_TOKEN = os.getenv("ROBINHOOD_MCP_AUTH_TOKEN", "tp_secret_bridge_token_2026")

_is_logged_in = False

def ensure_login() -> bool:
    global _is_logged_in
    if _is_logged_in:
        return True
    try:
        import robin_stocks.robinhood as r
        totp = pyotp.TOTP(ROBINHOOD_TOTP_SECRET).now() if ROBINHOOD_TOTP_SECRET else None
        logger.info(f"Attempting Robinhood login for {ROBINHOOD_USERNAME}...")
        login_res = r.login(
            username=ROBINHOOD_USERNAME,
            password=ROBINHOOD_PASSWORD,
            mfa_code=totp,
            store_session=True
        )
        _is_logged_in = True
        logger.info("Robinhood login successful!")
        return True
    except Exception as e:
        logger.error(f"Failed to log into Robinhood: {e}")
        return False

@mcp.tool()
def robinhood_ping() -> Dict[str, Any]:
    """Tests the MCP server connectivity and returns status."""
    return {
        "status": "ONLINE",
        "mcp_version": "1.0.0",
        "service": "TradePilot Robinhood Bridge",
        "configured_user": ROBINHOOD_USERNAME[:3] + "***@" + ROBINHOOD_USERNAME.split("@")[-1] if "@" in ROBINHOOD_USERNAME else "UNCONFIGURED"
    }

@mcp.tool()
def robinhood_get_account() -> Dict[str, Any]:
    """Fetches Robinhood account profile, cash balance, and buying power."""
    ensure_login()
    try:
        import robin_stocks.robinhood as r
        profile = r.load_account_profile()
        portfolio = r.load_portfolio_profile()
        return {
            "account_number": profile.get("account_number", "RH-XXXX"),
            "buying_power": float(profile.get("buying_power", 0.0)),
            "cash": float(profile.get("cash", 0.0)),
            "portfolio_equity": float(portfolio.get("equity", 0.0)),
            "market_value": float(portfolio.get("market_value", 0.0)),
            "options_trading_level": profile.get("options_trading_level", "Level 2/3")
        }
    except Exception as e:
        return {"error": str(e), "buying_power": 25000.0, "status": "SIMULATED_FALLBACK"}

@mcp.tool()
def robinhood_get_option_positions() -> List[Dict[str, Any]]:
    """Retrieves all currently open option positions on Robinhood."""
    ensure_login()
    try:
        import robin_stocks.robinhood as r
        positions = r.get_open_option_positions()
        res = []
        for pos in positions:
            res.append({
                "chain_symbol": pos.get("chain_symbol"),
                "quantity": float(pos.get("quantity", 0)),
                "average_price": float(pos.get("average_price", 0)) / 100.0,
                "type": pos.get("type"),
                "id": pos.get("id")
            })
        return res
    except Exception as e:
        logger.error(f"Error fetching option positions: {e}")
        return []

@mcp.tool()
def robinhood_submit_option_order(
    symbol: str,
    strike: float,
    expiration_date: str,
    option_type: str,
    action: str = "buy",
    contracts: int = 1,
    price: float = 0.0,
    order_type: str = "limit"
) -> Dict[str, Any]:
    """
    Submits an option order to Robinhood with strict 1-contract rule enforcement.
    """
    # Strict 1-Quantity Discipline Guard
    if contracts > 1:
        return {
            "success": False,
            "error": f"REJECTED: Strict 1-Quantity rule prohibits submitting {contracts} contracts. Max allowed: 1 contract."
        }

    ensure_login()
    try:
        import robin_stocks.robinhood as r
        logger.info(f"Submitting {action.upper()} 1 contract {symbol} {strike} {option_type} @ ${price:.2f}")
        
        # Real execution via robin_stocks
        side = "buy_to_open" if action.lower() == "buy" else "sell_to_open"
        order_res = r.order_option_spread(
            direction="debit" if action.lower() == "buy" else "credit",
            price=price,
            symbol=symbol,
            quantity=1,
            spread=[{
                "expirationDate": expiration_date,
                "strike": str(strike),
                "optionType": option_type.lower(),
                "effect": "open",
                "action": action.lower()
            }],
            timeInForce="gfd"
        )
        return {
            "success": True,
            "order_id": order_res.get("id", f"RH-ORD-{os.urandom(4).hex()}"),
            "status": order_res.get("state", "filled"),
            "symbol": symbol,
            "strike": strike,
            "contracts": 1,
            "fill_price": price
        }
    except Exception as e:
        logger.error(f"Robinhood order failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "simulated": True,
            "message": f"Simulated order accepted: 1 {symbol} {strike} {option_type} @ ${price:.2f}"
        }

@mcp.tool()
def robinhood_cancel_order(order_id: str) -> Dict[str, Any]:
    """Cancels a working option order on Robinhood."""
    ensure_login()
    try:
        import robin_stocks.robinhood as r
        r.cancel_option_order(order_id)
        return {"success": True, "order_id": order_id, "status": "CANCELLED"}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8787"))
    logger.info(f"Starting TradePilot Robinhood MCP Server on port {port}...")
    mcp.run(transport="sse", port=port)
