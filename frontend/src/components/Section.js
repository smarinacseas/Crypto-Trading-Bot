import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * Section card with consistent header/spacing. When `collapsible` is true,
 * the body folds open/closed.
 */
export default function Section({
  title,
  subtitle,
  actions,
  children,
  collapsible = false,
  defaultOpen = true,
  dense = false,
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;

  return (
    <section
      className={`bg-secondary-800 border border-secondary-700 rounded-lg overflow-hidden ${className}`}
    >
      <header
        className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-secondary-700 ${
          collapsible ? 'cursor-pointer hover:bg-secondary-700/40' : ''
        }`}
        onClick={() => collapsible && setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {collapsible && <Chevron className="h-4 w-4 text-neutral-400 shrink-0" />}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-neutral-100 truncate">{title}</div>
            {subtitle && <div className="text-xs text-neutral-400 truncate">{subtitle}</div>}
          </div>
        </div>
        {actions && <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">{actions}</div>}
      </header>
      {(!collapsible || open) && (
        <div className={dense ? '' : 'p-4'}>{children}</div>
      )}
    </section>
  );
}
