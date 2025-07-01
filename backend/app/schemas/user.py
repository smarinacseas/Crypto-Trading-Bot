from pydantic import BaseModel, EmailStr
from fastapi_users.schemas import CreateUpdateDictModel
from typing import Optional
from datetime import datetime

class UserRead(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserCreate(CreateUpdateDictModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserUpdate(CreateUpdateDictModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class ExchangeAccountCreate(BaseModel):
    exchange_name: str
    account_name: str
    api_key: str
    api_secret: str
    api_passphrase: Optional[str] = None
    is_testnet: bool = False

class ExchangeAccountRead(BaseModel):
    id: int
    exchange_name: str
    account_name: str
    api_key: str  # Will be masked in response
    is_active: bool
    is_testnet: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PortfolioCreate(BaseModel):
    name: str
    description: Optional[str] = None

class PortfolioRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    total_value_usd: str
    total_pnl_usd: str
    total_trades: int
    success_rate: str
    active_positions: int
    created_at: datetime

    class Config:
        from_attributes = True

class PositionRead(BaseModel):
    id: int
    symbol: str
    side: str
    size: str
    entry_price: str
    current_price: Optional[str] = None
    pnl_usd: str
    pnl_percent: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True