import type { CSSProperties } from 'react';

/**
 * Where a design's cover sits in the storefront's arch-shaped frames, chosen by the owner in Admin:
 * the point of the picture kept in view (x, y as 0–100 % of its width and height, like CSS object-position)
 * and how far it is zoomed in (1 = just fills the frame).
 */
export type CoverFocus = { x: number; y: number; zoom: number };

export const DEFAULT_COVER_FOCUS: CoverFocus = { x: 50, y: 50, zoom: 1 };
export const COVER_ZOOM_MAX = 3;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** A valid focus from any input (missing or out of range values fall back or are clamped). */
export function normalizeCoverFocus(f: Partial<CoverFocus> | null | undefined): CoverFocus {
  const n = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  return {
    x: Math.round(clamp(n(f?.x, 50), 0, 100) * 10) / 10,
    y: Math.round(clamp(n(f?.y, 50), 0, 100) * 10) / 10,
    zoom: Math.round(clamp(n(f?.zoom, 1), 1, COVER_ZOOM_MAX) * 100) / 100,
  };
}

/**
 * Inline style for a cover <img> with `object-cover` in its frame. Zoom uses the `transform` property, so
 * hover effects that use Tailwind's `scale-*` (the separate `scale` property) still add on top of it.
 */
export function coverImageStyle(f: CoverFocus | null | undefined): CSSProperties | undefined {
  if (!f) return undefined;
  const { x, y, zoom } = normalizeCoverFocus(f);
  return {
    objectPosition: `${x}% ${y}%`,
    ...(zoom > 1 ? { transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` } : {}),
  };
}
