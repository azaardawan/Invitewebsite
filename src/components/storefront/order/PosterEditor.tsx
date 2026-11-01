'use client';

import { useEffect, useState } from 'react';
import { OWN_PICTURE, POSTER_ROW_MAX, VIDEO_STILL, resolvePoster, type PosterChoice, type PosterChoices, type PosterOrientation } from '@/lib/poster-choices';
import { coverImageStyle, normalizeCoverFocus, type CoverFocus } from '@/lib/cover-focus';
import { PhotoFramer } from './PhotoSlots';

export type PosterEditorLabels = {
  title: string;
  subtitle: string;
  landscape: string;
  portrait: string;
  /** "The big picture". */
  main: string;
  /** "A still from the video". */
  videoStill: string;
  /** "Upload a picture" (for this poster only), "Change", "Remove", "Adjust the frame". */
  upload: string;
  ownPicture: string;
  removePicture: string;
  reframe: string;
  frameHint: string;
  dragHint: string;
  zoom: string;
  uploading: string;
  /** "Photos in the row (up to {max})": {max} is filled in here. */
  row: string;
  rowHint: string;
  /** "The poster's words", its hint, and "Back to the page's text". */
  texts: string;
  textsHint: string;
  reset: string;
  drawing: string;
  back: string;
  next: string;
  done: string;
  error: string;
};

type Thumb = { index: number; src: string; focus: CoverFocus };
type OwnPicture = { src: string; width: number; height: number; focus: CoverFocus };
type PosterTextField = { key: string; label: string; value: string; start: string; maxLength: number; multiline: boolean };

/** The photo the browser sends: at most this many pixels on the long side, as JPEG. */
const SEND_MAX_SIDE = 2400;
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

/**
 * The poster step (packages with the landscape and/or portrait couple poster), after the customer has filled their page.
 * Each poster the package sells is pictured as it will print (watermarked until paid, drawn by the server). For each:
 * its big picture (a picture uploaded for this poster only, framed in the poster's own frame; the video's still; or any
 * photo), the landscape poster's row of up to five photos (in the order tapped), and every text printed on it, each
 * starting from the page's text and changeable for this poster only. Each change is saved at once (`base`/poster) and the
 * poster drawn again.
 */
