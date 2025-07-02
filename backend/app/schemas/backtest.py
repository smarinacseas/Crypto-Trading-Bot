"""
Pydantic schemas for backtesting operations
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum


class BacktestStatusEnum(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BacktestTimeframeEnum(str, Enum):
    ONE_MINUTE = "1m"
    FIVE_MINUTES = "5m"
    FIFTEEN_MINUTES = "15m"
    THIRTY_MINUTES = "30m"
    ONE_HOUR = "1h"
    FOUR_HOURS = "4h"
    TWELVE_HOURS = "12h"
    ONE_DAY = "1d"
    ONE_WEEK = "1w"


class BacktestCreate(BaseModel):
    """Schema for creating a new backtest"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    strategy_id: int = Field(..., gt=0)
    symbol: str = Field(..., min_length=1, max_length=20)
    timeframe: BacktestTimeframeEnum
    start_date: datetime
    end_date: datetime
    initial_capital: float = Field(default=10000.0, gt=0, le=1000000)
    max_position_size: Optional[float] = Field(default=25.0, gt=0, le=100)
    stop_loss_pct: Optional[float] = Field(None, gt=0, le=50)
    take_profit_pct: Optional[float] = Field(None, gt=0, le=100)
    commission: float = Field(default=0.001, ge=0, le=0.1)
    slippage: float = Field(default=0.001, ge=0, le=0.1)
    strategy_overrides: Optional[Dict[str, Any]] = None
    
    @field_validator('end_date')
    @classmethod
    def end_date_after_start_date(cls, v, info):
        if info.data.get('start_date') and v <= info.data['start_date']:
            raise ValueError('End date must be after start date')
        return v
    
    @field_validator('symbol')
    @classmethod
    def symbol_format(cls, v):
        return v.upper().replace('/', '')


