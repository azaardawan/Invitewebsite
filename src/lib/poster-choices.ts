import type { PosterOrientation } from '@/catalog/posters';

export type { PosterOrientation };

/**
 * The customer's choices for one couple poster (made on the poster step):
 * - `main`: the big picture: a photo place, -1 for the video's still, or -2 for a picture uploaded for this poster only;
 * - `row`: the photo places in the landscape poster's row, in order;
 * - `texts`: the poster's own words, by the design's text key (manifest `posters.texts`); absent = the page's text or the
 *   design's default, '' = left out.
 */
export type PosterChoice = { main?: number; row?: number[]; texts?: Record<string, string> };
export type PosterChoices = { landscape?: PosterChoice; portrait?: PosterChoice };

/** The landscape poster's row holds at most this many photos. */
export const POSTER_ROW_MAX = 5;
/** `main` value for the video's still. */
export const VIDEO_STILL = -1;
/** `main` value for the picture uploaded for this poster only. */
export const OWN_PICTURE = -2;

/** What a poster shows: its big picture (a photo, or null for the video's still) and its row of photos. */
export type PosterPick<P> = { main: P | null; row: P[] };

/**
 * A poster's pictures from the customer's choices, kept valid as photos come and go: a chosen place that no longer has a
 * photo is dropped. Defaults: the video's still (or the first photo), and the next photos in order for the row. `own`:
 * the picture uploaded for this poster, if any.
 */
export function resolvePoster<P extends { index: number }>(
  choice: PosterChoice | undefined,
  photos: readonly P[],
  hasStill: boolean,
  orientation: PosterOrientation,
  own?: P | null,
): PosterPick<P> {
  const byIndex = (i: number) => photos.find((p) => p.index === i);
  let main: P | null;
  if (choice?.main === OWN_PICTURE && own) main = own;
  else if (choice?.main === VIDEO_STILL && hasStill) main = null;
  else if (choice?.main !== undefined && choice.main >= 0 && byIndex(choice.main)) main = byIndex(choice.main)!;
  else main = hasStill ? null : (photos[0] ?? null);
  if (orientation === 'portrait') return { main, row: [] };
  const chosen = (choice?.row ?? []).map(byIndex).filter((p): p is P => Boolean(p));
  const row = choice?.row ? chosen : photos.filter((p) => p !== main);
  return { main, row: row.slice(0, POSTER_ROW_MAX) };
}

/**
 * Cleans the customer's choices: known orientations, places that have a photo, no repeats, the row's limit, the
 * picture uploaded for that poster (when there is one), and only the design's text keys for that poster, within their
 * length (control characters dropped). Null for anything else.
 */
export function cleanPosterChoices(
  input: unknown,
  places: number | readonly number[],
  opts: { texts?: Partial<Record<PosterOrientation, Record<string, number>>>; own?: readonly PosterOrientation[] } = {},
): PosterChoices | null {
  if (!input || typeof input !== 'object') return null;
  const out: PosterChoices = {};
  // The places that have a photo (a count: places 0…n-1).
  const filled = new Set(typeof places === 'number' ? Array.from({ length: places }, (_, i) => i) : places);
  const place = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && filled.has(v);
  for (const o of ['landscape', 'portrait'] as const) {
    const c = (input as Record<string, unknown>)[o];
    if (c === undefined) continue;
    if (!c || typeof c !== 'object') return null;
    const { main, row, texts } = c as { main?: unknown; row?: unknown; texts?: unknown };
    const next: PosterChoice = {};
    if (main !== undefined) {
      const ok = main === VIDEO_STILL || place(main) || (main === OWN_PICTURE && Boolean(opts.own?.includes(o)));
      if (!ok) return null;
      next.main = main as number;
    }
    if (o === 'landscape' && row !== undefined) {
      if (!Array.isArray(row) || row.length > POSTER_ROW_MAX || !row.every(place) || new Set(row).size !== row.length) return null;
      next.row = row as number[];
    }
    if (texts !== undefined) {
      const allowed = opts.texts?.[o] ?? {};
      if (!texts || typeof texts !== 'object' || Array.isArray(texts)) return null;
      const clean: Record<string, string> = {};
      for (const [key, value] of Object.entries(texts)) {
        const max = allowed[key];
        if (max === undefined || typeof value !== 'string') return null;
        const text = value.normalize('NFC').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').replace(/\n{3,}/g, '\n\n').trim();
        if (Array.from(text).length > max) return null;
        clean[key] = text;
      }
      next.texts = clean;
    }
    out[o] = next;
  }
  return out;
}
