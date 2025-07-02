"""
Backtesting models for trading strategy testing and analysis
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from backend.app.core.database import Base


class BacktestStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running" 
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BacktestTimeframe(enum.Enum):
    ONE_MINUTE = "1m"
    FIVE_MINUTES = "5m"
    FIFTEEN_MINUTES = "15m"
    THIRTY_MINUTES = "30m"
    ONE_HOUR = "1h"
    FOUR_HOURS = "4h"
    TWELVE_HOURS = "12h"
    ONE_DAY = "1d"
    ONE_WEEK = "1w"


class Backtest(Base):
    """Main backtest configuration and metadata"""
    __tablename__ = "backtests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Strategy reference
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    
    # User reference
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Backtest configuration
    symbol = Column(String, nullable=False)  # e.g., "BTC/USD"
    timeframe = Column(String, nullable=False)  # e.g., "1h", "4h", "1d"
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    initial_capital = Column(Float, nullable=False, default=10000.0)
    
    # Risk management settings
    max_position_size = Column(Float, default=25.0)  # Percentage of capital
    stop_loss_pct = Column(Float)  # Global stop loss percentage
    take_profit_pct = Column(Float)  # Global take profit percentage
    
    # Execution settings
    commission = Column(Float, default=0.001)  # 0.1% default commission
    slippage = Column(Float, default=0.001)  # 0.1% default slippage
    
    # Status and timing
    status = Column(String, default=BacktestStatus.PENDING.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Progress tracking
    progress_pct = Column(Float, default=0.0)
    current_date = Column(DateTime)
    
    # Error handling
    error_message = Column(Text)
    
    # Configuration overrides (JSON)
    strategy_overrides = Column(JSON)  # Override strategy parameters for this backtest
    
    # Relationships
    strategy = relationship("Strategy", back_populates="backtests")
    user = relationship("User", back_populates="backtests")
    results = relationship("BacktestResult", back_populates="backtest", uselist=False)
    trades = relationship("BacktestTrade", back_populates="backtest")
    metrics = relationship("BacktestMetrics", back_populates="backtest")
    equity_curve = relationship("BacktestEquityCurve", back_populates="backtest")


class BacktestResult(Base):
    """Summary results of a completed backtest"""
    __tablename__ = "backtest_results"

    id = Column(Integer, primary_key=True, index=True)
    backtest_id = Column(Integer, ForeignKey("backtests.id"), unique=True, nullable=False)
    
    # Performance metrics
    total_return = Column(Float)
    annual_return = Column(Float)
    max_drawdown = Column(Float)
    sharpe_ratio = Column(Float)
    sortino_ratio = Column(Float)
    calmar_ratio = Column(Float)
    
    # Trade statistics
    total_trades = Column(Integer)
    winning_trades = Column(Integer)
    losing_trades = Column(Integer)
    win_rate = Column(Float)
    avg_win = Column(Float)
    avg_loss = Column(Float)
    profit_factor = Column(Float)
    
    # Risk metrics
    volatility = Column(Float)
    beta = Column(Float)
    alpha = Column(Float)
    var_95 = Column(Float)  # Value at Risk (95%)
    cvar_95 = Column(Float)  # Conditional Value at Risk
    
    # Capital metrics
    final_capital = Column(Float)
    peak_capital = Column(Float)
    lowest_capital = Column(Float)
    avg_capital = Column(Float)
    
    # Time-based metrics
    avg_trade_duration = Column(Float)  # Average trade duration in hours
    max_consecutive_wins = Column(Integer)
    max_consecutive_losses = Column(Integer)
    
    # Market exposure
    market_exposure_pct = Column(Float)  # Percentage of time in market
    long_exposure_pct = Column(Float)
    short_exposure_pct = Column(Float)
    
    # Additional metrics (JSON for flexibility)
    additional_metrics = Column(JSON)
    
    # Timestamps
    calculated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    backtest = relationship("Backtest", back_populates="results")


class BacktestTrade(Base):
    """Individual trades executed during backtest"""
    __tablename__ = "backtest_trades"

    id = Column(Integer, primary_key=True, index=True)
    backtest_id = Column(Integer, ForeignKey("backtests.id"), nullable=False)
    
    # Trade identification
    trade_id = Column(String, nullable=False)  # Unique identifier within backtest
    symbol = Column(String, nullable=False)
    
    # Trade details
    side = Column(String, nullable=False)  # "long" or "short"
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float)
    quantity = Column(Float, nullable=False)
    
    # Timing
    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime)
    duration_hours = Column(Float)
    
    # P&L
    pnl = Column(Float)  # Profit/Loss in base currency
    pnl_pct = Column(Float)  # Profit/Loss percentage
    fees = Column(Float)  # Total fees paid
    
    # Risk management
    stop_loss_price = Column(Float)
    take_profit_price = Column(Float)
    exit_reason = Column(String)  # "stop_loss", "take_profit", "signal", "eod"
    
    # Market data at entry/exit
    entry_signal_data = Column(JSON)  # Indicator values at entry
    exit_signal_data = Column(JSON)  # Indicator values at exit
    
    # Position sizing
    position_size_pct = Column(Float)  # Percentage of capital used
    capital_at_entry = Column(Float)  # Available capital at entry
    
    # Trade status
    is_open = Column(Boolean, default=True)
    
    # Relationships
    backtest = relationship("Backtest", back_populates="trades")


class BacktestMetrics(Base):
    """Time-series metrics during backtest execution"""
    __tablename__ = "backtest_metrics"

    id = Column(Integer, primary_key=True, index=True)
    backtest_id = Column(Integer, ForeignKey("backtests.id"), nullable=False)
    
    # Timestamp
    timestamp = Column(DateTime, nullable=False)
    
    # Portfolio metrics
    portfolio_value = Column(Float, nullable=False)
    cash_balance = Column(Float, nullable=False)
    position_value = Column(Float, default=0.0)
    
    # Performance metrics (rolling)
    rolling_return_1d = Column(Float)
    rolling_return_7d = Column(Float)
    rolling_return_30d = Column(Float)
    rolling_volatility_30d = Column(Float)
    rolling_sharpe_30d = Column(Float)
    
    # Drawdown tracking
    drawdown_pct = Column(Float)
    underwater_duration_days = Column(Float)
    
    # Position tracking
    open_positions = Column(Integer, default=0)
    gross_exposure = Column(Float, default=0.0)
    net_exposure = Column(Float, default=0.0)
    
    # Market data
    market_price = Column(Float)
    market_volume = Column(Float)
    
    # Relationships
    backtest = relationship("Backtest", back_populates="metrics")


class BacktestEquityCurve(Base):
    """Equity curve data points for visualization"""
    __tablename__ = "backtest_equity_curve"

    id = Column(Integer, primary_key=True, index=True)
    backtest_id = Column(Integer, ForeignKey("backtests.id"), nullable=False)
    
    # Time and value
    timestamp = Column(DateTime, nullable=False)
    equity_value = Column(Float, nullable=False)
    
    # Returns
    daily_return = Column(Float)
    cumulative_return = Column(Float)
    
    # Benchmark comparison (optional)
    benchmark_value = Column(Float)
    benchmark_return = Column(Float)
    
    # Additional data for charts
    market_price = Column(Float)
    position_size = Column(Float)
    
    # Relationships
    backtest = relationship("Backtest", back_populates="equity_curve")