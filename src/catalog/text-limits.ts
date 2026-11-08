/**
 * The longest each customer text may be on a design (owner, 2026-11-08): beyond it the design breaks (the text runs out
 * of its place, is cut off, or runs into another text or the artwork's drawing) on the invitation or the printed card.
 * Measured for every design by `e2e/text-limits.spec.ts` (phone 360 px, Arabic and English, cover and opened
 * invitation, card front and back, shaped cards), then rounded down a little so other languages and words fit too.
 *
 * Keys: a field (`person_1_name`), a wording line (`wording.<key>`), the printed card's back title and message
 * (`card_title`, `card_message`). A text not listed keeps its usual limit (the Field Library's, the wording line's own,
 * `CARD_BACK_LIMITS`). These only ever lower a limit. A new design: run the probe and add its limits here.
 */
export const THEME_TEXT_LIMITS: Readonly<Record<string, Readonly<Record<string, number>>>> = {};

export type CardBackLimits = { title: number; message: number };

/** The limit of a text on a design: its usual `max`, or the design's own when lower. */
export function themeTextLimit(themeKey: string | null | undefined, key: string, max: number): number;
export function themeTextLimit(themeKey: string | null | undefined, key: string, max: number | null): number | null;
export function themeTextLimit(themeKey: string | null | undefined, key: string, max: number | null): number | null {
  const own = themeKey ? THEME_TEXT_LIMITS[themeKey]?.[key] : undefined;
  if (own === undefined) return max;
  return max === null ? own : Math.min(max, own);
}

/** The printed card back's limits on a design. */
export function cardBackLimits(themeKey: string | null | undefined, base: CardBackLimits): CardBackLimits {
  return { title: themeTextLimit(themeKey, 'card_title', base.title), message: themeTextLimit(themeKey, 'card_message', base.message) };
}
