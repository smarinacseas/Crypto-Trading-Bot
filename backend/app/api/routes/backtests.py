"""
API routes for backtesting operations
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from backend.app.core.database import get_database as get_db
from backend.app.core.auth import current_active_user
from backend.app.models.user import User
from backend.app.models.strategy import Strategy
from backend.app.models.backtest import (
    Backtest, BacktestResult, BacktestTrade, 
    BacktestEquityCurve, BacktestStatus
)
from backend.app.schemas.backtest import (
    BacktestCreate, BacktestUpdate, BacktestSchema, BacktestListResponse,
    BacktestSearchParams, BacktestComparisonRequest, BacktestComparisonResponse,
    QuickBacktestRequest, QuickBacktestResponse, BacktestTradeSchema, BacktestEquityCurveSchema
)
from backend.app.backtesting.engine import BacktestEngine


router = APIRouter()


@router.post("/", response_model=BacktestSchema)
async def create_backtest(
    backtest_data: BacktestCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new backtest"""
    
    # Verify strategy exists and user has access
    strategy = db.query(Strategy).filter(
        Strategy.id == backtest_data.strategy_id,
        (Strategy.created_by == current_user.id) | (Strategy.is_public == True)
    ).first()
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found or access denied")
    
    # Create backtest record
    backtest = Backtest(
        **backtest_data.model_dump(),
        user_id=current_user.id,
        status=BacktestStatus.PENDING.value
    )
    
    db.add(backtest)
    db.commit()
    db.refresh(backtest)
    
    # Start backtest in background
    background_tasks.add_task(run_backtest_task, backtest.id, db)
    
    return backtest


