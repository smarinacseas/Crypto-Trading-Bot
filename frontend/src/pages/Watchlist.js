import React from 'react';

/**
 * Placeholder. Watchlist API + persistence is part of the next phase
 * (sentiment + ML); for now, use the screener + browser bookmarks.
 */
export default function Watchlist() {
  return (
    <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-8 text-center max-w-xl mx-auto">
      <h3 className="text-lg font-semibold text-neutral-100 mb-2">Watchlists coming soon</h3>
      <p className="text-sm text-neutral-400">
        Saved lists and per-ticker alerts land in the next phase, alongside sentiment
        ingestion (Reddit, StockTwits, news). Until then, use the screener filters and
        bookmark stock detail pages.
      </p>
    </div>
  );
}
