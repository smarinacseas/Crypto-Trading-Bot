"""
Authentication routes that support both FastAPI-Users and Supabase authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from ...core.supabase_auth import (
    get_current_user_from_supabase,
    require_current_user_from_supabase,
    get_current_user_hybrid,
    require_current_user_hybrid
)
from ...core.auth import current_active_user  # Local auth
from ...models.user import User
from ...schemas.user import UserRead
from pydantic import BaseModel

router = APIRouter()

class UserProfile(BaseModel):
    """User profile response model."""
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_superuser: bool
    authentication_method: str  # "local" or "supabase"

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    user: User = Depends(require_current_user_hybrid)
):
    """
    Get current user profile.
    Supports both local FastAPI-Users authentication and Supabase authentication.
    """
    # Determine authentication method based on whether user has a hashed_password
    auth_method = "local" if user.hashed_password else "supabase"
    
    return UserProfile(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_superuser=user.is_superuser,
        authentication_method=auth_method
    )

@router.get("/me/supabase", response_model=UserProfile)
async def get_supabase_user_profile(
    user: User = Depends(require_current_user_from_supabase)
):
    """
    Get current user profile (Supabase authentication only).
    This endpoint specifically requires Supabase JWT authentication.
    """
    return UserProfile(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_superuser=user.is_superuser,
        authentication_method="supabase"
    )

@router.get("/me/optional")
async def get_optional_user_profile(
    user: Optional[User] = Depends(get_current_user_hybrid)
):
    """
    Get current user profile if authenticated, otherwise return null.
    This endpoint demonstrates optional authentication.
    """
    if not user:
        return {"user": None, "authenticated": False}
    
    auth_method = "local" if user.hashed_password else "supabase"
    
    return {
        "user": UserProfile(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_superuser=user.is_superuser,
            authentication_method=auth_method
        ),
        "authenticated": True
    }

@router.post("/sync-user")
async def sync_user_from_supabase(
    user: User = Depends(require_current_user_from_supabase)
):
    """
    Sync user data from Supabase to local database.
    This endpoint can be called after a user signs in with Supabase
    to ensure their local profile is up to date.
    """
    return {
        "message": "User data synchronized successfully",
        "user_id": user.id,
        "email": user.email
    }

class AuthStatus(BaseModel):
    """Authentication status response."""
    authenticated: bool
    user_id: Optional[int] = None
    email: Optional[str] = None
    authentication_method: Optional[str] = None

@router.get("/status", response_model=AuthStatus)
async def get_auth_status(
    user: Optional[User] = Depends(get_current_user_hybrid)
):
    """
    Get authentication status without requiring authentication.
    Useful for frontend to check if user is logged in.
    """
    if not user:
        return AuthStatus(authenticated=False)
    
    auth_method = "local" if user.hashed_password else "supabase"
    
    return AuthStatus(
        authenticated=True,
        user_id=user.id,
        email=user.email,
        authentication_method=auth_method
    )