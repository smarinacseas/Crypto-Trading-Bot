import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, XCircleIcon } from '@heroicons/react/24/outline';

const NumericInput = ({ value, onChange, placeholder, step = 'any' }) => (
  <input
    type="number"
    step={step}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
    placeholder={placeholder}
    className="num w-full px-2.5 py-1.5 bg-secondary-900 border border-secondary-700 rounded text-xs text-neutral-100 placeholder-neutral-600 focus:border-primary-500 focus:outline-none"
  />
);

function Group({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const Chev = open ? ChevronDownIcon : ChevronRightIcon;
  return (
    <div className="border-b border-secondary-700 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-left hover:bg-secondary-700/30"
      >
        <Chev className="h-3.5 w-3.5 text-neutral-400" />
        <span className="section-label">{title}</span>
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

export default function FilterPanel({ filters, sectors, onChange, onClear }) {
  const set = (k, v) => onChange({ ...filters, [k]: v });

  return (
    <aside className="bg-secondary-800 border border-secondary-700 rounded-lg overflow-hidden h-fit sticky top-20">
      <div className="px-3 py-2.5 border-b border-secondary-700 flex items-center justify-between">
        <span className="section-label">Filters</span>
        <button
          onClick={onClear}
          className="text-[10px] text-neutral-400 hover:text-neutral-200 inline-flex items-center gap-1"
        >
          <XCircleIcon className="h-3 w-3" /> Clear
        </button>
      </div>

      <Group title="Sector">
        <select
          value={filters.sector || ''}
          onChange={(e) => set('sector', e.target.value)}
          className="w-full px-2.5 py-1.5 bg-secondary-900 border border-secondary-700 rounded text-xs text-neutral-100 focus:border-primary-500 focus:outline-none"
        >
          <option value="">All sectors</option>
          {sectors.map((s) => (
            <option key={s.sector} value={s.sector}>{s.sector}</option>
          ))}
        </select>
      </Group>

      <Group title="Market cap (USD)">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-neutral-500 mb-1">Min</div>
            <NumericInput value={filters.min_market_cap} onChange={(v) => set('min_market_cap', v)} placeholder="e.g. 1e9" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 mb-1">Max</div>
            <NumericInput value={filters.max_market_cap} onChange={(v) => set('max_market_cap', v)} placeholder="e.g. 5e11" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {[
            ['Mega', 2e11, null],
            ['Large', 1e10, 2e11],
            ['Mid', 2e9, 1e10],
            ['Small', 3e8, 2e9],
          ].map(([label, lo, hi]) => (
            <button
              key={label}
              onClick={() => onChange({ ...filters, min_market_cap: lo, max_market_cap: hi })}
              className="text-[10px] px-2 py-0.5 rounded bg-secondary-700 text-neutral-300 hover:bg-secondary-600"
            >
              {label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Valuation">
        <div>
          <div className="text-[10px] text-neutral-500 mb-1">Max P/E</div>
          <NumericInput value={filters.max_pe} onChange={(v) => set('max_pe', v)} placeholder="e.g. 30" />
        </div>
      </Group>

      <Group title="Short interest" defaultOpen={true}>
        <div>
          <div className="text-[10px] text-neutral-500 mb-1">Min short % of float (decimal)</div>
          <NumericInput
            step="0.01"
            value={filters.min_short_pct}
            onChange={(v) => set('min_short_pct', v)}
            placeholder="0.10 = 10%"
          />
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {[0.05, 0.1, 0.2].map((v) => (
            <button
              key={v}
              onClick={() => set('min_short_pct', v)}
              className="text-[10px] px-2 py-0.5 rounded bg-secondary-700 text-neutral-300 hover:bg-secondary-600"
            >
              ≥ {(v * 100).toFixed(0)}%
            </button>
          ))}
        </div>
      </Group>
    </aside>
  );
}
