"""
Paper trading engine for real-time strategy testing
"""

import asyncio
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal
from backend.app.models.strategy import Strategy
from backend.app.models.paper_trading import (
    PaperTradingSession, PaperOrder, PaperPosition, PaperTrade,
    PaperPortfolioSnapshot, PaperTradingAlert, PaperOrderStatus,
    PaperTradingStatus, PaperOrderSide, PaperOrderType
)
from backend.app.services.market_data import MarketDataService, MarketTick, get_market_data_service
from backend.app.backtesting.engine import BacktestEngine


logger = logging.getLogger(__name__)


@dataclass
class OrderRequest:
    """Order request data"""
    symbol: str
    side: str  # "buy" or "sell"
    order_type: str  # "market", "limit"
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    signal_data: Optional[Dict] = None


@dataclass
class PositionInfo:
    """Current position information"""
    symbol: str
    side: str  # "long" or "short"
    quantity: float
    entry_price: float
    current_price: float
    unrealized_pnl: float
    unrealized_pnl_pct: float


class PaperTradingEngine:
    """Real-time paper trading engine"""
    
    def __init__(self, session_id: int):
        self.session_id = session_id
        self.session: Optional[PaperTradingSession] = None
        self.strategy: Optional[Strategy] = None
        self.market_data_service: Optional[MarketDataService] = None
        self.is_running = False
        self.last_update = datetime.utcnow()
        
        # In-memory caches for performance
        self.current_positions: Dict[str, PositionInfo] = {}
        self.pending_orders: Dict[str, PaperOrder] = {}
        self.latest_prices: Dict[str, float] = {}
        
        # Strategy evaluation state
        self.indicator_values: Dict[str, Any] = {}
        self.last_signal_time: Dict[str, datetime] = {}
        
    async def start(self):
        """Start the paper trading engine"""
        try:
            # Load session and strategy
            db = SessionLocal()
            self.session = db.query(PaperTradingSession).filter(
                PaperTradingSession.id == self.session_id
            ).first()
            
            if not self.session:
                raise Exception(f"Paper trading session {self.session_id} not found")
            
            self.strategy = db.query(Strategy).filter(
                Strategy.id == self.session.strategy_id
            ).first()
            
            if not self.strategy:
                raise Exception(f"Strategy {self.session.strategy_id} not found")
            
            db.close()
            
            # Get market data service
            self.market_data_service = await get_market_data_service()
            
            # Subscribe to market data
            self.market_data_service.subscribe(
                self.session.symbol, 
                self.on_market_data_update
            )
            
            # Load current state
            await self.load_current_state()
            
            # Update session status
            await self.update_session_status(PaperTradingStatus.ACTIVE)
            
            self.is_running = True
            logger.info(f"Started paper trading engine for session {self.session_id}")
            
            # Start main loop
            await self.run_main_loop()
            
        except Exception as e:
            logger.error(f"Failed to start paper trading engine: {e}")
            await self.update_session_status(PaperTradingStatus.STOPPED)
            raise
    
    async def stop(self):
        """Stop the paper trading engine"""
        self.is_running = False
        
        if self.market_data_service and self.session:
            self.market_data_service.unsubscribe(
                self.session.symbol, 
                self.on_market_data_update
            )
        
        await self.update_session_status(PaperTradingStatus.STOPPED)
        logger.info(f"Stopped paper trading engine for session {self.session_id}")
    
    async def pause(self):
        """Pause the paper trading engine"""
        await self.update_session_status(PaperTradingStatus.PAUSED)
        logger.info(f"Paused paper trading engine for session {self.session_id}")
    
    async def resume(self):
        """Resume the paper trading engine"""
        await self.update_session_status(PaperTradingStatus.ACTIVE)
        logger.info(f"Resumed paper trading engine for session {self.session_id}")
    
    async def load_current_state(self):
        """Load current positions and pending orders"""
        db = SessionLocal()
        
        try:
            # Load open positions
            positions = db.query(PaperPosition).filter(
                PaperPosition.session_id == self.session_id,
                PaperPosition.is_open == True
            ).all()
            
            for position in positions:
                self.current_positions[position.symbol] = PositionInfo(
                    symbol=position.symbol,
                    side=position.side,
                    quantity=position.quantity,
                    entry_price=position.entry_price,
                    current_price=position.current_price,
                    unrealized_pnl=position.unrealized_pnl,
                    unrealized_pnl_pct=(position.unrealized_pnl / (position.quantity * position.entry_price)) * 100
                )
            
            # Load pending orders
            orders = db.query(PaperOrder).filter(
                PaperOrder.session_id == self.session_id,
                PaperOrder.status == PaperOrderStatus.PENDING.value
            ).all()
            
            for order in orders:
                self.pending_orders[order.order_id] = order
                
        finally:
            db.close()
    
    async def on_market_data_update(self, tick: MarketTick):
        """Handle market data updates"""
        try:
            self.latest_prices[tick.symbol] = tick.price
            self.last_update = datetime.utcnow()
            
            # Update position P&L
            await self.update_position_pnl(tick.symbol, tick.price)
            
            # Check pending orders
            await self.check_pending_orders(tick)
            
            # Only evaluate strategy if session is active
            if self.session and self.session.status == PaperTradingStatus.ACTIVE.value:
                await self.evaluate_strategy(tick)
            
        except Exception as e:
            logger.error(f"Error handling market data update: {e}")
    
    async def update_position_pnl(self, symbol: str, current_price: float):
        """Update position P&L based on current price"""
        if symbol in self.current_positions:
            position = self.current_positions[symbol]
            position.current_price = current_price
            
            # Calculate unrealized P&L
            if position.side == "long":
                position.unrealized_pnl = (current_price - position.entry_price) * position.quantity
            else:  # short
                position.unrealized_pnl = (position.entry_price - current_price) * position.quantity
            
            position.unrealized_pnl_pct = (position.unrealized_pnl / (position.quantity * position.entry_price)) * 100
            
            # Update database
            await self.update_position_in_db(position)
    
    async def check_pending_orders(self, tick: MarketTick):
        """Check and execute pending orders"""
        orders_to_remove = []
        
        for order_id, order in self.pending_orders.items():
            if order.symbol == tick.symbol:
                should_fill = False
                fill_price = tick.price
                
                if order.order_type == PaperOrderType.MARKET.value:
                    should_fill = True
                    # Add slippage for market orders
                    if order.side == PaperOrderSide.BUY.value:
                        fill_price = tick.ask or (tick.price * 1.001)
                    else:
                        fill_price = tick.bid or (tick.price * 0.999)
                        
                elif order.order_type == PaperOrderType.LIMIT.value:
                    if order.side == PaperOrderSide.BUY.value and tick.price <= order.price:
                        should_fill = True
                        fill_price = order.price
                    elif order.side == PaperOrderSide.SELL.value and tick.price >= order.price:
                        should_fill = True
                        fill_price = order.price
                
                if should_fill:
                    await self.fill_order(order, fill_price, tick)
                    orders_to_remove.append(order_id)
        
        # Remove filled orders
        for order_id in orders_to_remove:
            del self.pending_orders[order_id]
    
    async def fill_order(self, order: PaperOrder, fill_price: float, tick: MarketTick):
        """Fill a pending order"""
        try:
            db = SessionLocal()
            
            # Update order status
            order.status = PaperOrderStatus.FILLED.value
            order.filled_quantity = order.quantity
            order.avg_fill_price = fill_price
            order.filled_at = datetime.utcnow()
            
            # Calculate commission
            trade_value = order.quantity * fill_price
            commission = trade_value * 0.001  # 0.1% commission
            order.commission = commission
            
            db.merge(order)
            
            # Update or create position
            await self.update_position_after_fill(order, fill_price, db)
            
            # Update session capital
            if order.side == PaperOrderSide.BUY.value:
                self.session.current_capital -= (trade_value + commission)
            else:
                self.session.current_capital += (trade_value - commission)
            
            self.session.last_activity = datetime.utcnow()
            db.merge(self.session)
            
            # Create alert
            await self.create_alert(
                alert_type="order_filled",
                title=f"{order.side.upper()} Order Filled",
                message=f"Filled {order.quantity} {order.symbol} at ${fill_price:.2f}",
                severity="success",
                order_id=order.order_id,
                db=db
            )
            
            db.commit()
            db.close()
            
            logger.info(f"Filled order {order.order_id}: {order.side} {order.quantity} {order.symbol} at ${fill_price}")
            
        except Exception as e:
            logger.error(f"Error filling order {order.order_id}: {e}")
            db.rollback()
            db.close()
    
    async def update_position_after_fill(self, order: PaperOrder, fill_price: float, db: Session):
        """Update position after order fill"""
        # Find existing position
        existing_position = db.query(PaperPosition).filter(
            PaperPosition.session_id == self.session_id,
            PaperPosition.symbol == order.symbol,
            PaperPosition.is_open == True
        ).first()
        
        if existing_position:
            # Update existing position
            if order.side == PaperOrderSide.BUY.value:
                # Increase long position or decrease short position
                if existing_position.side == "long":
                    # Add to long position
                    total_value = (existing_position.quantity * existing_position.entry_price) + (order.quantity * fill_price)
                    total_quantity = existing_position.quantity + order.quantity
                    existing_position.entry_price = total_value / total_quantity
                    existing_position.quantity = total_quantity
                else:
                    # Reduce short position
                    existing_position.quantity -= order.quantity
                    if existing_position.quantity <= 0:
                        # Position closed or flipped
                        if existing_position.quantity < 0:
                            existing_position.side = "long"
                            existing_position.quantity = abs(existing_position.quantity)
                            existing_position.entry_price = fill_price
                        else:
                            existing_position.is_open = False
            else:  # SELL
                # Decrease long position or increase short position
                if existing_position.side == "long":
                    existing_position.quantity -= order.quantity
                    if existing_position.quantity <= 0:
                        if existing_position.quantity < 0:
                            existing_position.side = "short"
                            existing_position.quantity = abs(existing_position.quantity)
                            existing_position.entry_price = fill_price
                        else:
                            existing_position.is_open = False
                else:
                    # Add to short position
                    total_value = (existing_position.quantity * existing_position.entry_price) + (order.quantity * fill_price)
                    total_quantity = existing_position.quantity + order.quantity
                    existing_position.entry_price = total_value / total_quantity
                    existing_position.quantity = total_quantity
            
            existing_position.updated_at = datetime.utcnow()
            db.merge(existing_position)
            
        else:
            # Create new position
            new_position = PaperPosition(
                session_id=self.session_id,
                position_id=str(uuid.uuid4()),
                symbol=order.symbol,
                side="long" if order.side == PaperOrderSide.BUY.value else "short",
                quantity=order.quantity,
                entry_price=fill_price,
                current_price=fill_price,
                unrealized_pnl=0.0,
                entry_signal_data=order.signal_data
            )
            db.add(new_position)
        
        # Update in-memory cache
        await self.load_current_state()
    
    async def evaluate_strategy(self, tick: MarketTick):
        """Evaluate strategy conditions and generate signals"""
        try:
            # Skip if we just processed a signal for this symbol (rate limiting)
            last_signal = self.last_signal_time.get(tick.symbol)
            if last_signal and (datetime.utcnow() - last_signal).seconds < self.session.update_interval:
                return
            
            # Calculate indicators (simplified for real-time)
            await self.calculate_real_time_indicators(tick)
            
            # Evaluate entry conditions
            entry_signals = await self.evaluate_entry_conditions(tick)
            
            # Evaluate exit conditions for existing positions
            await self.evaluate_exit_conditions(tick)
            
            # Process entry signals
            for signal in entry_signals:
                await self.process_entry_signal(signal, tick)
            
            self.last_signal_time[tick.symbol] = datetime.utcnow()
            
        except Exception as e:
            logger.error(f"Error evaluating strategy: {e}")
    
    async def calculate_real_time_indicators(self, tick: MarketTick):
        """Calculate technical indicators for real-time data"""
        # This is a simplified version - in production, you'd maintain
        # a rolling window of price data for proper indicator calculation
        
        symbol = tick.symbol
        if symbol not in self.indicator_values:
            self.indicator_values[symbol] = {}
        
        # Simple moving average simulation (normally you'd need historical data)
        if 'sma_20' not in self.indicator_values[symbol]:
            self.indicator_values[symbol]['sma_20'] = tick.price
        else:
            # Exponential smoothing approximation
            alpha = 2 / (20 + 1)
            self.indicator_values[symbol]['sma_20'] = (
                alpha * tick.price + (1 - alpha) * self.indicator_values[symbol]['sma_20']
            )
        
        if 'sma_50' not in self.indicator_values[symbol]:
            self.indicator_values[symbol]['sma_50'] = tick.price
        else:
            alpha = 2 / (50 + 1)
            self.indicator_values[symbol]['sma_50'] = (
                alpha * tick.price + (1 - alpha) * self.indicator_values[symbol]['sma_50']
            )
        
        # Simple RSI approximation
        if 'rsi' not in self.indicator_values[symbol]:
            self.indicator_values[symbol]['rsi'] = 50.0
        else:
            # Simplified RSI calculation
            price_change = tick.price - self.indicator_values[symbol].get('last_price', tick.price)
            if price_change > 0:
                self.indicator_values[symbol]['rsi'] = min(100, self.indicator_values[symbol]['rsi'] + 1)
            elif price_change < 0:
                self.indicator_values[symbol]['rsi'] = max(0, self.indicator_values[symbol]['rsi'] - 1)
        
        self.indicator_values[symbol]['last_price'] = tick.price
        self.indicator_values[symbol]['current_price'] = tick.price
    
    async def evaluate_entry_conditions(self, tick: MarketTick) -> List[Dict]:
        """Evaluate strategy entry conditions"""
        signals = []
        symbol = tick.symbol
        
        if symbol not in self.indicator_values:
            return signals
        
        indicators = self.indicator_values[symbol]
        
        # Check if we already have a position
        if symbol in self.current_positions:
            return signals  # Don't open new positions if we already have one
        
        # Evaluate long conditions (simplified SMA crossover example)
        if self.strategy.entry_conditions.get('long'):
            # Simple SMA crossover: buy when short SMA > long SMA
            sma_20 = indicators.get('sma_20', 0)
            sma_50 = indicators.get('sma_50', 0)
            
            if sma_20 > sma_50 and sma_20 > 0 and sma_50 > 0:
                signals.append({
                    'side': 'buy',
                    'signal_data': {
                        'type': 'sma_crossover',
                        'sma_20': sma_20,
                        'sma_50': sma_50,
                        'price': tick.price,
                        'timestamp': tick.timestamp.isoformat()
                    }
                })
        
        # Evaluate short conditions
        if self.strategy.entry_conditions.get('short'):
            rsi = indicators.get('rsi', 50)
            if rsi > 70:  # Overbought
                signals.append({
                    'side': 'sell',
                    'signal_data': {
                        'type': 'rsi_overbought',
                        'rsi': rsi,
                        'price': tick.price,
                        'timestamp': tick.timestamp.isoformat()
                    }
                })
        
        return signals
    
    async def evaluate_exit_conditions(self, tick: MarketTick):
        """Evaluate exit conditions for existing positions"""
        symbol = tick.symbol
        
        if symbol not in self.current_positions:
            return
        
        position = self.current_positions[symbol]
        
        # Check stop loss
        if self.session.stop_loss_pct:
            stop_loss_threshold = position.entry_price * (1 - self.session.stop_loss_pct / 100)
            if position.side == "long" and tick.price <= stop_loss_threshold:
                await self.close_position(position, tick.price, "stop_loss", tick)
                return
        
        # Check take profit
        if self.session.take_profit_pct:
            take_profit_threshold = position.entry_price * (1 + self.session.take_profit_pct / 100)
            if position.side == "long" and tick.price >= take_profit_threshold:
                await self.close_position(position, tick.price, "take_profit", tick)
                return
        
        # Check strategy exit conditions
        indicators = self.indicator_values.get(symbol, {})
        if indicators:
            # Example: Exit long position when RSI > 70
            rsi = indicators.get('rsi', 50)
            if position.side == "long" and rsi > 70:
                await self.close_position(position, tick.price, "signal", tick)
    
    async def process_entry_signal(self, signal: Dict, tick: MarketTick):
        """Process an entry signal and create order"""
        try:
            # Calculate position size
            position_size_usd = self.session.current_capital * (self.session.max_position_size / 100)
            quantity = position_size_usd / tick.price
            
            # Create order request
            order_request = OrderRequest(
                symbol=tick.symbol,
                side=signal['side'],
                order_type="market",
                quantity=quantity,
                signal_data=signal['signal_data']
            )
            
            await self.place_order(order_request)
            
        except Exception as e:
            logger.error(f"Error processing entry signal: {e}")
    
    async def place_order(self, order_request: OrderRequest) -> str:
        """Place a new order"""
        try:
            db = SessionLocal()
            
            order_id = str(uuid.uuid4())
            current_price = self.latest_prices.get(order_request.symbol, 0)
            
            order = PaperOrder(
                session_id=self.session_id,
                order_id=order_id,
                symbol=order_request.symbol,
                side=order_request.side,
                order_type=order_request.order_type,
                quantity=order_request.quantity,
                price=order_request.price,
                stop_price=order_request.stop_price,
                remaining_quantity=order_request.quantity,
                market_price=current_price,
                signal_data=order_request.signal_data
            )
            
            db.add(order)
            
            # Add to pending orders if not market order
            if order_request.order_type != "market":
                self.pending_orders[order_id] = order
            
            # Create alert
            await self.create_alert(
                alert_type="order_placed",
                title=f"{order_request.side.upper()} Order Placed",
                message=f"Placed {order_request.order_type} order for {order_request.quantity:.4f} {order_request.symbol}",
                severity="info",
                order_id=order_id,
                db=db
            )
            
            db.commit()
            db.close()
            
            logger.info(f"Placed order {order_id}: {order_request.side} {order_request.quantity} {order_request.symbol}")
            return order_id
            
        except Exception as e:
            logger.error(f"Error placing order: {e}")
            db.rollback()
            db.close()
            raise
    
    async def close_position(self, position: PositionInfo, exit_price: float, exit_reason: str, tick: MarketTick):
        """Close an existing position"""
        try:
            # Create closing order
            side = "sell" if position.side == "long" else "buy"
            
            order_request = OrderRequest(
                symbol=position.symbol,
                side=side,
                order_type="market",
                quantity=position.quantity,
                signal_data={
                    "exit_reason": exit_reason,
                    "exit_price": exit_price,
                    "timestamp": tick.timestamp.isoformat()
                }
            )
            
            await self.place_order(order_request)
            
        except Exception as e:
            logger.error(f"Error closing position: {e}")
    
    async def create_alert(self, alert_type: str, title: str, message: str, 
                          severity: str = "info", order_id: str = None, 
                          trade_id: str = None, db: Session = None):
        """Create a trading alert"""
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True
        
        try:
            alert = PaperTradingAlert(
                session_id=self.session_id,
                user_id=self.session.user_id,
                alert_type=alert_type,
                title=title,
                message=message,
                severity=severity,
                symbol=self.session.symbol,
                order_id=order_id,
                trade_id=trade_id
            )
            
            db.add(alert)
            
            if close_db:
                db.commit()
            
        finally:
            if close_db:
                db.close()
    
    async def update_position_in_db(self, position: PositionInfo):
        """Update position in database"""
        try:
            db = SessionLocal()
            
            db_position = db.query(PaperPosition).filter(
                PaperPosition.session_id == self.session_id,
                PaperPosition.symbol == position.symbol,
                PaperPosition.is_open == True
            ).first()
            
            if db_position:
                db_position.current_price = position.current_price
                db_position.unrealized_pnl = position.unrealized_pnl
                db_position.updated_at = datetime.utcnow()
                db.commit()
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error updating position in database: {e}")
    
    async def update_session_status(self, status: PaperTradingStatus):
        """Update session status"""
        try:
            db = SessionLocal()
            
            session = db.query(PaperTradingSession).filter(
                PaperTradingSession.id == self.session_id
            ).first()
            
            if session:
                session.status = status.value
                session.last_activity = datetime.utcnow()
                db.commit()
                
                if self.session:
                    self.session.status = status.value
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error updating session status: {e}")
    
    async def run_main_loop(self):
        """Main engine loop"""
        while self.is_running:
            try:
                # Take portfolio snapshot every minute
                await self.take_portfolio_snapshot()
                
                # Clean up old data
                await self.cleanup_old_data()
                
                # Wait before next iteration
                await asyncio.sleep(60)  # 1 minute
                
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                await asyncio.sleep(10)
    
    async def take_portfolio_snapshot(self):
        """Take a portfolio snapshot for performance tracking"""
        try:
            db = SessionLocal()
            
            # Calculate total portfolio value
            total_value = self.session.current_capital
            unrealized_pnl = 0.0
            
            for position in self.current_positions.values():
                total_value += position.unrealized_pnl
                unrealized_pnl += position.unrealized_pnl
            
            # Calculate returns
            total_return = ((total_value - self.session.initial_capital) / self.session.initial_capital) * 100
            
            snapshot = PaperPortfolioSnapshot(
                session_id=self.session_id,
                total_value=total_value,
                cash_balance=self.session.current_capital,
                unrealized_pnl=unrealized_pnl,
                total_return=total_return,
                open_positions=len(self.current_positions),
                market_prices=self.latest_prices
            )
            
            db.add(snapshot)
            db.commit()
            db.close()
            
        except Exception as e:
            logger.error(f"Error taking portfolio snapshot: {e}")
    
    async def cleanup_old_data(self):
        """Clean up old market data and snapshots"""
        try:
            db = SessionLocal()
            
            # Keep only last 30 days of snapshots
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            
            db.query(PaperPortfolioSnapshot).filter(
                PaperPortfolioSnapshot.session_id == self.session_id,
                PaperPortfolioSnapshot.timestamp < cutoff_date
            ).delete()
            
            db.commit()
            db.close()
            
        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")


class PaperTradingManager:
    """Manager for multiple paper trading engines"""
    
    def __init__(self):
        self.engines: Dict[int, PaperTradingEngine] = {}
    
    async def start_session(self, session_id: int) -> PaperTradingEngine:
        """Start a paper trading session"""
        if session_id in self.engines:
            return self.engines[session_id]
        
        engine = PaperTradingEngine(session_id)
        self.engines[session_id] = engine
        
        # Start engine in background task
        asyncio.create_task(engine.start())
        
        return engine
    
    async def stop_session(self, session_id: int):
        """Stop a paper trading session"""
        if session_id in self.engines:
            await self.engines[session_id].stop()
            del self.engines[session_id]
    
    async def get_session(self, session_id: int) -> Optional[PaperTradingEngine]:
        """Get a running session"""
        return self.engines.get(session_id)
    
    async def stop_all_sessions(self):
        """Stop all running sessions"""
        for engine in self.engines.values():
            await engine.stop()
        self.engines.clear()


# Global paper trading manager
paper_trading_manager = PaperTradingManager()