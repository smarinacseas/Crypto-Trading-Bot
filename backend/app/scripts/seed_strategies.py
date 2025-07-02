"""
Script to seed the database with sample trading strategies
Run this after creating a user account
"""

import asyncio
from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal
from backend.app.models.strategy import (
    Strategy, StrategyPerformance, StrategyType, RiskLevel, StrategyStatus
)
from backend.app.models.user import User

def create_sample_strategies():
    db = SessionLocal()
    
    try:
        # Get the first user (assuming you have at least one user)
        user = db.query(User).first()
        if not user:
            print("No users found. Please create a user account first.")
            return
        
        print(f"Creating strategies for user: {user.email}")
        
        # Sample strategies
        strategies_data = [
            {
                "name": "SMA Crossover Strategy",
                "description": "A classic technical analysis strategy using Simple Moving Average crossovers. When the short-term SMA crosses above the long-term SMA, it generates a buy signal. When it crosses below, it generates a sell signal.",
                "short_description": "Classic SMA crossover strategy for trend following",
                "strategy_type": StrategyType.TECHNICAL,
                "risk_level": RiskLevel.MEDIUM,
                "min_capital": 500.0,
                "recommended_capital": 2000.0,
                "max_drawdown": 15.0,
                "target_return": 25.0,
                "timeframe": "4h",
                "parameters": {
                    "short_sma_period": 20,
                    "long_sma_period": 50,
                    "stop_loss_pct": 5.0,
                    "take_profit_pct": 10.0
                },
                "indicators": {
                    "sma_20": {"type": "SMA", "period": 20},
                    "sma_50": {"type": "SMA", "period": 50}
                },
                "entry_conditions": {
                    "long": "sma_20 > sma_50 AND sma_20_prev <= sma_50_prev",
                    "short": "sma_20 < sma_50 AND sma_20_prev >= sma_50_prev"
                },
                "exit_conditions": {
                    "stop_loss": "price <= entry_price * (1 - stop_loss_pct/100)",
                    "take_profit": "price >= entry_price * (1 + take_profit_pct/100)"
                },
                "is_public": True,
                "tags": ["sma", "crossover", "trend-following", "beginner-friendly"]
            },
            {
                "name": "RSI Mean Reversion",
                "description": "A mean reversion strategy based on the Relative Strength Index (RSI). Buys when RSI is oversold (below 30) and sells when RSI is overbought (above 70). Best suited for sideways markets.",
                "short_description": "RSI-based mean reversion strategy for range-bound markets",
                "strategy_type": StrategyType.TECHNICAL,
                "risk_level": RiskLevel.MEDIUM,
                "min_capital": 1000.0,
                "recommended_capital": 3000.0,
                "max_drawdown": 12.0,
                "target_return": 20.0,
                "timeframe": "1h",
                "parameters": {
                    "rsi_period": 14,
                    "oversold_level": 30,
                    "overbought_level": 70,
                    "position_size_pct": 25
                },
                "indicators": {
                    "rsi": {"type": "RSI", "period": 14}
                },
                "entry_conditions": {
                    "long": "rsi < oversold_level",
                    "short": "rsi > overbought_level"
                },
                "exit_conditions": {
                    "long_exit": "rsi > 50",
                    "short_exit": "rsi < 50"
                },
                "is_public": True,
                "tags": ["rsi", "mean-reversion", "scalping", "intermediate"]
            },
            {
                "name": "Momentum Breakout",
                "description": "A momentum-based strategy that identifies breakouts from consolidation patterns. Uses volume confirmation and multiple timeframe analysis to reduce false signals. High reward potential but requires strict risk management.",
                "short_description": "High-momentum breakout strategy with volume confirmation",
                "strategy_type": StrategyType.MOMENTUM,
                "risk_level": RiskLevel.HIGH,
                "min_capital": 2000.0,
                "recommended_capital": 5000.0,
                "max_drawdown": 25.0,
                "target_return": 45.0,
                "timeframe": "15m",
                "parameters": {
                    "breakout_period": 20,
                    "volume_multiplier": 1.5,
                    "atr_multiplier": 2.0,
                    "max_position_size": 10
                },
                "indicators": {
                    "bollinger_bands": {"type": "BB", "period": 20, "std": 2},
                    "volume_ma": {"type": "SMA", "period": 20, "source": "volume"},
                    "atr": {"type": "ATR", "period": 14}
                },
                "entry_conditions": {
                    "long": "close > bb_upper AND volume > volume_ma * volume_multiplier",
                    "short": "close < bb_lower AND volume > volume_ma * volume_multiplier"
                },
                "exit_conditions": {
                    "stop_loss": "atr_based_stop",
                    "take_profit": "risk_reward_2_to_1"
                },
                "is_public": True,
                "tags": ["momentum", "breakout", "volume", "advanced"]
            },
            {
                "name": "Grid Trading Bot",
                "description": "An automated grid trading strategy that places buy and sell orders at predefined intervals around the current price. Profits from market volatility and is most effective in ranging markets.",
                "short_description": "Automated grid trading for volatile, sideways markets",
                "strategy_type": StrategyType.QUANTITATIVE,
                "risk_level": RiskLevel.LOW,
                "min_capital": 1500.0,
                "recommended_capital": 4000.0,
                "max_drawdown": 8.0,
                "target_return": 15.0,
                "timeframe": "5m",
                "parameters": {
                    "grid_spacing_pct": 1.0,
                    "num_grids": 10,
                    "order_size_pct": 10,
                    "rebalance_threshold": 20
                },
                "indicators": {
                    "price_range": {"type": "RANGE", "period": 100}
                },
                "entry_conditions": {
                    "grid_buy": "price <= grid_level - grid_spacing",
                    "grid_sell": "price >= grid_level + grid_spacing"
                },
                "exit_conditions": {
                    "profit_target": "opposite_grid_triggered",
                    "range_break": "price_outside_range"
                },
                "is_public": True,
                "tags": ["grid", "automated", "low-risk", "steady-income"]
            },
            {
                "name": "Arbitrage Scanner",
                "description": "Advanced arbitrage strategy that identifies price discrepancies across multiple exchanges. Requires API connections to multiple exchanges and fast execution. Suitable for experienced traders with substantial capital.",
                "short_description": "Cross-exchange arbitrage opportunities scanner",
                "strategy_type": StrategyType.ARBITRAGE,
                "risk_level": RiskLevel.LOW,
                "min_capital": 10000.0,
                "recommended_capital": 25000.0,
                "max_drawdown": 3.0,
                "target_return": 12.0,
                "timeframe": "1m",
                "parameters": {
                    "min_profit_bps": 50,
                    "max_execution_time": 30,
                    "exchanges": ["binance", "coinbase", "kraken"],
                    "min_volume_usd": 10000
                },
                "indicators": {
                    "price_feed": {"type": "REALTIME", "exchanges": "multiple"}
                },
                "entry_conditions": {
                    "arbitrage": "price_diff > min_profit_bps AND volume > min_volume"
                },
                "exit_conditions": {
                    "immediate": "fill_both_sides_simultaneously"
                },
                "is_public": False,  # Private strategy
                "tags": ["arbitrage", "cross-exchange", "low-risk", "expert"]
            },
            {
                "name": "DCA Dollar Cost Average",
                "description": "A systematic investment strategy that buys a fixed dollar amount of cryptocurrency at regular intervals, regardless of price. Reduces the impact of volatility through time diversification.",
                "short_description": "Systematic dollar-cost averaging for long-term accumulation",
                "strategy_type": StrategyType.FUNDAMENTAL,
                "risk_level": RiskLevel.LOW,
                "min_capital": 100.0,
                "recommended_capital": 1000.0,
                "max_drawdown": 50.0,  # Based on market drawdowns
                "target_return": 100.0,  # Long-term crypto returns
                "timeframe": "1d",
                "parameters": {
                    "investment_amount": 100,
                    "frequency_days": 7,
                    "take_profit_pct": 200,
                    "max_investment_periods": 52
                },
                "indicators": {
                    "price_ma": {"type": "SMA", "period": 200}
                },
                "entry_conditions": {
                    "buy": "scheduled_investment_date"
                },
                "exit_conditions": {
                    "partial_profit": "price > avg_cost * (1 + take_profit_pct/100)"
                },
                "is_public": True,
                "tags": ["dca", "long-term", "beginner", "hodl"]
            }
        ]
        
        created_strategies = []
        
        for strategy_data in strategies_data:
            strategy = Strategy(
                **strategy_data,
                created_by=user.id,
                status=StrategyStatus.ACTIVE
            )
            db.add(strategy)
            db.flush()  # Get the ID
            
            # Add sample performance data
            performance = StrategyPerformance(
                strategy_id=strategy.id,
                total_return=strategy_data["target_return"] * 0.8,  # 80% of target
                annual_return=strategy_data["target_return"],
                max_drawdown=strategy_data["max_drawdown"],
                sharpe_ratio=1.2 + (strategy_data["target_return"] / 100),
                sortino_ratio=1.5 + (strategy_data["target_return"] / 100),
                calmar_ratio=strategy_data["target_return"] / strategy_data["max_drawdown"],
                total_trades=150 + (strategy.id * 20),
                winning_trades=90 + (strategy.id * 12),
                losing_trades=60 + (strategy.id * 8),
                win_rate=60.0 + (strategy.id * 2),
                avg_win=3.5 + (strategy.id * 0.5),
                avg_loss=-2.1 - (strategy.id * 0.2),
                profit_factor=1.8 + (strategy.id * 0.1),
                volatility=15.0 + (strategy.id * 2),
                beta=0.8 + (strategy.id * 0.05),
                var_95=-5.0 - (strategy.id * 0.5),
                period_days=365,
                data_source="backtest"
            )
            db.add(performance)
            
            created_strategies.append(strategy)
            print(f"Created strategy: {strategy.name}")
        
        db.commit()
        print(f"\nSuccessfully created {len(created_strategies)} strategies!")
        
        # Print summary
        print("\nStrategy Summary:")
        for strategy in created_strategies:
            print(f"- {strategy.name} ({strategy.strategy_type.value}, {strategy.risk_level.value} risk)")
            
    except Exception as e:
        print(f"Error creating strategies: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_strategies()