"""Backtest basket: a working set of tickers the user is curating.

Single basket per user; flatten into per-row response with the latest
snapshot so the basket page can render without N+1 queries.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ...core.auth import CurrentUser, get_current_user
from ...core.database import get_db
from ...models.preferences import BasketItem
from ...models.stock import Stock, StockSnapshot
from ...schemas.preferences import BasketAddRequest, BasketBulkAddRequest, BasketItemRead

router = APIRouter()


def _to_read(item: BasketItem, snap: StockSnapshot | None) -> BasketItemRead:
    return BasketItemRead(
        id=item.id,
        ticker=item.stock.ticker,
        name=item.stock.name,
        sector=item.stock.sector,
        industry=item.stock.industry,
        note=item.note,
        added_at=item.added_at,
        price=snap.price if snap else None,
        day_change_pct=snap.day_change_pct if snap else None,
        market_cap=snap.market_cap if snap else None,
        short_percent_of_float=snap.short_percent_of_float if snap else None,
    )


def _latest_snapshot(db: Session, stock_id: int) -> StockSnapshot | None:
    return (
        db.query(StockSnapshot)
        .filter(StockSnapshot.stock_id == stock_id)
        .order_by(desc(StockSnapshot.as_of))
        .first()
    )


@router.get("/basket", response_model=List[BasketItemRead])
def list_basket(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    items = (
        db.query(BasketItem)
        .filter(BasketItem.user_id == user.id)
        .order_by(desc(BasketItem.added_at))
        .all()
    )
    return [_to_read(it, _latest_snapshot(db, it.stock_id)) for it in items]


@router.post("/basket", response_model=BasketItemRead, status_code=status.HTTP_201_CREATED)
def add_to_basket(
    body: BasketAddRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    stock = db.query(Stock).filter(Stock.ticker == body.ticker.upper()).one_or_none()
    if stock is None:
        raise HTTPException(status_code=404, detail=f"{body.ticker} not in screener — refresh it first.")
    existing = (
        db.query(BasketItem)
        .filter(BasketItem.user_id == user.id, BasketItem.stock_id == stock.id)
        .one_or_none()
    )
    if existing is not None:
        # Idempotent: update the note if provided.
        if body.note is not None:
            existing.note = body.note
            db.commit()
            db.refresh(existing)
        return _to_read(existing, _latest_snapshot(db, stock.id))

    item = BasketItem(user_id=user.id, stock_id=stock.id, note=body.note)
    db.add(item)
    db.commit()
    db.refresh(item)
    return _to_read(item, _latest_snapshot(db, stock.id))


@router.post("/basket/bulk", response_model=List[BasketItemRead])
def bulk_add_to_basket(
    body: BasketBulkAddRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    added: List[BasketItem] = []
    for raw in body.tickers:
        ticker = raw.upper().strip()
        if not ticker:
            continue
        stock = db.query(Stock).filter(Stock.ticker == ticker).one_or_none()
        if stock is None:
            continue
        existing = (
            db.query(BasketItem)
            .filter(BasketItem.user_id == user.id, BasketItem.stock_id == stock.id)
            .one_or_none()
        )
        if existing is None:
            item = BasketItem(user_id=user.id, stock_id=stock.id)
            db.add(item)
            added.append(item)
    db.commit()
    # Return the full basket so the client can replace state in one shot.
    items = (
        db.query(BasketItem)
        .filter(BasketItem.user_id == user.id)
        .order_by(desc(BasketItem.added_at))
        .all()
    )
    return [_to_read(it, _latest_snapshot(db, it.stock_id)) for it in items]


@router.delete("/basket/{ticker}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_basket(
    ticker: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    stock = db.query(Stock).filter(Stock.ticker == ticker.upper()).one_or_none()
    if stock is None:
        return
    db.query(BasketItem).filter(
        BasketItem.user_id == user.id, BasketItem.stock_id == stock.id
    ).delete()
    db.commit()


@router.delete("/basket", status_code=status.HTTP_204_NO_CONTENT)
def clear_basket(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    db.query(BasketItem).filter(BasketItem.user_id == user.id).delete()
    db.commit()
