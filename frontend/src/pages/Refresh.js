import React, { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Section from '../components/Section';
import { refreshUniverse, refreshUniverseSync } from '../lib/api';

export default function Refresh() {
  const [tickers, setTickers] = useState('');
  const [status, setStatus] = useState(null);
  const [running, setRunning] = useState(false);

  const parseTickers = () =>
    tickers.split(/[\s,]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);

  const runAsync = async () => {
    setRunning(true);
    setStatus(null);
    try {
      const list = parseTickers();
      const res = await refreshUniverse(list.length ? list : null);
      setStatus({ kind: 'queued', ...res });
    } catch (e) {
      setStatus({ kind: 'error', message: e?.message || 'Refresh failed' });
    } finally {
      setRunning(false);
    }
  };

  const runSync = async () => {
    setRunning(true);
    setStatus(null);
    try {
      const list = parseTickers();
      if (!list.length) throw new Error('Sync refresh requires explicit tickers (avoid timeouts).');
      const res = await refreshUniverseSync(list);
      setStatus({ kind: 'done', ...res });
    } catch (e) {
      setStatus({ kind: 'error', message: e?.message || 'Refresh failed' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <Section
        title="Refresh stock data"
        subtitle="Pulls fundamentals + 2y of daily bars from Yahoo Finance"
      >
        <p className="text-xs text-neutral-400 mb-3">
          Leave empty to refresh the default universe
          (<code className="text-neutral-300 num">backend/app/data/sp500.txt</code>).
        </p>

        <textarea
          value={tickers}
          onChange={(e) => setTickers(e.target.value)}
          rows={4}
          placeholder="AAPL, MSFT, NVDA, GME    (space or comma separated)"
          className="ticker w-full px-3 py-2 bg-secondary-900 border border-secondary-700 rounded text-sm text-neutral-100 placeholder-neutral-500 focus:border-primary-500 focus:outline-none"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={runAsync}
            disabled={running}
            className="inline-flex items-center px-3 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white rounded text-xs"
          >
            <ArrowPathIcon className={`h-3.5 w-3.5 mr-1 ${running ? 'animate-spin' : ''}`} />
            Refresh in background
          </button>
          <button
            onClick={runSync}
            disabled={running}
            className="inline-flex items-center px-3 py-1.5 bg-secondary-700 hover:bg-secondary-600 disabled:opacity-40 text-neutral-100 rounded text-xs"
          >
            Refresh & wait (small lists)
          </button>
        </div>
      </Section>

      {status?.kind === 'queued' && (
        <div className="bg-primary-900/40 border border-primary-700 text-primary-100 rounded-lg p-3 text-sm">
          Queued <span className="num">{status.requested}</span> ticker
          {status.requested === 1 ? '' : 's'} for background refresh.
        </div>
      )}
      {status?.kind === 'done' && (
        <div className="bg-emerald-950/40 border border-emerald-700 text-emerald-100 rounded-lg p-3 text-sm">
          Done: <span className="num">{status.succeeded}/{status.requested}</span> succeeded
          {status.failed_tickers?.length ? ` · failed: ${status.failed_tickers.join(', ')}` : ''}
        </div>
      )}
      {status?.kind === 'error' && (
        <div className="bg-rose-950/40 border border-rose-700 text-rose-100 rounded-lg p-3 text-sm">
          {status.message}
        </div>
      )}

      <Section title="Daily EOD schedule" subtitle="Run via cron / launchd / scheduled task">
        <pre className="text-[11px] num bg-secondary-900 rounded p-3 text-neutral-300 overflow-x-auto">
{`0 22 * * 1-5  cd /path/to/repo && /path/to/venv/bin/python \\
  -m backend.app.scripts.refresh_universe`}
        </pre>
      </Section>
    </div>
  );
}
