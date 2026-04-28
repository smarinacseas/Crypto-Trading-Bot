"""Stock universe + snapshot + bar models.

Three tables, deliberately denormalized to keep screener queries fast:

- ``stocks``: one row per ticker, slow-changing metadata (sector, name).
- ``stock_snapshots``: one row per ticker per refresh — price, volume,
  market cap, short interest, fundamental ratios. The screener reads from
  the *latest* snapshot per ticker.
- ``stock_bars``: daily OHLCV history, used for charts + backtests.

A ``Watchlist`` is a named bag of tickers belonging to a user (currently
the local user; trivial to scope to real users when auth is wired).
"""
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.database import Base


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(16), unique=True, nullable=False, index=True)
    name = Column(String(255))
    sector = Column(String(64), index=True)
    industry = Column(String(128), index=True)
    exchange = Column(String(32))
    country = Column(String(64))
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    snapshots = relationship(
        "StockSnapshot",
        back_populates="stock",
        cascade="all, delete-orphan",
        order_by="StockSnapshot.as_of.desc()",
    )
    bars = relationship(
        "StockBar",
        back_populates="stock",
        cascade="all, delete-orphan",
        order_by="StockBar.bar_date",
    )


class StockSnapshot(Base):
    """Point-in-time fundamentals + market metrics for a ticker.

    The screener queries the most recent snapshot per stock. We keep history
    so we can compute trends (e.g. "short interest rising for 3 weeks").
    """
    __tablename__ = "stock_snapshots"
    __table_args__ = (
        UniqueConstraint("stock_id", "as_of", name="uq_snapshot_stock_asof"),
    )

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    as_of = Column(DateTime(timezone=True), nullable=False, index=True)

    # Price & volume
    price = Column(Float)
    previous_close = Column(Float)
    day_change_pct = Column(Float)
    volume = Column(Float)
    avg_volume_10d = Column(Float)

    # Size
    market_cap = Column(Float)
    shares_outstanding = Column(Float)
    float_shares = Column(Float)

    # Short interest
    shares_short = Column(Float)
    short_ratio = Column(Float)            # days to cover
    short_percent_of_float = Column(Float)

    # Valuation
    pe_ratio = Column(Float)
    forward_pe = Column(Float)
    peg_ratio = Column(Float)
    price_to_book = Column(Float)

    # Profitability & growth
    profit_margin = Column(Float)
    revenue_growth = Column(Float)
    earnings_growth = Column(Float)

    # Risk
    beta = Column(Float)
    fifty_two_week_high = Column(Float)
    fifty_two_week_low = Column(Float)

    # Sentiment placeholder (filled by phase 3 sentiment ingest)
    sentiment_score = Column(Float)

    stock = relationship("Stock", back_populates="snapshots")


class StockBar(Base):
    """Daily OHLCV bar for a ticker."""
    __tablename__ = "stock_bars"
    __table_args__ = (
        UniqueConstraint("stock_id", "bar_date", name="uq_bar_stock_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    bar_date = Column(Date, nullable=False, index=True)

    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    adj_close = Column(Float)
    volume = Column(Float)

    stock = relationship("Stock", back_populates="bars")


watchlist_stocks = Table(
    "watchlist_stocks",
    Base.metadata,
    Column("watchlist_id", Integer, ForeignKey("watchlists.id"), primary_key=True),
    Column("stock_id", Integer, ForeignKey("stocks.id"), primary_key=True),
)


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    stocks = relationship("Stock", secondary=watchlist_stocks, lazy="selectin")
