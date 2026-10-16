'use client';

import { useEffect, useRef, useState } from 'react';
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
  earlier: string;
  later: string;
  previous: string;
  next: string;
  /** Above the live design in the editor ("How it looks in the design"). */
  inDesign: string;
  /** Under the frame ("Drag the photo to move it; zoom with the slider"). */
  dragHint: string;
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

/** Sends a message to every live design on the page (the page's preview and the editor's), same site only. */
function tellDesigns(message: unknown) {
  for (const frame of document.querySelectorAll<HTMLIFrameElement>('iframe[data-order-preview], iframe[data-photo-preview]')) {
    frame.contentWindow?.postMessage(message, window.location.origin);
  }
}

/**
 * The customer's photos for a design that holds some (feature `photos`). Photos fill the design's places in order
 * (photo 3 is always the collage's third spot), each framed in that place's own shape (`aspects`). The customer
 * adds them (one, or several at once), moves them earlier or later, removes them (the later ones move up), and
 * adjusts each in an editor that shows the real design beside the frame, redrawn live as the photo is dragged or
 * zoomed. Every change is saved at once (`base`/<place>) and every design on the page follows it.
 */
export function PhotoSlots({
  base,
  previewUrl,
  max,
  min,
  aspects,
  names,
  initial,
  labels,
}: {
  /** e.g. `/p/<token>/photos` (while ordering) or `/r/<token>/photos` (after publishing, with self-edit). */
  base: string;
  /** The design with this invitation's content (`/p/<token>`, or the live invitation), for the editor. */
  previewUrl: string;
  max: number;
  min: number;
  /** Each place's frame, width ÷ height. */
  aspects: number[];
  /** The design's names for the first places ("The couple"…), in the customer's language. */
  names: (string | null)[];
  initial: SlotPhoto[];
  labels: Labels;
}) {
  const [photos, setPhotos] = useState<SlotPhoto[]>(() => [...initial].sort((a, b) => a.position - b.position));
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const many = useRef<HTMLInputElement>(null);

  const aspectOf = (i: number) => aspects[i] ?? aspects[0] ?? 0.75;
  const nameOf = (i: number) => names[i] ?? labels.photo.replace('{n}', String(i + 1));

  // Every design on the page shows the photos as they are now (also while one is being dragged).
  useEffect(() => {
    tellDesigns({ type: 'bahja:photos', photos: photos.map(({ src, width, height, focus }) => ({ src, width, height, focus })) });
  }, [photos]);

  async function upload(file: File, position: number, edit: boolean) {
    setError(null);
    setBusy(position);
    try {
      const body = new FormData();
      body.append('file', await shrink(file), 'photo.jpg');
      const res = await fetch(`${base}/${position}`, { method: 'POST', body });
      const data = (await res.json().catch(() => ({}))) as { photo?: SlotPhoto; error?: string };
      if (!res.ok || !data.photo) {
        const code = data.error as keyof Labels['errors'] | undefined;
        setError(code && code in labels.errors ? labels.errors[code] : labels.errors.generic);
        return false;
      }
      const saved = data.photo;
      setPhotos((list) => [...list.filter((p) => p.position !== saved.position), saved].sort((a, b) => a.position - b.position));
      // A single new photo opens straight in the editor, inside the design.
      if (edit) setEditing(saved.position);
      return true;
    } catch {
      setError(labels.errors.generic);
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function addMany(files: FileList) {
    let next = photos.length;
    // One at a time: kinder to a phone on mobile data, and to the server.
    for (const file of Array.from(files).slice(0, max - photos.length)) {
      if (await upload(file, next, false)) next++;
    }
  }

  async function remove(position: number) {
    setError(null);
    setBusy(position);
    try {
      const res = await fetch(`${base}/${position}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error();
      // The photos after it move up a place, as on the server.
      setPhotos((list) => list.filter((p) => p.position !== position).map((p) => (p.position > position ? { ...p, position: p.position - 1 } : p)));
      setEditing(null);
    } catch {
      setError(labels.errors.generic);
    } finally {
      setBusy(null);
    }
  }

  async function move(position: number, to: number) {
    if (to < 0 || to >= photos.length) return;
    setError(null);
    const res = await fetch(`${base}/${position}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ swapWith: to }) }).catch(() => null);
    if (!res?.ok) {
      setError(labels.errors.generic);
      return;
    }
    setPhotos((list) =>
      list
        .map((p) => (p.position === position ? { ...p, position: to } : p.position === to ? { ...p, position } : p))
        .sort((a, b) => a.position - b.position),
    );
    if (editing === position) setEditing(to);
    tellDesigns({ type: 'bahja:show-photo', index: to });
  }

  const setFocus = (position: number, focus: CoverFocus) => setPhotos((list) => list.map((p) => (p.position === position ? { ...p, focus } : p)));
  const saveFocus = (position: number, focus: CoverFocus) =>
    void fetch(`${base}/${position}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(focus) }).catch(() => {});

  const count = photos.length;
  const current = editing !== null ? photos.find((p) => p.position === editing) : undefined;

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
      {max - count > 1 ? (
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
          const photo = photos.find((p) => p.position === position);
          const name = nameOf(position);
          // Photos fill the places in order: the next free place takes the new photo; later ones wait their turn.
          const isNext = !photo && position === count;
          const loading = busy === position;
          return (
            <li key={position} className="flex flex-col gap-2" data-photo-slot={position} data-filled={photo ? 'true' : 'false'}>
              <span className="text-xs font-medium text-muted">{name}</span>
              {photo ? (
                <button
                  type="button"
                  onClick={() => setEditing(position)}
                  className="relative block overflow-hidden rounded-xl border border-line bg-paper"
                  style={{ aspectRatio: String(aspectOf(position)) }}
                  aria-label={`${labels.adjust}: ${name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- the customer's own photo */}
                  <img src={photo.src} alt={name} className="size-full object-cover" style={coverImageStyle(photo.focus)} />
                  {loading ? <Busy text={labels.uploading} /> : null}
                </button>
              ) : isNext ? (
                <label className="relative block cursor-pointer overflow-hidden rounded-xl border border-dashed border-accent/60 bg-paper" style={{ aspectRatio: String(aspectOf(position)) }}>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={`${labels.add}: ${name}`}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload(f, position, true);
                      e.target.value = '';
                    }}
                  />
                  <span className="flex size-full flex-col items-center justify-center gap-1 text-accent">
                    <span aria-hidden className="text-3xl leading-none">
                      +
                    </span>
                    <span className="text-sm font-medium">{labels.add}</span>
                  </span>
                  {busy !== null && busy >= count ? <Busy text={labels.uploading} /> : null}
                </label>
              ) : (
                <span aria-hidden className="block rounded-xl border border-dashed border-line bg-paper/60" style={{ aspectRatio: String(aspectOf(position)) }} />
              )}
              {photo ? (
                <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                  <button type="button" className="text-accent underline" onClick={() => setEditing(position)}>
                    {labels.adjust}
                  </button>
                  {position > 0 ? (
                    <button type="button" className="text-accent underline" onClick={() => void move(position, position - 1)} aria-label={`${labels.earlier}: ${name}`}>
                      {labels.earlier}
                    </button>
                  ) : null}
                  {position < count - 1 ? (
                    <button type="button" className="text-accent underline" onClick={() => void move(position, position + 1)} aria-label={`${labels.later}: ${name}`}>
                      {labels.later}
                    </button>
                  ) : null}
                  <button type="button" className="text-danger underline" onClick={() => void remove(position)} disabled={loading}>
                    {labels.remove}
                  </button>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {current ? (
        <Editor
          key={current.position}
          photo={current}
          name={nameOf(current.position)}
          aspect={aspectOf(current.position)}
          previewUrl={previewUrl}
          labels={labels}
          hasPrevious={current.position > 0}
          hasNext={current.position < count - 1}
          onFocus={(f) => setFocus(current.position, f)}
          onCommit={(f) => saveFocus(current.position, f)}
          onReplace={(file) => void upload(file, current.position, true)}
          onGo={(to) => setEditing(to)}
          onClose={() => setEditing(null)}
          onLoaded={() => {
            tellDesigns({ type: 'bahja:photos', photos: photos.map(({ src, width, height, focus }) => ({ src, width, height, focus })) });
            tellDesigns({ type: 'bahja:show-photo', index: current.position });
          }}
          busy={busy === current.position}
        />
      ) : null}
    </section>
  );
}

