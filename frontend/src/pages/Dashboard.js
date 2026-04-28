import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSectors, listStocks } from '../lib/api';
import { fmtCompact, fmtPct, pctClass, fmtCurrency } from '../lib/format';

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-4">
      <div className="text-xs uppercase tracking-wider text-neutral-400">{label}</div>
      <div className="text-2xl font-semibold mt-1 text-neutral-100">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    listStocks({ limit: 500 }).then(setStocks).catch(() => setStocks([]));
    listSectors().then(setSectors).catch(() => setSectors([]));
  }, []);

  const topGainers = useMemo(
    () => [...stocks]
      .filter((s) => s.day_change_pct != null)
      .sort((a, b) => b.day_change_pct - a.day_change_pct)
      .slice(0, 8),
    [stocks],
  );

  const topLosers = useMemo(
    () => [...stocks]
      .filter((s) => s.day_change_pct != null)
      .sort((a, b) => a.day_change_pct - b.day_change_pct)
      .slice(0, 8),
    [stocks],
  );

  const highShort = useMemo(
    () => [...stocks]
      .filter((s) => s.short_percent_of_float != null)
      .sort((a, b) => b.short_percent_of_float - a.short_percent_of_float)
      .slice(0, 8),
    [stocks],
  );

  const totalCap = useMemo(
    () => stocks.reduce((sum, s) => sum + (s.market_cap || 0), 0),
    [stocks],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Stocks tracked" value={stocks.length} />
        <StatCard label="Sectors" value={sectors.length} />
        <StatCard label="Universe market cap" value={fmtCompact(totalCap)} />
        <StatCard
          label="Avg 1d change"
          value={fmtPct(
            stocks.length
              ? stocks.reduce((s, x) => s + (x.day_change_pct || 0), 0) / stocks.length
              : 0,
          )}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MoverCard title="Top gainers" rows={topGainers} field="day_change_pct" fmt={fmtPct} colorRow />
        <MoverCard title="Top losers" rows={topLosers} field="day_change_pct" fmt={fmtPct} colorRow />
        <MoverCard title="Highest short %" rows={highShort} field="short_percent_of_float" fmt={fmtPct} />
      </div>

      <div className="bg-secondary-800 border border-secondary-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-secondary-700">
          <h3 className="text-sm font-semibold text-neutral-200">Sector performance</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-secondary-900">
            <tr className="text-neutral-400">
              <th className="px-4 py-2 text-left font-medium">Sector</th>
              <th className="px-4 py-2 text-right font-medium">Stocks</th>
              <th className="px-4 py-2 text-right font-medium">Avg 1d %</th>
              <th className="px-4 py-2 text-right font-medium">Total market cap</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s) => (
              <tr key={s.sector} className="border-t border-secondary-700/50 hover:bg-secondary-700/30">
                <td className="px-4 py-2 text-neutral-200">{s.sector}</td>
                <td className="px-4 py-2 text-right text-neutral-300">{s.stock_count}</td>
                <td className={`px-4 py-2 text-right ${pctClass(s.avg_day_change_pct)}`}>
                  {fmtPct(s.avg_day_change_pct)}
                </td>
                <td className="px-4 py-2 text-right text-neutral-300">{fmtCompact(s.total_market_cap)}</td>
              </tr>
            ))}
            {sectors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                  No data yet. Run a refresh from the sidebar to populate the dashboard.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MoverCard({ title, rows, field, fmt, colorRow }) {
  return (
    <div className="bg-secondary-800 border border-secondary-700 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-secondary-700">
        <h3 className="text-sm font-semibold text-neutral-200">{title}</h3>
      </div>
      <ul className="divide-y divide-secondary-700/50">
        {rows.map((s) => (
          <li key={s.ticker} className="px-4 py-2 flex items-center justify-between text-sm">
            <Link to={`/stocks/${s.ticker}`} className="font-mono text-primary-300 hover:text-primary-200">
              {s.ticker}
            </Link>
            <div className="text-right">
              <div className="text-neutral-300">{fmtCurrency(s.price)}</div>
              <div className={colorRow ? pctClass(s[field]) : 'text-neutral-400'}>
                {fmt(s[field])}
              </div>
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="px-4 py-6 text-center text-neutral-500 text-sm">—</li>}
      </ul>
    </div>
  );
}