class BacktestUpdate(BaseModel):
    """Schema for updating a backtest"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[BacktestStatusEnum] = None


class BacktestTradeSchema(BaseModel):
    """Schema for backtest trade data"""
    trade_id: str
    symbol: str
    side: str
    entry_price: float
    exit_price: Optional[float] = None
    quantity: float
    entry_time: datetime
    exit_time: Optional[datetime] = None
    duration_hours: Optional[float] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    fees: float
    stop_loss_price: Optional[float] = None
    take_profit_price: Optional[float] = None
    exit_reason: Optional[str] = None
    position_size_pct: Optional[float] = None
    is_open: bool = True


class BacktestResultSchema(BaseModel):
    """Schema for backtest results"""
    total_return: Optional[float] = None
    annual_return: Optional[float] = None
    max_drawdown: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    calmar_ratio: Optional[float] = None
    total_trades: Optional[int] = None
    winning_trades: Optional[int] = None
    losing_trades: Optional[int] = None
    win_rate: Optional[float] = None
    avg_win: Optional[float] = None
    avg_loss: Optional[float] = None
    profit_factor: Optional[float] = None
    volatility: Optional[float] = None
    beta: Optional[float] = None
    alpha: Optional[float] = None
    var_95: Optional[float] = None
    cvar_95: Optional[float] = None
    final_capital: Optional[float] = None
    peak_capital: Optional[float] = None
    lowest_capital: Optional[float] = None
    avg_capital: Optional[float] = None
    avg_trade_duration: Optional[float] = None
    max_consecutive_wins: Optional[int] = None
    max_consecutive_losses: Optional[int] = None
    market_exposure_pct: Optional[float] = None
    long_exposure_pct: Optional[float] = None
    short_exposure_pct: Optional[float] = None
    additional_metrics: Optional[Dict[str, Any]] = None
    calculated_at: Optional[datetime] = None


class BacktestMetricsSchema(BaseModel):
    """Schema for backtest metrics time series"""
    timestamp: datetime
    portfolio_value: float
    cash_balance: float
    position_value: float = 0.0
    rolling_return_1d: Optional[float] = None
    rolling_return_7d: Optional[float] = None
    rolling_return_30d: Optional[float] = None
    rolling_volatility_30d: Optional[float] = None
    rolling_sharpe_30d: Optional[float] = None
    drawdown_pct: Optional[float] = None
    underwater_duration_days: Optional[float] = None
    open_positions: int = 0
    gross_exposure: float = 0.0
    net_exposure: float = 0.0
    market_price: Optional[float] = None
    market_volume: Optional[float] = None


class BacktestEquityCurveSchema(BaseModel):
    """Schema for equity curve data points"""
    timestamp: datetime
    equity_value: float
    daily_return: Optional[float] = None
    cumulative_return: Optional[float] = None
    benchmark_value: Optional[float] = None
    benchmark_return: Optional[float] = None
    market_price: Optional[float] = None
    position_size: Optional[float] = None


class BacktestSchema(BaseModel):
    """Schema for complete backtest data"""
    id: int
    name: str
    description: Optional[str] = None
    strategy_id: int
    user_id: int
    symbol: str
    timeframe: str
    start_date: datetime
    end_date: datetime
    initial_capital: float
    max_position_size: Optional[float] = None
    stop_loss_pct: Optional[float] = None
    take_profit_pct: Optional[float] = None
    commission: float
    slippage: float
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress_pct: float = 0.0
    current_date: Optional[datetime] = None
    error_message: Optional[str] = None
    strategy_overrides: Optional[Dict[str, Any]] = None
    
    # Related data (optional for detailed responses)
    results: Optional[BacktestResultSchema] = None
    trades: Optional[List[BacktestTradeSchema]] = None
    equity_curve: Optional[List[BacktestEquityCurveSchema]] = None
    
    model_config = {"from_attributes": True}


class BacktestListResponse(BaseModel):
    """Schema for backtest list response"""
    backtests: List[BacktestSchema]
    total: int
    page: int
    page_size: int
    total_pages: int


class BacktestSearchParams(BaseModel):
    """Schema for backtest search parameters"""
    strategy_id: Optional[int] = None
    symbol: Optional[str] = None
    status: Optional[BacktestStatusEnum] = None
    start_date_from: Optional[datetime] = None
    start_date_to: Optional[datetime] = None
    min_return: Optional[float] = None
    max_drawdown: Optional[float] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


class BacktestComparisonRequest(BaseModel):
    """Schema for comparing multiple backtests"""
    backtest_ids: List[int] = Field(..., min_items=2, max_items=10)
    metrics: Optional[List[str]] = None  # Specific metrics to compare


class BacktestComparisonResponse(BaseModel):
    """Schema for backtest comparison response"""
    backtests: List[BacktestSchema]
    comparison_metrics: Dict[str, Dict[int, float]]  # metric_name -> {backtest_id: value}
    winner_analysis: Dict[str, int]  # metric_name -> winning_backtest_id


class BacktestProgressUpdate(BaseModel):
    """Schema for backtest progress updates"""
    backtest_id: int
    status: BacktestStatusEnum
    progress_pct: float
    current_date: Optional[datetime] = None
    error_message: Optional[str] = None


class QuickBacktestRequest(BaseModel):
    """Schema for quick backtesting without saving to database"""
    strategy_id: int
    symbol: str = "BTCUSD"
    timeframe: BacktestTimeframeEnum = BacktestTimeframeEnum.FOUR_HOURS
    period_days: int = Field(default=30, ge=7, le=365)
    initial_capital: float = Field(default=10000.0, gt=0, le=1000000)
    commission: float = Field(default=0.001, ge=0, le=0.1)


class QuickBacktestResponse(BaseModel):
    """Schema for quick backtest response"""
    strategy_name: str
    symbol: str
    timeframe: str
    period_days: int
    initial_capital: float
    final_capital: float
    total_return: float
    max_drawdown: float
    total_trades: int
    win_rate: float
    sharpe_ratio: float
    profit_factor: float
    equity_curve: List[BacktestEquityCurveSchema]
    recent_trades: List[BacktestTradeSchema]