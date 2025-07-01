#!/usr/bin/env python3

import sys
import os
sys.path.append('.')
os.chdir('/Users/stefanmarinac/VSCode_Projects/Crypto-Trading-Bot')

import asyncio
import traceback
from fastapi import FastAPI
from fastapi.testclient import TestClient
from backend.app.core.auth import fastapi_users, auth_backend
from backend.app.schemas.user import UserRead, UserCreate
from backend.app.core.database import async_engine
from backend.app.models.user import Base
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Debug Auth Test")

# Create tables immediately
async def setup_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(setup_db())

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
    return {"message": "Debug auth test app"}

def test_registration():
    try:
        client = TestClient(app)
        
        # Test root endpoint first
        response = client.get("/")
        print(f"Root endpoint: {response.status_code} - {response.json()}")
        
        # Test registration
        response = client.post(
            "/auth/register",
            json={"email": "test2@example.com", "password": "testpass123"}
        )
        print(f"Registration response: {response.status_code}")
        if response.status_code != 201:
            print(f"Response content: {response.content}")
            print(f"Response text: {response.text}")
        else:
            print(f"Success! User created: {response.json()}")
            
        # Test login
        login_response = client.post(
            "/auth/jwt/login",
            data={"username": "test2@example.com", "password": "testpass123"}
        )
        print(f"Login response: {login_response.status_code}")
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.content}")
        else:
            print(f"Login successful! Token: {login_response.json()}")
            
    except Exception as e:
        print(f"Error during testing: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_registration()