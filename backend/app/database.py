import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# This is a stub for the database connection.
# Update DATABASE_URL with your actual database URL. The default uses SQLite with aiosqlite for asynchronous access.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

# Create an asynchronous SQLAlchemy engine.
engine = create_async_engine(
    DATABASE_URL, 
    echo=True,
    future=True
)

# Create a configured sessionmaker for AsyncSession
SessionLocal = sessionmaker(
    bind=engine, 
    class_=AsyncSession,
    expire_on_commit=False
)

# Async generator dependency to get a database session
async def get_db():
    async with SessionLocal() as db:
        try:
            yield db
        finally:
            await db.close() 