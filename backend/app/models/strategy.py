from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, JSON, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from backend.app.core.database import Base


class StrategyType(str, enum.Enum):
    TECHNICAL = "technical"
    FUNDAMENTAL = "fundamental"
    QUANTITATIVE = "quantitative"
    ARBITRAGE = "arbitrage"
    MOMENTUM = "momentum"
    MEAN_REVERSION = "mean_reversion"
    TREND_FOLLOWING = "trend_following"
    SCALPING = "scalping"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class StrategyStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class Strategy(Base):
    __tablename__ = "strategies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    short_description = Column(String(255))
    
    # Strategy Classification
    strategy_type = Column(Enum(StrategyType), nullable=False)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    
    # Trading Parameters
    min_capital = Column(Float, default=100.0)  # Minimum capital required in USD
    recommended_capital = Column(Float, default=1000.0)
    max_drawdown = Column(Float)  # Expected maximum drawdown percentage
    target_return = Column(Float)  # Expected annual return percentage
    timeframe = Column(String(20))  # e.g., "1h", "4h", "1d"
    
    # Strategy Configuration
    parameters = Column(JSON)  # Configurable strategy parameters
    indicators = Column(JSON)  # Required technical indicators
    entry_conditions = Column(JSON)  # Entry signal conditions
    exit_conditions = Column(JSON)  # Exit signal conditions
    
    # Metadata
    is_public = Column(Boolean, default=False)  # Public in marketplace
    is_template = Column(Boolean, default=False)  # Template strategy
    status = Column(Enum(StrategyStatus), default=StrategyStatus.DRAFT)
    
    # Author information
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    tags = Column(JSON)  # Strategy tags for categorization
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="created_strategies")
    performance_records = relationship("StrategyPerformance", back_populates="strategy", cascade="all, delete-orphan")
    user_strategies = relationship("UserStrategy", back_populates="strategy", cascade="all, delete-orphan")
    backtests = relationship("Backtest", back_populates="strategy", cascade="all, delete-orphan")
    paper_trading_sessions = relationship("PaperTradingSession", back_populates="strategy", cascade="all, delete-orphan")


class StrategyPerformance(Base):
    __tablename__ = "strategy_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    
    # Performance Metrics
    total_return = Column(Float)  # Total return percentage
    annual_return = Column(Float)  # Annualized return percentage
    max_drawdown = Column(Float)  # Maximum drawdown percentage
    sharpe_ratio = Column(Float)  # Risk-adjusted return
    sortino_ratio = Column(Float)  # Downside risk-adjusted return
    calmar_ratio = Column(Float)  # Return/max drawdown ratio
    
    # Trading Statistics
    total_trades = Column(Integer, default=0)
    winning_trades = Column(Integer, default=0)
    losing_trades = Column(Integer, default=0)
    win_rate = Column(Float)  # Percentage of winning trades
    avg_win = Column(Float)  # Average winning trade %
    avg_loss = Column(Float)  # Average losing trade %
    profit_factor = Column(Float)  # Gross profit / gross loss
    
    # Risk Metrics
    volatility = Column(Float)  # Strategy volatility
    beta = Column(Float)  # Market correlation
    var_95 = Column(Float)  # Value at Risk (95%)
    
    # Time Period
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    period_days = Column(Integer)
    
    # Data Source
    data_source = Column(String(50))  # "backtest", "live", "paper"
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    strategy = relationship("Strategy", back_populates="performance_records")


class UserStrategy(Base):
    __tablename__ = "user_strategies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    
    # User-specific configuration
    custom_parameters = Column(JSON)  # User's custom parameter overrides
    is_active = Column(Boolean, default=False)  # Currently running
    is_favorite = Column(Boolean, default=False)  # User's favorites
    
    # User's performance tracking
    user_capital = Column(Float)  # Capital allocated to this strategy
    user_notes = Column(Text)  # User's private notes
    
    # Timestamps
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="user_strategies")
    strategy = relationship("Strategy", back_populates="user_strategies")


class StrategyRating(Base):
    __tablename__ = "strategy_ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    rating = Column(Integer, nullable=False)  # 1-5 star rating
    review = Column(Text)  # Optional written review
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    strategy = relationship("Strategy")
    user = relationship("User")


class StrategyCategory(Base):
    __tablename__ = "strategy_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    icon = Column(String(50))  # Icon identifier for UI
    color = Column(String(7))  # Hex color code
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StrategySignal(Base):
    __tablename__ = "strategy_signals"
    
    id = Column(Integer, primary_key=True, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Signal Details
    signal_type = Column(String(20), nullable=False)  # "BUY", "SELL", "HOLD"
    symbol = Column(String(20), nullable=False)
    price = Column(Float, nullable=False)
    confidence = Column(Float)  # 0.0 to 1.0 confidence score
    
    # Signal Context
    conditions_met = Column(JSON)  # Which conditions triggered the signal
    indicators_data = Column(JSON)  # Current indicator values
    market_context = Column(JSON)  # Market conditions at signal time
    
    # Timing
    signal_time = Column(DateTime(timezone=True), server_default=func.now())
    expiry_time = Column(DateTime(timezone=True))  # When signal expires
    
    # Status
    is_active = Column(Boolean, default=True)
    is_executed = Column(Boolean, default=False)
    execution_price = Column(Float)
    execution_time = Column(DateTime(timezone=True))
    
    # Relationships
    strategy = relationship("Strategy")
    user = relationship("User")