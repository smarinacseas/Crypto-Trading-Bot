# Routes package initialization 
from fastapi import APIRouter
from .portfolio import router as portfolio_router

# Create main router
router = APIRouter()

# Include all route modules
router.include_router(portfolio_router, tags=["portfolio"]) 