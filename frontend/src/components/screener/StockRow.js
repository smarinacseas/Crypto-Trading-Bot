import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import BasketButton from '../BasketButton';
import {
  fmtCompact,
  fmtCurrency,
  fmtPct,
  fmtRatio,
  fmtVolume,
  pctClass,
} from '../../lib/format';

const Cell = ({ children, align = 'right', className = '' }) => (
  <td className={`px-3 py-1.5 text-${align} ${className} whitespace-nowrap`}>{children}</td>
);

const Field = ({ label, value, color }) => (
  <div className="flex flex-col gap-0.5">
    <span className="section-label">{label}</span>
    <span className={`num text-sm ${color || 'text-neutral-100'}`}>{value}</span>
  </div>
);

export default function StockRow({ row, expanded, onToggleExpand, columns }) {
  const Chev = expanded ? ChevronDownIcon : ChevronRightIcon;
  return (
    <>
      <tr
        onClick={onToggleExpand}
        className={`border-t border-secondary-700/50 cursor-pointer hover:bg-secondary-700/40 ${
          expanded ? 'bg-secondary-700/30' : ''
        }`}
      >
        <td className="pl-3 pr-1 py-1.5 w-6">
          <Chev className="h-3.5 w-3.5 text-neutral-500" />
        </td>
        <td className="px-1 py-1.5 w-8" onClick={(e) => e.stopPropagation()}>
          <BasketButton ticker={row.ticker} size="xs" />
        </td>
        {columns.map((c) => {
          const v = row[c.key];
          const display = c.fmt ? c.fmt(v) : (v ?? '—');
          if (c.key === 'ticker') {
            return (
              <Cell key={c.key} align="left">
                <Link
                  to={`/stocks/${row.ticker}`}
                  onClick={(e) => e.stopPropagation()}
                  className="ticker font-semibold text-primary-300 hover:text-primary-200"
                >
                  {row.ticker}
                </Link>
              </Cell>
            );
          }
          if (c.key === 'name') {
            return (
              <Cell key={c.key} align="left" className="text-neutral-300 max-w-[220px] truncate">
                {row.name || '—'}
              </Cell>
            );
          }
          if (c.key === 'sector') {
            return (
              <Cell key={c.key} align="left" className="text-neutral-400 text-xs">
                {row.sector || '—'}
              </Cell>
            );
          }
          const className = `num ${c.color ? pctClass(v) : 'text-neutral-200'}`;
          return <Cell key={c.key} align={c.align} className={className}>{display}</Cell>;
        })}
      </tr>
      {expanded && (
        <tr className="bg-secondary-900/60">
          <td colSpan={columns.length + 2} className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-3">
              <Field label="Industry" value={row.industry || '—'} />
              <Field label="Exchange" value={row.exchange || '—'} />
              <Field label="Country" value={row.country || '—'} />
              <Field label="Day change" value={fmtPct(row.day_change_pct)} color={pctClass(row.day_change_pct)} />
              <Field label="Volume" value={fmtVolume(row.volume)} />
              <Field label="Market cap" value={fmtCompact(row.market_cap)} />

              <Field label="Price" value={fmtCurrency(row.price)} />
              <Field label="P/E" value={fmtRatio(row.pe_ratio)} />
              <Field label="Short ratio (days)" value={fmtRatio(row.short_ratio)} />
              <Field label="Short % float" value={fmtPct(row.short_percent_of_float)} />
              <Field label="Sentiment" value={fmtRatio(row.sentiment_score)} />
              <Field label="Snapshot" value={row.snapshot_as_of ? new Date(row.snapshot_as_of).toLocaleString() : '—'} />
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                to={`/stocks/${row.ticker}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-3 py-1.5 bg-primary-600/20 text-primary-200 border border-primary-600/30 rounded hover:bg-primary-600/30"
              >
                Open detail →
              </Link>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
