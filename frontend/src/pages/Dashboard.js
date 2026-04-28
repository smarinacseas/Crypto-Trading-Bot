import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, FireIcon } from '@heroicons/react/24/outline';
import Section from '../components/Section';
import Stat from '../components/Stat';
import BasketButton from '../components/BasketButton';
import { listSectors, listStocks } from '../lib/api';
import { fmtCompact, fmtCurrency, fmtPct, pctClass } from '../lib/format';

export default function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    listStocks({ limit: 500 }).then(setStocks).catch(() => setStocks([]));
    listSectors().then(setSectors).catch(() => setSectors([]));
  }, []);

  const sortBy = (field, dir = 'desc') =>
    [...stocks]
      .filter((s) => s[field] != null)
      .sort((a, b) => (dir === 'desc' ? b[field] - a[field] : a[field] - b[field]))
      .slice(0, 8);

  const topGainers = useMemo(() => sortBy('day_change_pct', 'desc'), [stocks]);
  const topLosers = useMemo(() => sortBy('day_change_pct', 'asc'), [stocks]);
  const highShort = useMemo(() => sortBy('short_percent_of_float', 'desc'), [stocks]);

  const totalCap = useMemo(() => stocks.reduce((s, x) => s + (x.market_cap || 0), 0), [stocks]);
  const avgChange = stocks.length
    ? stocks.reduce((s, x) => s + (x.day_change_pct || 0), 0) / stocks.length
    : 0;

  const empty = !stocks.length;

  return (
    <div className="space-y-4">
      {/* Top stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Stocks tracked" value={<span>{stocks.length}</span>} dense />
        <Stat label="Sectors" value={<span>{sectors.length}</span>} dense />
        <Stat label="Universe mkt cap" value={fmtCompact(totalCap)} dense />
        <Stat
          label="Avg 1D %"
          value={fmtPct(avgChange)}
          valueClass={pctClass(avgChange)}
          dense
        />
      </div>

      {empty && (
        <div className="bg-amber-950/30 border border-amber-700/50 text-amber-200 rounded-lg p-4 text-sm">
          No data yet. Head to <Link to="/refresh" className="underline">Refresh</Link> to ingest the default universe.
        </div>
      )}

      {/* Movers row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <MoverCard
          title="Top gainers"
          subtitle="By daily % change"
          icon={ArrowTrendingUpIcon}
          rows={topGainers}
          field="day_change_pct"
          fmt={fmtPct}
          colorRow
        />
        <MoverCard
          title="Top losers"
          subtitle="By daily % change"
          icon={ArrowTrendingDownIcon}
          rows={topLosers}
          field="day_change_pct"
          fmt={fmtPct}
          colorRow
        />
        <MoverCard
          title="Highest short %"
          subtitle="By short % of float"
          icon={FireIcon}
          rows={highShort}
          field="short_percent_of_float"
          fmt={fmtPct}
        />
      </div>

      {/* Sector table */}
      <Section title="Sector performance" subtitle="Latest snapshot, ordered by market cap" dense>
        <table className="min-w-full text-sm">
          <thead className="bg-secondary-900">
            <tr className="text-neutral-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-2 text-left font-medium">Sector</th>
              <th className="px-4 py-2 text-right font-medium">Stocks</th>
              <th className="px-4 py-2 text-right font-medium">Avg 1D %</th>
              <th className="px-4 py-2 text-right font-medium">Total mkt cap</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s) => (
              <tr key={s.sector} className="border-t border-secondary-700/50 hover:bg-secondary-700/30">
                <td className="px-4 py-2 text-neutral-100">{s.sector}</td>
                <td className="px-4 py-2 text-right num text-neutral-300">{s.stock_count}</td>
                <td className={`px-4 py-2 text-right num ${pctClass(s.avg_day_change_pct)}`}>
                  {fmtPct(s.avg_day_change_pct)}
                </td>
                <td className="px-4 py-2 text-right num text-neutral-300">{fmtCompact(s.total_market_cap)}</td>
              </tr>
            ))}
            {sectors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500 text-sm">—</td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function MoverCard({ title, subtitle, icon: Icon, rows, field, fmt, colorRow }) {
  return (
    <Section
      title={
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-neutral-400" />}
          {title}
        </span>
      }
      subtitle={subtitle}
      dense
    >
      <ul className="divide-y divide-secondary-700/50">
        {rows.map((s) => (
          <li key={s.ticker} className="px-3 py-1.5 flex items-center gap-3 hover:bg-secondary-700/30">
            <BasketButton ticker={s.ticker} size="xs" />
            <Link to={`/stocks/${s.ticker}`} className="ticker font-semibold text-primary-300 hover:text-primary-200 w-20">
              {s.ticker}
            </Link>
            <div className="flex-1 truncate text-xs text-neutral-400">{s.name}</div>
            <div className="text-right">
              <div className="num text-sm text-neutral-200">{fmtCurrency(s.price)}</div>
              <div className={`num text-xs ${colorRow ? pctClass(s[field]) : 'text-neutral-400'}`}>
                {fmt(s[field])}
              </div>
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="px-4 py-6 text-center text-neutral-500 text-sm">—</li>}
      </ul>
    </Section>
  );
}
