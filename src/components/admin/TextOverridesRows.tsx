'use client';

import { useState } from 'react';

/**
 * «Change any text» rows (Admin → an invitation, owner 2026-11-26): the text exactly as it shows on the invitation, and
 * what to show instead (empty hides it). Rows can be added and removed before saving.
 */
export function TextOverridesRows({
  initial,
  max,
  maxLength,
  labels,
}: {
  initial: { from: string; to: string }[];
  max: number;
  maxLength: number;
  labels: { from: string; to: string; add: string; remove: string };
}) {
  const [rows, setRows] = useState(() => (initial.length ? initial : [{ from: '', to: '' }]).map((r, i) => ({ ...r, id: i })));
  const [next, setNext] = useState(rows.length);
  const field = 'w-full rounded-md border border-line bg-surface px-3 py-2 text-base';
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end" data-text-override>
          <label className="block">
            <span className="mb-1 block text-sm">
              {labels.from} {i + 1}
            </span>
            <textarea name="from" rows={2} dir="auto" defaultValue={r.from} maxLength={maxLength} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm">{labels.to}</span>
            <textarea name="to" rows={2} dir="auto" defaultValue={r.to} maxLength={maxLength} className={field} />
          </label>
          <button type="button" onClick={() => setRows((all) => all.filter((x) => x.id !== r.id))} className="h-10 rounded-md border border-line px-3 text-sm">
            {labels.remove}
          </button>
        </div>
      ))}
      {rows.length < max ? (
        <button
          type="button"
          onClick={() => {
            setRows((all) => [...all, { from: '', to: '', id: next }]);
            setNext((n) => n + 1);
          }}
          className="rounded-md border border-line px-3 py-1.5 text-sm"
        >
          {labels.add}
        </button>
      ) : null}
    </div>
  );
}
