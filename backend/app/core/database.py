"""SQLAlchemy engine + session factories.

Supports SQLite (default) and Postgres without code changes — set
DATABASE_URL accordingly. For SQLite we add the standard
``check_same_thread=False`` pragma; everything else is parameterized.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings


def _to_async_url(url: str) -> str:
    """Translate a sync SQLAlchemy URL to its async-driver equivalent."""
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


_sync_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    _sync_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, **_sync_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async_engine = create_async_engine(_to_async_url(settings.DATABASE_URL))
async_session_maker = async_sessionmaker(async_engine, expire_on_commit=False)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncSession:
    async with async_session_maker() as session:
        yield session
