#!/usr/bin/env python3

import sys
import os
sys.path.append('.')
os.chdir('/Users/stefanmarinac/VSCode_Projects/Crypto-Trading-Bot')

from fastapi import FastAPI
from backend.app.core.auth import fastapi_users, auth_backend
from backend.app.schemas.user import UserRead, UserCreate
from backend.app.core.database import async_engine
from backend.app.models.user import Base
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Minimal Auth Test")

# Create tables on startup
@app.on_event("startup")
async def create_tables():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Authentication routes
app.include_router(
    fastapi_users.get_auth_router(auth_backend), 
    prefix="/auth/jwt", 
    tags=["auth"]
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)

@app.get("/")
def read_root():
    return {"message": "Minimal auth test app"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8003)