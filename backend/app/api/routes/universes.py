from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ...core.auth import CurrentUser, get_current_user
from ...services import universes as universes_service

router = APIRouter()


class UniverseRead(BaseModel):
    name: str
    label: str
    description: str | None = None
    count: int


@router.get("/universes", response_model=List[UniverseRead])
def list_universes(_: CurrentUser = Depends(get_current_user)):
    """List curated ticker universes available for refresh."""
    return [u.to_dict() for u in universes_service.list_universes()]
