'use client';

import { useRef, useState } from 'react';
import { COVER_ZOOM_MAX, coverImageStyle, normalizeCoverFocus, type CoverFocus } from '@/lib/cover-focus';

export type SlotPhoto = { position: number; src: string; width: number; height: number; focus: CoverFocus };

type Labels = {
  title: string;
  help: string;
  /** e.g. "{n} of {max} photos added" ({n} and {max} are filled in here, as photos are added). */
  count: string;
  add: string;
  addMany: string;
  replace: string;
  remove: string;
  adjust: string;
  done: string;
  zoom: string;
  uploading: string;
  /** A place without a design name, e.g. "Photo {n}". */
  photo: string;
  errors: Record<'tooLarge' | 'unsupportedImage' | 'imageTooSmall' | 'rateLimited' | 'generic', string>;
};

/** The photo the browser sends: at most this many pixels on the long side, as JPEG (quick on mobile data). */
const SEND_MAX_SIDE = 2400;

/**
 * Shrinks a photo in the browser before it is sent (a phone photo of 5–12 MB becomes well under 1 MB), keeping its
 * orientation. Formats the browser cannot draw (some HEIC photos) are sent as they are; the server decides.
 */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, SEND_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.type === 'image/jpeg' && file.size < 1_500_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.9));
  } catch {
    return file;
  }
}

/** Reloads the order page's live preview (same site) so it shows the photos just changed. */
function refreshPreview() {
  for (const frame of document.querySelectorAll<HTMLIFrameElement>('iframe[data-order-preview]')) {
    try {
      frame.contentWindow?.location.reload();
    } catch {
      frame.src = frame.src;
    }
  }
}

/**
 * The customer's photos for a design that holds some (feature `photos`): one place per photo the design shows, each
 * framed in the design's shape (`aspect`), to add, replace, move/zoom inside the frame, or remove. "Add several" fills
 * the empty places in order. Changes are saved at once (`base`/<place>) and the preview reloads.
 */
