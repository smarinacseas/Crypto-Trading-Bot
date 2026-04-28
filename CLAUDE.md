# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal-use **stock screener + dashboard** with:
- **Backend** (FastAPI) — yfinance-backed ingest, SQLAlchemy models for stocks/snapshots/daily bars + saved screener presets + a working-set basket. REST API for filters, sector aggregates, stock detail, presets CRUD, basket CRUD.
- **Frontend** (React + Tailwind + shadcn) — terminal-aesthetic dashboard with sector-grouped collapsible screener, row expansion for extra metrics, saved screener presets you can swap between, a basket of tickers for upcoming ML backtests, and per-stock detail pages with a TradingView live chart and collapsible fundamentals sections.

The repo was originally a crypto trading bot; that codebase was wholesale removed. If you find references to ccxt, Binance, HyperLiquid, paper trading, etc., they're leftovers — remove them.

**Roadmap (not yet built, but the data model is shaped for it):**
- Phase 3: sentiment ingestion (Reddit / StockTwits / news) → fills `StockSnapshot.sentiment_score`.
- Phase 4: feature engineering + ML backtests using the basket as input + the daily bar history for training.

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
python -m backend.app.scripts.refresh_universe                          # default universe (popular)
python -m backend.app.scripts.refresh_universe -u nasdaq100             # one named universe
python -m backend.app.scripts.refresh_universe -u popular -u high_short # multiple, deduped
python -m backend.app.scripts.refresh_universe AAPL MSFT NVDA           # explicit tickers
python -m backend.app.scripts.refresh_universe --list                   # see available universes

# Or use the UI: /refresh has a universe picker, or use the inline
# "Add ticker" search box on the screener toolbar (sync refresh of one).
```

Universes are plain `.txt` files in `backend/app/data/` (one ticker per line, `#` comments allowed). Special header comments are picked up as metadata: `# label: …` and `# description: …`. Adding a new universe = drop a new file in that dir; it'll be discovered automatically by `services/universes.py` and surfaced via `GET /api/universes`. Built-in universes: `popular`, `mega_cap`, `nasdaq100`, `high_short`, `dividend_aristocrats`.

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
- `models/stock.py` — three core tables:
  - `Stock`: ticker, name, sector, industry, exchange (slow-changing).
  - `StockSnapshot`: per-refresh point-in-time row (price, volume, market_cap, short interest, valuation ratios, beta, sentiment_score). Unique on `(stock_id, as_of)`.
  - `StockBar`: daily OHLCV. Unique on `(stock_id, bar_date)`.
