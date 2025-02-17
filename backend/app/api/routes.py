from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Import trading logic modules
from backend.app.execution.execute_ccxt import Executor
from backend.app.execution.execute_hyperliquid import ask_bid, limit_order, LocalAccount

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

@router.get("/balance")
def get_balance(exchange: str, meaningful_only: bool = False, threshold: float = 0.1):
    """Fetch the account balance for the given exchange."""
    try:
        if exchange.upper() == "HYPERLIQUID":
            raise HTTPException(status_code=400, detail="HyperLiquid balance fetching not supported via API yet.")
        executor = Executor(exchange)
        result = executor.fetch_balance(meaningful_only, threshold)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/order")
def create_order(order_req: OrderRequest):
    """Create an order using the specified trading logic."""
    try:
        if order_req.exchange.upper() == "HYPERLIQUID":
            # For demonstration, use ask_bid and limit_order from HyperLiquid module
            bid, _, _ = ask_bid(order_req.symbol)
            is_buy = True if order_req.side.lower() == "buy" else False
            result = limit_order(order_req.symbol, is_buy, order_req.price or bid, False, LocalAccount)
            return {"result": result}
        else:
            executor = Executor(order_req.exchange)
            if order_req.order_type.lower() in ["limit", "market", "stop"]:
                result = executor.create_order(order_req.symbol, order_req.order_type, order_req.side, order_req.amount, order_req.price)
            else:
                result = f"Unsupported order type: {order_req.order_type} for ccxt execution."
            return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/open-orders")
def get_open_orders(exchange: str, symbol: str):
    """Retrieve open orders for a given symbol."""
    try:
        if exchange.upper() == "HYPERLIQUID":
            raise HTTPException(status_code=400, detail="HyperLiquid open orders fetching not supported via API yet.")
        executor = Executor(exchange)
        result = executor.fetch_open_orders(symbol.upper())
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel-orders")
def cancel_orders(exchange: str, symbol: str):
    """Cancel all orders for the given symbol."""
    try:
        if exchange.upper() == "HYPERLIQUID":
            raise HTTPException(status_code=400, detail="HyperLiquid cancel orders not supported via API yet.")
        executor = Executor(exchange)
        result = executor.cancel_all_orders(symbol.upper())
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trade-cycle")
def trade_cycle(exchange: str, symbol: str = 'SOL/USDT', order_type: str = 'limit', side: str = 'sell', amount: float = 0.01, price: float = 5000):
    """Execute a full trade cycle for the given parameters."""
    try:
        if exchange.upper() == "HYPERLIQUID":
            raise HTTPException(status_code=400, detail="HyperLiquid trade cycle not supported via API yet.")
        executor = Executor(exchange)
        result = executor.execute_trade_cycle(symbol, order_type, side, amount, price)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 