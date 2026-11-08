/**
 * The longest each customer text may be on a design (owner, 2026-11-08): beyond it the design breaks (the text runs out
 * of its place, is cut off, or runs into another text or the artwork's drawing) on the invitation or the printed card.
 * Measured for every design by `e2e/text-limits.spec.ts` (phone 360 px, Arabic and English, cover and opened
 * invitation, card front and back, shaped cards); the low ones were checked by eye. Re-run it after changing a design.
 *
 * Keys: a field (`person_1_name`), a wording line (`wording.<key>`), the printed card's back title and message
 * (`card_title`, `card_message`). A text not listed keeps its usual limit (the Field Library's, the wording line's own,
 * `CARD_BACK_LIMITS`). These only ever lower a limit. A new design: run the probe and add its limits here.
 */
export const THEME_TEXT_LIMITS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  bahjaflix: { 'wording.row1': 16, 'wording.row2': 11, 'wording.row3': 10 },
  'bluebird-garden': { father_name: 11, 'wording.sonOf': 11, card_title: 27, card_message: 61 },
  'blush-floral': { person_1_name: 23, invitation_message: 38 },
  'burgundy-lace': { person_1_name: 19, person_2_name: 22, venue_name: 42, invitation_message: 245 },
  'cherry-confetti': { person_1_name: 28 },
  'cherry-confetti-party': { invitation_message: 32 },
  'delal-bridge': { person_1_name: 23, person_2_name: 18, venue_name: 79 },
  'embroidered-garden': { baby_name: 29, father_name: 27 },
  'espresso-ivory': { person_1_name: 24, person_2_name: 34, person_1_family: 42, person_2_family: 42, venue_name: 79, invitation_message: 245 },
  'golden-arch': { invitation_message: 116, 'wording.followLine': 33 },
  'laurel-bloom': { person_1_name: 32, invitation_message: 205 },
  'pearl-garden': { father_name: 11 },
  'pink-ribbon': { person_1_name: 28 },
  'pink-ribbon-party': { person_1_name: 36, invitation_message: 32 },
  'rosebird-garden': { baby_name: 10, father_name: 10, 'wording.sonOf': 8, card_title: 13, card_message: 96 },
  'royal-olive-crest': { venue_name: 47 },
  'vintage-love-letters': { person_1_name: 11, person_2_name: 19, venue_name: 74 },
  'winter-flower': { person_1_name: 21, person_2_name: 15 },
};

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
