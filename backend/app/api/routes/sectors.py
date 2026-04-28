from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.auth import CurrentUser, get_current_user
from ...core.database import get_db
from ...schemas.stock import SectorAggregate
from ...services import screener

router = APIRouter()


@router.get("/sectors", response_model=List[SectorAggregate])
def list_sectors(
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_current_user),
):
    return screener.sector_aggregates(db)
