"""
Paper trading models for real-time strategy testing without capital risk
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from backend.app.core.database import Base


class PaperTradingStatus(enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    STOPPED = "stopped"
    COMPLETED = "completed"


class PaperOrderSide(enum.Enum):
    BUY = "buy"
    SELL = "sell"


class PaperOrderType(enum.Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"


class PaperOrderStatus(enum.Enum):
    PENDING = "pending"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class PaperTradingSession(Base):
    """Main paper trading session configuration and tracking"""
    __tablename__ = "paper_trading_sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Strategy and user references
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Trading configuration
    symbol = Column(String, nullable=False)  # e.g., "BTC/USD"
    initial_capital = Column(Float, nullable=False, default=10000.0)
    current_capital = Column(Float, nullable=False)
    
    # Risk management
    max_position_size = Column(Float, default=25.0)  # Percentage of capital
    stop_loss_pct = Column(Float)  # Global stop loss percentage
    take_profit_pct = Column(Float)  # Global take profit percentage
    max_open_positions = Column(Integer, default=3)
    
    # Session status and timing
    status = Column(String, default=PaperTradingStatus.ACTIVE.value)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Performance tracking
    total_pnl = Column(Float, default=0.0)
    total_fees = Column(Float, default=0.0)
    total_trades = Column(Integer, default=0)
    winning_trades = Column(Integer, default=0)
    losing_trades = Column(Integer, default=0)
    
    # Real-time data settings
    data_source = Column(String, default="binance")  # Data source for market data
    update_interval = Column(Integer, default=5)  # Seconds between updates
    
    # Strategy parameters override
    strategy_overrides = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    strategy = relationship("Strategy", back_populates="paper_trading_sessions")
    user = relationship("User", back_populates="paper_trading_sessions")
    orders = relationship("PaperOrder", back_populates="session", cascade="all, delete-orphan")
    positions = relationship("PaperPosition", back_populates="session", cascade="all, delete-orphan")
    trades = relationship("PaperTrade", back_populates="session", cascade="all, delete-orphan")
    portfolio_snapshots = relationship("PaperPortfolioSnapshot", back_populates="session", cascade="all, delete-orphan")


class PaperOrder(Base):
    """Individual orders in paper trading"""
    __tablename__ = "paper_orders"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("paper_trading_sessions.id"), nullable=False)
    
    # Order identification
    order_id = Column(String, unique=True, nullable=False)  # UUID
    symbol = Column(String, nullable=False)
    
    # Order details
    side = Column(String, nullable=False)  # "buy" or "sell"
    order_type = Column(String, nullable=False)  # "market", "limit", etc.
    quantity = Column(Float, nullable=False)
    price = Column(Float)  # For limit orders
    stop_price = Column(Float)  # For stop orders
    
    # Order status
    status = Column(String, default=PaperOrderStatus.PENDING.value)
    filled_quantity = Column(Float, default=0.0)
    remaining_quantity = Column(Float)
    avg_fill_price = Column(Float)
    
    # Timing
    created_at = Column(DateTime, default=datetime.utcnow)
    filled_at = Column(DateTime)
    cancelled_at = Column(DateTime)
    
    # Market data at order time
    market_price = Column(Float)  # Market price when order was placed
    bid_price = Column(Float)
    ask_price = Column(Float)
    
    # Fees and costs
    commission = Column(Float, default=0.0)
    slippage = Column(Float, default=0.0)
    
    # Strategy context
    signal_data = Column(JSON)  # Strategy signals that triggered this order
    parent_order_id = Column(String, ForeignKey("paper_orders.order_id"))  # For stop-loss/take-profit orders
    
    # Relationships
    session = relationship("PaperTradingSession", back_populates="orders")
    children = relationship("PaperOrder", remote_side=[parent_order_id])
    fills = relationship("PaperOrderFill", back_populates="order", cascade="all, delete-orphan")


class PaperOrderFill(Base):
    """Order fill records for partial fills"""
    __tablename__ = "paper_order_fills"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("paper_orders.order_id"), nullable=False)
    
    # Fill details
    fill_id = Column(String, unique=True, nullable=False)
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Market context
    market_price = Column(Float)
    volume = Column(Float)
    
    # Costs
    commission = Column(Float, default=0.0)
    
    # Relationships
    order = relationship("PaperOrder", back_populates="fills")


class PaperPosition(Base):
    """Current positions in paper trading"""
    __tablename__ = "paper_positions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("paper_trading_sessions.id"), nullable=False)
    
    # Position identification
    position_id = Column(String, unique=True, nullable=False)
    symbol = Column(String, nullable=False)
    
    # Position details
    side = Column(String, nullable=False)  # "long" or "short"
    quantity = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    
    # P&L tracking
    unrealized_pnl = Column(Float, default=0.0)
    realized_pnl = Column(Float, default=0.0)
    total_fees = Column(Float, default=0.0)
    
    # Risk management
    stop_loss_price = Column(Float)
    take_profit_price = Column(Float)
    
    # Position timing
    opened_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Strategy context
    entry_signal_data = Column(JSON)
    
    # Status
    is_open = Column(Boolean, default=True)
    
    # Relationships
    session = relationship("PaperTradingSession", back_populates="positions")


class PaperTrade(Base):
    """Completed trades in paper trading"""
    __tablename__ = "paper_trades"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("paper_trading_sessions.id"), nullable=False)
    
    # Trade identification
    trade_id = Column(String, unique=True, nullable=False)
    symbol = Column(String, nullable=False)
    
    # Trade details
    side = Column(String, nullable=False)  # "long" or "short"
    quantity = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=False)
    
    # Timing
    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime, nullable=False)
    duration_seconds = Column(Integer)
    
    # P&L
    pnl = Column(Float, nullable=False)
    pnl_pct = Column(Float, nullable=False)
    fees = Column(Float, default=0.0)
    
    # Exit reason
    exit_reason = Column(String)  # "stop_loss", "take_profit", "signal", "manual"
    
    # Strategy context
    entry_signal_data = Column(JSON)
    exit_signal_data = Column(JSON)
    
    # Market conditions
    entry_market_data = Column(JSON)
    exit_market_data = Column(JSON)
    
    # Order references
    entry_order_id = Column(String)
    exit_order_id = Column(String)
    
    # Relationships
    session = relationship("PaperTradingSession", back_populates="trades")


class PaperPortfolioSnapshot(Base):
    """Portfolio value snapshots for performance tracking"""
    __tablename__ = "paper_portfolio_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("paper_trading_sessions.id"), nullable=False)
    
    # Snapshot timing
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Portfolio values
    total_value = Column(Float, nullable=False)
    cash_balance = Column(Float, nullable=False)
    position_value = Column(Float, default=0.0)
    unrealized_pnl = Column(Float, default=0.0)
    realized_pnl = Column(Float, default=0.0)
    
    # Performance metrics
    total_return = Column(Float, default=0.0)  # Since session start
    daily_return = Column(Float, default=0.0)
    
    # Position summary
    open_positions = Column(Integer, default=0)
    long_positions = Column(Integer, default=0)
    short_positions = Column(Integer, default=0)
    
    # Market data
    market_prices = Column(JSON)  # Current prices for all symbols
    
    # Relationships
    session = relationship("PaperTradingSession", back_populates="portfolio_snapshots")


class PaperTradingAlert(Base):
    """Trading alerts and notifications"""
    __tablename__ = "paper_trading_alerts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("paper_trading_sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Alert details
    alert_type = Column(String, nullable=False)  # "trade_opened", "trade_closed", "stop_loss", etc.
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, default="info")  # "info", "warning", "error", "success"
    
    # Context data
    symbol = Column(String)
    trade_id = Column(String)
    order_id = Column(String)
    context_data = Column(JSON)
    
    # Status
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("PaperTradingSession")
    user = relationship("User")


class MarketDataSnapshot(Base):
    """Real-time market data snapshots"""
    __tablename__ = "market_data_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    
    # Market identification
    symbol = Column(String, nullable=False, index=True)
    exchange = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # OHLCV data
    open_price = Column(Float)
    high_price = Column(Float)
    low_price = Column(Float)
    close_price = Column(Float)
    volume = Column(Float)
    
    # Order book data
    bid_price = Column(Float)
    ask_price = Column(Float)
    bid_size = Column(Float)
    ask_size = Column(Float)
    spread = Column(Float)
    
    # Technical indicators (optional)
    indicators = Column(JSON)
    
    # Data quality
    data_source = Column(String)
    latency_ms = Column(Integer)  # Data latency in milliseconds