"""Manual refresh endpoint — kicks off a background ingest job.

For personal use this is the easiest control: hit ``POST /api/refresh`` with
a list of tickers (or none, to use the default universe file). For periodic
refresh use the CLI: ``python -m backend.app.scripts.refresh_universe``.
"""
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ...core.auth import CurrentUser, get_current_user
from ...core.config import settings
from ...core.database import SessionLocal, get_db
from ...schemas.stock import RefreshResponse
from ...services import stock_data

router = APIRouter()


class RefreshRequest(BaseModel):
    tickers: Optional[List[str]] = None  # None => load from DEFAULT_UNIVERSE_FILE


def _resolve_tickers(req: RefreshRequest) -> List[str]:
    if req.tickers:
        return [t.upper() for t in req.tickers]
    try:
        return stock_data.load_universe_file(settings.DEFAULT_UNIVERSE_FILE)
    except FileNotFoundError:
        return []


def _refresh_in_background(tickers: List[str]) -> None:
    """Run the refresh on a fresh DB session (background task is post-response)."""
    db: Session = SessionLocal()
    try:
        stock_data.upsert_universe(db, tickers)
    finally:
        db.close()


@router.post("/refresh", response_model=RefreshResponse)
def refresh(
    req: RefreshRequest,
    background_tasks: BackgroundTasks,
    _: CurrentUser = Depends(get_current_user),
):
    """Queue a refresh in the background. Returns immediately.

    The response numbers reflect *queued* counts; check logs (or the screener)
    to confirm completion.
    """
    tickers = _resolve_tickers(req)
    background_tasks.add_task(_refresh_in_background, tickers)
    return RefreshResponse(
        requested=len(tickers),
        succeeded=0,
        failed=0,
        failed_tickers=[],
    )


@router.post("/refresh/sync", response_model=RefreshResponse)
def refresh_sync(
    req: RefreshRequest,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_current_user),
):
    """Synchronous refresh — blocks until done. Use for small ticker lists only."""
    tickers = _resolve_tickers(req)
    summary = stock_data.upsert_universe(db, tickers)
    return RefreshResponse(
        requested=summary.requested,
        succeeded=summary.succeeded,
        failed=summary.failed,
        failed_tickers=summary.failed_tickers,
    )
