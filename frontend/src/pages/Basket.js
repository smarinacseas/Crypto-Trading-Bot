import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  BeakerIcon,
  ClipboardDocumentIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Section from '../components/Section';
import Stat from '../components/Stat';
import { useBasket } from '../contexts/BasketContext';
import {
  fmtCompact,
  fmtCurrency,
  fmtPct,
  fmtRatio,
  pctClass,
} from '../lib/format';

export default function Basket() {
  const { items, loading, refresh, clear, remove, bulkAdd } = useBasket();
  const [adding, setAdding] = useState('');

  const onPaste = async () => {
    const list = adding
      .split(/[\s,]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (list.length === 0) return;
    await bulkAdd(list);
    setAdding('');
  };

  const onCopy = () => {
    if (!items.length) return;
    navigator.clipboard.writeText(items.map((i) => i.ticker).join(', '));
  };

  const totalCap = items.reduce((s, i) => s + (i.market_cap || 0), 0);
  const avgChange = items.length
    ? items.reduce((s, i) => s + (i.day_change_pct || 0), 0) / items.length
    : 0;
  const sectorCounts = items.reduce((acc, i) => {
    const k = i.sector || 'Uncategorized';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="In basket" value={<span>{items.length}</span>} dense />
        <Stat label="Sectors" value={<span>{Object.keys(sectorCounts).length}</span>} dense />
        <Stat label="Total mkt cap" value={fmtCompact(totalCap)} dense />
        <Stat
          label="Avg 1D %"
          value={fmtPct(avgChange)}
          valueClass={pctClass(avgChange)}
          dense
        />
      </div>

      {/* Add bar */}
      <Section
        title="Working set"
        subtitle="Stocks queued for feature engineering and ML backtests"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="text-xs px-2.5 py-1.5 bg-secondary-700 hover:bg-secondary-600 text-neutral-200 rounded inline-flex items-center gap-1"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" /> Reload
            </button>
            <button
              onClick={onCopy}
              disabled={!items.length}
              className="text-xs px-2.5 py-1.5 bg-secondary-700 hover:bg-secondary-600 text-neutral-200 rounded inline-flex items-center gap-1 disabled:opacity-40"
            >
              <ClipboardDocumentIcon className="h-3.5 w-3.5" /> Copy tickers
            </button>
            <button
              onClick={() => items.length && window.confirm('Clear the basket?') && clear()}
              disabled={!items.length}
              className="text-xs px-2.5 py-1.5 text-rose-300 hover:bg-rose-600/15 rounded inline-flex items-center gap-1 disabled:opacity-40"
            >
              <TrashIcon className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            placeholder="Paste tickers: AAPL MSFT GME, NVDA …"
            onKeyDown={(e) => e.key === 'Enter' && onPaste()}
            className="ticker flex-1 min-w-[260px] px-3 py-1.5 bg-secondary-900 border border-secondary-700 rounded text-sm text-neutral-100 placeholder-neutral-500 focus:border-primary-500 focus:outline-none"
          />
          <button
            onClick={onPaste}
            disabled={!adding.trim()}
            className="text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white rounded inline-flex items-center gap-1"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Add
          </button>
          <Link
            to="/screener"
            className="text-xs px-3 py-1.5 bg-secondary-700 hover:bg-secondary-600 text-neutral-200 rounded"
          >
            Pick from screener →
          </Link>
        </div>
        <p className="text-[11px] text-neutral-500 mt-2">
          Tickers must already exist in the screener (refresh them first if not).
        </p>
      </Section>

      {/* The basket itself */}
      <div className="bg-secondary-800 border border-secondary-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary-900">
              <tr className="text-neutral-400 text-xs uppercase tracking-wider">
                <th className="px-3 py-2 text-left font-medium">Ticker</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Sector</th>
                <th className="px-3 py-2 text-right font-medium">Price</th>
                <th className="px-3 py-2 text-right font-medium">1D %</th>
                <th className="px-3 py-2 text-right font-medium">Mkt Cap</th>
                <th className="px-3 py-2 text-right font-medium">Short %</th>
                <th className="px-3 py-2 text-left font-medium">Added</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-neutral-400">Loading…</td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-neutral-400">
                    Empty. Add stocks from the screener (the <span className="num">+</span> button) or paste tickers above.
                  </td>
                </tr>
              )}
              {items.map((it) => (
                <tr key={it.ticker} className="border-t border-secondary-700/50 hover:bg-secondary-700/30">
                  <td className="px-3 py-1.5">
                    <Link to={`/stocks/${it.ticker}`} className="ticker font-semibold text-primary-300 hover:text-primary-200">
                      {it.ticker}
                    </Link>
                  </td>
                  <td className="px-3 py-1.5 text-neutral-300 max-w-[220px] truncate">{it.name || '—'}</td>
                  <td className="px-3 py-1.5 text-neutral-400 text-xs">{it.sector || '—'}</td>
                  <td className="px-3 py-1.5 text-right num text-neutral-200">{fmtCurrency(it.price)}</td>
                  <td className={`px-3 py-1.5 text-right num ${pctClass(it.day_change_pct)}`}>{fmtPct(it.day_change_pct)}</td>
                  <td className="px-3 py-1.5 text-right num text-neutral-200">{fmtCompact(it.market_cap)}</td>
                  <td className="px-3 py-1.5 text-right num text-neutral-200">{fmtPct(it.short_percent_of_float)}</td>
                  <td className="px-3 py-1.5 text-neutral-500 text-xs">
                    {it.added_at ? new Date(it.added_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <button
                      onClick={() => remove(it.ticker)}
                      className="text-neutral-500 hover:text-rose-300 transition-colors"
                      title="Remove from basket"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Future hook */}
      <Section
        title="Backtest"
        subtitle="Phase 4 — feature engineering + ML on the basket below"
        actions={
          <button
            disabled
            className="text-xs px-3 py-1.5 bg-secondary-700 text-neutral-500 rounded inline-flex items-center gap-1 cursor-not-allowed"
            title="Coming soon"
          >
            <BeakerIcon className="h-3.5 w-3.5" /> Configure backtest
          </button>
        }
      >
        <p className="text-sm text-neutral-400">
          The basket is the input set for the upcoming ML backtest workflow. You'll pick features
          (returns, technicals, fundamentals, sentiment), a model (logistic / GBM / RF), and a
          walk-forward train/test split. Results will land in this same place.
        </p>
      </Section>
    </div>
  );
}
