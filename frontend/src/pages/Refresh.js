import React, { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import Section from '../components/Section';
import { listUniverses, refreshUniverse, refreshUniverseSync } from '../lib/api';

export default function Refresh() {
  const [universes, setUniverses] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [tickers, setTickers] = useState('');
  const [status, setStatus] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    listUniverses()
      .then((u) => {
        setUniverses(u);
        // Default-select "popular" if it exists.
        if (u.some((x) => x.name === 'popular')) setSelected(new Set(['popular']));
      })
      .catch(() => setUniverses([]));
  }, []);

  const parseTickers = () =>
    tickers.split(/[\s,]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);

  const toggle = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalSelected = useMemo(() => {
    const counts = universes
      .filter((u) => selected.has(u.name))
      .map((u) => u.count);
    return counts.reduce((a, b) => a + b, 0) + parseTickers().length;
  }, [universes, selected, tickers]);

  const buildBody = () => {
    const t = parseTickers();
    return {
      tickers: t.length ? t : null,
      universes: selected.size ? Array.from(selected) : null,
    };
  };

  const runAsync = async () => {
    setRunning(true);
    setStatus(null);
    try {
      const res = await refreshUniverse(buildBody());
      setStatus({ kind: 'queued', ...res });
    } catch (e) {
      setStatus({ kind: 'error', message: e?.response?.data?.detail || e?.message || 'Refresh failed' });
    } finally {
      setRunning(false);
    }
  };

  const runSync = async () => {
    setRunning(true);
    setStatus(null);
    try {
      const body = buildBody();
      if (!body.tickers && !body.universes) {
        throw new Error('Pick a universe or paste tickers first.');
      }
      // Sync only really makes sense for small lists; warn if it's huge.
      if (totalSelected > 50) {
        if (!window.confirm(`Sync refresh of ${totalSelected} tickers will take a while and may time out. Continue?`)) {
          setRunning(false);
          return;
        }
      }
      const res = await refreshUniverseSync(body);
      setStatus({ kind: 'done', ...res });
    } catch (e) {
      setStatus({ kind: 'error', message: e?.response?.data?.detail || e?.message || 'Refresh failed' });
    } finally {
      setRunning(false);
    }
  };

  const Total = (
    <span className="num text-xs text-neutral-300">
      {totalSelected} ticker{totalSelected === 1 ? '' : 's'} queued
    </span>
  );

  return (
    <div className="max-w-4xl space-y-4">
      <Section
        title="Universes"
        subtitle="Curated ticker lists in backend/app/data/. Pick one or more — they'll be combined and deduped."
        actions={Total}
      >
        {universes.length === 0 ? (
          <div className="text-sm text-neutral-400">No universe files found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {universes.map((u) => {
              const isSelected = selected.has(u.name);
              return (
                <button
                  key={u.name}
                  type="button"
                  onClick={() => toggle(u.name)}
                  className={`flex items-start gap-3 text-left rounded-md border px-3 py-2.5 transition-colors ${
                    isSelected
                      ? 'bg-primary-600/20 border-primary-600/40'
                      : 'bg-secondary-900 border-secondary-700 hover:border-secondary-600'
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex items-center justify-center h-4 w-4 rounded border ${
                      isSelected
                        ? 'bg-primary-500 border-primary-400 text-white'
                        : 'border-secondary-600'
                    }`}
                  >
                    {isSelected && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-100">{u.label}</span>
                      <span className="num text-[11px] text-neutral-500">{u.count}</span>
                    </div>
                    {u.description && (
                      <div className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        {u.description}
                      </div>
                    )}
                    <div className="num text-[10px] text-neutral-600 mt-0.5">{u.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Or specific tickers" subtitle="Combined with selected universes (deduped)">
        <textarea
          value={tickers}
          onChange={(e) => setTickers(e.target.value)}
          rows={3}
          placeholder="AAPL, MSFT, NVDA, GME    (space or comma separated)"
          className="ticker w-full px-3 py-2 bg-secondary-900 border border-secondary-700 rounded text-sm text-neutral-100 placeholder-neutral-500 focus:border-primary-500 focus:outline-none"
        />
      </Section>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={runAsync}
          disabled={running || totalSelected === 0}
          className="inline-flex items-center px-3 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white rounded text-xs"
        >
          <ArrowPathIcon className={`h-3.5 w-3.5 mr-1 ${running ? 'animate-spin' : ''}`} />
          Refresh in background
        </button>
        <button
          onClick={runSync}
          disabled={running || totalSelected === 0}
          className="inline-flex items-center px-3 py-1.5 bg-secondary-700 hover:bg-secondary-600 disabled:opacity-40 text-neutral-100 rounded text-xs"
        >
          Refresh & wait
        </button>
        <span className="num text-[11px] text-neutral-500">
          ~{Math.max(1, Math.round(totalSelected * 0.6))}s estimated · 2y of bars per ticker
        </span>
      </div>

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
{`# Daily refresh of the popular universe at 10pm on weekdays
0 22 * * 1-5  cd /path/to/repo && /path/to/venv/bin/python \\
  -m backend.app.scripts.refresh_universe -u popular`}
        </pre>
        <p className="text-[11px] text-neutral-500 mt-2">
          Combine universes with repeated <code className="num">-u</code> flags
          (e.g. <code className="num">-u popular -u high_short</code>).
        </p>
      </Section>
    </div>
  );
}
