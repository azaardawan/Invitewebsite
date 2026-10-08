'use client';

import { useState, useTransition } from 'react';

type Labels = { title: string; private: string; public: string; saving: string; saved: string; error: string };

/**
 * Who sees the guest messages. Saved the moment a choice is tapped (no separate button to miss),
 * with a clear "Saving… / Saved" note; on failure the previous choice comes back.
 */
export function GuestbookChoice({
  name = 'visibility',
  initialPublic,
  save,
  labels,
}: {
  /** Radio group name; each choice on the page needs its own. */
  name?: string;
  initialPublic: boolean;
  save: (isPublic: boolean) => Promise<{ ok: boolean }>;
  labels: Labels;
}) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [state, setState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [pending, startTransition] = useTransition();

  function choose(next: boolean) {
    if (next === isPublic) return;
    const previous = isPublic;
    setIsPublic(next);
    setState('idle');
    startTransition(async () => {
      const result = await save(next).catch(() => ({ ok: false }));
      if (result.ok) setState('saved');
      else {
        setIsPublic(previous);
        setState('error');
      }
    });
  }

  const option = (value: boolean, text: string) => (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${
        isPublic === value ? 'border-accent bg-blush' : 'border-line bg-surface'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value ? 'public' : 'private'}
        checked={isPublic === value}
        onChange={() => choose(value)}
        disabled={pending}
        className="mt-1 size-5 accent-[#6e1f33]"
      />
      <span>{text}</span>
    </label>
  );

  return (
    <div className="flex flex-col gap-2">
      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="sr-only">{labels.title}</legend>
        {option(false, labels.private)}
        {option(true, labels.public)}
      </fieldset>
      <p role="status" aria-live="polite" className="min-h-5 text-sm">
        {pending ? (
          <span className="text-muted">{labels.saving}</span>
        ) : state === 'saved' ? (
          <span className="font-semibold text-accent">✓ {labels.saved}</span>
        ) : state === 'error' ? (
          <span className="text-danger">{labels.error}</span>
        ) : null}
      </p>
    </div>
  );
}
