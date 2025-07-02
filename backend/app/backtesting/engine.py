"""
Core backtesting engine for strategy testing and validation
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import asyncio
import logging
from dataclasses import dataclass
from enum import Enum

from backend.app.models.backtest import (
    Backtest, BacktestResult, BacktestTrade, BacktestMetrics, 
    BacktestEquityCurve, BacktestStatus
)
from backend.app.models.strategy import Strategy


logger = logging.getLogger(__name__)


class OrderSide(Enum):
    LONG = "long"
    SHORT = "short"


class ExitReason(Enum):
    SIGNAL = "signal"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"
    END_OF_DATA = "end_of_data"
    MAX_DURATION = "max_duration"


@dataclass
class Trade:
    """Individual trade representation"""
    trade_id: str
    symbol: str
    side: OrderSide
    entry_price: float
    quantity: float
    entry_time: datetime
    stop_loss_price: Optional[float] = None
    take_profit_price: Optional[float] = None
    exit_price: Optional[float] = None
    exit_time: Optional[datetime] = None
    exit_reason: Optional[ExitReason] = None
    pnl: Optional[float] = None
    pnl_pct: Optional[float] = None
    fees: float = 0.0
    entry_signal_data: Optional[Dict] = None
    exit_signal_data: Optional[Dict] = None


@dataclass
class Portfolio:
    """Portfolio state tracking"""
    cash: float
    positions: Dict[str, float]  # symbol -> quantity
    open_trades: List[Trade]
    closed_trades: List[Trade]
    equity_history: List[Tuple[datetime, float]]
    
    @property
    def total_value(self) -> float:
        return self.cash + sum(self.positions.values())
    
    @property
    def open_positions_value(self) -> float:
        return sum(self.positions.values())


class BacktestEngine:
    """Main backtesting engine"""
    
    def __init__(self, strategy: Strategy, config: Backtest):
        self.strategy = strategy
        self.config = config
        self.portfolio = Portfolio(
            cash=config.initial_capital,
            positions={},
            open_trades=[],
            closed_trades=[],
            equity_history=[]
        )
        self.current_time = config.start_date
        self.data: Optional[pd.DataFrame] = None
        self.indicators: Dict[str, pd.Series] = {}
        self.trade_counter = 0
        
    async def load_market_data(self) -> pd.DataFrame:
        """Load historical market data for backtesting"""
        # TODO: Implement data loading from various sources
        # For now, simulate data
        date_range = pd.date_range(
            start=self.config.start_date,
            end=self.config.end_date,
            freq=self._get_pandas_freq(self.config.timeframe)
        )
        
        # Simulate realistic OHLCV data
        np.random.seed(42)  # For reproducible results
        n_periods = len(date_range)
        
        # Generate realistic price data using random walk
        initial_price = 50000.0  # Starting price
        returns = np.random.normal(0.0005, 0.02, n_periods)  # Small positive drift with volatility
        prices = initial_price * np.exp(np.cumsum(returns))
        
        # Generate OHLC from prices
        data = []
        for i, price in enumerate(prices):
            volatility = 0.01
            high = price * (1 + np.random.uniform(0, volatility))
            low = price * (1 - np.random.uniform(0, volatility))
            open_price = prices[i-1] if i > 0 else price
            close_price = price
            volume = np.random.uniform(1000, 10000)
            
            data.append({
                'timestamp': date_range[i],
                'open': open_price,
                'high': max(open_price, high, close_price),
                'low': min(open_price, low, close_price),
                'close': close_price,
                'volume': volume
            })
        
        self.data = pd.DataFrame(data).set_index('timestamp')
        return self.data
    
    def _get_pandas_freq(self, timeframe: str) -> str:
        """Convert timeframe string to pandas frequency"""
        freq_map = {
            '1m': '1T',
            '5m': '5T',
            '15m': '15T',
            '30m': '30T',
            '1h': '1H',
            '4h': '4H',
            '12h': '12H',
            '1d': '1D',
            '1w': '1W'
        }
        return freq_map.get(timeframe, '1H')
    
    def calculate_indicators(self) -> None:
        """Calculate technical indicators based on strategy requirements"""
        if self.data is None:
            raise ValueError("Market data not loaded")
        
        # Parse strategy indicators and calculate them
        for name, config in self.strategy.indicators.items():
            indicator_type = config.get('type', '').upper()
            period = config.get('period', 20)
            
            if indicator_type == 'SMA':
                self.indicators[name] = self.data['close'].rolling(window=period).mean()
            elif indicator_type == 'EMA':
                self.indicators[name] = self.data['close'].ewm(span=period).mean()
            elif indicator_type == 'RSI':
                self.indicators[name] = self._calculate_rsi(self.data['close'], period)
            elif indicator_type == 'BB':
                # Bollinger Bands
                sma = self.data['close'].rolling(window=period).mean()
                std = self.data['close'].rolling(window=period).std()
                std_multiplier = config.get('std', 2)
                self.indicators[f'{name}_upper'] = sma + (std * std_multiplier)
                self.indicators[f'{name}_lower'] = sma - (std * std_multiplier)
                self.indicators[f'{name}_middle'] = sma
            elif indicator_type == 'ATR':
                self.indicators[name] = self._calculate_atr(period)
        
        logger.info(f"Calculated {len(self.indicators)} indicators")
    
    def _calculate_rsi(self, prices: pd.Series, period: int) -> pd.Series:
        """Calculate Relative Strength Index"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _calculate_atr(self, period: int) -> pd.Series:
        """Calculate Average True Range"""
        high_low = self.data['high'] - self.data['low']
        high_close = np.abs(self.data['high'] - self.data['close'].shift())
        low_close = np.abs(self.data['low'] - self.data['close'].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = ranges.max(axis=1)
        return true_range.rolling(window=period).mean()
    
    def evaluate_entry_conditions(self, timestamp: datetime) -> List[Tuple[OrderSide, Dict]]:
        """Evaluate strategy entry conditions"""
        signals = []
        
        try:
            # Get current indicator values
            current_values = {}
            for name, series in self.indicators.items():
                if timestamp in series.index:
                    current_values[name] = series[timestamp]
            
            # Get current market data
            if timestamp in self.data.index:
                current_data = self.data.loc[timestamp]
                current_values.update({
                    'open': current_data['open'],
                    'high': current_data['high'],
                    'low': current_data['low'],
                    'close': current_data['close'],
                    'volume': current_data['volume']
                })
            
            # Evaluate long conditions
            long_condition = self.strategy.entry_conditions.get('long', '')
            if self._evaluate_condition(long_condition, current_values):
                signals.append((OrderSide.LONG, current_values))
            
            # Evaluate short conditions
            short_condition = self.strategy.entry_conditions.get('short', '')
            if self._evaluate_condition(short_condition, current_values):
                signals.append((OrderSide.SHORT, current_values))
                
        except Exception as e:
            logger.warning(f"Error evaluating entry conditions at {timestamp}: {e}")
        
        return signals
    
    def evaluate_exit_conditions(self, trade: Trade, timestamp: datetime) -> Tuple[bool, ExitReason, Dict]:
        """Evaluate exit conditions for an open trade"""
        try:
            # Get current market data
            if timestamp not in self.data.index:
                return False, None, {}
            
            current_data = self.data.loc[timestamp]
            current_price = current_data['close']
            
            # Check stop loss
            if trade.stop_loss_price:
                if trade.side == OrderSide.LONG and current_price <= trade.stop_loss_price:
                    return True, ExitReason.STOP_LOSS, {'exit_price': trade.stop_loss_price}
                elif trade.side == OrderSide.SHORT and current_price >= trade.stop_loss_price:
                    return True, ExitReason.STOP_LOSS, {'exit_price': trade.stop_loss_price}
            
            # Check take profit
            if trade.take_profit_price:
                if trade.side == OrderSide.LONG and current_price >= trade.take_profit_price:
                    return True, ExitReason.TAKE_PROFIT, {'exit_price': trade.take_profit_price}
                elif trade.side == OrderSide.SHORT and current_price <= trade.take_profit_price:
                    return True, ExitReason.TAKE_PROFIT, {'exit_price': trade.take_profit_price}
            
            # Check strategy exit conditions
            current_values = {}
            for name, series in self.indicators.items():
                if timestamp in series.index:
                    current_values[name] = series[timestamp]
            
            current_values.update({
                'open': current_data['open'],
                'high': current_data['high'],
                'low': current_data['low'],
                'close': current_data['close'],
                'volume': current_data['volume']
            })
            
            # Check exit conditions based on trade side
            exit_key = f'{trade.side.value}_exit' if f'{trade.side.value}_exit' in self.strategy.exit_conditions else 'exit'
            exit_condition = self.strategy.exit_conditions.get(exit_key, '')
            
            if self._evaluate_condition(exit_condition, current_values):
                return True, ExitReason.SIGNAL, {'exit_price': current_price}
            
        except Exception as e:
            logger.warning(f"Error evaluating exit conditions for trade {trade.trade_id} at {timestamp}: {e}")
        
        return False, None, {}
    
    def _evaluate_condition(self, condition: str, values: Dict) -> bool:
        """Safely evaluate a condition string with current values"""
        if not condition:
            return False
        
        try:
            # Simple condition evaluation (can be enhanced)
            # Replace variable names with actual values
            eval_condition = condition
            for var_name, value in values.items():
                if var_name in eval_condition:
                    eval_condition = eval_condition.replace(var_name, str(value))
            
            # Basic safety checks before eval
            dangerous_keywords = ['import', 'exec', 'eval', '__', 'open', 'file']
            if any(keyword in eval_condition.lower() for keyword in dangerous_keywords):
                logger.warning(f"Dangerous condition detected: {condition}")
                return False
            
            # Simple condition parsing for basic comparisons
            if '>' in eval_condition or '<' in eval_condition or '==' in eval_condition:
                return eval(eval_condition)
            
        except Exception as e:
            logger.warning(f"Error evaluating condition '{condition}': {e}")
        
        return False
    
    def calculate_position_size(self, side: OrderSide, entry_price: float) -> float:
        """Calculate position size based on risk management rules"""
        # Use strategy parameters or config defaults
        max_position_pct = self.config.max_position_size or 25.0
        
        # Calculate maximum position value
        max_position_value = self.portfolio.cash * (max_position_pct / 100.0)
        
        # Calculate quantity
        quantity = max_position_value / entry_price
        
        return quantity
    
    def open_trade(self, side: OrderSide, timestamp: datetime, signal_data: Dict) -> Optional[Trade]:
        """Open a new trade"""
        try:
            current_price = self.data.loc[timestamp]['close']
            quantity = self.calculate_position_size(side, current_price)
            
            # Calculate fees
            trade_value = quantity * current_price
            fees = trade_value * self.config.commission
            
            # Check if we have enough cash
            if self.portfolio.cash < trade_value + fees:
                logger.warning(f"Insufficient cash for trade: need {trade_value + fees}, have {self.portfolio.cash}")
                return None
            
            self.trade_counter += 1
            trade = Trade(
                trade_id=f"trade_{self.trade_counter}",
                symbol=self.config.symbol,
                side=side,
                entry_price=current_price,
                quantity=quantity,
                entry_time=timestamp,
                fees=fees,
                entry_signal_data=signal_data
            )
            
            # Set stop loss and take profit if configured
            if self.config.stop_loss_pct:
                if side == OrderSide.LONG:
                    trade.stop_loss_price = current_price * (1 - self.config.stop_loss_pct / 100)
                else:
                    trade.stop_loss_price = current_price * (1 + self.config.stop_loss_pct / 100)
            
            if self.config.take_profit_pct:
                if side == OrderSide.LONG:
                    trade.take_profit_price = current_price * (1 + self.config.take_profit_pct / 100)
                else:
                    trade.take_profit_price = current_price * (1 - self.config.take_profit_pct / 100)
            
            # Update portfolio
            self.portfolio.cash -= trade_value + fees
            position_value = quantity * current_price if side == OrderSide.LONG else -quantity * current_price
            self.portfolio.positions[self.config.symbol] = self.portfolio.positions.get(self.config.symbol, 0) + position_value
            self.portfolio.open_trades.append(trade)
            
            logger.info(f"Opened {side.value} trade: {trade.trade_id} at {current_price}")
            return trade
            
        except Exception as e:
            logger.error(f"Error opening trade: {e}")
            return None
    
    def close_trade(self, trade: Trade, timestamp: datetime, exit_reason: ExitReason, exit_data: Dict) -> None:
        """Close an existing trade"""
        try:
            exit_price = exit_data.get('exit_price', self.data.loc[timestamp]['close'])
            
            # Calculate P&L
            if trade.side == OrderSide.LONG:
                pnl = (exit_price - trade.entry_price) * trade.quantity
            else:
                pnl = (trade.entry_price - exit_price) * trade.quantity
            
            # Calculate fees for exit
            exit_value = trade.quantity * exit_price
            exit_fees = exit_value * self.config.commission
            
            # Update trade
            trade.exit_price = exit_price
            trade.exit_time = timestamp
            trade.exit_reason = exit_reason
            trade.pnl = pnl - exit_fees
            trade.pnl_pct = (trade.pnl / (trade.quantity * trade.entry_price)) * 100
            trade.fees += exit_fees
            trade.exit_signal_data = exit_data
            
            # Update portfolio
            trade_value = trade.quantity * exit_price
            self.portfolio.cash += trade_value - exit_fees
            
            # Remove position
            position_value = trade.quantity * exit_price if trade.side == OrderSide.LONG else -trade.quantity * exit_price
            self.portfolio.positions[self.config.symbol] = self.portfolio.positions.get(self.config.symbol, 0) - position_value
            
            # Move trade to closed trades
            self.portfolio.open_trades.remove(trade)
            self.portfolio.closed_trades.append(trade)
            
            logger.info(f"Closed trade {trade.trade_id}: P&L = {trade.pnl:.2f} ({trade.pnl_pct:.2f}%)")
            
        except Exception as e:
            logger.error(f"Error closing trade {trade.trade_id}: {e}")
    
    def update_portfolio_metrics(self, timestamp: datetime) -> None:
        """Update portfolio metrics and equity curve"""
        current_price = self.data.loc[timestamp]['close']
        
        # Update position values based on current price
        total_position_value = 0
        for symbol, quantity in self.portfolio.positions.items():
            if symbol == self.config.symbol:
                total_position_value += quantity * current_price
        
        total_equity = self.portfolio.cash + total_position_value
        self.portfolio.equity_history.append((timestamp, total_equity))
    
    async def run_backtest(self, progress_callback=None) -> BacktestResult:
        """Run the complete backtest"""
        logger.info(f"Starting backtest for strategy: {self.strategy.name}")
        
        try:
            # Load market data
            await self.load_market_data()
            
            # Calculate indicators
            self.calculate_indicators()
            
            # Iterate through each time period
            total_periods = len(self.data)
            
            for i, (timestamp, row) in enumerate(self.data.iterrows()):
                self.current_time = timestamp
                
                # Update progress
                progress = (i / total_periods) * 100
                if progress_callback:
                    await progress_callback(progress)
                
                # Check exit conditions for open trades
                for trade in self.portfolio.open_trades.copy():
                    should_exit, exit_reason, exit_data = self.evaluate_exit_conditions(trade, timestamp)
                    if should_exit:
                        self.close_trade(trade, timestamp, exit_reason, exit_data)
                
                # Check entry conditions for new trades
                # Limit number of open positions
                if len(self.portfolio.open_trades) < 3:  # Max 3 concurrent trades
                    entry_signals = self.evaluate_entry_conditions(timestamp)
                    for side, signal_data in entry_signals:
                        if len(self.portfolio.open_trades) < 3:
                            self.open_trade(side, timestamp, signal_data)
                
                # Update portfolio metrics
                self.update_portfolio_metrics(timestamp)
            
            # Close any remaining open trades at the end
            for trade in self.portfolio.open_trades.copy():
                self.close_trade(trade, self.current_time, ExitReason.END_OF_DATA, {})
            
            # Calculate final results
            result = self._calculate_results()
            logger.info("Backtest completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Backtest failed: {e}")
            raise
    
    def _calculate_results(self) -> BacktestResult:
        """Calculate comprehensive backtest results"""
        trades = self.portfolio.closed_trades
        equity_curve = pd.Series([equity for _, equity in self.portfolio.equity_history])
        
        if len(trades) == 0:
            logger.warning("No trades executed during backtest")
            return BacktestResult()
        
        # Basic metrics
        total_pnl = sum(trade.pnl for trade in trades)
        total_return = (total_pnl / self.config.initial_capital) * 100
        
        # Trade statistics
        winning_trades = [t for t in trades if t.pnl > 0]
        losing_trades = [t for t in trades if t.pnl <= 0]
        
        win_rate = (len(winning_trades) / len(trades)) * 100 if trades else 0
        avg_win = np.mean([t.pnl for t in winning_trades]) if winning_trades else 0
        avg_loss = np.mean([t.pnl for t in losing_trades]) if losing_trades else 0
        profit_factor = abs(sum(t.pnl for t in winning_trades) / sum(t.pnl for t in losing_trades)) if losing_trades and sum(t.pnl for t in losing_trades) != 0 else 0
        
        # Risk metrics
        returns = equity_curve.pct_change().dropna()
        volatility = returns.std() * np.sqrt(252) * 100  # Annualized volatility
        sharpe_ratio = (returns.mean() / returns.std()) * np.sqrt(252) if returns.std() != 0 else 0
        
        # Drawdown calculation
        peak = equity_curve.expanding().max()
        drawdown = ((equity_curve - peak) / peak) * 100
        max_drawdown = abs(drawdown.min())
        
        # Final portfolio values
        final_capital = equity_curve.iloc[-1] if len(equity_curve) > 0 else self.config.initial_capital
        peak_capital = equity_curve.max() if len(equity_curve) > 0 else self.config.initial_capital
        
        result = BacktestResult(
            total_return=total_return,
            annual_return=total_return,  # Simplified - should calculate properly based on period
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe_ratio,
            total_trades=len(trades),
            winning_trades=len(winning_trades),
            losing_trades=len(losing_trades),
            win_rate=win_rate,
            avg_win=avg_win,
            avg_loss=avg_loss,
            profit_factor=profit_factor,
            volatility=volatility,
            final_capital=final_capital,
            peak_capital=peak_capital,
            lowest_capital=equity_curve.min() if len(equity_curve) > 0 else self.config.initial_capital
        )
        
        return result