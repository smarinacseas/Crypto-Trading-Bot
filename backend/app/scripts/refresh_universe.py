"""CLI: refresh stock data from one or more universes / explicit tickers.

Usage from the repo root:

    # Default universe (popular)
    python -m backend.app.scripts.refresh_universe

    # One named universe
    python -m backend.app.scripts.refresh_universe --universe nasdaq100

    # Multiple universes (combined + deduped)
    python -m backend.app.scripts.refresh_universe -u popular -u high_short

    # Explicit tickers (overrides --universe)
    python -m backend.app.scripts.refresh_universe AAPL MSFT GOOGL

    # Universes + explicit tickers
    python -m backend.app.scripts.refresh_universe -u popular AAPL MSFT

Hook into cron for daily EOD refresh:
    0 22 * * 1-5  cd /path/to/repo && /path/to/venv/bin/python \\
                    -m backend.app.scripts.refresh_universe -u popular
"""
import argparse
import logging
import sys
from pathlib import Path

from backend.app.core.config import settings
from backend.app.core.database import Base, SessionLocal, engine
from backend.app.models import preferences  # noqa: F401  (register tables)
from backend.app.models import stock  # noqa: F401
from backend.app.models import user  # noqa: F401
from backend.app.services import stock_data, universes


def main() -> int:
    parser = argparse.ArgumentParser(description="Refresh stock data")
    parser.add_argument("tickers", nargs="*", help="Explicit tickers (combined with --universe)")
    parser.add_argument(
        "--universe", "-u",
        action="append",
        help="Universe name (filename stem in backend/app/data). Repeatable.",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available universes and exit",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=settings.LOG_LEVEL,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    log = logging.getLogger("refresh")

    if args.list:
        for u in universes.list_universes():
            print(f"  {u.name:24s} {u.count:4d}  {u.label}")
            if u.description:
                print(f"  {'':24s}      {u.description}")
        return 0

    Base.metadata.create_all(bind=engine)

    universe_names = args.universe or []
    explicit_tickers = [t.upper() for t in args.tickers]

    if not universe_names and not explicit_tickers:
        # Fall back to whatever DEFAULT_UNIVERSE_FILE points to.
        default_name = Path(settings.DEFAULT_UNIVERSE_FILE).stem
        universe_names = [default_name]

    tickers = universes.resolve_tickers(universe_names, explicit_tickers)
    if not tickers:
        log.error("No tickers to refresh.")
        return 1

    log.info(
        "Refreshing %d tickers (universes: %s, explicit: %d)",
        len(tickers),
        ", ".join(universe_names) or "—",
        len(explicit_tickers),
    )

    db = SessionLocal()
    try:
        summary = stock_data.upsert_universe(db, tickers)
    finally:
        db.close()

    log.info(
        "Done: %d/%d succeeded, %d failed",
        summary.succeeded,
        summary.requested,
        summary.failed,
    )
    if summary.failed_tickers:
        log.warning("Failed tickers: %s", ", ".join(summary.failed_tickers))
    return 0 if summary.failed == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
