import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSectors, listStocks } from '../lib/api';
import { fmtCompact, fmtPct, pctClass } from '../lib/format';

export default function Sectors() {
  const [sectors, setSectors] = useState([]);
  const [stocksBySector, setStocksBySector] = useState({});

  useEffect(() => {
    Promise.all([listSectors(), listStocks({ limit: 500 })]).then(([secs, all]) => {
      setSectors(secs);
      const grouped = {};
      for (const s of all) {
        const k = s.sector || 'Uncategorized';
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(s);
      }
      setStocksBySector(grouped);
    });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {sectors.map((s) => {
        const rows = (stocksBySector[s.sector] || [])
          .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
          .slice(0, 6);
        return (
          <div key={s.sector} className="bg-secondary-800 border border-secondary-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-secondary-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-100">{s.sector}</h3>
                <div className="text-xs text-neutral-400">
                  {s.stock_count} stocks · {fmtCompact(s.total_market_cap)} total cap
                </div>
              </div>
              <div className={`text-lg font-semibold ${pctClass(s.avg_day_change_pct)}`}>
                {fmtPct(s.avg_day_change_pct)}
              </div>
            </div>
            <ul className="divide-y divide-secondary-700/50">
              {rows.map((row) => (
                <li key={row.ticker} className="px-4 py-2 flex items-center justify-between text-sm">
                  <Link to={`/stocks/${row.ticker}`} className="font-mono text-primary-300 hover:text-primary-200">
                    {row.ticker}
                  </Link>
                  <div className="text-neutral-400 text-xs flex-1 px-3 truncate">{row.name}</div>
                  <div className={`${pctClass(row.day_change_pct)} text-right w-20`}>
                    {fmtPct(row.day_change_pct)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {sectors.length === 0 && (
        <div className="col-span-full text-center text-neutral-400 py-8">
          No data yet. Refresh from the sidebar.
        </div>
      )}
    </div>
  );
}
