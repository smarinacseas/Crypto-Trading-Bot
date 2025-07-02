from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes import router as api_router
from backend.app.api.routes.websocket import router as websocket_router
from backend.app.api.routes.portfolio import router as portfolio_router
from backend.app.api.routes.strategies import router as strategies_router
from backend.app.api.routes.backtests import router as backtests_router
from backend.app.api.routes.paper_trading import router as paper_trading_router
from backend.app.core.auth import fastapi_users, auth_backend
from backend.app.schemas.user import UserRead, UserCreate
from backend.app.core.config import settings
from backend.app.models.user import Base
from backend.app.models import strategy  # Import to register models
from backend.app.models import backtest  # Import to register models
from backend.app.models import paper_trading  # Import to register models
from backend.app.core.database import engine, async_engine
from dotenv import load_dotenv

# Run the following command to start the API on local host:
# uvicorn backend.app.main:app --reload
# Navigate to http://127.0.0.1:8000/docs to see the API documentation

load_dotenv()  # This will load variables from a .env file into the environment

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Crypto Trading Bot API")

# Create async tables on startup
@app.on_event("startup")
async def create_async_tables():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(websocket_router, prefix="/ws")
app.include_router(portfolio_router, prefix="/api")
app.include_router(strategies_router, prefix="/api", tags=["strategies"])
app.include_router(backtests_router, prefix="/api/backtests", tags=["backtests"])
app.include_router(paper_trading_router, prefix="/api/paper-trading", tags=["paper-trading"])

# Authentication routes
app.include_router(
    fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"]
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserRead),
    prefix="/users",
    tags=["users"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the Solana Trading Bot API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 