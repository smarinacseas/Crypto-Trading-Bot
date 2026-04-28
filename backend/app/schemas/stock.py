"""Pydantic schemas for stock screener + detail endpoints."""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class StockSnapshotRead(BaseModel):
    as_of: datetime

    price: Optional[float] = None
    previous_close: Optional[float] = None
    day_change_pct: Optional[float] = None
    volume: Optional[float] = None
    avg_volume_10d: Optional[float] = None

    market_cap: Optional[float] = None
    shares_outstanding: Optional[float] = None
    float_shares: Optional[float] = None

    shares_short: Optional[float] = None
    short_ratio: Optional[float] = None
    short_percent_of_float: Optional[float] = None

    pe_ratio: Optional[float] = None
    forward_pe: Optional[float] = None
    peg_ratio: Optional[float] = None
    price_to_book: Optional[float] = None

    profit_margin: Optional[float] = None
    revenue_growth: Optional[float] = None
    earnings_growth: Optional[float] = None

    beta: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None

    sentiment_score: Optional[float] = None

    class Config:
        from_attributes = True


class StockBase(BaseModel):
    id: int
    ticker: str
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    exchange: Optional[str] = None
    country: Optional[str] = None

    class Config:
        from_attributes = True


class StockListItem(StockBase):
    """Flattened row used by the screener table."""
    price: Optional[float] = None
    day_change_pct: Optional[float] = None
    market_cap: Optional[float] = None
    volume: Optional[float] = None
    short_percent_of_float: Optional[float] = None
    short_ratio: Optional[float] = None
    pe_ratio: Optional[float] = None
    sentiment_score: Optional[float] = None
    snapshot_as_of: Optional[datetime] = None


class StockDetail(StockBase):
    latest_snapshot: Optional[StockSnapshotRead] = None


class StockBarRead(BaseModel):
    bar_date: date
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    adj_close: Optional[float] = None
    volume: Optional[float] = None

    class Config:
        from_attributes = True


class SectorAggregate(BaseModel):
    sector: str
    stock_count: int
    avg_day_change_pct: Optional[float] = None
    median_short_percent_of_float: Optional[float] = None
    total_market_cap: Optional[float] = None


class ScreenerQuery(BaseModel):
    """Mirror of the GET /api/screener query string for clarity/typing."""
    sector: Optional[str] = None
    min_market_cap: Optional[float] = None
    max_market_cap: Optional[float] = None
    min_short_pct: Optional[float] = None
    max_pe: Optional[float] = None
    sort_by: str = Field("market_cap", pattern=r"^[a-z_]+$")
    sort_dir: str = Field("desc", pattern=r"^(asc|desc)$")
    limit: int = Field(100, ge=1, le=1000)
    offset: int = Field(0, ge=0)


class RefreshResponse(BaseModel):
    requested: int
    succeeded: int
    failed: int
    failed_tickers: List[str] = []
