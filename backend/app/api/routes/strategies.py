from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_, desc, asc, func

from backend.app.core.database import get_database
from backend.app.models.user import User
from backend.app.models.strategy import (
    Strategy, StrategyPerformance, UserStrategy, StrategyRating,
    StrategyType, RiskLevel, StrategyStatus
)
from backend.app.schemas.strategy import (
    StrategyCreate, StrategyUpdate, StrategyRead, StrategyListRead,
    StrategyPerformanceCreate, StrategyPerformanceRead,
    UserStrategyCreate, UserStrategyUpdate, UserStrategyRead,
    StrategyRatingCreate, StrategyRatingRead,
    StrategySearchParams, StrategyMarketplaceResponse,
    StrategyStatsResponse
)
from backend.app.core.auth import current_active_user

router = APIRouter()


# Strategy CRUD Operations
@router.post("/strategies", response_model=StrategyRead, status_code=status.HTTP_201_CREATED)
async def create_strategy(
    strategy_data: StrategyCreate,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Create a new trading strategy"""
    strategy = Strategy(
        **strategy_data.dict(),
        created_by=current_user.id
    )
    
    db.add(strategy)
    db.commit()
    db.refresh(strategy)
    
    return strategy


@router.get("/strategies", response_model=List[StrategyListRead])
async def get_user_strategies(
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database),
    status_filter: Optional[StrategyStatus] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get user's own strategies"""
    query = db.query(Strategy).filter(Strategy.created_by == current_user.id)
    
    if status_filter:
        query = query.filter(Strategy.status == status_filter)
    
    strategies = query.order_by(desc(Strategy.updated_at)).offset(offset).limit(limit).all()
    
    # Add computed fields
    strategy_list = []
    for strategy in strategies:
        # Get latest performance
        latest_perf = db.query(StrategyPerformance).filter(
            StrategyPerformance.strategy_id == strategy.id
        ).order_by(desc(StrategyPerformance.updated_at)).first()
        
        # Get rating stats
        rating_stats = db.query(
            func.avg(StrategyRating.rating).label('avg_rating'),
            func.count(StrategyRating.id).label('total_ratings')
        ).filter(StrategyRating.strategy_id == strategy.id).first()
        
        # Get subscriber count
        subscriber_count = db.query(UserStrategy).filter(
            UserStrategy.strategy_id == strategy.id
        ).count()
        
        strategy_dict = {
            **strategy.__dict__,
            'avg_rating': float(rating_stats.avg_rating) if rating_stats.avg_rating else None,
            'total_ratings': rating_stats.total_ratings or 0,
            'subscriber_count': subscriber_count,
            'latest_return': latest_perf.total_return if latest_perf else None,
            'latest_sharpe': latest_perf.sharpe_ratio if latest_perf else None,
            'latest_win_rate': latest_perf.win_rate if latest_perf else None
        }
        
        strategy_list.append(StrategyListRead(**strategy_dict))
    
    return strategy_list


@router.get("/strategies/{strategy_id}", response_model=StrategyRead)
async def get_strategy(
    strategy_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Get strategy details"""
    strategy = db.query(Strategy).options(
        selectinload(Strategy.performance_records)
    ).filter(
        and_(
            Strategy.id == strategy_id,
            or_(
                Strategy.created_by == current_user.id,
                Strategy.is_public == True
            )
        )
    ).first()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found or access denied"
        )
    
    # Add computed fields
    rating_stats = db.query(
        func.avg(StrategyRating.rating).label('avg_rating'),
        func.count(StrategyRating.id).label('total_ratings')
    ).filter(StrategyRating.strategy_id == strategy.id).first()
    
    subscriber_count = db.query(UserStrategy).filter(
        UserStrategy.strategy_id == strategy.id
    ).count()
    
    strategy_dict = strategy.__dict__.copy()
    strategy_dict.update({
        'avg_rating': float(rating_stats.avg_rating) if rating_stats.avg_rating else None,
        'total_ratings': rating_stats.total_ratings or 0,
        'subscriber_count': subscriber_count,
        'performance_records': strategy.performance_records
    })
    
    return StrategyRead(**strategy_dict)


@router.put("/strategies/{strategy_id}", response_model=StrategyRead)
async def update_strategy(
    strategy_id: int,
    strategy_update: StrategyUpdate,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Update a strategy (only by creator)"""
    strategy = db.query(Strategy).filter(
        and_(
            Strategy.id == strategy_id,
            Strategy.created_by == current_user.id
        )
    ).first()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found or access denied"
        )
    
    # Update fields
    update_data = strategy_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(strategy, field, value)
    
    db.commit()
    db.refresh(strategy)
    
    return strategy


@router.delete("/strategies/{strategy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_strategy(
    strategy_id: int,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Delete a strategy (only by creator)"""
    strategy = db.query(Strategy).filter(
        and_(
            Strategy.id == strategy_id,
            Strategy.created_by == current_user.id
        )
    ).first()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found or access denied"
        )
    
    db.delete(strategy)
    db.commit()


# Strategy Marketplace
@router.get("/marketplace", response_model=StrategyMarketplaceResponse)
async def get_marketplace_strategies(
    search_params: StrategySearchParams = Depends(),
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Get public strategies from marketplace with filtering"""
    query = db.query(Strategy).filter(Strategy.is_public == True)
    
    # Apply filters
    if search_params.search:
        search_term = f"%{search_params.search}%"
        query = query.filter(
            or_(
                Strategy.name.ilike(search_term),
                Strategy.description.ilike(search_term),
                Strategy.short_description.ilike(search_term)
            )
        )
    
    if search_params.strategy_types:
        query = query.filter(Strategy.strategy_type.in_(search_params.strategy_types))
    
    if search_params.risk_levels:
        query = query.filter(Strategy.risk_level.in_(search_params.risk_levels))
    
    if search_params.min_capital_max:
        query = query.filter(Strategy.min_capital <= search_params.min_capital_max)
    
    if search_params.tags:
        # Filter by tags (JSON array contains)
        for tag in search_params.tags:
            query = query.filter(Strategy.tags.contains([tag]))
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply sorting
    sort_column = Strategy.created_at
    if search_params.sort_by == "name":
        sort_column = Strategy.name
    elif search_params.sort_by == "rating":
        # This would need a subquery for rating
        pass
    
    if search_params.sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    # Apply pagination
    strategies = query.offset(search_params.offset).limit(search_params.limit).all()
    
    # Add computed fields
    strategy_list = []
    for strategy in strategies:
        # Get latest performance
        latest_perf = db.query(StrategyPerformance).filter(
            StrategyPerformance.strategy_id == strategy.id
        ).order_by(desc(StrategyPerformance.updated_at)).first()
        
        # Get rating stats
        rating_stats = db.query(
            func.avg(StrategyRating.rating).label('avg_rating'),
            func.count(StrategyRating.id).label('total_ratings')
        ).filter(StrategyRating.strategy_id == strategy.id).first()
        
        # Get subscriber count
        subscriber_count = db.query(UserStrategy).filter(
            UserStrategy.strategy_id == strategy.id
        ).count()
        
        # Apply performance filters
        if search_params.min_return and latest_perf:
            if not latest_perf.total_return or latest_perf.total_return < search_params.min_return:
                continue
        
        if search_params.min_rating and rating_stats.avg_rating:
            if rating_stats.avg_rating < search_params.min_rating:
                continue
        
        strategy_dict = {
            **strategy.__dict__,
            'avg_rating': float(rating_stats.avg_rating) if rating_stats.avg_rating else None,
            'total_ratings': rating_stats.total_ratings or 0,
            'subscriber_count': subscriber_count,
            'latest_return': latest_perf.total_return if latest_perf else None,
            'latest_sharpe': latest_perf.sharpe_ratio if latest_perf else None,
            'latest_win_rate': latest_perf.win_rate if latest_perf else None
        }
        
        strategy_list.append(StrategyListRead(**strategy_dict))
    
    has_more = (search_params.offset + len(strategy_list)) < total_count
    
    return StrategyMarketplaceResponse(
        strategies=strategy_list,
        total_count=total_count,
        has_more=has_more,
        filters={
            "strategy_types": [t.value for t in StrategyType],
            "risk_levels": [r.value for r in RiskLevel]
        }
    )


# User Strategy Management
@router.post("/user-strategies", response_model=UserStrategyRead, status_code=status.HTTP_201_CREATED)
async def subscribe_to_strategy(
    user_strategy_data: UserStrategyCreate,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Subscribe to a strategy"""
    # Check if strategy exists and is accessible
    strategy = db.query(Strategy).filter(
        and_(
            Strategy.id == user_strategy_data.strategy_id,
            or_(
                Strategy.created_by == current_user.id,
                Strategy.is_public == True
            )
        )
    ).first()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found or not accessible"
        )
    
    # Check if already subscribed
    existing = db.query(UserStrategy).filter(
        and_(
            UserStrategy.user_id == current_user.id,
            UserStrategy.strategy_id == user_strategy_data.strategy_id
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to this strategy"
        )
    
    user_strategy = UserStrategy(
        **user_strategy_data.dict(),
        user_id=current_user.id
    )
    
    db.add(user_strategy)
    db.commit()
    db.refresh(user_strategy)
    
    return user_strategy


@router.get("/user-strategies", response_model=List[UserStrategyRead])
async def get_user_subscriptions(
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database),
    active_only: bool = Query(False)
):
    """Get user's strategy subscriptions"""
    query = db.query(UserStrategy).filter(UserStrategy.user_id == current_user.id)
    
    if active_only:
        query = query.filter(UserStrategy.is_active == True)
    
    return query.order_by(desc(UserStrategy.subscribed_at)).all()


# Strategy Performance
@router.post("/strategies/{strategy_id}/performance", response_model=StrategyPerformanceRead)
async def add_strategy_performance(
    strategy_id: int,
    performance_data: StrategyPerformanceCreate,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Add performance data to a strategy"""
    # Check strategy ownership
    strategy = db.query(Strategy).filter(
        and_(
            Strategy.id == strategy_id,
            Strategy.created_by == current_user.id
        )
    ).first()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found or access denied"
        )
    
    performance = StrategyPerformance(
        **performance_data.dict(),
        strategy_id=strategy_id
    )
    
    db.add(performance)
    db.commit()
    db.refresh(performance)
    
    return performance


# Strategy Ratings
@router.post("/strategies/{strategy_id}/rating", response_model=StrategyRatingRead)
async def rate_strategy(
    strategy_id: int,
    rating_data: StrategyRatingCreate,
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Rate a strategy"""
    # Check if strategy exists and is accessible
    strategy = db.query(Strategy).filter(
        and_(
            Strategy.id == strategy_id,
            or_(
                Strategy.created_by == current_user.id,
                Strategy.is_public == True
            )
        )
    ).first()
    
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found or not accessible"
        )
    
    # Check if user already rated
    existing_rating = db.query(StrategyRating).filter(
        and_(
            StrategyRating.strategy_id == strategy_id,
            StrategyRating.user_id == current_user.id
        )
    ).first()
    
    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating_data.rating
        existing_rating.review = rating_data.review
        db.commit()
        db.refresh(existing_rating)
        return existing_rating
    else:
        # Create new rating
        rating = StrategyRating(
            **rating_data.dict(),
            strategy_id=strategy_id,
            user_id=current_user.id
        )
        db.add(rating)
        db.commit()
        db.refresh(rating)
        return rating


# Statistics
@router.get("/stats", response_model=StrategyStatsResponse)
async def get_strategy_stats(
    current_user: User = Depends(current_active_user),
    db: Session = Depends(get_database)
):
    """Get strategy marketplace statistics"""
    total_strategies = db.query(Strategy).count()
    public_strategies = db.query(Strategy).filter(Strategy.is_public == True).count()
    
    # Average rating
    avg_rating_result = db.query(func.avg(StrategyRating.rating)).scalar()
    avg_rating = float(avg_rating_result) if avg_rating_result else None
    
    # Strategy types count
    strategy_types_count = {}
    for strategy_type in StrategyType:
        count = db.query(Strategy).filter(
            and_(
                Strategy.strategy_type == strategy_type,
                Strategy.is_public == True
            )
        ).count()
        strategy_types_count[strategy_type.value] = count
    
    # Risk levels count
    risk_levels_count = {}
    for risk_level in RiskLevel:
        count = db.query(Strategy).filter(
            and_(
                Strategy.risk_level == risk_level,
                Strategy.is_public == True
            )
        ).count()
        risk_levels_count[risk_level.value] = count
    
    # Top performing strategies (simplified)
    top_strategies = db.query(Strategy).filter(
        Strategy.is_public == True
    ).order_by(desc(Strategy.created_at)).limit(5).all()
    
    top_performing = []
    for strategy in top_strategies:
        strategy_dict = {
            **strategy.__dict__,
            'avg_rating': None,
            'total_ratings': 0,
            'subscriber_count': 0,
            'latest_return': None,
            'latest_sharpe': None,
            'latest_win_rate': None
        }
        top_performing.append(StrategyListRead(**strategy_dict))
    
    return StrategyStatsResponse(
        total_strategies=total_strategies,
        public_strategies=public_strategies,
        avg_rating=avg_rating,
        strategy_types_count=strategy_types_count,
        risk_levels_count=risk_levels_count,
        top_performing=top_performing
    )