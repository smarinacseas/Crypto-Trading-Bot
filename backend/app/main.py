"""FastAPI app entrypoint.

Run from the repo root:
    uvicorn backend.app.main:app --reload
Docs at http://127.0.0.1:8000/docs

Tables are created on startup via ``Base.metadata.create_all`` — this is fine
for SQLite. When migrating to Postgres, swap to alembic-managed migrations
(``alembic -c backend/alembic.ini upgrade head``) and remove the create_all
call below.
"""
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import router as api_router
from backend.app.core.config import settings
from backend.app.core.database import Base, engine

# Import models so their tables register with Base.metadata before create_all.
from backend.app.models import preferences  # noqa: F401
from backend.app.models import stock  # noqa: F401
from backend.app.models import user  # noqa: F401

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Stock Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
def read_root():
    return {"name": "Stock Dashboard API", "auth_enabled": settings.AUTH_ENABLED}
