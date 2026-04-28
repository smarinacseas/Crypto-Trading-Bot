import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownIcon, ArrowUpIcon, ArrowsUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { listStocks, listSectors } from '../lib/api';
import {
  fmtCompact,
  fmtCurrency,
  fmtDateTime,
  fmtPct,
  fmtRatio,
  fmtVolume,
  pctClass,
} from '../lib/format';

const COLUMNS = [
  { key: 'ticker', label: 'Ticker', sortable: true, align: 'left' },
  { key: 'name', label: 'Name', sortable: false, align: 'left' },
  { key: 'sector', label: 'Sector', sortable: true, align: 'left' },
  { key: 'price', label: 'Price', sortable: true, align: 'right', fmt: (v) => fmtCurrency(v) },
  { key: 'day_change_pct', label: '1d %', sortable: true, align: 'right', fmt: fmtPct, color: true },
  { key: 'market_cap', label: 'Market Cap', sortable: true, align: 'right', fmt: fmtCompact },
  { key: 'volume', label: 'Volume', sortable: true, align: 'right', fmt: fmtVolume },
  { key: 'short_percent_of_float', label: 'Short % Float', sortable: true, align: 'right', fmt: fmtPct },
  { key: 'short_ratio', label: 'Short Ratio', sortable: true, align: 'right', fmt: fmtRatio },
  { key: 'pe_ratio', label: 'P/E', sortable: true, align: 'right', fmt: fmtRatio },
  { key: 'sentiment_score', label: 'Sentiment', sortable: true, align: 'right', fmt: fmtRatio },
];

function SortIcon({ active, dir }) {
  if (!active) return <ArrowsUpDownIcon className="inline h-3 w-3 ml-1 text-neutral-500" />;
  return dir === 'asc'
    ? <ArrowUpIcon className="inline h-3 w-3 ml-1 text-primary-400" />
    : <ArrowDownIcon className="inline h-3 w-3 ml-1 text-primary-400" />;
}

export default function Screener() {
  const [stocks, setStocks] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [groupBySector, setGroupBySector] = useState(true);

  const [filters, setFilters] = useState({
    sector: '',
    min_market_cap: '',
    max_pe: '',
    min_short_pct: '',
    sort_by: 'market_cap',
    sort_dir: 'desc',
  });

  useEffect(() => {
    listSectors().then(setSectors).catch(() => setSectors([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v != null),
    );
    params.limit = 500;
    listStocks(params)
      .then(setStocks)
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleSort = (key) => {
    setFilters((f) => ({
      ...f,
      sort_by: key,
      sort_dir: f.sort_by === key && f.sort_dir === 'desc' ? 'asc' : 'desc',
    }));
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return stocks;
    const q = search.trim().toUpperCase();
    return stocks.filter(
      (s) =>
        s.ticker.includes(q) ||
        (s.name || '').toUpperCase().includes(q),
    );
  }, [stocks, search]);

  const grouped = useMemo(() => {
    if (!groupBySector) return [{ sector: null, rows: filtered }];
    const map = new Map();
    for (const row of filtered) {
      const key = row.sector || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }
    return Array.from(map.entries()).map(([sector, rows]) => ({ sector, rows }));
  }, [filtered, groupBySector]);

  return (
    <div className="space-y-4">
      <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search ticker or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-secondary-900 border border-secondary-700 rounded-md text-sm text-neutral-100 placeholder-neutral-500 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <select
            value={filters.sector}
            onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value }))}
            className="px-3 py-2 bg-secondary-900 border border-secondary-700 rounded-md text-sm text-neutral-100"
          >
            <option value="">All sectors</option>
            {sectors.map((s) => (
              <option key={s.sector} value={s.sector}>{s.sector}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min market cap"
            value={filters.min_market_cap}
            onChange={(e) => setFilters((f) => ({ ...f, min_market_cap: e.target.value }))}
            className="px-3 py-2 bg-secondary-900 border border-secondary-700 rounded-md text-sm text-neutral-100 placeholder-neutral-500"
          />

          <input
            type="number"
            placeholder="Max P/E"
            value={filters.max_pe}
            onChange={(e) => setFilters((f) => ({ ...f, max_pe: e.target.value }))}
            className="px-3 py-2 bg-secondary-900 border border-secondary-700 rounded-md text-sm text-neutral-100 placeholder-neutral-500"
          />

          <input
            type="number"
            step="0.01"
            placeholder="Min short % float"
            value={filters.min_short_pct}
            onChange={(e) => setFilters((f) => ({ ...f, min_short_pct: e.target.value }))}
            className="px-3 py-2 bg-secondary-900 border border-secondary-700 rounded-md text-sm text-neutral-100 placeholder-neutral-500"
          />
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={groupBySector}
              onChange={(e) => setGroupBySector(e.target.checked)}
              className="accent-primary-500"
            />
            Group by sector
          </label>
          <span>·</span>
          <span>{filtered.length} of {stocks.length} stocks</span>
          {stocks[0]?.snapshot_as_of && (
            <>
              <span>·</span>
              <span>Latest snapshot {fmtDateTime(stocks[0].snapshot_as_of)}</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-700 text-rose-200 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-secondary-800 border border-secondary-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary-900 sticky top-0">
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => c.sortable && handleSort(c.key)}
                    className={`px-3 py-2.5 text-${c.align} font-medium text-neutral-300 ${
                      c.sortable ? 'cursor-pointer hover:text-neutral-100' : ''
                    } whitespace-nowrap`}
                  >
                    {c.label}
                    {c.sortable && <SortIcon active={filters.sort_by === c.key} dir={filters.sort_dir} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-neutral-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-neutral-400">
                    No stocks. Run a refresh from the sidebar to populate the screener.
                  </td>
                </tr>
              )}
              {!loading && grouped.map(({ sector, rows }) => (
                <React.Fragment key={sector || '_'}>
                  {groupBySector && sector && (
                    <tr className="bg-secondary-900/60">
                      <td colSpan={COLUMNS.length} className="px-3 py-2 text-xs uppercase tracking-wider text-primary-300 font-semibold">
                        {sector} <span className="text-neutral-500">· {rows.length}</span>
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.ticker} className="border-t border-secondary-700/50 hover:bg-secondary-700/30">
                      {COLUMNS.map((c) => {
                        const v = row[c.key];
                        const display = c.fmt ? c.fmt(v) : (v ?? '—');
                        const className = c.color ? pctClass(v) : 'text-neutral-200';
                        if (c.key === 'ticker') {
                          return (
                            <td key={c.key} className="px-3 py-2">
                              <Link to={`/stocks/${row.ticker}`} className="text-primary-300 font-mono font-semibold hover:text-primary-200">
                                {row.ticker}
                              </Link>
                            </td>
                          );
                        }
                        return (
                          <td key={c.key} className={`px-3 py-2 text-${c.align} ${className} whitespace-nowrap`}>
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
