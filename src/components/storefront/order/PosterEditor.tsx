'use client';

import { useEffect, useState } from 'react';
import { POSTER_ROW_MAX, VIDEO_STILL, resolvePoster, type PosterChoices, type PosterOrientation } from '@/lib/poster-choices';
import { coverImageStyle, type CoverFocus } from '@/lib/cover-focus';

export type PosterEditorLabels = {
  title: string;
  subtitle: string;
  landscape: string;
  portrait: string;
  /** "The big picture". */
  main: string;
  /** "The video's still". */
  videoStill: string;
  /** "Photos in the row (up to {max})": {max} is filled in here. */
  row: string;
  rowHint: string;
  drawing: string;
  back: string;
  next: string;
  error: string;
};

type Thumb = { index: number; src: string; focus: CoverFocus };

/**
 * The poster step (packages with `couple_poster`), after the customer has filled their page: each poster (landscape,
 * portrait) pictured as it will print (watermarked until paid, drawn by the server), and the pictures it shows chosen
 * by tapping: the big picture (the video's still or any photo) and, on the landscape poster, the row of up to five
 * photos in the order tapped. Each choice is saved at once (`base`/poster) and the poster drawn again. The texts are
 * the page's own (changed on the page).
 */
export function PosterEditor({
  base,
  photos,
  still,
  initial,
  backHref,
  continueHref,
  labels,
}: {
  /** `/p/<token>` while ordering, `/r/<token>` after paying. */
  base: string;
  photos: Thumb[];
  still: string | null;
  initial: PosterChoices;
  backHref: string;
  continueHref: string;
  labels: PosterEditorLabels;
}) {
  const [orientation, setOrientation] = useState<PosterOrientation>('landscape');
  const [choices, setChoices] = useState<PosterChoices>(initial);
  const [stamp, setStamp] = useState<Record<PosterOrientation, number>>({ landscape: 0, portrait: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  /** The latest choice not saved yet (several taps in a row are saved, and drawn, once). */
  const [pending, setPending] = useState<{ next: PosterChoices; which: PosterOrientation } | null>(null);

  const pick = resolvePoster(choices[orientation], photos, Boolean(still), orientation);
  const mainIndex = pick.main ? pick.main.index : still ? VIDEO_STILL : null;

  async function save(next: PosterChoices, which: PosterOrientation) {
    setError(false);
    const res = await fetch(`${base}/poster`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [which]: next[which] }) }).catch(() => null);
    if (!res?.ok) {
      setError(true);
      return;
    }
    setLoading(true);
    setStamp((s) => ({ ...s, [which]: Date.now() }));
  }

  function change(next: PosterChoices) {
    setChoices(next);
    setPending({ next, which: orientation });
  }
  useEffect(() => {
    if (!pending) return;
    const id = window.setTimeout(() => {
      setPending(null);
      void save(pending.next, pending.which);
    }, 700);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save only reads state setters and `base`
  }, [pending]);

  const setMain = (main: number) => change({ ...choices, [orientation]: { ...choices[orientation], main } });
  const toggleRow = (index: number) => {
    const current = pick.row.map((p) => p.index);
    const row = current.includes(index) ? current.filter((i) => i !== index) : current.length < POSTER_ROW_MAX ? [...current, index] : current;
    change({ ...choices, landscape: { ...choices.landscape, row } });
  };

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
      <div role="tablist" className="flex gap-2">
        {(['landscape', 'portrait'] as const).map((o) => (
          <button
            key={o}
            type="button"
            role="tab"
            aria-selected={orientation === o}
            onClick={() => {
              setOrientation(o);
              setLoading(true);
            }}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${orientation === o ? 'bg-accent text-accent-ink' : 'border border-line text-heading'}`}
          >
            {o === 'landscape' ? labels.landscape : labels.portrait}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative mx-auto w-full" style={{ maxWidth: orientation === 'landscape' ? 720 : 420 }}>
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
          {loading ? (
            <span className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-medium text-white" role="status">
              {labels.drawing}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          {error ? (
            <p role="alert" className="rounded-xl bg-danger/10 px-4 py-2 text-sm text-danger">
              {labels.error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-heading">{labels.main}</h2>
            <div className="flex flex-wrap gap-2" data-poster-main>
              {still ? thumb('still', still, null, mainIndex === VIDEO_STILL, () => setMain(VIDEO_STILL), undefined, labels.videoStill) : null}
              {photos.map((p) => thumb(`main-${p.index}`, p.src, p.focus, mainIndex === p.index, () => setMain(p.index)))}
            </div>
          </div>
          {orientation === 'landscape' ? (
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
