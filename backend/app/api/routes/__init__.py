from fastapi import APIRouter

from .basket import router as basket_router
from .presets import router as presets_router
from .refresh import router as refresh_router
from .sectors import router as sectors_router
from .stocks import router as stocks_router

router = APIRouter()
router.include_router(stocks_router, tags=["stocks"])
router.include_router(sectors_router, tags=["sectors"])
router.include_router(refresh_router, tags=["refresh"])
router.include_router(presets_router, tags=["presets"])
router.include_router(basket_router, tags=["basket"])
