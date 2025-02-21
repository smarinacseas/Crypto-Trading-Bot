# 🚀 Automated Trading Bot

## 📌 Overview

This project is an automated trading bot that supports **real-time market data feeds, order execution, and API-based interactions** with multiple exchanges. Designed for **high-frequency trading, strategy backtesting, and automated execution**, the bot can connect to **Binance, MEXC, and HyperLiquid**.

The bot is modular and scalable, allowing for future enhancements such as **AI-driven trading strategies, backtesting, and risk management**.

---

## 🔥 Features

### ✅ **Live Market Data Feeds**

- **Binance Exchange (CLI Output)**
  - Standard Trade Stream
  - Aggregated Trade Stream (High-Volume Trades)
  - Funding Rates Stream
  - Liquidations Stream

### ✅ **Exchange Connectivity**

- **MEXC via `CCXT` Library**
  - Easily interchangeable with any **CCXT-supported exchange**.
- **HyperLiquid via `HyperLiquid` SDK**
  - Supports **order execution, position management, and balance retrieval**.

### ✅ **Getting Started**

- Clone the repository

```
git clone https://github.com/yourusername/solana-trading-bot.git
```

- Install the dependencies

```
pip install -r requirements.txt
```

- Run the bot

```
uvicorn backend.app.main:app --reload
```

Navigate to http://127.0.0.1:8000/docs to interact with the endpoints

### ✅ **Planned Features**

- More robust exchange support (Bybit, KuCoin, Kraken, etc.)
- Trading signals & indicators (SMA, RSI, VWAP, VWMA, TA-Lib integration)
- Advanced risk management (Stop-loss, take-profit, trailing stops)
- Multiple trading strategies (Scalping, Mean Reversion, Momentum Trading)
- Backtesting & Strategy Optimization
- Automated execution based on AI-driven signals
- Mock trading & real-time PnL tracking
- Web-based front-end for easy control & monitoring