function Busy({ text }: { text: string }) {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-surface/80 text-sm font-medium" role="status">
      {text}
    </span>
  );
}

/**
 * One photo, in a full-screen editor: the real design (this invitation, opened, scrolled to the photo and redrawn live)
 * next to the photo's frame in exactly that place's shape. Drag to move, slider to zoom; saved when the finger lifts.
 */
function Editor({
  photo,
  name,
  aspect,
  previewUrl,
  labels,
  hasPrevious,
  hasNext,
  onFocus,
  onCommit,
  onReplace,
  onGo,
  onClose,
  onLoaded,
  busy,
}: {
  photo: SlotPhoto;
  name: string;
  aspect: number;
  previewUrl: string;
  labels: Labels;
  hasPrevious: boolean;
  hasNext: boolean;
  onFocus: (f: CoverFocus) => void;
  onCommit: (f: CoverFocus) => void;
  onReplace: (file: File) => void;
  onGo: (position: number) => void;
  onClose: () => void;
  /** The editor's design has loaded: bring it up to date (photos not saved yet included). */
  onLoaded: () => void;
  busy: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; start: CoverFocus } | null>(null);
  const focus = photo.focus;
  const src = `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}photoEdit=1&photo=${photo.position}`;

  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    // The page behind stays still while the editor is open; Escape closes it.
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    tellDesigns({ type: 'bahja:show-photo', index: photo.position });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [photo.position]);

  // How far the photo overflows the frame after zoom: dragging that many pixels moves it end to end.
  function overflowOf(start: CoverFocus) {
    const box = frame.current?.getBoundingClientRect();
    if (!box || !photo.width || !photo.height) return { x: 0, y: 0 };
    const s = Math.max(box.width / photo.width, box.height / photo.height);
    return { x: start.zoom * photo.width * s - box.width, y: start.zoom * photo.height * s - box.height };
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`${labels.adjust}: ${name}`} className="fixed inset-0 z-50 flex flex-col bg-surface lg:flex-row" data-photo-editor-dialog>
      <div className="flex min-h-0 flex-1 flex-col bg-paper lg:order-2">
        <p className="px-4 pt-3 text-xs font-medium text-muted">{labels.inDesign}</p>
        <iframe data-photo-preview src={src} title={labels.inDesign} className="min-h-0 w-full flex-1 border-0" onLoad={onLoaded} />
      </div>
      <div className="flex max-h-[48vh] shrink-0 flex-col gap-3 overflow-y-auto border-t border-line p-4 lg:max-h-none lg:w-[380px] lg:border-t-0 lg:border-e">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-heading">{name}</p>
          <button type="button" onClick={onClose} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">
            {labels.done}
          </button>
        </div>
        <div className="mx-auto w-full max-w-[260px]" data-photo-editor>
          <div
            ref={frame}
            className="relative cursor-grab touch-none overflow-hidden rounded-xl border-2 border-accent bg-paper active:cursor-grabbing"
            style={{ aspectRatio: String(aspect) }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY, start: focus };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              const o = overflowOf(d.start);
              onFocus(
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
            {busy ? <Busy text={labels.uploading} /> : null}
          </div>
          <p className="mt-2 text-center text-xs text-muted">{labels.dragHint}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
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
            onChange={(e) => onFocus(normalizeCoverFocus({ ...focus, zoom: Number(e.target.value) }))}
            onPointerUp={() => onCommit(focus)}
            onKeyUp={() => onCommit(focus)}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
          <button type="button" className="text-accent underline disabled:opacity-40" disabled={!hasPrevious} onClick={() => onGo(photo.position - 1)}>
            {labels.previous}
          </button>
          <label className="cursor-pointer text-accent underline">
            {labels.replace}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onReplace(f);
                e.target.value = '';
              }}
            />
          </label>
          <button type="button" className="text-accent underline disabled:opacity-40" disabled={!hasNext} onClick={() => onGo(photo.position + 1)}>
            {labels.next}
          </button>
        </div>
      </div>
    </div>
  );
}
