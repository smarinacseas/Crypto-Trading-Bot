"""yfinance-backed ingest service.

The screener stores point-in-time snapshots, so this module is *write-only*
from the backend's perspective: routes never call yfinance directly. Instead
they query the DB, and a refresh job (``backend.app.services.refresh``)
calls the helpers below.

Design notes:
- yfinance occasionally rate-limits; ``upsert_universe`` sleeps between
  calls (configurable via ``REFRESH_RATE_LIMIT_SECONDS``).
- Every yfinance field we read can be ``None`` — yfinance returns sparse
  dicts. ``_get`` handles missing keys uniformly.
- We never overwrite a successful ``StockSnapshot`` by date; uniqueness is
  on ``(stock_id, as_of)``. Multiple intra-day refreshes therefore append.
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Iterable, List, Optional, Sequence

import pandas as pd
import yfinance as yf
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models.stock import Stock, StockBar, StockSnapshot

logger = logging.getLogger(__name__)


@dataclass
class RefreshSummary:
    requested: int = 0
    succeeded: int = 0
    failed: int = 0
    failed_tickers: List[str] = None

    def __post_init__(self):
        self.failed_tickers = self.failed_tickers or []


def _get(d: dict, *keys: str) -> Optional[Any]:
    """Return the first non-None value for any of ``keys`` in ``d``."""
    for k in keys:
        v = d.get(k)
        if v is not None and not (isinstance(v, float) and pd.isna(v)):
            return v
    return None


def _to_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    try:
        f = float(v)
        return f if not pd.isna(f) else None
    except (TypeError, ValueError):
        return None


def _ensure_stock(db: Session, ticker: str, info: dict) -> Stock:
    ticker = ticker.upper()
    stock = db.query(Stock).filter(Stock.ticker == ticker).one_or_none()

    name = _get(info, "longName", "shortName")
    sector = _get(info, "sector")
    industry = _get(info, "industry")
    exchange = _get(info, "exchange", "fullExchangeName")
    country = _get(info, "country")

    if stock is None:
        stock = Stock(
            ticker=ticker,
            name=name,
            sector=sector,
            industry=industry,
            exchange=exchange,
            country=country,
        )
        db.add(stock)
        db.flush()
    else:
        # Refresh slow-changing metadata in case it changed (sector reclass etc.).
        stock.name = name or stock.name
        stock.sector = sector or stock.sector
        stock.industry = industry or stock.industry
        stock.exchange = exchange or stock.exchange
        stock.country = country or stock.country
    return stock


def _build_snapshot(stock: Stock, info: dict, as_of: datetime) -> StockSnapshot:
    price = _to_float(_get(info, "regularMarketPrice", "currentPrice"))
    prev_close = _to_float(_get(info, "regularMarketPreviousClose", "previousClose"))
    day_change_pct = None
    if price is not None and prev_close not in (None, 0):
        day_change_pct = (price - prev_close) / prev_close * 100.0

    return StockSnapshot(
        stock_id=stock.id,
        as_of=as_of,
        price=price,
        previous_close=prev_close,
        day_change_pct=day_change_pct,
        volume=_to_float(_get(info, "regularMarketVolume", "volume")),
        avg_volume_10d=_to_float(_get(info, "averageVolume10days", "averageDailyVolume10Day")),
        market_cap=_to_float(_get(info, "marketCap")),
        shares_outstanding=_to_float(_get(info, "sharesOutstanding")),
        float_shares=_to_float(_get(info, "floatShares")),
        shares_short=_to_float(_get(info, "sharesShort")),
        short_ratio=_to_float(_get(info, "shortRatio")),
        short_percent_of_float=_to_float(_get(info, "shortPercentOfFloat")),
        pe_ratio=_to_float(_get(info, "trailingPE")),
        forward_pe=_to_float(_get(info, "forwardPE")),
        peg_ratio=_to_float(_get(info, "pegRatio", "trailingPegRatio")),
        price_to_book=_to_float(_get(info, "priceToBook")),
        profit_margin=_to_float(_get(info, "profitMargins")),
        revenue_growth=_to_float(_get(info, "revenueGrowth")),
        earnings_growth=_to_float(_get(info, "earningsGrowth")),
        beta=_to_float(_get(info, "beta")),
        fifty_two_week_high=_to_float(_get(info, "fiftyTwoWeekHigh")),
        fifty_two_week_low=_to_float(_get(info, "fiftyTwoWeekLow")),
    )


def refresh_ticker(db: Session, ticker: str) -> bool:
    """Pull info + recent bars for one ticker and persist.

    Returns True on success, False on any error (logged).
    """
    try:
        yf_ticker = yf.Ticker(ticker)
        info = yf_ticker.info or {}
        if not info or _get(info, "regularMarketPrice", "currentPrice") is None:
            logger.warning("yfinance returned no usable data for %s", ticker)
            return False

        stock = _ensure_stock(db, ticker, info)
        snap = _build_snapshot(stock, info, datetime.now(timezone.utc))
        db.add(snap)

        _refresh_bars(db, stock, yf_ticker)
        db.commit()
        return True
    except Exception:  # noqa: BLE001 — yfinance throws a zoo of exceptions
        logger.exception("refresh failed for %s", ticker)
        db.rollback()
        return False


def _refresh_bars(db: Session, stock: Stock, yf_ticker: "yf.Ticker", period: str = "2y") -> None:
    """Pull daily bars and upsert by date.

    We re-pull the full 2y window each time. yfinance is fast enough that
    incremental fetching isn't worth the bug surface for personal use.
    """
    df = yf_ticker.history(period=period, interval="1d", auto_adjust=False)
    if df is None or df.empty:
        return

    # Map existing bars by date so we can update vs. insert without N queries.
    existing = {b.bar_date: b for b in db.query(StockBar).filter(StockBar.stock_id == stock.id).all()}

    for ts, row in df.iterrows():
        bar_date = ts.date() if hasattr(ts, "date") else ts
        bar = existing.get(bar_date)
        values = dict(
            open=_to_float(row.get("Open")),
            high=_to_float(row.get("High")),
            low=_to_float(row.get("Low")),
            close=_to_float(row.get("Close")),
            adj_close=_to_float(row.get("Adj Close") if "Adj Close" in row else row.get("Close")),
            volume=_to_float(row.get("Volume")),
        )
        if bar is None:
            db.add(StockBar(stock_id=stock.id, bar_date=bar_date, **values))
        else:
            for k, v in values.items():
                setattr(bar, k, v)


def upsert_universe(db: Session, tickers: Sequence[str]) -> RefreshSummary:
    """Refresh a batch of tickers sequentially (rate-limit-friendly)."""
    summary = RefreshSummary(requested=len(tickers))
    for t in tickers:
        ok = refresh_ticker(db, t)
        if ok:
            summary.succeeded += 1
        else:
            summary.failed += 1
            summary.failed_tickers.append(t)
        if settings.REFRESH_RATE_LIMIT_SECONDS:
            time.sleep(settings.REFRESH_RATE_LIMIT_SECONDS)
    return summary


def load_universe_file(path: str) -> List[str]:
    """Read a newline-delimited ticker list (``#`` comments allowed)."""
    out: List[str] = []
    with open(path, "r") as f:
        for line in f:
            t = line.strip()
            if not t or t.startswith("#"):
                continue
            out.append(t.upper())
    return out
