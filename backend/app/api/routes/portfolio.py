from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_database
from ...core.auth import current_active_user
from ...models.user import User, Portfolio, Position, ExchangeAccount
from ...schemas.user import PortfolioCreate, PortfolioRead, PositionRead, ExchangeAccountCreate, ExchangeAccountRead
from ...core.security import encrypt_api_key, decrypt_api_key

router = APIRouter()

@router.get("/portfolios", response_model=List[PortfolioRead])
async def get_user_portfolios(
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Get all portfolios for the current user"""
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    return portfolios

@router.post("/portfolios", response_model=PortfolioRead)
async def create_portfolio(
    portfolio_data: PortfolioCreate,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Create a new portfolio"""
    portfolio = Portfolio(
        user_id=current_user.id,
        name=portfolio_data.name,
        description=portfolio_data.description
    )
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio

@router.get("/portfolios/{portfolio_id}", response_model=PortfolioRead)
async def get_portfolio(
    portfolio_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Get a specific portfolio"""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    return portfolio

@router.get("/portfolios/{portfolio_id}/positions", response_model=List[PositionRead])
async def get_portfolio_positions(
    portfolio_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Get all positions for a portfolio"""
    # Verify portfolio ownership
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    positions = db.query(Position).filter(Position.portfolio_id == portfolio_id).all()
    return positions

@router.get("/exchange-accounts", response_model=List[ExchangeAccountRead])
async def get_exchange_accounts(
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Get all exchange accounts for the current user"""
    accounts = db.query(ExchangeAccount).filter(ExchangeAccount.user_id == current_user.id).all()
    
    # Mask API keys in response
    for account in accounts:
        if account.api_key:
            account.api_key = account.api_key[:4] + "..." + account.api_key[-4:] if len(account.api_key) > 8 else "***"
    
    return accounts

@router.post("/exchange-accounts", response_model=ExchangeAccountRead)
async def create_exchange_account(
    account_data: ExchangeAccountCreate,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Create a new exchange account"""
    # Encrypt API credentials
    encrypted_api_key = encrypt_api_key(account_data.api_key)
    encrypted_api_secret = encrypt_api_key(account_data.api_secret)
    encrypted_api_passphrase = encrypt_api_key(account_data.api_passphrase) if account_data.api_passphrase else None
    
    account = ExchangeAccount(
        user_id=current_user.id,
        exchange_name=account_data.exchange_name,
        account_name=account_data.account_name,
        api_key=encrypted_api_key,
        api_secret=encrypted_api_secret,
        api_passphrase=encrypted_api_passphrase,
        is_testnet=account_data.is_testnet
    )
    
    db.add(account)
    db.commit()
    db.refresh(account)
    
    # Mask API key in response
    account.api_key = account_data.api_key[:4] + "..." + account_data.api_key[-4:] if len(account_data.api_key) > 8 else "***"
    
    return account

@router.delete("/exchange-accounts/{account_id}")
async def delete_exchange_account(
    account_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Delete an exchange account"""
    account = db.query(ExchangeAccount).filter(
        ExchangeAccount.id == account_id,
        ExchangeAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Exchange account not found")
    
    db.delete(account)
    db.commit()
    
    return {"message": "Exchange account deleted successfully"}

@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Get aggregated dashboard statistics for the user"""
    # Get all user portfolios
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    
    # Aggregate statistics
    total_portfolios = len(portfolios)
    total_value_usd = sum(float(p.total_value_usd) for p in portfolios)
    total_pnl_usd = sum(float(p.total_pnl_usd) for p in portfolios)
    total_trades = sum(p.total_trades for p in portfolios)
    total_active_positions = sum(p.active_positions for p in portfolios)
    
    # Calculate average success rate
    success_rates = [float(p.success_rate) for p in portfolios if p.success_rate]
    avg_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0
    
    # Get recent positions
    recent_positions = db.query(Position).join(Portfolio).filter(
        Portfolio.user_id == current_user.id
    ).order_by(Position.created_at.desc()).limit(5).all()
    
    return {
        "total_portfolios": total_portfolios,
        "total_value_usd": f"{total_value_usd:.2f}",
        "total_pnl_usd": f"{total_pnl_usd:.2f}",
        "total_trades": total_trades,
        "total_active_positions": total_active_positions,
        "avg_success_rate": f"{avg_success_rate:.1f}",
        "recent_positions": recent_positions
    }