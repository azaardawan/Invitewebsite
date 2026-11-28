import { boardsNeeded, MAX_BOARDS, type BoardArrangement, type BoardSpot } from '@/catalog/signature-board';
import type { BoardNote } from './types';

/**
 * Lays the guests' messages out on the boards (owner, 2026-11-27, the approved "loose grid"): each note is as tall
 * as its whole message, a long one twice as wide, packed in five columns from the top; every board's text is
 * scaled together so all its notes fit (nothing is ever cut), then each note is turned a little (up to 3°) and
 * nudged, the same way every time. Guests next to each other never share an ink.
 *
 * Runs in the browser: notes are measured in the board's own field (`field`), drawn by `drawNote`, so the printed
 * board and the editor agree. Spots the couple already set are kept; new messages find room on a board with space,
 * else start the next board.
 */

export const COLS = 5;
/**
 * Columns for a board of `n` notes: few messages get fewer, wider columns (a part-full board still reads as one
 * picture, not a few tall strips), a full board five.
 */
export function colsFor(n: number) {
  return Math.max(2, Math.min(COLS, Math.round(Math.sqrt(n * 0.75))));
}
/** Space between notes, as a share of the field's width. */
const GAP = 0.032;
/** A message longer than this gets a double-width note. */
const WIDE_AT = 70;
/** The largest and smallest text size (1 = normal). */
const MAX_SCALE = 2.2;
const MIN_SCALE = 0.3;
const TURN = 3;

