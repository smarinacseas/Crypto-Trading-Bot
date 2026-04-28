import React, { useState } from 'react';
import { BookmarkIcon, BookmarkSquareIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

/**
 * Top toolbar of saved screeners — load / save-as / overwrite / delete.
 * Treats `null` as the "Untitled" working state.
 */
export default function PresetBar({
  presets,
  activeId,
  onLoad,
  onSaveAs,
  onUpdate,
  onDelete,
  isDirty,
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');

  const active = presets.find((p) => p.id === activeId) || null;

  const handleSaveAs = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSaveAs(trimmed);
    setName('');
    setRenaming(false);
  };

  return (
    <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-3 flex flex-wrap items-center gap-2">
      <BookmarkSquareIcon className="h-4 w-4 text-neutral-400" />
      <span className="section-label">Saved screener</span>

      <select
        value={activeId ?? ''}
        onChange={(e) => onLoad(e.target.value === '' ? null : Number(e.target.value))}
        className="num text-xs px-2.5 py-1.5 bg-secondary-900 border border-secondary-700 rounded text-neutral-100 focus:border-primary-500 focus:outline-none min-w-[180px]"
      >
        <option value="">— Untitled —</option>
        {presets.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {active && isDirty && (
        <span className="text-[10px] uppercase tracking-wider text-amber-400 px-1.5 py-0.5 bg-amber-500/10 rounded">
          modified
        </span>
      )}

      <div className="flex-1" />

      {active && isDirty && (
        <button
          onClick={() => onUpdate(active.id)}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-primary-600/20 text-primary-200 border border-primary-600/30 rounded hover:bg-primary-600/30"
        >
          <PencilIcon className="h-3.5 w-3.5" /> Update
        </button>
      )}
      {active && (
        <button
          onClick={() => onDelete(active.id)}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 text-rose-300 hover:bg-rose-600/15 rounded"
        >
          <TrashIcon className="h-3.5 w-3.5" /> Delete
        </button>
      )}

      {renaming ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveAs();
              if (e.key === 'Escape') { setRenaming(false); setName(''); }
            }}
            placeholder="Preset name"
            className="num text-xs px-2 py-1.5 bg-secondary-900 border border-secondary-700 rounded text-neutral-100 placeholder-neutral-500 focus:border-primary-500 focus:outline-none"
          />
          <button
            onClick={handleSaveAs}
            className="text-xs px-2.5 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded"
          >
            Save
          </button>
          <button
            onClick={() => { setRenaming(false); setName(''); }}
            className="text-xs px-2 py-1.5 text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setRenaming(true)}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-secondary-700 text-neutral-200 hover:bg-secondary-600 rounded"
        >
          <BookmarkIcon className="h-3.5 w-3.5" /> Save as…
        </button>
      )}
    </div>
  );
}
