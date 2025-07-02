"""
Pydantic schemas for paper trading operations
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum


class PaperTradingStatusEnum(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    STOPPED = "stopped"
    COMPLETED = "completed"


class PaperOrderSideEnum(str, Enum):
    BUY = "buy"
    SELL = "sell"


class PaperOrderTypeEnum(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"


class PaperOrderStatusEnum(str, Enum):
    PENDING = "pending"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class PaperTradingSessionCreate(BaseModel):
    """Schema for creating a new paper trading session"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    strategy_id: int = Field(..., gt=0)
    symbol: str = Field(..., min_length=1, max_length=20)
    initial_capital: float = Field(default=10000.0, gt=0, le=1000000)
    max_position_size: Optional[float] = Field(default=25.0, gt=0, le=100)
    stop_loss_pct: Optional[float] = Field(None, gt=0, le=50)
    take_profit_pct: Optional[float] = Field(None, gt=0, le=100)
    max_open_positions: int = Field(default=3, ge=1, le=10)
    data_source: str = Field(default="binance", max_length=50)
    update_interval: int = Field(default=5, ge=1, le=60)
    strategy_overrides: Optional[Dict[str, Any]] = None
    
    @field_validator('symbol')
    @classmethod
    def symbol_format(cls, v):
        return v.upper().replace('/', '')


