# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an automated crypto trading bot that connects to multiple exchanges for market data collection and order execution. The project consists of:

- **Backend Python API** (FastAPI) - Main application server
- **Data Collection System** - Real-time streams from Binance (trades, funding rates, liquidations)
- **Order Execution** - CCXT-based execution for MEXC and HyperLiquid SDK integration
- **Technical Indicators** - SMA calculations with historical data from Coinbase
- **Frontend** (planned) - Web interface for monitoring and control

## Key Architecture Components

### Data Import System (`backend/app/data_import/`)
- **Binance Streams**: Real-time WebSocket connections for trades, funding rates, and liquidations
- **Coinbase Historical**: CCXT-based historical OHLCV data retrieval with CSV caching
- **Base Stream Classes**: Shared WebSocket handling and message parsing logic

### Execution System (`backend/app/execution/`)
- **CCXT Executor**: Generic exchange interface supporting multiple exchanges (currently MEXC)
- **HyperLiquid Executor**: Native SDK integration for HyperLiquid DEX
- Uses environment variables for API credentials: `{EXCHANGE}_API_KEY` and `{EXCHANGE}_SECRET_KEY`

### Technical Analysis (`backend/app/indicators/`)
- **SMA Calculator**: Fetches historical data and calculates Simple Moving Average with trading signals
- **Support/Resistance**: Calculates key levels from historical price data
- Modular design allows easy addition of new indicators

## Development Commands

### Starting the Application
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI server with hot reload
uvicorn backend.app.main:app --reload

# Access API documentation
# Navigate to http://127.0.0.1:8000/docs
```

### Running Individual Modules
```bash
# Run SMA indicator calculation
python -m backend.app.indicators.indicators

# Run Binance streaming (from scripts)
python -m backend.app.scripts.binance_streaming_entry

# Run historical data collection
python -m backend.app.data_import.coinbase.cb_historical
```

## Environment Setup

The project requires API credentials in environment variables:
- `COINBASE_API_KEY` and `COINBASE_API_SECRET` - For historical data
- `{EXCHANGE}_API_KEY` and `{EXCHANGE}_SECRET_KEY` - For trading (e.g., MEXC_API_KEY)

## Data Storage

- **CSV Files**: Historical data cached in `backend/app/data_import/*/output_files/`
- **Real-time Data**: Streamed to console and CSV files in `backend/data/`
- **Database**: Peewee ORM configured but not yet implemented

## Key Dependencies

- **FastAPI**: Web framework for API endpoints
- **CCXT**: Multi-exchange trading library
- **WebSockets**: Real-time data streaming
- **Pandas**: Data manipulation and analysis
- **HyperLiquid SDK**: Native DEX integration
- **Technical Analysis**: pandas_ta, ta, TA-Lib

## File Naming Conventions

- Stream outputs: `{exchange}_{data_type}.csv`
- Historical data: `{symbol}_{timeframe}_{weeks}w.csv` (e.g., `BTC_USD_6h_10w.csv`)
- API credentials: `{EXCHANGE_NAME}_API_KEY` format