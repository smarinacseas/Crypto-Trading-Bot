"""Manual refresh endpoint — kicks off a background ingest job.

Accepts either ticker lists, named universes (curated files in
``backend/app/data``), or both. They're combined + deduped before ingest.

For periodic refresh use the CLI:
    python -m backend.app.scripts.refresh_universe
"""
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ...core.auth import CurrentUser, get_current_user
from ...core.config import settings
from ...core.database import SessionLocal, get_db
from ...schemas.stock import RefreshResponse
from ...services import stock_data, universes as universes_service

router = APIRouter()


class RefreshRequest(BaseModel):
    tickers: Optional[List[str]] = None
    universes: Optional[List[str]] = None  # universe names (e.g. ["popular", "high_short"])


def _resolve(req: RefreshRequest) -> List[str]:
    # Explicit args win — only fall back to default universe if both are empty.
    if not req.tickers and not req.universes:
        try:
            from pathlib import Path
            default_name = Path(settings.DEFAULT_UNIVERSE_FILE).stem
            return universes_service.load_universe(default_name)
        except FileNotFoundError:
            return []
    return universes_service.resolve_tickers(req.universes, req.tickers)


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
    tickers = _resolve(req)
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
    tickers = _resolve(req)
    summary = stock_data.upsert_universe(db, tickers)
    return RefreshResponse(
        requested=summary.requested,
        succeeded=summary.succeeded,
        failed=summary.failed,
        failed_tickers=summary.failed_tickers,
    )