class PaperTradingSessionUpdate(BaseModel):
    """Schema for updating a paper trading session"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[PaperTradingStatusEnum] = None
    max_position_size: Optional[float] = Field(None, gt=0, le=100)
    stop_loss_pct: Optional[float] = Field(None, gt=0, le=50)
    take_profit_pct: Optional[float] = Field(None, gt=0, le=100)
    max_open_positions: Optional[int] = Field(None, ge=1, le=10)


class PaperOrderCreate(BaseModel):
    """Schema for creating a new paper order"""
    symbol: str = Field(..., min_length=1, max_length=20)
    side: PaperOrderSideEnum
    order_type: PaperOrderTypeEnum
    quantity: float = Field(..., gt=0)
    price: Optional[float] = Field(None, gt=0)
    stop_price: Optional[float] = Field(None, gt=0)


class PaperOrderSchema(BaseModel):
    """Schema for paper order data"""
    id: int
    order_id: str
    session_id: int
    symbol: str
    side: str
    order_type: str
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    status: str
    filled_quantity: float = 0.0
    remaining_quantity: Optional[float] = None
    avg_fill_price: Optional[float] = None
    created_at: datetime
    filled_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    market_price: Optional[float] = None
    commission: float = 0.0
    signal_data: Optional[Dict[str, Any]] = None
    
    model_config = {"from_attributes": True}


class PaperPositionSchema(BaseModel):
    """Schema for paper position data"""
    id: int
    position_id: str
    session_id: int
    symbol: str
    side: str
    quantity: float
    entry_price: float
    current_price: float
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0
    total_fees: float = 0.0
    stop_loss_price: Optional[float] = None
    take_profit_price: Optional[float] = None
    opened_at: datetime
    updated_at: datetime
    is_open: bool = True
    entry_signal_data: Optional[Dict[str, Any]] = None
    
    model_config = {"from_attributes": True}


class PaperTradeSchema(BaseModel):
    """Schema for completed paper trade"""
    id: int
    trade_id: str
    session_id: int
    symbol: str
    side: str
    quantity: float
    entry_price: float
    exit_price: float
    entry_time: datetime
    exit_time: datetime
    duration_seconds: Optional[int] = None
    pnl: float
    pnl_pct: float
    fees: float = 0.0
    exit_reason: Optional[str] = None
    entry_signal_data: Optional[Dict[str, Any]] = None
    exit_signal_data: Optional[Dict[str, Any]] = None
    
    model_config = {"from_attributes": True}


class PaperPortfolioSnapshotSchema(BaseModel):
    """Schema for portfolio snapshot"""
    id: int
    session_id: int
    timestamp: datetime
    total_value: float
    cash_balance: float
    position_value: float = 0.0
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0
    total_return: float = 0.0
    daily_return: float = 0.0
    open_positions: int = 0
    long_positions: int = 0
    short_positions: int = 0
    market_prices: Optional[Dict[str, Any]] = None
    
    model_config = {"from_attributes": True}


class PaperTradingAlertSchema(BaseModel):
    """Schema for paper trading alert"""
    id: int
    session_id: int
    alert_type: str
    title: str
    message: str
    severity: str = "info"
    symbol: Optional[str] = None
    trade_id: Optional[str] = None
    order_id: Optional[str] = None
    context_data: Optional[Dict[str, Any]] = None
    is_read: bool = False
    created_at: datetime
    
    model_config = {"from_attributes": True}


class PaperTradingSessionSchema(BaseModel):
    """Schema for complete paper trading session"""
    id: int
    name: str
    description: Optional[str] = None
    strategy_id: int
    user_id: int
    symbol: str
    initial_capital: float
    current_capital: float
    max_position_size: float = 25.0
    stop_loss_pct: Optional[float] = None
    take_profit_pct: Optional[float] = None
    max_open_positions: int = 3
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    last_activity: datetime
    total_pnl: float = 0.0
    total_fees: float = 0.0
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    data_source: str = "binance"
    update_interval: int = 5
    strategy_overrides: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional related data
    current_positions: Optional[List[PaperPositionSchema]] = None
    recent_trades: Optional[List[PaperTradeSchema]] = None
    recent_orders: Optional[List[PaperOrderSchema]] = None
    
    model_config = {"from_attributes": True}


class PaperTradingSessionListResponse(BaseModel):
    """Schema for session list response"""
    sessions: List[PaperTradingSessionSchema]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaperTradingSearchParams(BaseModel):
    """Schema for paper trading search parameters"""
    strategy_id: Optional[int] = None
    symbol: Optional[str] = None
    status: Optional[PaperTradingStatusEnum] = None
    start_date_from: Optional[datetime] = None
    start_date_to: Optional[datetime] = None
    min_return: Optional[float] = None
    max_drawdown: Optional[float] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


class PaperTradingPerformanceSchema(BaseModel):
    """Schema for session performance metrics"""
    session_id: int
    total_return: float
    total_return_pct: float
    daily_return_avg: float
    volatility: float
    sharpe_ratio: Optional[float] = None
    max_drawdown: float
    max_drawdown_pct: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    avg_win: float
    avg_loss: float
    profit_factor: Optional[float] = None
    largest_win: float
    largest_loss: float
    avg_trade_duration: float  # in hours
    total_fees: float
    start_date: datetime
    end_date: Optional[datetime] = None
    days_active: int


class MarketDataTickSchema(BaseModel):
    """Schema for real-time market data tick"""
    symbol: str
    timestamp: datetime
    price: float
    bid: Optional[float] = None
    ask: Optional[float] = None
    volume: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    change_24h: Optional[float] = None
    change_24h_pct: Optional[float] = None


class OrderBookSchema(BaseModel):
    """Schema for order book data"""
    symbol: str
    timestamp: datetime
    bids: List[List[float]]  # [[price, size], ...]
    asks: List[List[float]]  # [[price, size], ...]
    best_bid: Optional[float] = None
    best_ask: Optional[float] = None
    spread: Optional[float] = None


class PaperTradingStatsSchema(BaseModel):
    """Schema for session statistics"""
    session_id: int
    current_value: float
    total_return: float
    total_return_pct: float
    unrealized_pnl: float
    realized_pnl: float
    total_fees: float
    open_positions: int
    total_trades: int
    win_rate: float
    best_trade: float
    worst_trade: float
    avg_trade_duration: float
    last_update: datetime


class WebSocketMessage(BaseModel):
    """Schema for WebSocket messages"""
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_id: Optional[int] = None


class PaperTradingCommand(BaseModel):
    """Schema for trading commands"""
    command: str  # "start", "stop", "pause", "resume", "place_order", "cancel_order"
    session_id: int
    parameters: Optional[Dict[str, Any]] = None