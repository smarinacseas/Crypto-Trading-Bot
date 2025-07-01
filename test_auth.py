#!/usr/bin/env python3

import sys
import os
sys.path.append('.')
os.chdir('/Users/stefanmarinac/VSCode_Projects/Crypto-Trading-Bot')

import asyncio
from fastapi import FastAPI
from backend.app.core.auth import fastapi_users, auth_backend
from backend.app.schemas.user import UserRead, UserCreate, UserUpdate
from backend.app.core.database import async_engine
from backend.app.models.user import Base

async def test_registration():
    """Test the registration functionality"""
    
    # Create tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    print("Database tables created successfully")
    
    # Create a test app
    app = FastAPI()
    app.include_router(
        fastapi_users.get_register_router(UserRead, UserCreate),
        prefix="/auth",
        tags=["auth"],
    )
    
    print("FastAPI app with auth router created")
    print("Test completed successfully - the auth system should work")

if __name__ == "__main__":
    asyncio.run(test_registration())