export function PosterEditor({
  base,
  photos,
  still,
  initial,
  orientations,
  frames,
  own: initialOwn,
  texts,
  backHref,
  continueHref,
  labels,
}: {
  /** `/p/<token>` while ordering, `/r/<token>` after paying. */
  base: string;
  photos: Thumb[];
  still: string | null;
  initial: PosterChoices;
  /** The posters the package sells. */
  orientations: PosterOrientation[];
  /** Each poster's big-picture frame (width ÷ height). */
  frames: Record<PosterOrientation, number>;
  own: Partial<Record<PosterOrientation, OwnPicture | null>>;
  texts: Partial<Record<PosterOrientation, PosterTextField[]>>;
  backHref: string;
  continueHref: string;
  labels: PosterEditorLabels;
}) {
  const [orientation, setOrientation] = useState<PosterOrientation>(orientations[0] ?? 'landscape');
  const [choices, setChoices] = useState<PosterChoices>(initial);
  const [own, setOwn] = useState(initialOwn);
  const [stamp, setStamp] = useState<Record<PosterOrientation, number>>({ landscape: 0, portrait: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [framing, setFraming] = useState(false);
  /** The latest choice not saved yet (several taps or keystrokes in a row are saved, and drawn, once). */
  const [pending, setPending] = useState<{ choice: PosterChoice; which: PosterOrientation } | null>(null);

  const ownPicture = own[orientation] ?? null;
  const ownThumb = ownPicture ? { index: OWN_PICTURE, src: ownPicture.src, focus: ownPicture.focus } : null;
  const pick = resolvePoster(choices[orientation], photos, Boolean(still), orientation, ownThumb);
  const mainIndex = pick.main ? pick.main.index : still ? VIDEO_STILL : null;
  const redraw = (which: PosterOrientation) => {
    setLoading(true);
    setStamp((s) => ({ ...s, [which]: Date.now() }));
  };

  async function save(choice: PosterChoice, which: PosterOrientation) {
    setError(false);
    const res = await fetch(`${base}/poster`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [which]: choice }) }).catch(() => null);
    if (!res?.ok) {
      setError(true);
      return;
    }
    redraw(which);
  }

  function change(next: PosterChoice) {
    setChoices((c) => ({ ...c, [orientation]: next }));
    setPending({ choice: next, which: orientation });
  }
  useEffect(() => {
    if (!pending) return;
    const id = window.setTimeout(() => {
      setPending(null);
      void save(pending.choice, pending.which);
    }, 800);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save only reads state setters and `base`
  }, [pending]);

  const current = choices[orientation] ?? {};
  const setMain = (main: number) => change({ ...current, main });
  const toggleRow = (index: number) => {
    const now = pick.row.map((p) => p.index);
    const row = now.includes(index) ? now.filter((i) => i !== index) : now.length < POSTER_ROW_MAX ? [...now, index] : now;
    change({ ...current, row });
  };
  const fields = texts[orientation] ?? [];
  const textOf = (f: PosterTextField) => current.texts?.[f.key] ?? f.value;
  const setText = (key: string, value: string) => change({ ...current, texts: { ...(current.texts ?? {}), [key]: value } });
  const resetText = (key: string) => {
    const rest = { ...(current.texts ?? {}) };
    delete rest[key];
    change({ ...current, texts: rest });
  };

  async function upload(file: File) {
    setBusy(true);
    setError(false);
    try {
      const body = new FormData();
      body.append('file', await shrink(file), 'poster.jpg');
      const res = await fetch(`${base}/poster/photo/${orientation}`, { method: 'POST', body });
      const data = (await res.json().catch(() => ({}))) as { photo?: OwnPicture; posterChoices?: PosterChoices };
      if (!res.ok || !data.photo) throw new Error();
      setOwn((o) => ({ ...o, [orientation]: data.photo! }));
      if (data.posterChoices) setChoices(data.posterChoices);
      setFraming(true);
      redraw(orientation);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function removeOwn() {
    setBusy(true);
    const res = await fetch(`${base}/poster/photo/${orientation}`, { method: 'DELETE' }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError(true);
    const data = (await res.json().catch(() => ({}))) as { posterChoices?: PosterChoices };
    setOwn((o) => ({ ...o, [orientation]: null }));
    if (data.posterChoices) setChoices(data.posterChoices);
    setFraming(false);
    redraw(orientation);
  }

  const setFocus = (focus: CoverFocus) => setOwn((o) => (o[orientation] ? { ...o, [orientation]: { ...o[orientation]!, focus } } : o));
  const saveFocus = (focus: CoverFocus) => {
    const which = orientation;
    void fetch(`${base}/poster/photo/${which}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(focus) })
      .then((r) => (r.ok ? redraw(which) : setError(true)))
      .catch(() => setError(true));
  };

  const inputCls = 'w-full rounded-xl border border-line bg-surface px-3 py-2 text-[15px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15';
  const thumb = (key: string, src: string, focus: CoverFocus | null, selected: boolean, onClick: () => void, badge?: string, label?: string) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={`relative aspect-[3/4] w-[72px] shrink-0 overflow-hidden rounded-lg border-2 ${selected ? 'border-accent ring-2 ring-accent/30' : 'border-line opacity-80'}`}
      data-poster-thumb={key}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- the customer's own photo */}
      <img src={src} alt="" className="size-full object-cover" style={focus ? coverImageStyle(focus) : undefined} />
      {badge ? <span className="absolute end-1 top-1 grid size-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-ink">{badge}</span> : null}
    </button>
  );

  return (
    <section id="posters" className="flex scroll-mt-6 flex-col gap-5" data-poster-editor>
      <div>
        <h1 className="font-display text-[32px] leading-[1.3] font-bold text-heading lg:text-[44px]">{labels.title}</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">{labels.subtitle}</p>
      </div>
      {orientations.length > 1 ? (
        <div role="tablist" className="flex gap-2">
          {orientations.map((o) => (
            <button
              key={o}
              type="button"
              role="tab"
              aria-selected={orientation === o}
              onClick={() => {
                setOrientation(o);
                setFraming(false);
                setLoading(true);
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${orientation === o ? 'bg-accent text-accent-ink' : 'border border-line text-heading'}`}
            >
              {o === 'landscape' ? labels.landscape : labels.portrait}
            </button>
          ))}
        </div>
      ) : (
        <h2 className="font-semibold text-heading">{orientation === 'landscape' ? labels.landscape : labels.portrait}</h2>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative mx-auto w-full self-start lg:sticky lg:top-6" style={{ maxWidth: orientation === 'landscape' ? 720 : 420 }}>
          {/* Drawn by the server (watermarked until paid); a few seconds after each change. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- generated picture */}
          <img
            key={`${orientation}-${stamp[orientation]}`}
            src={`${base}/extra/poster-${orientation}.preview${stamp[orientation] ? `?v=${stamp[orientation]}` : ''}`}
            alt={orientation === 'landscape' ? labels.landscape : labels.portrait}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            className={`w-full border border-line bg-black shadow-lg ${orientation === 'landscape' ? 'aspect-[1190/842]' : 'aspect-[842/1190]'}`}
            data-poster-preview={orientation}
          />
          {loading || pending ? (
            <span className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-medium text-white" role="status">
              {labels.drawing}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          {error ? (
            <p role="alert" className="rounded-xl bg-danger/10 px-4 py-2 text-sm text-danger">
              {labels.error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-heading">{labels.main}</h2>
            <div className="flex flex-wrap gap-2" data-poster-main>
              <label className={`grid aspect-[3/4] w-[72px] shrink-0 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-accent/60 p-1 text-center text-[11px] font-semibold text-accent ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                {busy ? labels.uploading : `+ ${labels.upload}`}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  data-poster-upload
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(f);
                    e.target.value = '';
                  }}
                />
              </label>
              {ownPicture ? thumb('own', ownPicture.src, ownPicture.focus, mainIndex === OWN_PICTURE, () => setMain(OWN_PICTURE), undefined, labels.ownPicture) : null}
              {still ? thumb('still', still, null, mainIndex === VIDEO_STILL, () => setMain(VIDEO_STILL), undefined, labels.videoStill) : null}
              {photos.map((p) => thumb(`main-${p.index}`, p.src, p.focus, mainIndex === p.index, () => setMain(p.index)))}
            </div>
            {ownPicture && mainIndex === OWN_PICTURE ? (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
                <button type="button" className="text-accent underline" onClick={() => setFraming((f) => !f)} data-poster-reframe>
                  {labels.reframe}
                </button>
                <button type="button" className="text-danger underline" onClick={() => void removeOwn()} disabled={busy}>
                  {labels.removePicture}
                </button>
              </div>
            ) : null}
            {framing && ownPicture ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4" data-poster-framer>
                <p className="text-sm text-muted">{labels.frameHint}</p>
                <PhotoFramer
                  photo={ownPicture}
                  aspect={frames[orientation]}
                  focus={ownPicture.focus}
                  onFocus={(f) => setFocus(normalizeCoverFocus(f))}
                  onCommit={saveFocus}
                  busy={busy}
                  labels={{ dragHint: labels.dragHint, zoom: labels.zoom, uploading: labels.uploading }}
                />
                <button type="button" className="self-end rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink" onClick={() => setFraming(false)}>
                  {labels.done}
                </button>
              </div>
            ) : null}
          </div>

          {orientation === 'landscape' && photos.length ? (
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold text-heading">{labels.row.replace('{max}', String(POSTER_ROW_MAX))}</h2>
              <p className="text-xs text-muted">{labels.rowHint}</p>
              <div className="flex flex-wrap gap-2" data-poster-row>
                {photos.map((p) => {
                  const at = pick.row.findIndex((r) => r.index === p.index);
                  return thumb(`row-${p.index}`, p.src, p.focus, at >= 0, () => toggleRow(p.index), at >= 0 ? String(at + 1) : undefined);
                })}
              </div>
            </div>
          ) : null}

          {fields.length ? (
            <div className="flex flex-col gap-3" data-poster-texts>
              <div>
                <h2 className="font-semibold text-heading">{labels.texts}</h2>
                <p className="text-xs text-muted">{labels.textsHint}</p>
              </div>
              {fields.map((f) => {
                const value = textOf(f);
                return (
                  <label key={f.key} className="flex flex-col gap-1 text-sm font-medium text-heading">
                    <span className="flex items-center justify-between gap-2">
                      {f.label}
                      {current.texts?.[f.key] !== undefined && value !== f.start ? (
                        <button type="button" className="text-xs font-normal text-accent underline" onClick={() => resetText(f.key)}>
                          {labels.reset}
                        </button>
                      ) : null}
                    </span>
                    {f.multiline ? (
                      <textarea rows={4} maxLength={f.maxLength} value={value} onChange={(e) => setText(f.key, e.target.value)} className={inputCls} data-poster-text={f.key} />
                    ) : (
                      <input maxLength={f.maxLength} value={value} onChange={(e) => setText(f.key, e.target.value)} className={inputCls} data-poster-text={f.key} />
                    )}
                  </label>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <a href={backHref} className="text-sm font-medium text-accent underline underline-offset-4">
          {labels.back}
        </a>
        <a href={continueHref} className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink" data-poster-continue>
          {labels.next}
        </a>
      </div>
    </section>
  );
}
