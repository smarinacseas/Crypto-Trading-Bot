from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from fastapi_users.db import SQLAlchemyBaseUserTable
from ..core.database import Base

class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    first_name = Column(String(100))
    last_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    exchange_accounts = relationship("ExchangeAccount", back_populates="user")
    portfolios = relationship("Portfolio", back_populates="user")

class ExchangeAccount(Base):
    __tablename__ = "exchange_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exchange_name = Column(String(50), nullable=False)  # 'binance', 'mexc', 'hyperliquid'
    account_name = Column(String(100), nullable=False)  # User-defined name
    api_key = Column(Text, nullable=False)  # Encrypted
    api_secret = Column(Text, nullable=False)  # Encrypted
    api_passphrase = Column(Text)  # For exchanges that require it
    is_active = Column(Boolean, default=True)
    is_testnet = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="exchange_accounts")

class Portfolio(Base):
    __tablename__ = "portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    total_value_usd = Column(String(50), default="0.00")
    total_pnl_usd = Column(String(50), default="0.00")
    total_trades = Column(Integer, default=0)
    success_rate = Column(String(10), default="0.00")
    active_positions = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="portfolios")
    positions = relationship("Position", back_populates="portfolio")

class Position(Base):
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    symbol = Column(String(20), nullable=False)
    side = Column(String(10), nullable=False)  # 'LONG', 'SHORT'
    size = Column(String(50), nullable=False)
    entry_price = Column(String(50), nullable=False)
    current_price = Column(String(50))
    pnl_usd = Column(String(50), default="0.00")
    pnl_percent = Column(String(10), default="0.00")
    status = Column(String(20), default="OPEN")  # 'OPEN', 'CLOSED'
    exchange_account_id = Column(Integer, ForeignKey("exchange_accounts.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="positions")