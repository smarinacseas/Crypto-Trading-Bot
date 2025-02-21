from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Import trading logic modules
from backend.app.execution.execute_ccxt import Executor
from backend.app.execution.execute_hyperliquid import HyperLiquidExecutor

router = APIRouter()

# Request model for order creation
class OrderRequest(BaseModel):
    exchange: str
    symbol: str
    order_type: str
    side: str
    amount: float
    price: float = None
    leverage: float = None


def get_executor(exchange: str):
    """
    Helper function to return the appropriate executor instance based on the exchange name.
    """
    if exchange.upper() == "HYPERLIQUID":
        return HyperLiquidExecutor()
    else:
        return Executor(exchange)


@router.get("/balance")
def get_balance(exchange: str, meaningful_only: bool = False, threshold: float = 0.1):
    """Fetch the account balance for the given exchange."""
    try:
        executor = get_executor(exchange)
        result = executor.fetch_balance(meaningful_only, threshold)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/order")
def create_order(order_req: OrderRequest):
    """Create an order using the specified trading logic."""
    try:
        executor = get_executor(order_req.exchange)
        # Optionally set leverage if provided
        if order_req.leverage is not None:
            executor.set_leverage(order_req.leverage, order_req.symbol)
        result = executor.create_order(
            order_req.symbol,
            order_req.order_type,
            order_req.side,
            order_req.amount,
            order_req.price
        )
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/open-orders")
def get_open_orders(exchange: str, symbol: str):
    """Retrieve open orders for a given symbol.
    MEXC: SOL/USDT"""
    try:
        executor = get_executor(exchange)
        result = executor.fetch_open_orders(symbol)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cancel-orders")
def cancel_orders(exchange: str, symbol: str):
    """Cancel all orders for the given symbol."""
    try:
        executor = get_executor(exchange)
        result = executor.cancel_all_orders(symbol)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trade-cycle")
def trade_cycle(exchange: str, symbol: str = 'SOL/USDT', order_type: str = 'limit', side: str = 'sell', amount: float = 0.01, price: float = 5000):
    """Execute a full trade cycle for the given parameters."""
    try:
        executor = get_executor(exchange)
        result = executor.execute_trade_cycle(symbol, order_type, side, amount, price)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/kill-switch")
def kill_switch(exchange: str, symbol: str = None):
    """Activate the kill switch to cancel all orders and, if applicable, close positions.
    For HyperLiquid, the symbol parameter is ignored.
    For ccxt-based exchanges, an optional symbol can be provided to target a specific asset."""
    try:
        executor = get_executor(exchange)
        if exchange.upper() == "HYPERLIQUID":
            # For HyperLiquidExecutor, kill_switch does not accept a symbol argument
            result = executor.kill_switch()
        else:
            # For ccxt Executor, pass the symbol if provided
            result = executor.kill_switch(symbol)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 