/**
 * The signature board (owner, 2026-11-27): an add-on, bought at the end of the order form, for weddings and newborns.
 * Every guest message, with the guest's name and signature, is written on one big printed board (welcome-board size)
 * in the design's board artwork; when a board holds the owner's number of people, the next ones go on a second board.
 * Each guest writes in their own ink (no boxes), and guests next to each other never share an ink. The couple can move
 * and turn every message, and move one to another board, from their receipt.
 *
 * Offered only on a design whose board artwork the owner uploaded (Admin → the design), at the owner's price
 * (Admin → Settings).
 */
export const SIGNATURE_BOARD_SECTIONS = ['wedding', 'newborn'] as const;

/** The board's size when the owner doesn't set one: 60 × 90 cm portrait, the usual welcome board. */
export const DEFAULT_BOARD_MM = { width: 600, height: 900 } as const;
/** The board sizes the owner may set (mm). */
export const BOARD_MM_LIMITS = { min: 200, max: 1500 } as const;

/** People per board: the owner's choice within these. */
export const PER_BOARD_LIMITS = { min: 6, max: 120 } as const;
export const DEFAULT_PER_BOARD = 30;

/** The most boards one invitation gets (a very big wedding still prints sensibly). */
export const MAX_BOARDS = 12;

/**
 * Where the messages go on the artwork, as a share of the board (0–100) from each edge, and the band above it for the
 * names (`title`: write the names and the keepsake heading there).
 */
export type BoardArea = { top: number; right: number; bottom: number; left: number };
export const DEFAULT_BOARD_AREA: BoardArea = { top: 15, right: 6, bottom: 5, left: 6 };

/**
 * Inks for a light board (each at least 4.5:1 on ivory paper, and clearly different from one another), and for a
 * dark board. A guest's message, name and signature are all in one ink.
 */
export const BOARD_INKS = {
  dark: ['#1f3a7a', '#8c1f3f', '#1f5e3b', '#5b2a86', '#0f5f6b', '#7a4a12', '#3a3a40'],
  light: ['#fff7e8', '#f2cf7a', '#f6b8c8', '#a9e3c4', '#a8d4f2', '#d6c2f2', '#f7c59f'],
} as const;
export type BoardInkSet = keyof typeof BOARD_INKS;

/** How many boards `people` messages need at `perBoard` a board (at least one). */
export function boardsNeeded(people: number, perBoard: number): number {
  return Math.min(MAX_BOARDS, Math.max(1, Math.ceil(people / Math.max(1, perBoard))));
}

export function boardSection(section: string | null | undefined): boolean {
  return !!section && (SIGNATURE_BOARD_SECTIONS as readonly string[]).includes(section);
}

/**
 * Where one message sits, as the couple left it (or as first laid out): its board (0 = the first), the top-left
 * corner and width as a share of the message area (0–100), its turn in degrees, and its ink (index in the ink set).
 */
export type BoardSpot = { b: number; x: number; y: number; w: number; r: number; c: number };
/** The arrangement saved on the invitation: each board's text size, and each message's spot by guest reply id. */
export type BoardArrangement = { v: 1; scales: number[]; spots: Record<string, BoardSpot> };

/** A saved arrangement, checked (anything malformed is dropped: those messages are laid out again). */
export function parseArrangement(input: unknown, opts: { boards?: number } = {}): BoardArrangement | null {
  if (!input || typeof input !== 'object') return null;
  const { v, scales, spots } = input as Record<string, unknown>;
  if (v !== 1 || !Array.isArray(scales) || !spots || typeof spots !== 'object') return null;
  const max = opts.boards ?? MAX_BOARDS;
  const num = (n: unknown, lo: number, hi: number) => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
  const cleanScales = scales.slice(0, MAX_BOARDS).map((s) => (num(s, 0.2, 3) ? Math.round((s as number) * 1000) / 1000 : 1));
  const out: Record<string, BoardSpot> = {};
  const entries = Object.entries(spots as Record<string, unknown>);
  if (entries.length > 2000) return null;
  for (const [id, raw] of entries) {
    if (!/^[0-9a-f-]{36}$/.test(id) || !raw || typeof raw !== 'object') continue;
    const s = raw as Record<string, unknown>;
    if (!num(s.b, 0, max - 1) || !Number.isInteger(s.b) || !num(s.x, -20, 120) || !num(s.y, -20, 120) || !num(s.w, 1, 100) || !num(s.r, -180, 180) || !num(s.c, 0, 6) || !Number.isInteger(s.c)) continue;
    const r1 = (n: unknown) => Math.round((n as number) * 100) / 100;
    out[id] = { b: s.b as number, x: r1(s.x), y: r1(s.y), w: r1(s.w), r: r1(s.r), c: s.c as number };
  }
  return { v: 1, scales: cleanScales, spots: out };
}
