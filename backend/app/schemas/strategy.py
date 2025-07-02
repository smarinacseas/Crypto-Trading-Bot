from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum

from backend.app.models.strategy import StrategyType, RiskLevel, StrategyStatus


class StrategyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=255)
    strategy_type: StrategyType
    risk_level: RiskLevel
    min_capital: float = Field(default=100.0, ge=0)
    recommended_capital: float = Field(default=1000.0, ge=0)
    max_drawdown: Optional[float] = Field(None, ge=0, le=100)
    target_return: Optional[float] = Field(None, ge=-100, le=1000)
    timeframe: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    indicators: Optional[Dict[str, Any]] = None
    entry_conditions: Optional[Dict[str, Any]] = None
    exit_conditions: Optional[Dict[str, Any]] = None
    is_public: bool = False
    tags: Optional[List[str]] = None

    @validator('recommended_capital')
    def recommended_capital_must_be_gte_min_capital(cls, v, values):
        if 'min_capital' in values and v < values['min_capital']:
            raise ValueError('recommended_capital must be >= min_capital')
        return v


class StrategyCreate(StrategyBase):
    pass


class StrategyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=255)
    strategy_type: Optional[StrategyType] = None
    risk_level: Optional[RiskLevel] = None
    min_capital: Optional[float] = Field(None, ge=0)
    recommended_capital: Optional[float] = Field(None, ge=0)
    max_drawdown: Optional[float] = Field(None, ge=0, le=100)
    target_return: Optional[float] = Field(None, ge=-100, le=1000)
    timeframe: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    indicators: Optional[Dict[str, Any]] = None
    entry_conditions: Optional[Dict[str, Any]] = None
    exit_conditions: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None
    status: Optional[StrategyStatus] = None
    tags: Optional[List[str]] = None


class StrategyPerformanceBase(BaseModel):
    total_return: Optional[float] = None
    annual_return: Optional[float] = None
    max_drawdown: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    calmar_ratio: Optional[float] = None
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    win_rate: Optional[float] = None
    avg_win: Optional[float] = None
    avg_loss: Optional[float] = None
    profit_factor: Optional[float] = None
    volatility: Optional[float] = None
    beta: Optional[float] = None
    var_95: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    period_days: Optional[int] = None
    data_source: str = "backtest"


class StrategyPerformanceCreate(StrategyPerformanceBase):
    strategy_id: int


class StrategyPerformanceRead(StrategyPerformanceBase):
    id: int
    strategy_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class UserStrategyBase(BaseModel):
    custom_parameters: Optional[Dict[str, Any]] = None
    is_active: bool = False
    is_favorite: bool = False
    user_capital: Optional[float] = Field(None, ge=0)
    user_notes: Optional[str] = None


class UserStrategyCreate(UserStrategyBase):
    strategy_id: int


class UserStrategyUpdate(BaseModel):
    custom_parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_favorite: Optional[bool] = None
    user_capital: Optional[float] = Field(None, ge=0)
    user_notes: Optional[str] = None


class UserStrategyRead(UserStrategyBase):
    id: int
    user_id: int
    strategy_id: int
    subscribed_at: datetime
    last_used: Optional[datetime] = None

    class Config:
        from_attributes = True


class StrategyRatingBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None


class StrategyRatingCreate(StrategyRatingBase):
    strategy_id: int


class StrategyRatingRead(StrategyRatingBase):
    id: int
    strategy_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StrategySignalBase(BaseModel):
    signal_type: str = Field(..., pattern="^(BUY|SELL|HOLD)$")
    symbol: str = Field(..., min_length=1, max_length=20)
    price: float = Field(..., gt=0)
    confidence: Optional[float] = Field(None, ge=0, le=1)
    conditions_met: Optional[Dict[str, Any]] = None
    indicators_data: Optional[Dict[str, Any]] = None
    market_context: Optional[Dict[str, Any]] = None
    expiry_time: Optional[datetime] = None


class StrategySignalCreate(StrategySignalBase):
    strategy_id: int


class StrategySignalRead(StrategySignalBase):
    id: int
    strategy_id: int
    user_id: int
    signal_time: datetime
    is_active: bool
    is_executed: bool
    execution_price: Optional[float] = None
    execution_time: Optional[datetime] = None

    class Config:
        from_attributes = True


class StrategyRead(StrategyBase):
    id: int
    created_by: int
    status: StrategyStatus
    created_at: datetime
    updated_at: datetime
    
    # Related data
    performance_records: List[StrategyPerformanceRead] = []
    avg_rating: Optional[float] = None
    total_ratings: int = 0
    subscriber_count: int = 0

    class Config:
        from_attributes = True


class StrategyListRead(BaseModel):
    """Simplified strategy model for list views"""
    id: int
    name: str
    short_description: Optional[str] = None
    strategy_type: StrategyType
    risk_level: RiskLevel
    min_capital: float
    recommended_capital: float
    target_return: Optional[float] = None
    avg_rating: Optional[float] = None
    total_ratings: int = 0
    subscriber_count: int = 0
    is_public: bool
    created_at: datetime
    
    # Latest performance metrics
    latest_return: Optional[float] = None
    latest_sharpe: Optional[float] = None
    latest_win_rate: Optional[float] = None

    class Config:
        from_attributes = True


class StrategySearchParams(BaseModel):
    """Search and filter parameters for strategies"""
    search: Optional[str] = None
    strategy_types: Optional[List[StrategyType]] = None
    risk_levels: Optional[List[RiskLevel]] = None
    min_capital_max: Optional[float] = None
    min_return: Optional[float] = None
    min_rating: Optional[float] = Field(None, ge=1, le=5)
    tags: Optional[List[str]] = None
    sort_by: str = Field(default="created_at", pattern="^(created_at|name|rating|return|subscribers)$")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class StrategyMarketplaceResponse(BaseModel):
    """Response model for strategy marketplace"""
    strategies: List[StrategyListRead]
    total_count: int
    has_more: bool
    filters: Dict[str, Any]


class StrategyStatsResponse(BaseModel):
    """Strategy statistics response"""
    total_strategies: int
    public_strategies: int
    avg_rating: Optional[float] = None
    strategy_types_count: Dict[str, int]
    risk_levels_count: Dict[str, int]
    top_performing: List[StrategyListRead]