@router.get("/", response_model=BacktestListResponse)
async def get_backtests(
    search_params: BacktestSearchParams = Depends(),
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's backtests with filtering and pagination"""
    
    query = db.query(Backtest).filter(Backtest.user_id == current_user.id)
    
    # Apply filters
    if search_params.strategy_id:
        query = query.filter(Backtest.strategy_id == search_params.strategy_id)
    
    if search_params.symbol:
        query = query.filter(Backtest.symbol.ilike(f"%{search_params.symbol}%"))
    
    if search_params.status:
        query = query.filter(Backtest.status == search_params.status.value)
    
    if search_params.start_date_from:
        query = query.filter(Backtest.start_date >= search_params.start_date_from)
    
    if search_params.start_date_to:
        query = query.filter(Backtest.start_date <= search_params.start_date_to)
    
    # Apply sorting
    sort_column = getattr(Backtest, search_params.sort_by, Backtest.created_at)
    if search_params.sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (search_params.page - 1) * search_params.page_size
    backtests = query.offset(offset).limit(search_params.page_size).all()
    
    total_pages = (total + search_params.page_size - 1) // search_params.page_size
    
    return BacktestListResponse(
        backtests=backtests,
        total=total,
        page=search_params.page,
        page_size=search_params.page_size,
        total_pages=total_pages
    )


@router.get("/{backtest_id}", response_model=BacktestSchema)
async def get_backtest(
    backtest_id: int,
    include_trades: bool = Query(False),
    include_equity_curve: bool = Query(False),
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific backtest with optional detailed data"""
    
    backtest = db.query(Backtest).filter(
        Backtest.id == backtest_id,
        Backtest.user_id == current_user.id
    ).first()
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    # Convert to schema
    backtest_data = BacktestSchema.model_validate(backtest)
    
    # Add optional data
    if include_trades and backtest.trades:
        backtest_data.trades = [BacktestTradeSchema.model_validate(trade) for trade in backtest.trades]
    
    if include_equity_curve and backtest.equity_curve:
        backtest_data.equity_curve = [BacktestEquityCurveSchema.model_validate(point) for point in backtest.equity_curve]
    
    return backtest_data


@router.put("/{backtest_id}", response_model=BacktestSchema)
async def update_backtest(
    backtest_id: int,
    backtest_update: BacktestUpdate,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Update a backtest (only certain fields allowed)"""
    
    backtest = db.query(Backtest).filter(
        Backtest.id == backtest_id,
        Backtest.user_id == current_user.id
    ).first()
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    # Only allow updates if backtest is not running
    if backtest.status == BacktestStatus.RUNNING.value:
        raise HTTPException(status_code=400, detail="Cannot update running backtest")
    
    # Update fields
    update_data = backtest_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(backtest, field, value)
    
    db.commit()
    db.refresh(backtest)
    
    return backtest


@router.delete("/{backtest_id}")
async def delete_backtest(
    backtest_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a backtest"""
    
    backtest = db.query(Backtest).filter(
        Backtest.id == backtest_id,
        Backtest.user_id == current_user.id
    ).first()
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    # Cannot delete running backtests
    if backtest.status == BacktestStatus.RUNNING.value:
        raise HTTPException(status_code=400, detail="Cannot delete running backtest")
    
    db.delete(backtest)
    db.commit()
    
    return {"message": "Backtest deleted successfully"}


@router.post("/{backtest_id}/start")
async def start_backtest(
    backtest_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Start or restart a backtest"""
    
    backtest = db.query(Backtest).filter(
        Backtest.id == backtest_id,
        Backtest.user_id == current_user.id
    ).first()
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    if backtest.status == BacktestStatus.RUNNING.value:
        raise HTTPException(status_code=400, detail="Backtest is already running")
    
    # Reset status and start
    backtest.status = BacktestStatus.PENDING.value
    backtest.progress_pct = 0.0
    backtest.error_message = None
    
    db.commit()
    
    # Start backtest in background
    background_tasks.add_task(run_backtest_task, backtest_id, db)
    
    return {"message": "Backtest started successfully"}


@router.post("/{backtest_id}/stop")
async def stop_backtest(
    backtest_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Stop a running backtest"""
    
    backtest = db.query(Backtest).filter(
        Backtest.id == backtest_id,
        Backtest.user_id == current_user.id
    ).first()
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    if backtest.status != BacktestStatus.RUNNING.value:
        raise HTTPException(status_code=400, detail="Backtest is not running")
    
    # Update status to cancelled
    backtest.status = BacktestStatus.CANCELLED.value
    db.commit()
    
    return {"message": "Backtest stopped successfully"}


@router.get("/{backtest_id}/trades")
async def get_backtest_trades(
    backtest_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Get trades from a specific backtest"""
    
    backtest = db.query(Backtest).filter(
        Backtest.id == backtest_id,
        Backtest.user_id == current_user.id
    ).first()
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    # Get trades with pagination
    offset = (page - 1) * page_size
    trades = db.query(BacktestTrade).filter(
        BacktestTrade.backtest_id == backtest_id
    ).order_by(BacktestTrade.entry_time.desc()).offset(offset).limit(page_size).all()
    
    total = db.query(BacktestTrade).filter(BacktestTrade.backtest_id == backtest_id).count()
    
    return {
        "trades": trades,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/{backtest_id}/equity-curve")
async def get_backtest_equity_curve(
    backtest_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Get equity curve data for visualization"""
    
    backtest = db.query(Backtest).filter(
        Backtest.id == backtest_id,
        Backtest.user_id == current_user.id
    ).first()
    
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    equity_curve = db.query(BacktestEquityCurve).filter(
        BacktestEquityCurve.backtest_id == backtest_id
    ).order_by(BacktestEquityCurve.timestamp.asc()).all()
    
    return {"equity_curve": equity_curve}


@router.post("/compare", response_model=BacktestComparisonResponse)
async def compare_backtests(
    comparison_request: BacktestComparisonRequest,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Compare multiple backtests"""
    
    # Get all requested backtests
    backtests = db.query(Backtest).filter(
        Backtest.id.in_(comparison_request.backtest_ids),
        Backtest.user_id == current_user.id
    ).all()
    
    if len(backtests) != len(comparison_request.backtest_ids):
        raise HTTPException(status_code=404, detail="One or more backtests not found")
    
    # Get results for each backtest
    comparison_metrics = {}
    default_metrics = ["total_return", "max_drawdown", "sharpe_ratio", "win_rate", "profit_factor"]
    metrics_to_compare = comparison_request.metrics or default_metrics
    
    for metric in metrics_to_compare:
        comparison_metrics[metric] = {}
        for backtest in backtests:
            if backtest.results:
                value = getattr(backtest.results, metric, None)
                comparison_metrics[metric][backtest.id] = value
    
    # Determine winners for each metric
    winner_analysis = {}
    for metric, values in comparison_metrics.items():
        if values:
            # Higher is better for most metrics except drawdown
            if metric == "max_drawdown":
                winner_id = min(values, key=lambda k: values[k] if values[k] is not None else float('inf'))
            else:
                winner_id = max(values, key=lambda k: values[k] if values[k] is not None else float('-inf'))
            winner_analysis[metric] = winner_id
    
    return BacktestComparisonResponse(
        backtests=backtests,
        comparison_metrics=comparison_metrics,
        winner_analysis=winner_analysis
    )


@router.post("/quick", response_model=QuickBacktestResponse)
async def run_quick_backtest(
    request: QuickBacktestRequest,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_db)
):
    """Run a quick backtest without saving to database"""
    
    # Get strategy
    strategy = db.query(Strategy).filter(
        Strategy.id == request.strategy_id,
        (Strategy.created_by == current_user.id) | (Strategy.is_public == True)
    ).first()
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found or access denied")
    
    # Create temporary backtest config
    end_date = datetime.now()
    start_date = end_date - timedelta(days=request.period_days)
    
    temp_config = Backtest(
        name="Quick Backtest",
        strategy_id=request.strategy_id,
        user_id=current_user.id,
        symbol=request.symbol,
        timeframe=request.timeframe.value,
        start_date=start_date,
        end_date=end_date,
        initial_capital=request.initial_capital,
        commission=request.commission
    )
    
    # Run backtest
    engine = BacktestEngine(strategy, temp_config)
    result = await engine.run_backtest()
    
    # Get recent trades (last 10)
    recent_trades = engine.portfolio.closed_trades[-10:] if engine.portfolio.closed_trades else []
    
    # Get equity curve
    equity_curve = [
        BacktestEquityCurveSchema(
            timestamp=timestamp,
            equity_value=equity,
            daily_return=None,
            cumulative_return=((equity / request.initial_capital) - 1) * 100
        )
        for timestamp, equity in engine.portfolio.equity_history
    ]
    
    return QuickBacktestResponse(
        strategy_name=strategy.name,
        symbol=request.symbol,
        timeframe=request.timeframe.value,
        period_days=request.period_days,
        initial_capital=request.initial_capital,
        final_capital=result.final_capital or request.initial_capital,
        total_return=result.total_return or 0.0,
        max_drawdown=result.max_drawdown or 0.0,
        total_trades=result.total_trades or 0,
        win_rate=result.win_rate or 0.0,
        sharpe_ratio=result.sharpe_ratio or 0.0,
        profit_factor=result.profit_factor or 0.0,
        equity_curve=equity_curve,
        recent_trades=[BacktestTradeSchema(
            trade_id=trade.trade_id,
            symbol=trade.symbol,
            side=trade.side.value,
            entry_price=trade.entry_price,
            exit_price=trade.exit_price,
            quantity=trade.quantity,
            entry_time=trade.entry_time,
            exit_time=trade.exit_time,
            pnl=trade.pnl,
            pnl_pct=trade.pnl_pct,
            fees=trade.fees,
            exit_reason=trade.exit_reason.value if trade.exit_reason else None,
            is_open=False
        ) for trade in recent_trades]
    )


async def run_backtest_task(backtest_id: int, db: Session):
    """Background task to run backtest"""
    
    # Get fresh database session
    from backend.app.core.database import SessionLocal
    db = SessionLocal()
    
    try:
        backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
        if not backtest:
            return
        
        # Update status to running
        backtest.status = BacktestStatus.RUNNING.value
        backtest.started_at = datetime.now()
        db.commit()
        
        # Get strategy
        strategy = db.query(Strategy).filter(Strategy.id == backtest.strategy_id).first()
        if not strategy:
            raise Exception("Strategy not found")
        
        # Progress callback
        async def progress_callback(progress_pct: float):
            backtest.progress_pct = progress_pct
            db.commit()
        
        # Run backtest
        engine = BacktestEngine(strategy, backtest)
        result = await engine.run_backtest(progress_callback)
        
        # Save results to database
        backtest_result = BacktestResult(
            backtest_id=backtest.id,
            **result.__dict__
        )
        db.add(backtest_result)
        
        # Save trades
        for trade in engine.portfolio.closed_trades:
            backtest_trade = BacktestTrade(
                backtest_id=backtest.id,
                trade_id=trade.trade_id,
                symbol=trade.symbol,
                side=trade.side.value,
                entry_price=trade.entry_price,
                exit_price=trade.exit_price,
                quantity=trade.quantity,
                entry_time=trade.entry_time,
                exit_time=trade.exit_time,
                duration_hours=(trade.exit_time - trade.entry_time).total_seconds() / 3600 if trade.exit_time else None,
                pnl=trade.pnl,
                pnl_pct=trade.pnl_pct,
                fees=trade.fees,
                stop_loss_price=trade.stop_loss_price,
                take_profit_price=trade.take_profit_price,
                exit_reason=trade.exit_reason.value if trade.exit_reason else None,
                is_open=False
            )
            db.add(backtest_trade)
        
        # Save equity curve
        for timestamp, equity in engine.portfolio.equity_history:
            equity_point = BacktestEquityCurve(
                backtest_id=backtest.id,
                timestamp=timestamp,
                equity_value=equity
            )
            db.add(equity_point)
        
        # Update backtest status
        backtest.status = BacktestStatus.COMPLETED.value
        backtest.completed_at = datetime.now()
        backtest.progress_pct = 100.0
        
        db.commit()
        
    except Exception as e:
        # Update backtest with error
        backtest.status = BacktestStatus.FAILED.value
        backtest.error_message = str(e)
        db.commit()
        
    finally:
        db.close()