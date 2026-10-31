/** Which pictures each couple poster shows (customer's choice). `main`: a photo place, or -1 for the video's still. */
export type PosterChoice = { main?: number; row?: number[] };
export type PosterChoices = { landscape?: PosterChoice; portrait?: PosterChoice };
export type PosterOrientation = 'landscape' | 'portrait';

/** The landscape poster's row holds at most this many photos. */
export const POSTER_ROW_MAX = 5;
/** `main` value for the video's still. */
export const VIDEO_STILL = -1;

/** What a poster shows: its big picture (a photo, or null for the video's still) and its row of photos. */
export type PosterPick<P> = { main: P | null; row: P[] };

/**
 * A poster's pictures from the customer's choices, kept valid as photos come and go: a chosen place that no longer has a
 * photo is dropped. Defaults: the video's still (or the first photo), and the next photos in order for the row.
 */
export function resolvePoster<P extends { index: number }>(choice: PosterChoice | undefined, photos: readonly P[], hasStill: boolean, orientation: PosterOrientation): PosterPick<P> {
  const byIndex = (i: number) => photos.find((p) => p.index === i);
  let main: P | null;
  if (choice?.main === VIDEO_STILL && hasStill) main = null;
  else if (choice?.main !== undefined && byIndex(choice.main)) main = byIndex(choice.main)!;
  else main = hasStill ? null : (photos[0] ?? null);
  if (orientation === 'portrait') return { main, row: [] };
  const chosen = (choice?.row ?? []).map(byIndex).filter((p): p is P => Boolean(p));
  const row = choice?.row ? chosen : photos.filter((p) => p !== main);
  return { main, row: row.slice(0, POSTER_ROW_MAX) };
}

/** Cleans the customer's choices: known orientations, whole numbers, places that exist, no repeats, the row's limit. */
export function cleanPosterChoices(input: unknown, photoCount: number): PosterChoices | null {
  if (!input || typeof input !== 'object') return null;
  const out: PosterChoices = {};
  const place = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < photoCount;
  for (const o of ['landscape', 'portrait'] as const) {
    const c = (input as Record<string, unknown>)[o];
    if (c === undefined) continue;
    if (!c || typeof c !== 'object') return null;
    const { main, row } = c as { main?: unknown; row?: unknown };
    const next: PosterChoice = {};
    if (main !== undefined) {
      if (main !== VIDEO_STILL && !place(main)) return null;
      next.main = main as number;
    }
    if (o === 'landscape' && row !== undefined) {
      if (!Array.isArray(row) || row.length > POSTER_ROW_MAX || !row.every(place) || new Set(row).size !== row.length) return null;
      next.row = row as number[];
    }
    out[o] = next;
  }
  return out;
}
