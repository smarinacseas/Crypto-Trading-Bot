# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal-use **stock screener + dashboard** with:
- **Backend** (FastAPI) — yfinance-backed ingest, SQLAlchemy models for stocks/snapshots/daily bars, REST API for screener filters, sector aggregates, and stock detail.
- **Frontend** (React + Tailwind + shadcn) — sector-grouped screener table, dashboard with movers + sector performance, per-stock detail page embedding the TradingView live chart.

The repo was originally a crypto trading bot; that codebase was wholesale removed in the rewrite. If you find references to ccxt, Binance, HyperLiquid, paper trading, etc., they are leftovers — flag and remove.

**Roadmap (not yet built, but the data model is shaped for it):**
- Phase 3: sentiment ingestion (Reddit / StockTwits / news) → fills `StockSnapshot.sentiment_score`.
- Phase 4: feature engineering + ML backtests against the daily bar history.

## Development Commands

### Backend
```bash
python3 -m venv quant
source quant/bin/activate
pip install -r backend/requirements.txt

# Run from the repo root — imports are absolute (backend.app.*).
uvicorn backend.app.main:app --reload   # http://127.0.0.1:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm start                                 # http://localhost:3000 (proxies /api -> :8000)
npm run build
npm test                                  # react-scripts (Jest); no tests written yet
```

### Populating data
The screener is empty until you run a refresh. Either:
```bash
# CLI (recommended — schedule via cron for daily EOD refresh)
python -m backend.app.scripts.refresh_universe                    # default universe
python -m backend.app.scripts.refresh_universe AAPL MSFT NVDA     # specific tickers
python -m backend.app.scripts.refresh_universe --file my_list.txt

# Or use the UI: navigate to /refresh in the dashboard.
```

The default universe lives in `backend/app/data/sp500.txt` (one ticker per line, `#` comments allowed).

There is no Python test suite or linter configured.

## High-Level Architecture

### Data flow
```
yfinance ─┐
          ├─► services/stock_data.py ──► stocks / stock_snapshots / stock_bars (SQLite)
                                                 │
                                                 ▼
                                  services/screener.py (latest-snapshot joins)
                                                 │
                                                 ▼
                                api/routes/{stocks,sectors,refresh}.py
                                                 │
                                                 ▼
                                       React frontend (axios via lib/api.js)
```

The screener never calls yfinance directly — routes only read the DB. Refresh is the only path that hits the network, kicked off via the CLI script or `POST /api/refresh`.

### Backend layout (`backend/app/`)
- `main.py` — FastAPI app, single `lifespan` that calls `Base.metadata.create_all` (SQLite-friendly; swap for alembic when you graduate to Postgres).
- `core/config.py` — pydantic-settings, reads `.env`. **All env vars listed in `.env.example`.**
- `core/database.py` — sync + async engines. The async URL is auto-derived: `sqlite:///` → `sqlite+aiosqlite:///`, `postgresql://` → `postgresql+psycopg://`. To switch DBs, change only `DATABASE_URL`.
- `core/auth.py` — **stub**. Returns a fixed local user when `AUTH_ENABLED=false`. To turn on real auth, flip the env var and replace the body of `get_current_user` (see comments in the file). All routes already `Depends(get_current_user)`, so no signatures need to change.
- `models/stock.py` — three core tables + a watchlist join table:
  - `Stock`: ticker, name, sector, industry, exchange (slow-changing).
  - `StockSnapshot`: per-refresh point-in-time row (price, volume, market_cap, short interest, valuation ratios, beta, sentiment_score). Unique on `(stock_id, as_of)`.
  - `StockBar`: daily OHLCV. Unique on `(stock_id, bar_date)`.
