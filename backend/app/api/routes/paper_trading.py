"""
API routes for paper trading operations
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import asyncio

from backend.app.core.database import get_database as get_db
from backend.app.core.auth import current_active_user
from backend.app.models.user import User
from backend.app.models.strategy import Strategy
from backend.app.models.paper_trading import (
    PaperTradingSession, PaperOrder, PaperPosition, PaperTrade,
    PaperPortfolioSnapshot, PaperTradingAlert, PaperTradingStatus
)
from backend.app.schemas.paper_trading import (
    PaperTradingSessionCreate, PaperTradingSessionUpdate, PaperTradingSessionSchema,
    PaperTradingSessionListResponse, PaperTradingSearchParams, PaperOrderCreate,
    PaperOrderSchema, PaperPositionSchema, PaperTradeSchema, PaperTradingAlertSchema,
    PaperTradingPerformanceSchema, PaperTradingStatsSchema, MarketDataTickSchema,
    OrderBookSchema, WebSocketMessage, PaperTradingCommand
)
from backend.app.paper_trading.engine import paper_trading_manager, PaperTradingEngine
from backend.app.services.market_data import get_market_data_service, get_real_time_price


router = APIRouter()


@router.post("/sessions", response_model=PaperTradingSessionSchema)
async def create_paper_trading_session(
    session_data: PaperTradingSessionCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new paper trading session"""
    
    # Verify strategy exists and user has access
    strategy = db.query(Strategy).filter(
        Strategy.id == session_data.strategy_id,
        (Strategy.created_by == current_user.id) | (Strategy.is_public == True)
    ).first()
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found or access denied")
    
    # Create session record
    session = PaperTradingSession(
        **session_data.model_dump(),
        user_id=current_user.id,
        current_capital=session_data.initial_capital,
        status=PaperTradingStatus.ACTIVE.value
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Start paper trading engine in background
    background_tasks.add_task(start_paper_trading_engine, session.id)
    
    return session


@router.get("/sessions", response_model=PaperTradingSessionListResponse)
async def get_paper_trading_sessions(
    search_params: PaperTradingSearchParams = Depends(),
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's paper trading sessions with filtering and pagination"""
    
    query = db.query(PaperTradingSession).filter(PaperTradingSession.user_id == current_user.id)
    
    # Apply filters
    if search_params.strategy_id:
        query = query.filter(PaperTradingSession.strategy_id == search_params.strategy_id)
    
    if search_params.symbol:
        query = query.filter(PaperTradingSession.symbol.ilike(f"%{search_params.symbol}%"))
    
    if search_params.status:
        query = query.filter(PaperTradingSession.status == search_params.status.value)
    
    if search_params.start_date_from:
        query = query.filter(PaperTradingSession.start_time >= search_params.start_date_from)
    
    if search_params.start_date_to:
        query = query.filter(PaperTradingSession.start_time <= search_params.start_date_to)
    
    # Apply sorting
    sort_column = getattr(PaperTradingSession, search_params.sort_by, PaperTradingSession.created_at)
    if search_params.sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (search_params.page - 1) * search_params.page_size
    sessions = query.offset(offset).limit(search_params.page_size).all()
    
    total_pages = (total + search_params.page_size - 1) // search_params.page_size
    
    return PaperTradingSessionListResponse(
        sessions=sessions,
        total=total,
        page=search_params.page,
        page_size=search_params.page_size,
        total_pages=total_pages
    )


@router.get("/sessions/{session_id}", response_model=PaperTradingSessionSchema)
async def get_paper_trading_session(
    session_id: int,
    include_positions: bool = Query(False),
    include_trades: bool = Query(False),
    include_orders: bool = Query(False),
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific paper trading session with optional detailed data"""
    
    session = db.query(PaperTradingSession).filter(
        PaperTradingSession.id == session_id,
        PaperTradingSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Paper trading session not found")
    
    # Convert to schema
    session_data = PaperTradingSessionSchema.model_validate(session)
    
    # Add optional data
    if include_positions:
        positions = db.query(PaperPosition).filter(
            PaperPosition.session_id == session_id,
            PaperPosition.is_open == True
        ).all()
        session_data.current_positions = [PaperPositionSchema.model_validate(pos) for pos in positions]
    
    if include_trades:
        trades = db.query(PaperTrade).filter(
            PaperTrade.session_id == session_id
        ).order_by(PaperTrade.exit_time.desc()).limit(20).all()
        session_data.recent_trades = [PaperTradeSchema.model_validate(trade) for trade in trades]
    
    if include_orders:
        orders = db.query(PaperOrder).filter(
            PaperOrder.session_id == session_id
        ).order_by(PaperOrder.created_at.desc()).limit(20).all()
        session_data.recent_orders = [PaperOrderSchema.model_validate(order) for order in orders]
    
    return session_data


@router.put("/sessions/{session_id}", response_model=PaperTradingSessionSchema)
async def update_paper_trading_session(
    session_id: int,
    session_update: PaperTradingSessionUpdate,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Update a paper trading session"""
    
    session = db.query(PaperTradingSession).filter(
        PaperTradingSession.id == session_id,
        PaperTradingSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Paper trading session not found")
    
    # Update fields
    update_data = session_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)
    
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    
    # Update engine status if status changed
    if 'status' in update_data:
        engine = await paper_trading_manager.get_session(session_id)
        if engine:
            if update_data['status'] == 'paused':
                await engine.pause()
            elif update_data['status'] == 'active':
                await engine.resume()
            elif update_data['status'] == 'stopped':
                await paper_trading_manager.stop_session(session_id)
    
    return session


@router.delete("/sessions/{session_id}")
async def delete_paper_trading_session(
    session_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a paper trading session"""
    
    session = db.query(PaperTradingSession).filter(
        PaperTradingSession.id == session_id,
        PaperTradingSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Paper trading session not found")
    
    # Stop engine if running
    await paper_trading_manager.stop_session(session_id)
    
    # Delete session (cascade will handle related records)
    db.delete(session)
    db.commit()
    
    return {"message": "Paper trading session deleted successfully"}


@router.post("/sessions/{session_id}/start")
async def start_paper_trading_session(
    session_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Start a paper trading session"""
    
    session = db.query(PaperTradingSession).filter(
        PaperTradingSession.id == session_id,
        PaperTradingSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Paper trading session not found")
    
    if session.status == PaperTradingStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Session is already running")
    
    # Update status
    session.status = PaperTradingStatus.ACTIVE.value
    session.last_activity = datetime.utcnow()
    db.commit()
    
    # Start engine
    await paper_trading_manager.start_session(session_id)
    
    return {"message": "Paper trading session started successfully"}


@router.post("/sessions/{session_id}/stop")
async def stop_paper_trading_session(
    session_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Stop a paper trading session"""
    
    session = db.query(PaperTradingSession).filter(
        PaperTradingSession.id == session_id,
        PaperTradingSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Paper trading session not found")
    
    # Stop engine
    await paper_trading_manager.stop_session(session_id)
    
    # Update status
    session.status = PaperTradingStatus.STOPPED.value
    session.end_time = datetime.utcnow()
    db.commit()
    
    return {"message": "Paper trading session stopped successfully"}


@router.post("/sessions/{session_id}/orders", response_model=PaperOrderSchema)
async def place_paper_order(
    session_id: int,
    order_data: PaperOrderCreate,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Place a manual paper trading order"""
    
    session = db.query(PaperTradingSession).filter(
        PaperTradingSession.id == session_id,
        PaperTradingSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Paper trading session not found")
    
    if session.status != PaperTradingStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Get engine
    engine = await paper_trading_manager.get_session(session_id)
    if not engine:
        raise HTTPException(status_code=400, detail="Trading engine not running")
    
    # Place order through engine
    from backend.app.paper_trading.engine import OrderRequest
    order_request = OrderRequest(
        symbol=order_data.symbol,
        side=order_data.side.value,
        order_type=order_data.order_type.value,
        quantity=order_data.quantity,
        price=order_data.price,
        stop_price=order_data.stop_price,
        signal_data={"manual": True, "user_id": current_user.id}
    )
    
    order_id = await engine.place_order(order_request)
    
    # Return created order
    order = db.query(PaperOrder).filter(PaperOrder.order_id == order_id).first()
    return PaperOrderSchema.model_validate(order)


@router.get("/sessions/{session_id}/positions")
async def get_session_positions(
    session_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Get current positions for a session"""
    
    session = db.query(PaperTradingSession).filter(
        PaperTradingSession.id == session_id,
        PaperTradingSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Paper trading session not found")
    
    positions = db.query(PaperPosition).filter(
        PaperPosition.session_id == session_id,
        PaperPosition.is_open == True
    ).all()
    
    return {"positions": [PaperPositionSchema.model_validate(pos) for pos in positions]}


@router.get("/sessions/{session_id}/trades")
async def get_session_trades(
    session_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Get completed trades for a session"""
    
    session = db.query(PaperTradingSession).filter(
        PaperTradingSession.id == session_id,
        PaperTradingSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Paper trading session not found")
    
    # Get trades with pagination
    offset = (page - 1) * page_size
    trades = db.query(PaperTrade).filter(
        PaperTrade.session_id == session_id
    ).order_by(PaperTrade.exit_time.desc()).offset(offset).limit(page_size).all()
    
    total = db.query(PaperTrade).filter(PaperTrade.session_id == session_id).count()
    
    return {
        "trades": [PaperTradeSchema.model_validate(trade) for trade in trades],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/sessions/{session_id}/performance", response_model=PaperTradingPerformanceSchema)
async def get_session_performance(
    session_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Get performance metrics for a session"""
    
    session = db.query(PaperTradingSession).filter(
        PaperTradingSession.id == session_id,
        PaperTradingSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Paper trading session not found")
    
    # Calculate performance metrics
    trades = db.query(PaperTrade).filter(PaperTrade.session_id == session_id).all()
    
    if not trades:
        # Return default metrics if no trades
        return PaperTradingPerformanceSchema(
            session_id=session_id,
            total_return=0.0,
            total_return_pct=0.0,
            daily_return_avg=0.0,
            volatility=0.0,
            max_drawdown=0.0,
            max_drawdown_pct=0.0,
            total_trades=0,
            winning_trades=0,
            losing_trades=0,
            win_rate=0.0,
            avg_win=0.0,
            avg_loss=0.0,
            largest_win=0.0,
            largest_loss=0.0,
            avg_trade_duration=0.0,
            total_fees=0.0,
            start_date=session.start_time,
            days_active=0
        )
    
    # Calculate metrics
    total_pnl = sum(trade.pnl for trade in trades)
    total_return_pct = (total_pnl / session.initial_capital) * 100
    
    winning_trades = [t for t in trades if t.pnl > 0]
    losing_trades = [t for t in trades if t.pnl <= 0]
    
    win_rate = (len(winning_trades) / len(trades)) * 100 if trades else 0
    avg_win = sum(t.pnl for t in winning_trades) / len(winning_trades) if winning_trades else 0
    avg_loss = sum(t.pnl for t in losing_trades) / len(losing_trades) if losing_trades else 0
    
    largest_win = max((t.pnl for t in trades), default=0)
    largest_loss = min((t.pnl for t in trades), default=0)
    
    avg_duration = sum(t.duration_seconds or 0 for t in trades) / len(trades) if trades else 0
    avg_trade_duration = avg_duration / 3600  # Convert to hours
    
    total_fees = sum(t.fees for t in trades)
    
    days_active = (datetime.utcnow() - session.start_time).days + 1
    daily_return_avg = total_return_pct / days_active if days_active > 0 else 0
    
    # Calculate profit factor
    gross_profit = sum(t.pnl for t in winning_trades)
    gross_loss = abs(sum(t.pnl for t in losing_trades))
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else None
    
    return PaperTradingPerformanceSchema(
        session_id=session_id,
        total_return=total_pnl,
        total_return_pct=total_return_pct,
        daily_return_avg=daily_return_avg,
        volatility=0.0,  # Would need price series to calculate
        max_drawdown=0.0,  # Would need equity curve to calculate
        max_drawdown_pct=0.0,
        total_trades=len(trades),
        winning_trades=len(winning_trades),
        losing_trades=len(losing_trades),
        win_rate=win_rate,
        avg_win=avg_win,
        avg_loss=avg_loss,
        profit_factor=profit_factor,
        largest_win=largest_win,
        largest_loss=largest_loss,
        avg_trade_duration=avg_trade_duration,
        total_fees=total_fees,
        start_date=session.start_time,
        end_date=session.end_time,
        days_active=days_active
    )


@router.get("/sessions/{session_id}/alerts")
async def get_session_alerts(
    session_id: int,
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Get alerts for a session"""
    
    session = db.query(PaperTradingSession).filter(
        PaperTradingSession.id == session_id,
        PaperTradingSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Paper trading session not found")
    
    query = db.query(PaperTradingAlert).filter(PaperTradingAlert.session_id == session_id)
    
    if unread_only:
        query = query.filter(PaperTradingAlert.is_read == False)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    alerts = query.order_by(PaperTradingAlert.created_at.desc()).offset(offset).limit(page_size).all()
    
    return {
        "alerts": [PaperTradingAlertSchema.model_validate(alert) for alert in alerts],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/market-data/{symbol}")
async def get_market_data(symbol: str):
    """Get real-time market data for a symbol"""
    
    try:
        service = await get_market_data_service()
        tick = service.get_current_price(symbol)
        
        if tick:
            return MarketDataTickSchema(
                symbol=tick.symbol,
                timestamp=tick.timestamp,
                price=tick.price,
                bid=tick.bid,
                ask=tick.ask,
                volume=tick.volume,
                high_24h=tick.high_24h,
                low_24h=tick.low_24h,
                change_24h=tick.change_24h,
                change_24h_pct=tick.change_24h_pct
            )
        else:
            raise HTTPException(status_code=404, detail="Market data not available")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching market data: {str(e)}")


@router.websocket("/sessions/{session_id}/live")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time updates"""
    
    await websocket.accept()
    
    try:
        # Verify session access
        session = db.query(PaperTradingSession).filter(
            PaperTradingSession.id == session_id,
            PaperTradingSession.user_id == current_user.id
        ).first()
        
        if not session:
            await websocket.close(code=4004, reason="Session not found")
            return
        
        # Send initial session state
        session_data = PaperTradingSessionSchema.model_validate(session)
        await websocket.send_json({
            "type": "session_state",
            "data": session_data.model_dump(),
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Real-time updates loop
        while True:
            try:
                # Send market data updates
                service = await get_market_data_service()
                tick = service.get_current_price(session.symbol)
                
                if tick:
                    await websocket.send_json({
                        "type": "market_data",
                        "data": {
                            "symbol": tick.symbol,
                            "price": tick.price,
                            "bid": tick.bid,
                            "ask": tick.ask,
                            "timestamp": tick.timestamp.isoformat()
                        },
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                # Send portfolio updates
                engine = await paper_trading_manager.get_session(session_id)
                if engine:
                    portfolio_value = engine.session.current_capital
                    for position in engine.current_positions.values():
                        portfolio_value += position.unrealized_pnl
                    
                    await websocket.send_json({
                        "type": "portfolio_update",
                        "data": {
                            "total_value": portfolio_value,
                            "cash_balance": engine.session.current_capital,
                            "unrealized_pnl": sum(pos.unrealized_pnl for pos in engine.current_positions.values()),
                            "open_positions": len(engine.current_positions),
                            "positions": [
                                {
                                    "symbol": pos.symbol,
                                    "side": pos.side,
                                    "quantity": pos.quantity,
                                    "entry_price": pos.entry_price,
                                    "current_price": pos.current_price,
                                    "unrealized_pnl": pos.unrealized_pnl,
                                    "unrealized_pnl_pct": pos.unrealized_pnl_pct
                                }
                                for pos in engine.current_positions.values()
                            ]
                        },
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                await asyncio.sleep(1)  # Update every second
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "data": {"message": str(e)},
                    "timestamp": datetime.utcnow().isoformat()
                })
                break
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.close(code=4000, reason=str(e))


async def start_paper_trading_engine(session_id: int):
    """Background task to start paper trading engine"""
    try:
        await paper_trading_manager.start_session(session_id)
    except Exception as e:
        logger.error(f"Failed to start paper trading engine for session {session_id}: {e}")


# Import logger
import logging
logger = logging.getLogger(__name__)