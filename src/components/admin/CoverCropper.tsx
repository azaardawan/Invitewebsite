'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { COVER_ZOOM_MAX, coverImageStyle, normalizeCoverFocus, type CoverFocus } from '@/lib/cover-focus';
import { ImageUpload } from './ImageUpload';

/** The storefront's cover frames, so the owner sees each one while placing the picture. */
const FRAMES = [
  { key: 'grid', w: 3, h: 4.4, round: 'rounded-t-[999px] rounded-b-[10px]' },
  { key: 'top', w: 3, h: 4, round: 'rounded-t-[999px] rounded-b-[10px]' },
  { key: 'home', w: 256, h: 340, round: 'rounded-t-[42%] rounded-b-[10px]' },
] as const;

const EDITOR_WIDTH = 240;

/**
 * Admin → the design → cover: upload the picture, then place it yourself: drag it inside the arch, zoom,
 * or use the sliders; the small frames show how each storefront card will cut it. The position is sent
 * with the form (coverFocusX, coverFocusY, coverFocusZoom).
 */
export function CoverCropper({
  label,
  initial,
  initialFocus,
}: {
  label: string;
  initial: { id: string; url: string } | null;
  initialFocus: CoverFocus | null;
}) {
  const t = useTranslations('admin.catalog.themes.coverCrop');
  const [image, setImage] = useState(initial);
  const [focus, setFocus] = useState<CoverFocus>(normalizeCoverFocus(initialFocus));
  const drag = useRef<{ x: number; y: number; start: CoverFocus; natural: { w: number; h: number } } | null>(null);
  const editorHeight = Math.round((EDITOR_WIDTH * FRAMES[0].h) / FRAMES[0].w);

  const set = (next: Partial<CoverFocus>) => setFocus((f) => normalizeCoverFocus({ ...f, ...next }));

  // How far the picture overflows the editor frame (after zoom): dragging that many pixels moves it end to end.
  function overflow(start: CoverFocus, natural: { w: number; h: number }) {
    if (!natural.w || !natural.h) return { x: 0, y: 0 };
    const s = Math.max(EDITOR_WIDTH / natural.w, editorHeight / natural.h);
    return { x: start.zoom * natural.w * s - EDITOR_WIDTH, y: start.zoom * natural.h * s - editorHeight };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const o = overflow(d.start, d.natural);
    set({
      x: o.x > 1 ? d.start.x - ((e.clientX - d.x) / o.x) * 100 : d.start.x,
      y: o.y > 1 ? d.start.y - ((e.clientY - d.y) / o.y) * 100 : d.start.y,
    });
  }

  const slider = (key: keyof CoverFocus, min: number, max: number, step: number) => (
    <label className="block text-sm">
      <span className="mb-1 block">{t(key)}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={focus[key]}
        onChange={(e) => set({ [key]: Number(e.target.value) })}
        className="w-full accent-[var(--color-accent)]"
        aria-label={t(key)}
        // Left is left on every page, also in Arabic and Kurdish.
        dir="ltr"
      />
    </label>
  );

  return (
    <div className="space-y-3" data-cover-cropper>
      <ImageUpload
        name="coverAssetId"
        label={label}
        initial={initial}
        preview={false}
        onChange={(v) => {
          setImage(v);
          // A new picture starts centred.
          if (v?.id !== image?.id) setFocus(normalizeCoverFocus(null));
        }}
      />
      {image ? (
        <div className="space-y-3 rounded-md border border-line p-3">
          <input type="hidden" name="coverFocusX" value={focus.x} />
          <input type="hidden" name="coverFocusY" value={focus.y} />
          <input type="hidden" name="coverFocusZoom" value={focus.zoom} />
          <p className="text-sm text-muted">{t('help')}</p>
          <div className="flex flex-wrap items-start gap-5">
            <div
              className={`relative cursor-grab touch-none overflow-hidden bg-paper active:cursor-grabbing ${FRAMES[0].round}`}
              style={{ width: EDITOR_WIDTH, height: editorHeight }}
              onPointerDown={(e) => {
                const img = e.currentTarget.querySelector('img');
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = { x: e.clientX, y: e.clientY, start: focus, natural: { w: img?.naturalWidth ?? 0, h: img?.naturalHeight ?? 0 } };
              }}
              onPointerMove={onPointerMove}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
              data-cover-editor
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin editor of an uploaded asset */}
              <img
                src={image.url}
                alt=""
                draggable={false}
                className="pointer-events-none size-full object-cover select-none"
                style={coverImageStyle(focus)}
              />
            </div>
            <div className="min-w-[200px] flex-1 space-y-3">
              {slider('x', 0, 100, 0.5)}
              {slider('y', 0, 100, 0.5)}
              {slider('zoom', 1, COVER_ZOOM_MAX, 0.01)}
              <button type="button" className="rounded-md border border-line px-3 py-1.5 text-sm" onClick={() => setFocus(normalizeCoverFocus(null))}>
                {t('centre')}
              </button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t('previews')}</p>
            <div className="flex flex-wrap items-end gap-4">
              {FRAMES.map((f) => (
                <figure key={f.key} className="space-y-1" data-cover-preview={f.key}>
                  <div className={`overflow-hidden bg-paper ${f.round}`} style={{ width: 96, height: Math.round((96 * f.h) / f.w) }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded asset */}
                    <img src={image.url} alt="" className="size-full object-cover" style={coverImageStyle(focus)} />
                  </div>
                  <figcaption className="text-center text-xs text-muted">{t(`frames.${f.key}`)}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
