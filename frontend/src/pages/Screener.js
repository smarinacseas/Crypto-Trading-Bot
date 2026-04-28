import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsUpDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  createPreset,
  deletePreset,
  listPresets,
  listSectors,
  listStocks,
  updatePreset,
} from '../lib/api';
import {
  fmtCompact,
  fmtCurrency,
  fmtDateTime,
  fmtPct,
  fmtRatio,
  fmtVolume,
  pctClass,
} from '../lib/format';
import { useBasket } from '../contexts/BasketContext';
import FilterPanel from '../components/screener/FilterPanel';
import PresetBar from '../components/screener/PresetBar';
import StockRow from '../components/screener/StockRow';

const COLUMNS = [
  { key: 'ticker', label: 'Ticker', sortable: true, align: 'left' },
  { key: 'name', label: 'Name', sortable: false, align: 'left' },
  { key: 'sector', label: 'Sector', sortable: true, align: 'left' },
  { key: 'price', label: 'Price', sortable: true, align: 'right', fmt: fmtCurrency },
  { key: 'day_change_pct', label: '1D %', sortable: true, align: 'right', fmt: fmtPct, color: true },
  { key: 'market_cap', label: 'Mkt Cap', sortable: true, align: 'right', fmt: fmtCompact },
  { key: 'volume', label: 'Volume', sortable: true, align: 'right', fmt: fmtVolume },
  { key: 'short_percent_of_float', label: 'Short%', sortable: true, align: 'right', fmt: fmtPct },
  { key: 'short_ratio', label: 'Days to Cover', sortable: true, align: 'right', fmt: fmtRatio },
  { key: 'pe_ratio', label: 'P/E', sortable: true, align: 'right', fmt: fmtRatio },
];

const DEFAULT_FILTERS = {
  sector: '',
  min_market_cap: '',
  max_market_cap: '',
  min_short_pct: '',
  max_pe: '',
};
const DEFAULT_SORT = { sort_by: 'market_cap', sort_dir: 'desc' };

function SortIcon({ active, dir }) {
  if (!active) return <ArrowsUpDownIcon className="inline h-3 w-3 ml-1 text-neutral-600" />;
  return dir === 'asc'
    ? <ArrowUpIcon className="inline h-3 w-3 ml-1 text-primary-300" />
    : <ArrowDownIcon className="inline h-3 w-3 ml-1 text-primary-300" />;
}

const stableJSON = (x) => JSON.stringify(x, Object.keys(x).sort());

