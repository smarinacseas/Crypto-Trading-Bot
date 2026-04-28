import React, { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { refreshUniverse, refreshUniverseSync } from '../lib/api';

export default function Refresh() {
  const [tickers, setTickers] = useState('');
  const [status, setStatus] = useState(null);
  const [running, setRunning] = useState(false);

  const parseTickers = () =>
    tickers
      .split(/[\s,]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

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
    <div className="max-w-2xl space-y-4">
      <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-neutral-100 mb-2">Refresh stock data</h3>
        <p className="text-sm text-neutral-400 mb-4">
          Pulls latest fundamentals and 2 years of daily bars from Yahoo Finance.
          Leave the field blank to refresh the default universe
          (<code className="text-neutral-300">backend/app/data/sp500.txt</code>).
        </p>

        <textarea
          value={tickers}
          onChange={(e) => setTickers(e.target.value)}
          rows={4}
          placeholder="AAPL, MSFT, NVDA, GME (or blank for default universe)"
          className="w-full px-3 py-2 bg-secondary-900 border border-secondary-700 rounded-md text-sm text-neutral-100 placeholder-neutral-500 font-mono"
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={runAsync}
            disabled={running}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-md text-sm transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${running ? 'animate-spin' : ''}`} />
            Refresh in background
          </button>
          <button
            onClick={runSync}
            disabled={running}
            className="inline-flex items-center px-4 py-2 bg-secondary-700 hover:bg-secondary-600 disabled:opacity-50 text-neutral-100 rounded-md text-sm transition-colors"
          >
            Refresh & wait (small lists)
          </button>
        </div>
      </div>

      {status?.kind === 'queued' && (
        <div className="bg-primary-900/40 border border-primary-700 text-primary-100 rounded-lg p-4 text-sm">
          Queued {status.requested} ticker{status.requested === 1 ? '' : 's'} for background refresh.
          Check the screener in a minute or two.
        </div>
      )}
      {status?.kind === 'done' && (
        <div className="bg-emerald-950/40 border border-emerald-700 text-emerald-100 rounded-lg p-4 text-sm">
          Done: {status.succeeded}/{status.requested} succeeded
          {status.failed_tickers?.length ? ` · failed: ${status.failed_tickers.join(', ')}` : ''}
        </div>
      )}
      {status?.kind === 'error' && (
        <div className="bg-rose-950/40 border border-rose-700 text-rose-100 rounded-lg p-4 text-sm">
          {status.message}
        </div>
      )}

      <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-4 text-xs text-neutral-400">
        <strong className="text-neutral-300">Tip:</strong> for daily EOD refresh, schedule the CLI job:
        <pre className="mt-2 p-2 bg-secondary-900 rounded text-neutral-300 overflow-x-auto">
{`0 22 * * 1-5  cd /path/to/repo && /path/to/venv/bin/python \\
  -m backend.app.scripts.refresh_universe`}
        </pre>
      </div>
    </div>
  );
}
