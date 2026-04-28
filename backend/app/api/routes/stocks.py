"""Stock screener + detail + bars endpoints."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ...core.auth import CurrentUser, get_current_user
from ...core.database import get_db
from ...models.stock import Stock, StockBar
from ...schemas.stock import StockBarRead, StockDetail, StockListItem, StockSnapshotRead
from ...services import screener

router = APIRouter()


@router.get("/stocks", response_model=List[StockListItem])
def list_stocks(
    sector: Optional[str] = None,
    min_market_cap: Optional[float] = Query(None, ge=0),
    max_market_cap: Optional[float] = Query(None, ge=0),
    min_short_pct: Optional[float] = Query(None, ge=0),
    max_pe: Optional[float] = Query(None, ge=0),
    sort_by: str = "market_cap",
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_current_user),
):
    """Screener — flat rows (stock + latest snapshot fields)."""
    rows = screener.list_stocks(
        db,
        sector=sector,
        min_market_cap=min_market_cap,
        max_market_cap=max_market_cap,
        min_short_pct=min_short_pct,
        max_pe=max_pe,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )
    return [
        StockListItem(
            id=stock.id,
            ticker=stock.ticker,
            name=stock.name,
            sector=stock.sector,
            industry=stock.industry,
            exchange=stock.exchange,
            country=stock.country,
            price=snap.price,
            day_change_pct=snap.day_change_pct,
            market_cap=snap.market_cap,
            volume=snap.volume,
            short_percent_of_float=snap.short_percent_of_float,
            short_ratio=snap.short_ratio,
            pe_ratio=snap.pe_ratio,
            sentiment_score=snap.sentiment_score,
            snapshot_as_of=snap.as_of,
        )
        for stock, snap in rows
    ]


@router.get("/stocks/{ticker}", response_model=StockDetail)
def get_stock(
    ticker: str,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_current_user),
):
    result = screener.get_stock_with_latest(db, ticker)
    if result is None:
        raise HTTPException(status_code=404, detail=f"{ticker} not found")
    stock, snap = result
    return StockDetail(
        id=stock.id,
        ticker=stock.ticker,
        name=stock.name,
        sector=stock.sector,
        industry=stock.industry,
        exchange=stock.exchange,
        country=stock.country,
        latest_snapshot=StockSnapshotRead.model_validate(snap) if snap else None,
    )


@router.get("/stocks/{ticker}/bars", response_model=List[StockBarRead])
def get_stock_bars(
    ticker: str,
    limit: int = Query(252, ge=1, le=2000),  # ~1 trading year by default
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_current_user),
):
    stock = db.query(Stock).filter(Stock.ticker == ticker.upper()).one_or_none()
    if stock is None:
        raise HTTPException(status_code=404, detail=f"{ticker} not found")
    bars = (
        db.query(StockBar)
        .filter(StockBar.stock_id == stock.id)
        .order_by(desc(StockBar.bar_date))
        .limit(limit)
        .all()
    )
    # Return chronologically ascending for chart consumers.
    bars.reverse()
    return bars