export default function Screener() {
  const [stocks, setStocks] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [presets, setPresets] = useState([]);
  const [activePresetId, setActivePresetId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [groupBySector, setGroupBySector] = useState(true);
  const [collapsedSectors, setCollapsedSectors] = useState(new Set());
  const [expandedRow, setExpandedRow] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [savedSnapshot, setSavedSnapshot] = useState({ filters: DEFAULT_FILTERS, sort: DEFAULT_SORT });

  const { bulkAdd } = useBasket();

  // Initial loads
  useEffect(() => { listSectors().then(setSectors).catch(() => setSectors([])); }, []);
  useEffect(() => { listPresets().then(setPresets).catch(() => setPresets([])); }, []);

  // Refetch stocks whenever filters or sort change.
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v != null),
    );
    Object.assign(params, sort, { limit: 500 });
    listStocks(params)
      .then(setStocks)
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [filters, sort]);

  // Compute "dirty" against the active preset's saved snapshot.
  const isDirty = useMemo(() => {
    if (activePresetId == null) {
      return stableJSON(filters) !== stableJSON(DEFAULT_FILTERS) || stableJSON(sort) !== stableJSON(DEFAULT_SORT);
    }
    return stableJSON({ filters, sort }) !== stableJSON(savedSnapshot);
  }, [filters, sort, activePresetId, savedSnapshot]);

  // ---- preset actions ---------------------------------------------------
  const loadPreset = (id) => {
    setExpandedRow(null);
    if (id == null) {
      setActivePresetId(null);
      setFilters(DEFAULT_FILTERS);
      setSort(DEFAULT_SORT);
      setSavedSnapshot({ filters: DEFAULT_FILTERS, sort: DEFAULT_SORT });
      return;
    }
    const p = presets.find((pp) => pp.id === id);
    if (!p) return;
    const f = { ...DEFAULT_FILTERS, ...(p.filters || {}) };
    const s = { ...DEFAULT_SORT, ...(p.sort || {}) };
    setActivePresetId(id);
    setFilters(f);
    setSort(s);
    setSavedSnapshot({ filters: f, sort: s });
  };

  const saveAs = async (name) => {
    const created = await createPreset({ name, filters, sort });
    setPresets((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setActivePresetId(created.id);
    setSavedSnapshot({ filters, sort });
  };

  const updateActive = async (id) => {
    const updated = await updatePreset(id, { filters, sort });
    setPresets((prev) => prev.map((p) => (p.id === id ? updated : p)));
    setSavedSnapshot({ filters, sort });
  };

  const deleteActive = async (id) => {
    await deletePreset(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
    if (activePresetId === id) loadPreset(null);
  };

  // ---- table interactions ----------------------------------------------
  const handleSort = (key) => {
    setSort((s) => ({
      sort_by: key,
      sort_dir: s.sort_by === key && s.sort_dir === 'desc' ? 'asc' : 'desc',
    }));
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return stocks;
    const q = search.trim().toUpperCase();
    return stocks.filter(
      (s) => s.ticker.includes(q) || (s.name || '').toUpperCase().includes(q),
    );
  }, [stocks, search]);

  const grouped = useMemo(() => {
    if (!groupBySector) return [{ sector: null, rows: filtered }];
    const map = new Map();
    for (const row of filtered) {
      const k = row.sector || 'Uncategorized';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(row);
    }
    return Array.from(map.entries()).map(([sector, rows]) => ({ sector, rows }));
  }, [filtered, groupBySector]);

  const toggleSector = (sector) => {
    setCollapsedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  };

  const addAllVisible = async () => {
    if (!filtered.length) return;
    await bulkAdd(filtered.map((r) => r.ticker));
  };

  return (
    <div className="space-y-3">
      <PresetBar
        presets={presets}
        activeId={activePresetId}
        onLoad={loadPreset}
        onSaveAs={saveAs}
        onUpdate={updateActive}
        onDelete={deleteActive}
        isDirty={isDirty}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-3">
        <FilterPanel
          filters={filters}
          sectors={sectors}
          onChange={setFilters}
          onClear={() => setFilters(DEFAULT_FILTERS)}
        />

        <div className="space-y-3 min-w-0">
          {/* Toolbar */}
          <div className="bg-secondary-800 border border-secondary-700 rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search ticker or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-secondary-900 border border-secondary-700 rounded text-sm text-neutral-100 placeholder-neutral-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-neutral-400 px-2">
              <input
                type="checkbox"
                checked={groupBySector}
                onChange={(e) => setGroupBySector(e.target.checked)}
                className="accent-primary-500"
              />
              Group by sector
            </label>
            <button
              onClick={addAllVisible}
              disabled={!filtered.length}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-primary-600/20 text-primary-200 border border-primary-600/30 rounded hover:bg-primary-600/30 disabled:opacity-40"
              title="Add every visible row to the basket"
            >
              <PlusIcon className="h-3.5 w-3.5" /> Add all to basket
            </button>
            <div className="num text-[11px] text-neutral-500 px-2">
              {filtered.length} / {stocks.length}
              {stocks[0]?.snapshot_as_of && (
                <span className="ml-2">· {fmtDateTime(stocks[0].snapshot_as_of)}</span>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-700 text-rose-200 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-secondary-800 border border-secondary-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-secondary-900 sticky top-14 z-10">
                  <tr>
                    <th className="w-6" />
                    <th className="w-8" />
                    {COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        onClick={() => c.sortable && handleSort(c.key)}
                        className={`px-3 py-2 text-${c.align} font-medium text-neutral-300 ${
                          c.sortable ? 'cursor-pointer hover:text-neutral-100 select-none' : ''
                        } whitespace-nowrap text-xs uppercase tracking-wider`}
                      >
                        {c.label}
                        {c.sortable && <SortIcon active={sort.sort_by === c.key} dir={sort.sort_dir} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={COLUMNS.length + 2} className="px-3 py-8 text-center text-neutral-400">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length + 2} className="px-3 py-8 text-center text-neutral-400">
                        No stocks match. Adjust filters or refresh data.
                      </td>
                    </tr>
                  )}
                  {!loading && grouped.map(({ sector, rows }) => {
                    const isCollapsed = sector != null && collapsedSectors.has(sector);
                    const sectorStats = (() => {
                      if (!rows.length) return null;
                      const change = rows.reduce((a, r) => a + (r.day_change_pct || 0), 0) / rows.length;
                      const cap = rows.reduce((a, r) => a + (r.market_cap || 0), 0);
                      return { change, cap };
                    })();
                    return (
                      <React.Fragment key={sector || '_'}>
                        {groupBySector && sector && (
                          <tr
                            onClick={() => toggleSector(sector)}
                            className="bg-secondary-900/70 hover:bg-secondary-900 cursor-pointer border-t border-secondary-700/50"
                          >
                            <td colSpan={COLUMNS.length + 2} className="px-3 py-2">
                              <div className="flex items-center gap-3">
                                {isCollapsed
                                  ? <ChevronRightIcon className="h-3.5 w-3.5 text-neutral-400" />
                                  : <ChevronDownIcon className="h-3.5 w-3.5 text-neutral-400" />}
                                <span className="text-xs uppercase tracking-wider text-primary-300 font-semibold">
                                  {sector}
                                </span>
                                <span className="num text-[11px] text-neutral-500">
                                  {rows.length} {rows.length === 1 ? 'stock' : 'stocks'}
                                </span>
                                {sectorStats && (
                                  <>
                                    <span className={`num text-[11px] ${pctClass(sectorStats.change)}`}>
                                      {fmtPct(sectorStats.change)} avg
                                    </span>
                                    <span className="num text-[11px] text-neutral-500">
                                      · {fmtCompact(sectorStats.cap)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                        {!isCollapsed && rows.map((row) => (
                          <StockRow
                            key={row.ticker}
                            row={row}
                            columns={COLUMNS}
                            expanded={expandedRow === row.ticker}
                            onToggleExpand={() => setExpandedRow(expandedRow === row.ticker ? null : row.ticker)}
                          />
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
