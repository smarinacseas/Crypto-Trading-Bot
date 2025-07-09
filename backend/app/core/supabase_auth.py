"""
Supabase authentication integration for FastAPI.
This module provides middleware and dependencies for validating Supabase JWT tokens.
"""
import jwt
import httpx
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from .config import settings
from .database import get_async_session
from .supabase_client import get_supabase
from ..models.user import User
from ..schemas.user import UserCreate
import sqlalchemy as sa

# JWT Bearer token extractor
security = HTTPBearer(auto_error=False)

class SupabaseAuth:
    """Supabase authentication handler."""
    
    def __init__(self):
        self.supabase = get_supabase()
        self._jwks_cache: Optional[Dict[str, Any]] = None
    
    async def get_jwks(self) -> Dict[str, Any]:
        """Get JSON Web Key Set from Supabase."""
        if self._jwks_cache is None:
            jwks_url = f"{settings.SUPABASE_URL}/auth/v1/jwks"
            async with httpx.AsyncClient() as client:
                response = await client.get(jwks_url)
                response.raise_for_status()
                self._jwks_cache = response.json()
        return self._jwks_cache
    
    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Supabase JWT token and return payload."""
        try:
            # Get the JWT header to find the key ID
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            
            if not kid:
                return None
            
            # Get JWKS and find the matching key
            jwks = await self.get_jwks()
            public_key = None
            
            for key in jwks.get("keys", []):
                if key.get("kid") == kid:
                    # Convert JWK to PEM format for verification
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                    break
            
            if not public_key:
                return None
            
            # Verify and decode the token
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience="authenticated",
                issuer=f"{settings.SUPABASE_URL}/auth/v1"
            )
            
            return payload
            
        except jwt.InvalidTokenError:
            return None
        except Exception as e:
            print(f"Token verification error: {e}")
            return None

supabase_auth = SupabaseAuth()

async def get_current_user_from_supabase(
    session: AsyncSession = Depends(get_async_session),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    Get current user from Supabase JWT token.
    Returns None if no valid token is provided (allows for optional authentication).
    """
    if not credentials:
        return None
    
    # Verify the Supabase token
    payload = await supabase_auth.verify_token(credentials.credentials)
    if not payload:
        return None
    
    # Extract user information from token
    user_id = payload.get("sub")
    email = payload.get("email")
    user_metadata = payload.get("user_metadata", {})
    
    if not user_id or not email:
        return None
    
    # Check if user exists in local database
    stmt = sa.select(User).where(User.email == email)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        # Create user in local database if they don't exist
        user = await create_user_from_supabase(session, payload)
    else:
        # Update user information if needed
        user = await update_user_from_supabase(session, user, payload)
    
    return user

async def require_current_user_from_supabase(
    user: Optional[User] = Depends(get_current_user_from_supabase)
) -> User:
    """
    Require a valid Supabase user (raises HTTPException if not authenticated).
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def create_user_from_supabase(
    session: AsyncSession, 
    payload: Dict[str, Any]
) -> User:
    """Create a new user in the local database from Supabase auth data."""
    user_metadata = payload.get("user_metadata", {})
    app_metadata = payload.get("app_metadata", {})
    
    # Extract user information
    email = payload.get("email")
    first_name = user_metadata.get("first_name", "")
    last_name = user_metadata.get("last_name", "")
    
    # If no first/last name in user_metadata, try full_name
    if not first_name and not last_name:
        full_name = user_metadata.get("full_name", "")
        if full_name:
            name_parts = full_name.split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    # Create user record
    user_data = {
        "email": email,
        "hashed_password": "",  # Not used for OAuth users
        "is_active": True,
        "is_verified": payload.get("email_confirmed_at") is not None,
        "is_superuser": False,
        "first_name": first_name,
        "last_name": last_name,
    }
    
    user = User(**user_data)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return user

async def update_user_from_supabase(
    session: AsyncSession,
    user: User,
    payload: Dict[str, Any]
) -> User:
    """Update existing user with latest Supabase auth data."""
    user_metadata = payload.get("user_metadata", {})
    
    # Update verification status
    user.is_verified = payload.get("email_confirmed_at") is not None
    
    # Update name if provided and different
    first_name = user_metadata.get("first_name", "")
    last_name = user_metadata.get("last_name", "")
    
    if not first_name and not last_name:
        full_name = user_metadata.get("full_name", "")
        if full_name:
            name_parts = full_name.split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    if first_name and first_name != user.first_name:
        user.first_name = first_name
    if last_name and last_name != user.last_name:
        user.last_name = last_name
    
    await session.commit()
    await session.refresh(user)
    
    return user

# Hybrid authentication that supports both local JWT and Supabase JWT
async def get_current_user_hybrid(
    session: AsyncSession = Depends(get_async_session),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    Get current user supporting both local FastAPI-Users JWT and Supabase JWT.
    Returns None if no valid token is provided.
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    
    # First, try Supabase authentication
    supabase_user = await get_current_user_from_supabase(session, credentials)
    if supabase_user:
        return supabase_user
    
    # Fallback to local JWT authentication
    # Note: This would require importing the local auth system
    # For now, we'll just return None if Supabase auth fails
    return None

async def require_current_user_hybrid(
    user: Optional[User] = Depends(get_current_user_hybrid)
) -> User:
    """
    Require a valid user from either authentication system.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user