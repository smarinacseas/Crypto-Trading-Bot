// Compact display helpers for the screener.

export const fmtCurrency = (v, decimals = 2) =>
  v == null || isNaN(v) ? '—' : `$${Number(v).toFixed(decimals)}`;

export const fmtCompact = (v) => {
  if (v == null || isNaN(v)) return '—';
  const n = Number(v);
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
};

export const fmtVolume = (v) => {
  if (v == null || isNaN(v)) return '—';
  const n = Number(v);
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n.toFixed(0)}`;
};

export const fmtPct = (v, decimals = 2) =>
  v == null || isNaN(v) ? '—' : `${Number(v).toFixed(decimals)}%`;

export const fmtRatio = (v, decimals = 2) =>
  v == null || isNaN(v) ? '—' : Number(v).toFixed(decimals);

export const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

export const pctClass = (v) => {
  if (v == null || isNaN(v)) return 'text-neutral-300';
  if (v > 0) return 'text-emerald-400';
  if (v < 0) return 'text-rose-400';
  return 'text-neutral-300';
};
