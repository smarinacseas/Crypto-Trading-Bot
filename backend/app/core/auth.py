"""Auth stub.

Auth is intentionally disabled for personal/local use. ``get_current_user``
is the single dependency every protected route should depend on. To enable
real auth later:

1. Set ``AUTH_ENABLED=true`` in .env and provide ``SECRET_KEY``.
2. Replace the body of ``get_current_user`` with real JWT verification
   (e.g. via fastapi-users, Supabase, Clerk, or your own).
3. Wire a login/register router into ``main.py``.

The rest of the app already calls ``Depends(get_current_user)``, so adding
auth doesn't require touching route signatures.
"""
from dataclasses import dataclass

from fastapi import HTTPException, status

from .config import settings


@dataclass
class CurrentUser:
    """Minimal user object passed to routes."""
    id: int
    email: str
    is_active: bool = True


# Single fixed user for personal-use mode. When AUTH_ENABLED flips on, this
# becomes a real authenticated user looked up from the DB.
_LOCAL_USER = CurrentUser(id=1, email="local@localhost", is_active=True)


async def get_current_user() -> CurrentUser:
    if not settings.AUTH_ENABLED:
        return _LOCAL_USER

    # Auth is enabled but no implementation has been wired yet.
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="AUTH_ENABLED=true but no auth backend is configured. "
               "See backend/app/core/auth.py.",
    )
