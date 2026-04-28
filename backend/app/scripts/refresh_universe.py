"""CLI: refresh the screener universe.

Usage from the repo root:
    python -m backend.app.scripts.refresh_universe                    # uses DEFAULT_UNIVERSE_FILE
    python -m backend.app.scripts.refresh_universe AAPL MSFT GOOGL    # specific tickers
    python -m backend.app.scripts.refresh_universe --file my_list.txt

Hook this into cron / launchd / Task Scheduler for daily EOD refreshes:
    0 22 * * 1-5  cd /path/to/repo && /path/to/venv/bin/python -m backend.app.scripts.refresh_universe
"""
import argparse
import logging
import sys

from backend.app.core.config import settings
from backend.app.core.database import Base, SessionLocal, engine
from backend.app.models import stock  # noqa: F401  (register tables)
from backend.app.models import user  # noqa: F401
from backend.app.services import stock_data


def main() -> int:
    parser = argparse.ArgumentParser(description="Refresh stock screener universe")
    parser.add_argument("tickers", nargs="*", help="Specific tickers (overrides --file)")
    parser.add_argument("--file", default=settings.DEFAULT_UNIVERSE_FILE, help="Universe file path")
    args = parser.parse_args()

    logging.basicConfig(
        level=settings.LOG_LEVEL,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    log = logging.getLogger("refresh")

    Base.metadata.create_all(bind=engine)

    if args.tickers:
        tickers = [t.upper() for t in args.tickers]
    else:
        try:
            tickers = stock_data.load_universe_file(args.file)
        except FileNotFoundError:
            log.error("Universe file not found: %s", args.file)
            return 1

    if not tickers:
        log.error("No tickers to refresh.")
        return 1

    log.info("Refreshing %d tickers", len(tickers))
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
