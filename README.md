# 🚀 Crypto Trading Bot

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.12-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.27.1-00d2d3.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18.2.0-61dafb.svg" alt="React">
  <img src="https://img.shields.io/badge/WebSocket-Enabled-green.svg" alt="WebSocket">
  <img src="https://img.shields.io/badge/Status-Active%20Development-yellow.svg" alt="Status">
</div>

## Overview

A full-stack cryptocurrency trading platform built with React and FastAPI. The project includes a modern web interface, real-time data processing, and comprehensive trading infrastructure with support for multiple exchanges.

## Tech Stack

**Frontend**
- React 18 with TailwindCSS
- Custom UI components with Radix primitives
- Chart.js for data visualization
- TradingView widgets

**Backend**
- FastAPI with automatic API documentation
- SQLAlchemy ORM with async support
- JWT authentication
- WebSocket for real-time communication

**Trading Infrastructure**
- HyperLiquid SDK integration
- CCXT library for multi-exchange support
- Real-time data streams from Binance
- Technical analysis with TA-Lib and pandas

## Current Features

### ✅ **Web Application**
- React frontend with trading interface
- FastAPI backend with REST API
- User authentication and registration
- Database models for strategies and backtests
- WebSocket infrastructure for real-time data

### ✅ **Trading Backend**
- Multi-exchange integration (HyperLiquid, MEXC, Binance)
- Real-time WebSocket data streams
- Technical indicators (SMA, support/resistance)
- Order execution engines
- Risk management tools

## 🚧 In Development

- **Frontend Integration**: Connecting real-time data to React components
- **Trading UI**: Order placement and portfolio management interface
- **Paper Trading**: Risk-free trading simulation
- **Strategy Backtesting**: Historical performance testing with visual results
- **Live Dashboard**: Real-time P&L and portfolio metrics

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/crypto-trading-bot.git
   cd crypto-trading-bot
   
   # Backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r backend/requirements.txt
   
   # Frontend
   cd frontend
   npm install
   cd ..
   ```

2. **Run the application**
   ```bash
   # Start backend (terminal 1)
   uvicorn backend.app.main:app --reload
   
   # Start frontend (terminal 2)
   cd frontend && npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - API docs: http://127.0.0.1:8000/docs

### Optional: Trading Features

For full trading capabilities, add API credentials to `.env`:
```bash
COINBASE_API_KEY=your_key
COINBASE_API_SECRET=your_secret
MEXC_API_KEY=your_key
MEXC_SECRET_KEY=your_secret
HYPERLIQUID_SECRET_KEY=your_private_key
```

Run trading services:
```bash
# Real-time data streams
python -m backend.app.scripts.binance_streaming_entry

# Technical indicators
python -m backend.app.indicators.indicators
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/jwt/login` - Login
- `GET /users/me` - User profile

### Trading
- `GET /api/strategies` - Manage trading strategies
- `POST /api/backtests` - Run backtests
- `GET /api/portfolio` - Portfolio data
- `POST /api/paper-trading` - Paper trading

Full documentation: http://127.0.0.1:8000/docs

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Auth & config
│   │   ├── models/       # Database models
│   │   ├── data_import/  # Exchange data
│   │   ├── execution/    # Trading engines
│   │   └── indicators/   # Technical analysis
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # App pages
│   │   └── utils/        # Utilities
│   └── package.json
```

## Development

```bash
# Backend development
uvicorn backend.app.main:app --reload

# Frontend development
cd frontend && npm start

# Run individual modules
python -m backend.app.indicators.indicators
python -m backend.app.scripts.binance_streaming_entry
```

## Roadmap

**Phase 1: Core Platform** ✅
- FastAPI backend with authentication
- React frontend
- Database integration
- WebSocket infrastructure

**Phase 2: Integration** 🚧
- Frontend-backend data integration
- Real-time trading interface
- Paper trading system
- Strategy backtesting UI

**Phase 3: Advanced Features** 🔄
- Machine learning integration
- Advanced order types
- Risk management systems
- Multi-timeframe analysis

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>⭐ Star this repository if you find it useful!</p>
</div>