# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack cryptocurrency trading platform with a FastAPI backend and React frontend. The backend exposes REST + WebSocket APIs for authentication, strategy management, backtesting, paper trading, real-time exchange data, and live order execution against multiple exchanges.

## Development Commands

### Backend
```bash
# Create venv (the project's permission allowlist references one named "quant")
python3 -m venv quant
source quant/bin/activate

pip install -r backend/requirements.txt

# Run the API with hot reload (always run from the repo root because imports are
# absolute, e.g. `from backend.app.api.routes import ...`)
uvicorn backend.app.main:app --reload
# Docs: http://127.0.0.1:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm start          # dev server at http://localhost:3000 (proxies /api -> :8000)
npm run build      # production build
npm test           # react-scripts (Jest) test runner
```

There is currently no Python test suite or linter configured — `npm test` is the only test command.

### Running individual backend modules
All scripts use absolute `backend.app.*` imports and must be invoked as modules from the repo root:
```bash
python -m backend.app.scripts.binance_streaming_entry   # interactive Binance WS streams
python -m backend.app.indicators.indicators              # SMA + support/resistance demo
python -m backend.app.data_import.coinbase.cb_historical # historical OHLCV pull
python -m backend.app.scripts.seed_strategies            # populate sample strategies
```

## High-Level Architecture

### Backend layout (`backend/app/`)
- `main.py` — FastAPI entrypoint. Registers routers under these prefixes: `/api`, `/ws`, `/api/strategies`, `/api/backtests`, `/api/paper-trading`, `/api/auth` (Supabase), and `/auth/jwt` + `/auth` + `/users` (FastAPI-Users). Creates SQLAlchemy tables on startup (both sync and async engines).
- `api/routes.py` — legacy "trading actions" router mounted at `/api` (balance, order, open-orders, cancel-orders, trade-cycle, kill-switch). Note: this file lives alongside the `api/routes/` package; both are imported by `main.py`.
- `api/routes/` — newer per-feature routers: `auth.py`, `portfolio.py`, `strategies.py`, `backtests.py`, `paper_trading.py`, `websocket.py`.
- `core/` — cross-cutting infrastructure:
  - `database.py` — dual SQLAlchemy engines (sync `engine` + async `async_engine`). The async URL is derived by rewriting `sqlite://` to `sqlite+aiosqlite://`.
  - `auth.py` — FastAPI-Users JWT backend with `int` user IDs and a custom `UserManager.create` that handles `first_name`/`last_name`.
  - `supabase_auth.py` + `supabase_client.py` — alternative Supabase JWT verification path. `get_current_user_hybrid` accepts either auth method, which is what `/api/auth/me` uses.
  - `config.py` — Pydantic settings. **Gitignored** (see `.gitignore`); must be created locally and reads `.env`.
- `models/` — SQLAlchemy models: `user`, `strategy`, `backtest`, `paper_trading`. All inherit `Base` from `core.database`. They must be imported in `main.py` to register with the metadata before `create_all`.
- `schemas/` — Pydantic request/response models matching the routers.
- `data_import/binance/` — async WebSocket streams. `base_stream.BaseBinanceStream` is the abstract base (URI assembly, message parsing for trades / mark price / liquidations, US-Central time formatting). Concrete subclasses: `standard_stream`, `aggregated_stream`, `funding_rates_stream`, `liquidations_stream`.
- `data_import/coinbase/cb_historical.py` — CCXT-based historical OHLCV with CSV caching in `output_files/`.
- `execution/` — order routing:
  - `execute_ccxt.Executor` — generic CCXT wrapper. Reads `{EXCHANGE}_API_KEY` / `{EXCHANGE}_SECRET_KEY` from env and dynamically loads `ccxt.<exchange_id>`.
  - `execute_hyperliquid.HyperLiquidExecutor` — native HyperLiquid SDK integration.
  - The `/api/order` route's `get_executor()` dispatches between the two by exchange name.
