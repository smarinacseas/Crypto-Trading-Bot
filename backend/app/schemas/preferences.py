from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class ScreenerPresetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    filters: Dict[str, Any] = Field(default_factory=dict)
    sort: Dict[str, Any] = Field(default_factory=dict)


class ScreenerPresetCreate(ScreenerPresetBase):
    pass


class ScreenerPresetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    filters: Optional[Dict[str, Any]] = None
    sort: Optional[Dict[str, Any]] = None


class ScreenerPresetRead(ScreenerPresetBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BasketItemRead(BaseModel):
    id: int
    ticker: str
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    note: Optional[str] = None
    added_at: Optional[datetime] = None

    # Latest snapshot fields, flattened.
    price: Optional[float] = None
    day_change_pct: Optional[float] = None
    market_cap: Optional[float] = None
    short_percent_of_float: Optional[float] = None

    class Config:
        from_attributes = True


class BasketAddRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=16)
    note: Optional[str] = None


class BasketBulkAddRequest(BaseModel):
    tickers: list[str]
