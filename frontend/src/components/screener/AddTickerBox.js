import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowPathIcon, MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { refreshUniverseSync } from '../../lib/api';

/**
 * Smart search-and-add box for the screener toolbar.
 *
 * - Typing filters the suggestions (existing screener stocks).
 * - Click a suggestion → calls onPick (typically opens detail page or scrolls to row).
 * - If the typed value isn't an existing ticker, an "+ Add XYZ" affordance
 *   triggers a sync refresh and onAdded() once it lands in the DB.
 */
export default function AddTickerBox({ existing, onPick, onAdded }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const wrapperRef = useRef(null);

  // Close suggestions when clicking outside.
  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const q = value.trim().toUpperCase();
  const existingSet = useMemo(() => new Set(existing.map((s) => s.ticker)), [existing]);
  const suggestions = useMemo(() => {
    if (!q) return [];
    return existing
      .filter((s) =>
        s.ticker.startsWith(q) ||
        s.ticker.includes(q) ||
        (s.name || '').toUpperCase().includes(q),
      )
      .slice(0, 8);
  }, [existing, q]);

  const isNew = q.length > 0 && !existingSet.has(q);

  const reset = () => {
    setValue('');
    setError(null);
    setOpen(false);
  };

  const doAdd = async () => {
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await refreshUniverseSync({ tickers: [q] });
      if (res.failed > 0) {
        setError(`yfinance returned no data for ${q}.`);
      } else {
        if (onAdded) await onAdded(q);
        reset();
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Pick top suggestion if there is one and the typed value matches its ticker exactly,
      // otherwise add as new.
      if (suggestions.length && suggestions[0].ticker === q) {
        onPick && onPick(suggestions[0]);
        reset();
        return;
      }
      if (isNew) doAdd();
      else if (suggestions[0]) {
        onPick && onPick(suggestions[0]);
        reset();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-72">
      <div className="relative">
        <MagnifyingGlassIcon className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Add ticker — AAPL, search…"
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true); setError(null); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          className="ticker w-full pl-8 pr-8 py-1.5 bg-secondary-900 border border-secondary-700 rounded text-sm text-neutral-100 placeholder-neutral-500 focus:border-primary-500 focus:outline-none uppercase"
        />
        {value && !busy && (
          <button
            onClick={reset}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200"
            tabIndex={-1}
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {busy && (
          <ArrowPathIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary-300 animate-spin" />
        )}
      </div>

      {open && (suggestions.length > 0 || isNew || error) && (
        <div className="absolute z-30 mt-1 w-full bg-secondary-800 border border-secondary-700 rounded-md shadow-lg overflow-hidden">
          {suggestions.length > 0 && (
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((s) => (
                <li key={s.ticker}>
                  <button
                    type="button"
                    onClick={() => { onPick && onPick(s); reset(); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary-700 transition-colors"
                  >
                    <span className="ticker font-semibold text-primary-300 w-16">{s.ticker}</span>
                    <span className="text-xs text-neutral-300 truncate flex-1">{s.name || ''}</span>
                    <span className="text-[10px] text-neutral-500">{s.sector || ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isNew && (
            <button
              type="button"
              onClick={doAdd}
              disabled={busy}
              className="w-full flex items-center gap-2 px-3 py-2 text-left bg-primary-600/15 hover:bg-primary-600/25 border-t border-secondary-700 text-primary-200 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="text-xs">
                Add <span className="ticker font-semibold">{q}</span> to screener (sync refresh)
              </span>
            </button>
          )}

          {error && (
            <div className="px-3 py-2 text-xs text-rose-300 bg-rose-950/30 border-t border-secondary-700">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