export function PhotoSlots({
  base,
  max,
  min,
  aspect,
  names,
  initial,
  labels,
}: {
  /** e.g. `/p/<token>/photos` (while ordering) or `/r/<token>/photos` (after publishing, with self-edit). */
  base: string;
  max: number;
  min: number;
  aspect: number;
  /** The design's names for the first places ("The couple"…), in the customer's language. */
  names: (string | null)[];
  initial: SlotPhoto[];
  labels: Labels;
}) {
  const [photos, setPhotos] = useState<Map<number, SlotPhoto>>(() => new Map(initial.map((p) => [p.position, p])));
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const many = useRef<HTMLInputElement>(null);

  const mark = (position: number, on: boolean) =>
    setBusy((b) => {
      const n = new Set(b);
      if (on) n.add(position);
      else n.delete(position);
      return n;
    });

  async function upload(position: number, file: File) {
    setError(null);
    mark(position, true);
    try {
      const body = new FormData();
      body.append('file', await shrink(file), 'photo.jpg');
      const res = await fetch(`${base}/${position}`, { method: 'POST', body });
      const data = (await res.json().catch(() => ({}))) as { photo?: SlotPhoto; error?: string };
      if (!res.ok || !data.photo) {
        const code = data.error as keyof Labels['errors'] | undefined;
        setError(code && code in labels.errors ? labels.errors[code] : labels.errors.generic);
        return;
      }
      setPhotos((p) => new Map(p).set(position, data.photo!));
      refreshPreview();
    } catch {
      setError(labels.errors.generic);
    } finally {
      mark(position, false);
    }
  }

  async function addMany(files: FileList) {
    const empty = Array.from({ length: max }, (_, i) => i).filter((i) => !photos.has(i));
    // One at a time: kinder to a phone on mobile data, and to the server.
    for (const [i, file] of Array.from(files).slice(0, empty.length).entries()) await upload(empty[i]!, file);
  }

  async function remove(position: number) {
    setError(null);
    mark(position, true);
    try {
      const res = await fetch(`${base}/${position}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error();
      setPhotos((p) => {
        const n = new Map(p);
        n.delete(position);
        return n;
      });
      if (editing === position) setEditing(null);
      refreshPreview();
    } catch {
      setError(labels.errors.generic);
    } finally {
      mark(position, false);
    }
  }

  async function saveFocus(position: number, focus: CoverFocus) {
    await fetch(`${base}/${position}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(focus) }).catch(() => {});
    refreshPreview();
  }

  const count = photos.size;
  const emptyCount = max - count;

  return (
    <section aria-labelledby="photos-title" className="flex flex-col gap-4" data-photo-slots={max}>
      <div>
        <h2 id="photos-title" className="text-xl font-semibold text-heading">
          {labels.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{labels.help}</p>
        <p className={`mt-1 text-sm font-medium ${count < min ? 'text-danger' : 'text-heading'}`} data-photo-count={count}>
          {labels.count.replace('{n}', String(count)).replace('{max}', String(max))}
        </p>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {max > 1 && emptyCount > 0 ? (
        <div>
          <input
            ref={many}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            data-photo-add-many
            aria-label={labels.addMany}
            onChange={(e) => {
              if (e.target.files?.length) void addMany(e.target.files);
              e.target.value = '';
            }}
          />
          <button type="button" onClick={() => many.current?.click()} className="rounded-full border border-accent px-5 py-2 text-sm font-semibold text-accent">
            {labels.addMany}
          </button>
        </div>
      ) : null}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: max }, (_, position) => {
          const photo = photos.get(position);
          const name = names[position] ?? labels.photo.replace('{n}', String(position + 1));
          const loading = busy.has(position);
          return (
            <li key={position} className="flex flex-col gap-2" data-photo-slot={position} data-filled={photo ? 'true' : 'false'}>
              <span className="text-xs font-medium text-muted">{name}</span>
              {photo && editing === position ? (
                <FocusEditor photo={photo} aspect={aspect} labels={labels} onChange={(focus) => setPhotos((p) => new Map(p).set(position, { ...photo, focus }))} onCommit={(focus) => void saveFocus(position, focus)} />
              ) : (
                <label
                  className={`relative block cursor-pointer overflow-hidden rounded-xl border bg-paper ${photo ? 'border-line' : 'border-dashed border-accent/60'}`}
                  style={{ aspectRatio: String(aspect) }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={photo ? `${labels.replace}: ${name}` : `${labels.add}: ${name}`}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload(position, f);
                      e.target.value = '';
                    }}
                  />
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- the customer's own photo
                    <img src={photo.src} alt={name} className="size-full object-cover" style={coverImageStyle(photo.focus)} />
                  ) : (
                    <span className="flex size-full flex-col items-center justify-center gap-1 text-accent">
                      <span aria-hidden className="text-3xl leading-none">
                        +
                      </span>
                      <span className="text-sm font-medium">{labels.add}</span>
                    </span>
                  )}
                  {loading ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-surface/80 text-sm font-medium" role="status">
                      {labels.uploading}
                    </span>
                  ) : null}
                </label>
              )}
              {photo ? (
                <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                  <button type="button" className="text-accent underline" onClick={() => setEditing(editing === position ? null : position)}>
                    {editing === position ? labels.done : labels.adjust}
                  </button>
                  <button type="button" className="text-danger underline" onClick={() => void remove(position)} disabled={loading}>
                    {labels.remove}
                  </button>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Drag the photo inside its frame, or zoom with the slider; saved when the finger lifts or the slider stops. */
function FocusEditor({ photo, aspect, labels, onChange, onCommit }: { photo: SlotPhoto; aspect: number; labels: Labels; onChange: (f: CoverFocus) => void; onCommit: (f: CoverFocus) => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; start: CoverFocus } | null>(null);
  const focus = photo.focus;

  // How far the photo overflows the frame after zoom: dragging that many pixels moves it end to end.
  function overflow(start: CoverFocus) {
    const box = frame.current?.getBoundingClientRect();
    if (!box || !photo.width || !photo.height) return { x: 0, y: 0 };
    const s = Math.max(box.width / photo.width, box.height / photo.height);
    return { x: start.zoom * photo.width * s - box.width, y: start.zoom * photo.height * s - box.height };
  }

  return (
    <div className="flex flex-col gap-2" data-photo-editor>
      <div
        ref={frame}
        className="relative cursor-grab touch-none overflow-hidden rounded-xl border border-accent bg-paper active:cursor-grabbing"
        style={{ aspectRatio: String(aspect) }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, start: focus };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const o = overflow(d.start);
          onChange(
            normalizeCoverFocus({
              ...d.start,
              x: o.x > 1 ? d.start.x - ((e.clientX - d.x) / o.x) * 100 : d.start.x,
              y: o.y > 1 ? d.start.y - ((e.clientY - d.y) / o.y) * 100 : d.start.y,
            }),
          );
        }}
        onPointerUp={() => {
          if (drag.current) onCommit(focus);
          drag.current = null;
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- the customer's own photo */}
        <img src={photo.src} alt="" draggable={false} className="pointer-events-none size-full object-cover select-none" style={coverImageStyle(focus)} />
      </div>
      <label className="flex items-center gap-2 text-xs">
        <span>{labels.zoom}</span>
        <input
          type="range"
          min={1}
          max={COVER_ZOOM_MAX}
          step={0.01}
          value={focus.zoom}
          dir="ltr"
          className="w-full accent-[var(--color-accent)]"
          aria-label={labels.zoom}
          onChange={(e) => onChange(normalizeCoverFocus({ ...focus, zoom: Number(e.target.value) }))}
          onPointerUp={() => onCommit(focus)}
          onKeyUp={() => onCommit(focus)}
        />
      </label>
    </div>
  );
}
