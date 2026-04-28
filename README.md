# Stock Dashboard

A personal-use stock screener and dashboard. Pulls market data, fundamentals, and short interest from Yahoo Finance, stores point-in-time snapshots in SQLite, and surfaces them through a sleek React UI with live TradingView charts.

Built to be the foundation for a sentiment + ML feature-engineering and backtesting workflow (later phases).

## What's in here

**Backend** (FastAPI + SQLAlchemy)
- yfinance ingest of fundamentals, market metrics, short interest, and 2y daily bars
- Point-in-time snapshots → screener queries always read the most recent
- Sector aggregates, per-stock detail, daily bar series
- SQLite by default, Postgres-ready (single env var swap)
- Alembic scaffolded for migrations

**Frontend** (React + Tailwind + shadcn UI)
- Dashboard: top movers, highest-short, sector performance table
- Screener: filter by sector / market cap / P/E / short %, sort by any column, sector-grouped view
- Stock detail: live TradingView chart + 18-metric fundamentals grid + daily close history
- Refresh control panel for ingesting new data

**Auth is intentionally stubbed out** for personal/local use — turn it on later via a single env var (see `backend/app/core/auth.py`).

## Quick start

```bash
# Backend
python3 -m venv quant
source quant/bin/activate                 # Windows: quant\Scripts\activate
pip install -r backend/requirements.txt
cp .env.example .env

# Run from repo root (imports are absolute)
uvicorn backend.app.main:app --reload     # http://127.0.0.1:8000/docs
```

```bash
# Frontend (new terminal)
cd frontend
npm install
npm start                                 # http://localhost:3000
```

## Populating the screener

The DB starts empty. Refresh either via the UI (`/refresh`) or the CLI:

```bash
# Default universe (backend/app/data/sp500.txt)
python -m backend.app.scripts.refresh_universe

# Specific tickers
python -m backend.app.scripts.refresh_universe AAPL MSFT NVDA

# Custom file
python -m backend.app.scripts.refresh_universe --file my_watchlist.txt
```

For daily EOD refresh, schedule it:

```cron
0 22 * * 1-5  cd /path/to/repo && /path/to/venv/bin/python -m backend.app.scripts.refresh_universe
```

## Environment

All configuration lives in `.env` (see `.env.example`). The two you'll most likely touch:

- `DATABASE_URL` — defaults to SQLite. Set to a Postgres URL like `postgresql+psycopg://user:pass@host:5432/db` to migrate.
- `DEFAULT_UNIVERSE_FILE` — point at your own ticker list.

## Switching to Postgres

1. Set `DATABASE_URL=postgresql+psycopg://...` in `.env`.
2. Generate the initial migration: `alembic -c backend/alembic.ini revision --autogenerate -m "initial"`.
3. Apply: `alembic -c backend/alembic.ini upgrade head`.
4. Remove the `Base.metadata.create_all(...)` line from `backend/app/main.py` so alembic owns the schema.

The async-driver mapping is automatic.

## Roadmap

- [x] Phase 1: pivot from crypto to stocks; foundation models + ingest
- [x] Phase 2: screener UI + sector dashboard + stock detail with live chart
- [ ] Phase 3: sentiment ingestion (Reddit, StockTwits, news) feeding `sentiment_score`
- [ ] Phase 4: feature engineering + sklearn ML backtests with walk-forward eval, equity curves, feature importance

## Project layout

```
backend/
  app/
    api/routes/         # FastAPI routers (stocks, sectors, refresh)
    core/               # config, database, auth stub
    models/             # SQLAlchemy: Stock, StockSnapshot, StockBar, Watchlist
    schemas/            # Pydantic request/response models
    services/           # stock_data (yfinance ingest) + screener (DB queries)
    scripts/            # refresh_universe CLI
    data/sp500.txt      # default ticker universe
  alembic/              # migrations (scaffolded; no revisions yet)
  requirements.txt
frontend/
  src/
    pages/              # Dashboard, Screener, StockDetail, Sectors, Refresh
    components/         # Layout, TradingViewWidget, shadcn UI primitives
    lib/api.js          # axios client
```

See `CLAUDE.md` for the architecture deep-dive aimed at AI assistants working on this repo.