- `indicators/indicators.py` — SMA + support/resistance, pulls historical data through `cb_historical`.
- `backtesting/engine.py` — `BacktestEngine` runs strategies over historical OHLCV (currently simulated/random walk in `load_market_data`; the real data source is a TODO). Indicators (`SMA`, `EMA`, `RSI`, `BB`, `ATR`) and entry/exit conditions are read from `Strategy.indicators` / `entry_conditions` / `exit_conditions` (JSON columns) and evaluated via `_evaluate_condition` (a guarded `eval` — be careful when extending). Caps concurrent trades at 3.
- `paper_trading/engine.py` — `PaperTradingEngine` consumes `services.market_data.MarketDataService` ticks and reuses the backtest engine's signal logic for live simulation.
- `services/market_data.py` — async market data service (CCXT + WebSockets) used by paper trading.
- `websocket_manager.py` — bridges Binance streams to browser WebSocket clients. `WebSocketManager` owns the set of FastAPI `WebSocket` connections and a registry of `asyncio.Task`s (one per stream). `BroadcastingStream` wraps a `BaseBinanceStream` subclass and **monkey-patches its `handle_connection`** to reformat parsed messages into frontend-friendly JSON (`type`, `symbol`, `side`, etc.) before broadcasting. The browser controls streams by sending `{action: "start_stream"|"stop_stream"|"get_active_streams", stream_type, symbol}` to `/ws/ws`.

### Frontend layout (`frontend/src/`)
- React 18 + react-router-dom v6, TailwindCSS, Radix UI primitives, Chart.js / Recharts, TradingView widgets, Supabase JS client, axios.
- `App.js` — all routes are gated on `useAuth().isAuthenticated`; unauthenticated users see `Landing`. `/dashboard` renders `ModernDashboard` (the classic one is at `/dashboard/classic`).
- `contexts/AuthContext.js` — the source of truth for auth state (uses Supabase).
- `pages/` — one file per top-level route (`Trading`, `DataStreams`, `Indicators`, `Strategies`, `Backtesting`, `PaperTrading`, `Account`, etc.).
- `components/ui/` — note the duplication: capitalized `.js` files (`Button.js`, `Card.js`, ...) and lowercase shadcn-style `.jsx` (`button.jsx`, `card.jsx`, ...). Prefer the `.jsx` shadcn components for new work; check existing usage in the page you're editing before picking.
- `package.json` sets `"proxy": "http://localhost:8000"`, so `fetch('/api/...')` from the dev server hits the backend without CORS.

### Authentication has two parallel paths
The codebase supports **both** local FastAPI-Users (JWT, SQLAlchemy `User` table) and Supabase-issued JWTs simultaneously:
- Local: `POST /auth/jwt/login`, `POST /auth/register`, dependency `current_active_user`.
- Supabase: `Authorization: Bearer <supabase_jwt>`, dependency `require_current_user_from_supabase`.
- Hybrid: `require_current_user_hybrid` (used by `/api/auth/me`) accepts either.

When adding a protected endpoint, decide which dependency to use — most newer code uses `current_active_user`, while user-profile/Supabase-aware endpoints use the hybrid.

## Conventions and gotchas

- **Always run Python from the repo root.** Imports are absolute (`backend.app.…`), so `cd backend && python app/main.py` will fail.
- **`backend/app/core/config.py` is gitignored** along with `backend/data/`, `backend/logs/`, `*.csv`, `*.db`. Don't commit any of these. Settings are loaded from `.env` (see `.env.example` for the full list: Supabase keys, `SECRET_KEY`, `ENCRYPTION_KEY`, `CORS_ORIGINS`, exchange API keys).
- **Exchange credentials follow `{EXCHANGE}_API_KEY` / `{EXCHANGE}_SECRET_KEY`** (uppercased exchange name). HyperLiquid is special: `HYPERLIQUID_SECRET_KEY` only.
- **CSV/data file naming:** stream outputs use `binance_{stream_type}_{symbol}.csv` (set in `WebSocketManager.start_binance_stream`); historical OHLCV uses `{symbol_with_underscores}_{timeframe}_{weeks}w.csv` (e.g., `BTC_USD_6h_10w.csv`).
- **Models must be imported in `main.py`** before `Base.metadata.create_all` for tables to be created — this is why `main.py` does dummy `import` statements for `strategy`, `backtest`, `paper_trading`.
- **`BacktestEngine._evaluate_condition` calls `eval()`** on user-supplied condition strings (with a denylist of `import`, `exec`, `__`, etc.). Treat any path that builds those strings from user input as a security boundary.
- **Two routes packages coexist:** `backend/app/api/routes.py` (file, legacy executor endpoints) and `backend/app/api/routes/` (package, newer routers). Don't delete one assuming it's a duplicate — both are imported in `main.py`.
- **`npm audit fix --force`** is documented in the README as known-broken; don't run it.
