'use client';

import { useEffect, useRef, useState } from 'react';

type Photo = { id: string; thumb: boolean };
type ErrorKey = 'full' | 'shareUsed' | 'duplicate' | 'tooBig' | 'type' | 'closed' | 'name' | 'rateLimited' | 'generic';

const NAME_KEY = 'bahja:guest-name';

/**
 * The guest's side of guest photo sharing: their name, then photos taken or chosen, sent one by one in original
 * quality. The phone sees what it sent (out of its share) and may remove it while uploading is open.
 */
export function GuestUploader({
  token,
  status,
  share,
  maxBytes,
  initial,
  initialName,
  labels,
}: {
  token: string;
  status: 'open' | 'notYet' | 'closed';
  share: number;
  maxBytes: number;
  initial: Photo[];
  initialName: string;
  labels: {
    name: string;
    namePlaceholder: string;
    take: string;
    choose: string;
    yours: string;
    /** "{n} of {max}" */
    count: string;
    remove: string;
    removeHint: string;
    sending: string;
    needName: string;
    notYet: string;
    closed: string;
    noPicture: string;
    errors: Record<ErrorKey, string>;
  };
}) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const nameInput = useRef<HTMLInputElement>(null);
  // The name typed last time on this phone, once on the page (never in the server's HTML).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved && nameInput.current && !nameInput.current.value) nameInput.current.value = saved;
    } catch {}
  }, []);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const left = share - photos.length;
  const open = status === 'open';

  async function send(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const name = nameInput.current?.value ?? '';
    if (!name.trim()) {
      setError(labels.needName);
      return;
    }
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {}
    let room = share - photos.length;
    for (const file of Array.from(files)) {
      if (room <= 0) {
        setError(labels.errors.shareUsed);
        break;
      }
      if (file.size > maxBytes) {
        setError(labels.errors.tooBig);
        continue;
      }
      setBusy((n) => n + 1);
      try {
        const body = new FormData();
        body.set('name', name.trim());
        body.set('photo', file);
        const res = await fetch(`/g/${token}/upload`, { method: 'POST', body });
        const out = (await res.json().catch(() => ({}))) as { id?: string; thumb?: boolean; error?: ErrorKey };
        if (out.id) {
          room--;
          setPhotos((p) => [...p, { id: out.id!, thumb: Boolean(out.thumb) }]);
        } else {
          setError(labels.errors[out.error ?? 'generic'] ?? labels.errors.generic);
          if (out.error === 'full' || out.error === 'closed' || out.error === 'shareUsed') break;
        }
      } catch {
        setError(labels.errors.generic);
      } finally {
        setBusy((n) => n - 1);
      }
    }
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/g/${token}/photo/${id}`, { method: 'DELETE' });
    if (res.ok) setPhotos((p) => p.filter((x) => x.id !== id));
    else setError(labels.errors.generic);
  }

  return (
    <section className="flex flex-col gap-4 rounded-[22px] border border-line bg-surface p-4">
      {!open ? <p className="rounded-2xl bg-blush px-4 py-3 text-sm text-accent-deep">{status === 'notYet' ? labels.notYet : labels.closed}</p> : null}
      <label className="flex flex-col gap-1.5">
        <span className="text-[15px] font-semibold text-heading">{labels.name}</span>
        <input
          ref={nameInput}
          defaultValue={initialName}
          maxLength={60}
          autoComplete="name"
          placeholder={labels.namePlaceholder}
          disabled={!open}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
      </label>
      {open && left > 0 ? (
        <div className="flex flex-col gap-2">
          <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void send(e.target.files).finally(() => (e.target.value = ''))} />
          <input ref={gallery} type="file" accept="image/*" multiple hidden onChange={(e) => void send(e.target.files).finally(() => (e.target.value = ''))} />
          <button type="button" onClick={() => camera.current?.click()} disabled={busy > 0} className="h-12 rounded-full bg-accent font-semibold text-accent-ink disabled:opacity-60">
            {labels.take}
          </button>
          <button type="button" onClick={() => gallery.current?.click()} disabled={busy > 0} className="h-12 rounded-full border border-accent bg-white font-semibold text-accent disabled:opacity-60">
            {labels.choose}
          </button>
        </div>
      ) : null}
      {busy > 0 ? (
        <p role="status" className="text-sm text-muted">
          {labels.sending}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <p className="flex items-center justify-between text-sm">
          <span className="font-medium">{labels.yours}</span>
          <span className="text-muted" data-guest-count>
            {labels.count.replace('{n}', String(photos.length)).replace('{max}', String(share))}
          </span>
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-blush">
          <i className="block h-full bg-accent transition-all" style={{ width: `${Math.min(100, (photos.length / share) * 100)}%` }} />
        </div>
        {photos.length ? (
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <li key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-blush">
                {p.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/g/${token}/photo/${p.id}`} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center p-2 text-center text-xs text-muted">{labels.noPicture}</span>
                )}
                {open ? (
                  <button type="button" onClick={() => void remove(p.id)} aria-label={labels.remove} className="absolute top-1 end-1 flex size-7 items-center justify-center rounded-full bg-white text-accent shadow">
                    ×
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {open && photos.length && labels.removeHint ? <p className="text-xs text-muted">{labels.removeHint}</p> : null}
      </div>
    </section>
  );
}
