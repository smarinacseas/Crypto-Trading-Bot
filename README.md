# 🚀 Automated Trading Bot

## 📌 Overview

This project is an automated trading bot that supports **real-time market data feeds, order execution, and API-based interactions** with multiple exchanges. Designed for **emotionless trading, strategy backtesting, risk management, and automated execution**, the bot can connect to **Binance (data streams) and MEXC & HyperLiquid (order execution)**.

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

- Create a virtual environment

```
conda create -n <env_name>
```

- Activate the environment

```
conda [--no-plugins] activate <env_name>
```

- Install the dependencies

```
pip install -r requirements.txt
```

- Run the backend API

```
uvicorn backend.app.main:app --reload
```

Navigate to http://127.0.0.1:8000/docs to interact with the API endpoints

- Run the frontend (in a separate terminal)

```
cd frontend
npm install
npm start
```

Navigate to http://localhost:3000 to access the trading dashboard

### ⏳ **Planned Features**

- More robust exchange support (Bybit, KuCoin, Kraken, etc.)
- Trading signals & indicators (SMA, RSI, VWAP, VWMA, TA-Lib integration)
- Advanced risk management (Stop-loss, take-profit, trailing stops)
- Multiple trading strategies (Scalping, Mean Reversion, Momentum Trading)
- Backtesting & Strategy Optimization
- Automated execution based on AI-driven signals
- Mock trading & real-time PnL tracking
- ✅ **Web-based Trading Dashboard**
  - Real-time price monitoring and live data streams
  - Manual trading interface with order placement
  - Automated strategy management and control
  - Technical indicator visualization and configuration
  - Position management and P&L tracking