/** A number from 0 to 1 that depends only on `seed` (each note keeps its turn and nudge). */
function seeded(seed: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export type DrawNote = (note: BoardNote) => HTMLElement;
/** Whether a box on the message area (shares 0–100) lies on the artwork's decoration (`touchesKeepOut`). */
export type Blocked = (box: { x: number; y: number; w: number; h: number }) => boolean;
const nothingBlocked: Blocked = () => false;

type Box = { x: number; y: number; w: number; h: number };

/** The note's height as a share of the field's height, at `w` (share of the width) and text size `scale`. */
function measure(field: HTMLElement, el: HTMLElement, w: number, scale: number) {
  el.style.cssText = `position:absolute;visibility:hidden;left:0;top:0;width:${w}%;--s:${scale}`;
  field.appendChild(el);
  const h = (el.offsetHeight / Math.max(1, field.clientHeight)) * 100;
  const overflow = [...el.querySelectorAll('p')].some((p) => p.scrollWidth > p.clientWidth + 1);
  el.remove();
  return { h, overflow };
}

/** Packs one board's notes in columns, shrinking the board's text until they all fit. */
function packBoard(field: HTMLElement, notes: BoardNote[], drawNote: DrawNote, rtl: boolean, blocked: Blocked = nothingBlocked): { scale: number; spots: Record<string, Omit<BoardSpot, 'c' | 'b'> & { h: number }> } {
  const els = new Map(notes.map((n) => [n.id, drawNote(n)]));
  const W = 100;
  const gapX = GAP * 100;
  // The gap in height units: the same distance on the board as across.
  const gapY = (GAP * field.clientWidth * 100) / Math.max(1, field.clientHeight);
  const cols = colsFor(notes.length);
  const cw = (W - gapX * (cols - 1)) / cols;
  let scale = MAX_SCALE;
  for (let pass = 0; pass < 24; pass++) {
    const out: { id: string; x: number; y: number; w: number; h: number }[] = [];
    // Each note takes the highest free place in any column: clear of the notes already placed (with the gap) and of
    // the artwork's decoration, so the room beside a flower or a crest is used too.
    const free = (box: { x: number; y: number; w: number; h: number }) =>
      out.every((o) => box.x + box.w + gapX / 2 <= o.x || o.x + o.w + gapX / 2 <= box.x || box.y + box.h + gapY <= o.y || o.y + o.h + gapY <= box.y) &&
      !blocked({ x: rtl ? W - box.x - box.w : box.x, y: box.y, w: box.w, h: box.h });
    for (const n of notes) {
      let span = n.message.length > WIDE_AT && cols > 2 ? 2 : 1;
      let w = cw * span + gapX * (span - 1);
      let m = measure(field, els.get(n.id)!, w, scale);
      // A word too long for one column gets a double-width note instead of being split.
      if (span === 1 && m.overflow && cols > 2) {
        span = 2;
        w = cw * 2 + gapX;
        m = measure(field, els.get(n.id)!, w, scale);
      }
      // The columns first; with decoration on the artwork, also places a little to either side of them, so a note
      // can fit between a vine and a crest. A column place wins a tie, which keeps the board orderly.
      let best = { x: 0, y: Infinity };
      const xs: number[] = [];
      for (let c = 0; c + span <= cols; c++) xs.push(c * (cw + gapX));
      if (blocked !== nothingBlocked) for (let x = 0; x <= W - w + 0.01; x += 2) xs.push(x);
      for (const x of xs) {
        let y = 0;
        while (y < 400 && !free({ x, y, w, h: m.h })) y += 0.75;
        if (y < best.y - 0.4) best = { x, y };
      }
      out.push({ id: n.id, x: best.x, y: best.y, w, h: m.h });
    }
    const tall = Math.max(0, ...out.map((o) => o.y + o.h));
    if (tall <= 97 || scale <= MIN_SCALE) {
      // Room to spare: the rows spread down the board (never more than half again apart).
      let k = tall > 0 ? Math.min(1.5, 97 / tall) : 1;
      const place = (o: (typeof out)[number], k: number, nudge: boolean) => {
        const nx = nudge ? (seeded(o.id, 1) - 0.5) * cw * 0.12 : 0;
        const ny = nudge ? (seeded(o.id, 2) - 0.5) * gapY : 0;
        const x = rtl ? W - o.x - o.w : o.x;
        return { x: round(x + nx), y: round(Math.max(0, Math.min(100 - o.h, o.y * k + ny))), w: round(o.w), h: o.h, r: round((seeded(o.id, 3) * 2 - 1) * TURN) };
      };
      // Spreading the rows down must not move a note onto the decoration: then they stay where they were packed.
      if (k > 1 && out.some((o) => blocked(place(o, k, false)))) k = 1;
      const spots: Record<string, Omit<BoardSpot, 'c' | 'b'> & { h: number }> = {};
      for (const o of out) {
        const nudged = place(o, k, true);
        spots[o.id] = blocked(nudged) ? place(o, k, false) : nudged;
      }
      return { scale: Math.round(scale * 1000) / 1000, spots };
    }
    scale = Math.max(MIN_SCALE, scale * Math.max(0.85, Math.sqrt(95 / tall)));
  }
  return { scale, spots: {} };
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Whether two notes touch or nearly touch (within about 4% across and 3% down): then they are neighbours. */
export function near(a: Box, b: Box) {
  const mx = 4;
  const my = 3;
  return a.x - mx < b.x + b.w && b.x - mx < a.x + a.w && a.y - my < b.y + b.h && b.y - my < a.y + a.h;
}

/** An ink for `id` that none of its neighbours on its board has (its own, when that is still free). */
export function inkFor(id: string, box: Box, others: { box: Box; c: number }[], inks: number, current?: number) {
  const taken = new Set(others.filter((o) => near(box, o.box)).map((o) => o.c));
  if (current !== undefined && current >= 0 && current < inks && !taken.has(current)) return current;
  const start = Math.floor(seeded(id, 4) * inks);
  for (let k = 0; k < inks; k++) if (!taken.has((start + k) % inks)) return (start + k) % inks;
  return start;
}

/**
 * The whole arrangement: the saved one with every new message placed and every note inked. `heights` gives back
 * each note's height (share of the field), for the editor's neighbour checks.
 */
export function arrange(
  field: HTMLElement,
  notes: BoardNote[],
  opts: { perBoard: number; saved: BoardArrangement | null; inks: number; rtl: boolean; drawNote: DrawNote; blocked?: Blocked },
): { arrangement: BoardArrangement; heights: Record<string, number> } {
  const blocked = opts.blocked ?? nothingBlocked;
  const saved = opts.saved?.spots ?? {};
  const scales = [...(opts.saved?.scales ?? [])];
  const spots: Record<string, BoardSpot> = {};
  const heights: Record<string, number> = {};
  const kept = notes.filter((n) => saved[n.id]);
  const fresh = notes.filter((n) => !saved[n.id]);

  // Nothing arranged yet: the notes are dealt onto boards in order, `perBoard` on each, and packed.
  // Otherwise the kept ones stay; the new ones fill the boards that have room, then new boards.
  const count = (b: number) => Object.values(spots).filter((s) => s.b === b).length;
  for (const n of kept) {
    const s = saved[n.id]!;
    spots[n.id] = { ...s };
    heights[n.id] = measure(field, opts.drawNote(n), s.w, scales[s.b] ?? 1).h;
  }
  const boardsUsed = () => Math.max(0, ...Object.values(spots).map((s) => s.b + 1));
  const leftover: BoardNote[] = [];
  if (kept.length) {
    for (const n of fresh) {
      let placed = false;
      for (let b = 0; b < boardsUsed() && !placed; b++) {
        if (count(b) >= opts.perBoard) continue;
        const spot = freeSpot(field, n, b, scales[b] ?? 1, spots, heights, { ...opts, blocked });
        if (spot) {
          spots[n.id] = spot.spot;
          heights[n.id] = spot.h;
          placed = true;
        }
      }
      if (!placed) leftover.push(n);
    }
  } else leftover.push(...fresh);

  // New boards for the rest, `perBoard` on each.
  const first = boardsUsed();
  const need = boardsNeeded(leftover.length, opts.perBoard);
  for (let i = 0; i < need && leftover.length; i++) {
    const b = Math.min(MAX_BOARDS - 1, first + i);
    const chunk = i === need - 1 || b === MAX_BOARDS - 1 ? leftover.slice(i * opts.perBoard) : leftover.slice(i * opts.perBoard, (i + 1) * opts.perBoard);
    if (!chunk.length) break;
    const packed = packBoard(field, chunk, opts.drawNote, opts.rtl, blocked);
    scales[b] = packed.scale;
    for (const [id, s] of Object.entries(packed.spots)) {
      spots[id] = { b, x: s.x, y: s.y, w: s.w, r: s.r, c: -1 };
      heights[id] = s.h;
    }
    if (b === MAX_BOARDS - 1) break;
  }

  // Inks: none shared with a neighbour.
  for (const n of notes) {
    const s = spots[n.id];
    if (!s) continue;
    const others = notes
      .filter((o) => o.id !== n.id && spots[o.id]?.b === s.b && spots[o.id]!.c >= 0)
      .map((o) => ({ box: { x: spots[o.id]!.x, y: spots[o.id]!.y, w: spots[o.id]!.w, h: heights[o.id] ?? 5 }, c: spots[o.id]!.c }));
    s.c = inkFor(n.id, { x: s.x, y: s.y, w: s.w, h: heights[n.id] ?? 5 }, others, opts.inks, s.c >= 0 ? s.c : undefined);
  }
  const boards = Math.max(1, boardsUsed());
  return { arrangement: { v: 1, scales: Array.from({ length: boards }, (_, b) => scales[b] ?? 1), spots }, heights };
}

/** Room for one new note on board `b`, scanning from the top (from the start of the line in its writing direction). */
function freeSpot(
  field: HTMLElement,
  n: BoardNote,
  b: number,
  scale: number,
  spots: Record<string, BoardSpot>,
  heights: Record<string, number>,
  opts: { rtl: boolean; drawNote: DrawNote; blocked: Blocked },
): { spot: BoardSpot; h: number } | null {
  const cols = colsFor(Object.values(spots).filter((s) => s.b === b).length + 1);
  const cw = (100 - GAP * 100 * (cols - 1)) / cols;
  const w = n.message.length > WIDE_AT && cols > 2 ? cw * 2 + GAP * 100 : cw;
  const { h } = measure(field, opts.drawNote(n), w, scale);
  const boxes = Object.entries(spots)
    .filter(([, s]) => s.b === b)
    .map(([id, s]) => ({ x: s.x - 1, y: s.y - 1, w: s.w + 2, h: (heights[id] ?? 5) + 2 }));
  for (let y = 0; y + h <= 100; y += 1.5) {
    for (let i = 0; i * 2 <= 100 - w; i++) {
      const x = opts.rtl ? 100 - w - i * 2 : i * 2;
      const box = { x, y, w, h };
      if (!opts.blocked(box) && boxes.every((o) => box.x + box.w <= o.x || o.x + o.w <= box.x || box.y + box.h <= o.y || o.y + o.h <= box.y)) {
        return { spot: { b, x: round(x), y: round(y), w: round(w), r: round((seeded(n.id, 3) * 2 - 1) * TURN), c: -1 }, h };
      }
    }
  }
  return null;
}
