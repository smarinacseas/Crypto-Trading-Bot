import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/Section';
import BasketButton from '../components/BasketButton';
import { listSectors, listStocks } from '../lib/api';
import { fmtCompact, fmtCurrency, fmtPct, pctClass } from '../lib/format';

export default function Sectors() {
  const [sectors, setSectors] = useState([]);
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    Promise.all([listSectors(), listStocks({ limit: 500 })]).then(([secs, all]) => {
      setSectors(secs);
      setStocks(all);
    });
  }, []);

  const stocksBySector = useMemo(() => {
    const grouped = {};
    for (const s of stocks) {
      const k = s.sector || 'Uncategorized';
      (grouped[k] ||= []).push(s);
    }
    return grouped;
  }, [stocks]);

  if (!sectors.length) {
    return (
      <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-8 text-center text-neutral-400">
        No data yet. Refresh from the sidebar.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      {sectors.map((s) => {
        const rows = (stocksBySector[s.sector] || [])
          .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
        return (
          <Section
            key={s.sector}
            title={s.sector}
            subtitle={`${s.stock_count} stocks · ${fmtCompact(s.total_market_cap)} cap`}
            actions={
              <span className={`num text-base font-semibold ${pctClass(s.avg_day_change_pct)}`}>
                {fmtPct(s.avg_day_change_pct)}
              </span>
            }
            collapsible
            defaultOpen
            dense
          >
            <ul className="divide-y divide-secondary-700/50">
              {rows.map((row) => (
                <li key={row.ticker} className="px-3 py-1.5 flex items-center gap-3 hover:bg-secondary-700/30">
                  <BasketButton ticker={row.ticker} size="xs" />
                  <Link
                    to={`/stocks/${row.ticker}`}
                    className="ticker font-semibold text-primary-300 hover:text-primary-200 w-20"
                  >
                    {row.ticker}
                  </Link>
                  <div className="flex-1 truncate text-xs text-neutral-400">{row.name}</div>
                  <div className="num text-xs text-neutral-300 w-20 text-right">{fmtCompact(row.market_cap)}</div>
                  <div className="num text-xs text-neutral-200 w-16 text-right">{fmtCurrency(row.price)}</div>
                  <div className={`num text-xs w-16 text-right ${pctClass(row.day_change_pct)}`}>
                    {fmtPct(row.day_change_pct)}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        );
      })}
    </div>
  );
}
