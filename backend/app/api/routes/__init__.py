from fastapi import APIRouter

from .stocks import router as stocks_router
from .sectors import router as sectors_router
from .refresh import router as refresh_router

router = APIRouter()
router.include_router(stocks_router, tags=["stocks"])
router.include_router(sectors_router, tags=["sectors"])
router.include_router(refresh_router, tags=["refresh"])
