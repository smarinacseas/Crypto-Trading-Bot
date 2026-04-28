"""CRUD for saved screener presets."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...core.auth import CurrentUser, get_current_user
from ...core.database import get_db
from ...models.preferences import ScreenerPreset
from ...schemas.preferences import (
    ScreenerPresetCreate,
    ScreenerPresetRead,
    ScreenerPresetUpdate,
)

router = APIRouter()


@router.get("/screener-presets", response_model=List[ScreenerPresetRead])
def list_presets(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    return (
        db.query(ScreenerPreset)
        .filter(ScreenerPreset.user_id == user.id)
        .order_by(ScreenerPreset.name)
        .all()
    )


@router.post("/screener-presets", response_model=ScreenerPresetRead, status_code=status.HTTP_201_CREATED)
def create_preset(
    body: ScreenerPresetCreate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    existing = (
        db.query(ScreenerPreset)
        .filter(ScreenerPreset.user_id == user.id, ScreenerPreset.name == body.name)
        .one_or_none()
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail=f"Preset '{body.name}' already exists.")
    preset = ScreenerPreset(user_id=user.id, **body.model_dump())
    db.add(preset)
    db.commit()
    db.refresh(preset)
    return preset


@router.put("/screener-presets/{preset_id}", response_model=ScreenerPresetRead)
def update_preset(
    preset_id: int,
    body: ScreenerPresetUpdate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    preset = (
        db.query(ScreenerPreset)
        .filter(ScreenerPreset.id == preset_id, ScreenerPreset.user_id == user.id)
        .one_or_none()
    )
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(preset, k, v)
    db.commit()
    db.refresh(preset)
    return preset


@router.delete("/screener-presets/{preset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_preset(
    preset_id: int,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    preset = (
        db.query(ScreenerPreset)
        .filter(ScreenerPreset.id == preset_id, ScreenerPreset.user_id == user.id)
        .one_or_none()
    )
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")
    db.delete(preset)
    db.commit()
