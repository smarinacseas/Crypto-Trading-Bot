"""Screener query helpers — joins each stock to its latest snapshot."""
from __future__ import annotations

from typing import List, Optional, Tuple

from sqlalchemy import desc, func
from sqlalchemy.orm import Session, aliased

from ..models.stock import Stock, StockSnapshot

# Whitelist of sortable columns. Maps screener field -> (model, attribute).
_SORT_FIELDS = {
    "ticker": (Stock, "ticker"),
    "name": (Stock, "name"),
    "sector": (Stock, "sector"),
    "price": (StockSnapshot, "price"),
    "day_change_pct": (StockSnapshot, "day_change_pct"),
    "market_cap": (StockSnapshot, "market_cap"),
    "volume": (StockSnapshot, "volume"),
    "short_percent_of_float": (StockSnapshot, "short_percent_of_float"),
    "short_ratio": (StockSnapshot, "short_ratio"),
    "pe_ratio": (StockSnapshot, "pe_ratio"),
    "sentiment_score": (StockSnapshot, "sentiment_score"),
}


def _latest_snapshot_subquery(db: Session):
    """Per-stock latest snapshot id, used as a join target."""
    return (
        db.query(
            StockSnapshot.stock_id.label("stock_id"),
            func.max(StockSnapshot.as_of).label("max_as_of"),
        )
        .group_by(StockSnapshot.stock_id)
        .subquery()
    )


def list_stocks(
    db: Session,
    *,
    sector: Optional[str] = None,
    min_market_cap: Optional[float] = None,
    max_market_cap: Optional[float] = None,
    min_short_pct: Optional[float] = None,
    max_pe: Optional[float] = None,
    sort_by: str = "market_cap",
    sort_dir: str = "desc",
    limit: int = 100,
    offset: int = 0,
) -> List[Tuple[Stock, StockSnapshot]]:
    """Return (stock, latest_snapshot) tuples matching filters."""
    latest = _latest_snapshot_subquery(db)
    snap_alias = aliased(StockSnapshot)

    q = (
        db.query(Stock, snap_alias)
        .join(latest, latest.c.stock_id == Stock.id)
        .join(
            snap_alias,
            (snap_alias.stock_id == latest.c.stock_id)
            & (snap_alias.as_of == latest.c.max_as_of),
        )
        .filter(Stock.is_active.is_(True))
    )

    if sector:
        q = q.filter(Stock.sector == sector)
    if min_market_cap is not None:
        q = q.filter(snap_alias.market_cap >= min_market_cap)
    if max_market_cap is not None:
        q = q.filter(snap_alias.market_cap <= max_market_cap)
    if min_short_pct is not None:
        q = q.filter(snap_alias.short_percent_of_float >= min_short_pct)
    if max_pe is not None:
        q = q.filter(snap_alias.pe_ratio <= max_pe)

    model, attr = _SORT_FIELDS.get(sort_by, _SORT_FIELDS["market_cap"])
    # When sorting by a snapshot field, we need the alias, not the raw model.
    if model is StockSnapshot:
        col = getattr(snap_alias, attr)
    else:
        col = getattr(model, attr)
    q = q.order_by(desc(col) if sort_dir == "desc" else col)

    return q.offset(offset).limit(limit).all()


def sector_aggregates(db: Session) -> List[dict]:
    """Sector-level rollup for the dashboard sidebar."""
    latest = _latest_snapshot_subquery(db)
    snap_alias = aliased(StockSnapshot)

    rows = (
        db.query(
            Stock.sector.label("sector"),
            func.count(Stock.id).label("stock_count"),
            func.avg(snap_alias.day_change_pct).label("avg_day_change_pct"),
            func.sum(snap_alias.market_cap).label("total_market_cap"),
        )
        .join(latest, latest.c.stock_id == Stock.id)
        .join(
            snap_alias,
            (snap_alias.stock_id == latest.c.stock_id)
            & (snap_alias.as_of == latest.c.max_as_of),
        )
        .filter(Stock.is_active.is_(True), Stock.sector.isnot(None))
        .group_by(Stock.sector)
        .order_by(desc("total_market_cap"))
        .all()
    )

    return [
        {
            "sector": r.sector,
            "stock_count": r.stock_count,
            "avg_day_change_pct": float(r.avg_day_change_pct) if r.avg_day_change_pct is not None else None,
            "total_market_cap": float(r.total_market_cap) if r.total_market_cap is not None else None,
            "median_short_percent_of_float": None,  # SQLite has no median; compute client-side if needed.
        }
        for r in rows
    ]


def get_stock_with_latest(db: Session, ticker: str) -> Optional[Tuple[Stock, Optional[StockSnapshot]]]:
    stock = db.query(Stock).filter(Stock.ticker == ticker.upper()).one_or_none()
    if stock is None:
        return None
    snap = (
        db.query(StockSnapshot)
        .filter(StockSnapshot.stock_id == stock.id)
        .order_by(desc(StockSnapshot.as_of))
        .first()
    )
    return stock, snap