- `services/stock_data.py` — yfinance ingest. `_get`/`_to_float` defensively pull sparse yfinance fields. `refresh_ticker` upserts metadata + appends a snapshot + upserts 2y of daily bars. `upsert_universe` is the batch loop with rate-limit sleeps.
- `services/screener.py` — the join that powers the screener. `_latest_snapshot_subquery` produces per-stock `max(as_of)`; `list_stocks` aliases `StockSnapshot` and applies whitelisted filters/sorts. **The `_SORT_FIELDS` dict is the only source of truth for what the screener can sort by — extend there to expose new columns.**
- `api/routes/stocks.py` — `/api/stocks` (screener), `/api/stocks/{ticker}` (detail with latest snapshot), `/api/stocks/{ticker}/bars`.
- `api/routes/sectors.py` — sector aggregates (count, avg day change, total market cap).
- `api/routes/refresh.py` — `/api/refresh` (background task) and `/api/refresh/sync` (blocking; small lists only).
- `scripts/refresh_universe.py` — CLI entrypoint, suitable for cron.
- `alembic/` — migration infrastructure scaffolded but no revisions yet. Run `alembic -c backend/alembic.ini revision --autogenerate -m "initial"` when you migrate to Postgres.

### Frontend layout (`frontend/src/`)
- `App.js` — five top-level routes: `/` (Dashboard), `/screener`, `/sectors`, `/watchlist`, `/refresh`, plus `/stocks/:ticker` for detail. No auth gates.
- `lib/api.js` — axios client; baseURL is `/api` (proxied by CRA in dev to `:8000`). All backend calls go through here.
- `lib/format.js` — display formatters (`fmtCompact`, `fmtPct`, `pctClass` for green/red coloring, etc.). Used everywhere; extend here rather than inlining Intl calls.
- `components/Layout.js` — sidebar nav + top bar. Static `navigation` array drives the menu.
- `components/TradingViewWidget.js` — accepts `symbol` prop (e.g. `"NASDAQ:AAPL"` or just `"AAPL"`). Uses `useId` for unique container ids so multiple instances on a page don't collide.
- `components/ui/` — shadcn-style primitives (lowercase `.jsx`). Only what's actually imported is kept.
- `pages/`:
  - `Dashboard.js` — overview stats + top movers + sector table.
  - `Screener.js` — the centerpiece. Sector-groupable filterable table. Filter state lives in `useState`; changes refetch via `listStocks`.
  - `StockDetail.js` — TradingView live chart + 18-stat fundamentals grid + recharts daily close line.
  - `Sectors.js` — sector breakdown cards.
  - `Refresh.js` — UI for `POST /api/refresh` (async + sync variants).
  - `Watchlist.js` — placeholder until phase 3.

## Conventions and gotchas

- **Always run Python from the repo root.** Imports are absolute (`from backend.app...`); `cd backend && python ...` will fail.
- **Auth stub is the only auth.** Don't import `fastapi_users`/`supabase` — they were removed. To enable multi-user mode, see the inline comment in `core/auth.py`. The local user always has `id=1`, `email="local@localhost"`.
- **Sort/filter additions touch two places.** When adding a screener column, update `services/screener.py::_SORT_FIELDS` (backend) and `pages/Screener.js::COLUMNS` (frontend). Anything not whitelisted is silently ignored.
- **Snapshots are append-only by `as_of`.** `refresh_ticker` always inserts a new `StockSnapshot`; the screener reads the latest. Don't UPDATE existing snapshots — historical snapshots are how phase 4 ML backtests get point-in-time features.
- **DB switch is a config change.** Change `DATABASE_URL` in `.env` and the engine + async-engine layer adapt automatically (`sqlite+aiosqlite` ↔ `postgresql+psycopg`). Don't add SQLite-specific SQL.
- **yfinance is sparse and rate-limited.** Many fields come back `None`. Always guard with `_to_float`/`_get`. The `REFRESH_RATE_LIMIT_SECONDS` setting throttles the loop.
- **Snapshot uniqueness is `(stock_id, as_of)`** — running two refreshes within the same second on the same ticker will conflict. In practice not a problem; if it bites, add jitter.
- **Tables are auto-created on startup.** Fine for SQLite, but when moving to Postgres switch to alembic-managed migrations and remove the `Base.metadata.create_all` call in `main.py`.
- **TradingView symbols need an exchange prefix** (`NASDAQ:AAPL`, `NYSE:KO`). `StockDetail.js` defaults to `NASDAQ:` if yfinance's `exchange` field doesn't suggest NYSE.