- `models/preferences.py` — user prefs:
  - `ScreenerPreset`: named bag of `filters` + `sort` (both stored as JSON so adding a filter doesn't need a migration). Unique on `(user_id, name)`.
  - `BasketItem`: one ticker in the user's working set. Unique on `(user_id, stock_id)` so adds are idempotent.
- `services/stock_data.py` — yfinance ingest. `_get`/`_to_float` defensively pull sparse yfinance fields. `refresh_ticker` upserts metadata + appends a snapshot + upserts 2y of daily bars. `upsert_universe` is the batch loop with rate-limit sleeps.
- `services/screener.py` — the join that powers the screener. `_latest_snapshot_subquery` produces per-stock `max(as_of)`; `list_stocks` aliases `StockSnapshot` and applies whitelisted filters/sorts. **The `_SORT_FIELDS` dict is the only source of truth for what the screener can sort by — extend there to expose new columns.**
- `services/universes.py` — discovers `*.txt` files in `backend/app/data/` and parses `# label:` / `# description:` headers. `resolve_tickers(universes, tickers)` combines + dedupes inputs.
- `api/routes/stocks.py` — `/api/stocks` (screener), `/api/stocks/{ticker}` (detail with latest snapshot), `/api/stocks/{ticker}/bars`.
- `api/routes/sectors.py` — sector aggregates (count, avg day change, total market cap).
- `api/routes/universes.py` — `GET /api/universes` lists discovered universes with counts/labels.
- `api/routes/refresh.py` — `POST /api/refresh` accepts `{tickers, universes}` (either or both); `/api/refresh/sync` is the blocking variant used by the inline "Add ticker" UX.
- `api/routes/presets.py` — `/api/screener-presets` CRUD. Names are unique per user (409 on duplicate).
- `api/routes/basket.py` — `/api/basket` list / add (idempotent) / bulk add / remove / clear.
- `scripts/refresh_universe.py` — CLI entrypoint, suitable for cron.
- `alembic/` — migration infrastructure scaffolded but no revisions yet. Run `alembic -c backend/alembic.ini revision --autogenerate -m "initial"` when you migrate to Postgres.

### Frontend layout (`frontend/src/`)
- `App.js` — five top-level routes: `/` (Dashboard), `/screener`, `/sectors`, `/basket`, `/refresh`, plus `/stocks/:ticker` for detail. No auth gates. Wraps everything in `<BasketProvider>`.
- `lib/api.js` — axios client; baseURL is `/api` (proxied by CRA in dev to `:8000`). All backend calls go through here. Functions are named the same as endpoints (`listStocks`, `listPresets`, `addToBasket`…).
- `lib/format.js` — display formatters (`fmtCompact`, `fmtPct`, `pctClass` for green/red coloring, etc.). Used everywhere; extend here rather than inlining Intl calls.
- `contexts/BasketContext.js` — single source of truth for basket state. Pages call `useBasket()` to get `{items, tickers, add, remove, bulkAdd, clear, refresh}`; the nav badge updates in real-time because all mutations flow through here.
- `components/Section.js`, `components/Stat.js` — shared layout primitives. Use `Section` (with optional `collapsible`/`actions`) for any titled card and `Stat` for a label+value tile. Don't roll your own card divs.
- `components/BasketButton.js` — toggle-button used in screener rows, dashboard movers, sectors, and the stock detail header. Reads/writes through `useBasket`.
- `components/screener/` — `FilterPanel` (left rail with collapsible filter groups), `PresetBar` (saved-screener dropdown + save/update/delete), `StockRow` (one row + its inline-expansion details).
- `components/TradingViewWidget.js` — accepts `symbol` prop. Uses `useId` for unique container ids.
- `components/ui/` — shadcn-style primitives (lowercase `.jsx`). Only what's actually imported is kept.
- `pages/`:
  - `Dashboard.js` — overview stats, top gainers/losers/short cards (with basket buttons), sector table.
  - `Screener.js` — centerpiece. Two-column layout: filter rail (left) + preset bar + table (right). Sector groups are collapsible, individual rows expand inline to show extra metrics. Toolbar has both a table-filter search and an `<AddTickerBox>` (autocompletes from the loaded screener; if you type a ticker it doesn't have, an "+ Add" affordance does a sync refresh on it). State: `filters`, `sort`, `activePresetId`, `savedSnapshot` — `isDirty` is computed by stable-stringifying current vs. saved.
  - `Basket.js` — the working set. Summary stats, paste-tickers add bar, table with remove buttons, placeholder for the phase-4 backtest builder.
  - `StockDetail.js` — TradingView chart + collapsible Valuation / Short interest / Growth / Volume sections + recharts close history.
  - `Sectors.js` — collapsible per-sector cards.
  - `Refresh.js` — universe picker (multi-select with counts) + free-text ticker box. Calls `POST /api/refresh` (async or sync) with `{tickers, universes}`.

## Conventions and gotchas

- **Always run Python from the repo root.** Imports are absolute (`from backend.app...`); `cd backend && python ...` will fail.
- **Auth stub is the only auth.** Don't import `fastapi_users`/`supabase` — they were removed. To enable multi-user mode, see the inline comment in `core/auth.py`. The local user always has `id=1`, `email="local@localhost"`.
- **Sort/filter additions touch two places.** When adding a screener column, update `services/screener.py::_SORT_FIELDS` (backend) and `pages/Screener.js::COLUMNS` (frontend). Anything not whitelisted is silently ignored. Adding a *filter* also requires `_SORT_FIELDS`-style whitelisting in `screener.list_stocks` and a control in `components/screener/FilterPanel.js`.
- **Saved screener filter shape is loose** — `ScreenerPreset.filters` and `.sort` are JSON. The frontend reconciles against `DEFAULT_FILTERS`/`DEFAULT_SORT`, so dropping a filter from the schema won't break old presets, but renaming one will silently lose the value.
- **Numerics use `.num`/`.ticker` CSS classes** for the JetBrains Mono + tabular-nums look. New tables/cards should use them on numeric/ticker cells; body text stays in Inter. The classes are defined in `index.css`.
- **`Section` and `Stat` are the layout primitives.** Don't recreate card chrome inline; if you need a new variant, extend `Section` (e.g. add a `tone` prop) rather than forking its markup across pages.
- **Snapshots are append-only by `as_of`.** `refresh_ticker` always inserts a new `StockSnapshot`; the screener reads the latest. Don't UPDATE existing snapshots — historical snapshots are how phase 4 ML backtests get point-in-time features.
- **DB switch is a config change.** Change `DATABASE_URL` in `.env` and the engine + async-engine layer adapt automatically (`sqlite+aiosqlite` ↔ `postgresql+psycopg`). Don't add SQLite-specific SQL.
- **yfinance is sparse and rate-limited.** Many fields come back `None`. Always guard with `_to_float`/`_get`. The `REFRESH_RATE_LIMIT_SECONDS` setting throttles the loop.
- **Snapshot uniqueness is `(stock_id, as_of)`** — running two refreshes within the same second on the same ticker will conflict. In practice not a problem; if it bites, add jitter.
- **Tables are auto-created on startup.** Fine for SQLite, but when moving to Postgres switch to alembic-managed migrations and remove the `Base.metadata.create_all` call in `main.py`.
- **TradingView symbols need an exchange prefix** (`NASDAQ:AAPL`, `NYSE:KO`). `StockDetail.js` defaults to `NASDAQ:` if yfinance's `exchange` field doesn't suggest NYSE.
