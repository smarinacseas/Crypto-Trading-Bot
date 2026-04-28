import React from 'react';

/** Compact stat block: small label + monospace value. */
export default function Stat({ label, value, valueClass = '', sub, dense = false }) {
  return (
    <div className={`bg-secondary-800 border border-secondary-700 rounded-lg ${dense ? 'p-3' : 'p-4'}`}>
      <div className="section-label">{label}</div>
      <div className={`num text-lg font-semibold mt-1 text-neutral-100 ${valueClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-neutral-500 mt-0.5">{sub}</div>}
    </div>
  );
}
