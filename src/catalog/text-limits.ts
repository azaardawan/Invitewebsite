/**
 * The longest each customer text may be on a design at the design's own size (owner, 2026-11-08): beyond it the design breaks (the text runs out
 * of its place, is cut off, or runs into another text or the artwork's drawing) on the invitation or the printed card.
 * Measured for every design by `e2e/text-limits.spec.ts` (phone 360 px, Arabic and English, cover and opened
 * invitation, card front and back, shaped cards); the low ones were checked by eye. Re-run it after changing a design.
 *
 * Keys: a field (`person_1_name`), a wording line (`wording.<key>`), the printed card's back title and message
 * (`card_title`, `card_message`). A text not listed keeps its usual limit (the Field Library's, the wording line's own,
 * `CARD_BACK_LIMITS`). These only ever lower a limit. Longer texts are written smaller up to `smallerTextLimit` (MIN_TEXT_SCALE), which is
 * the limit customers get. A new design: run the probe and add its limits here.
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

/**
 * Where a design sets the size of a text itself (so writing it smaller does not take), customers may write only what
 * was checked to fit (measured with the smaller writing on, owner 2026-11-08). Overrides `smallerTextLimit`.
 */
const CHECKED_MAX: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  bahjaflix: { 'wording.row3': 11 },
  'bluebird-garden': { father_name: 11, 'wording.sonOf': 11 },
  'blush-floral': { person_1_name: 23, invitation_message: 38 },
  'cherry-confetti': { person_1_name: 28 },
  'cherry-confetti-party': { invitation_message: 32 },
  'espresso-ivory': { person_2_name: 38, person_1_family: 49, person_2_family: 49 },
  'pink-ribbon': { person_1_name: 28 },
  'pink-ribbon-party': { person_1_name: 36, invitation_message: 32 },
  'rosebird-garden': { baby_name: 10, father_name: 10, 'wording.sonOf': 9 },
  'vintage-love-letters': { venue_name: 78 },
  'winter-flower': { person_1_name: 23, person_2_name: 18 },
};

export type CardBackLimits = { title: number; message: number };

/**
 * Owner, 2026-11-08: a text longer than what fits at the design's size is written smaller instead of being refused,
 * down to this share of its size; the hard limit is then the length that fits at that size.
 */
export const MIN_TEXT_SCALE = 0.7;

/** Texts that wrap over several lines: they shrink in both directions (the size goes with the square root). */
const MULTILINE = new Set(['invitation_message', 'family_names', 'card_message']);
const power = (key: string) => (MULTILINE.has(key) ? 0.5 : 1);

/** The longest a text may be on a design when written smaller (`fits` letters fit at the design's own size). */
export function smallerTextLimit(key: string, fits: number): number {
  return Math.floor(fits / MIN_TEXT_SCALE ** (1 / power(key)));
}

/**
 * How much smaller to write a text on a design: 1 while it fits at the design's size, else just enough smaller
 * (never below MIN_TEXT_SCALE) for it to take the room the longest text that fits takes.
 */
export function textScale(themeKey: string | null | undefined, key: string, length: number): number {
  const fits = themeKey ? THEME_TEXT_LIMITS[themeKey]?.[key] : undefined;
  if (fits === undefined || length <= fits) return 1;
  return Math.max(MIN_TEXT_SCALE, (fits / length) ** power(key));
}

/** The customer's texts on a design that must be written smaller, the smallest first (see `FitLongTexts`). */
export function textsToShrink(
  themeKey: string | null | undefined,
  texts: Record<string, string | null | undefined>,
): { text: string; scale: number }[] {
  return Object.entries(texts)
    .flatMap(([key, value]) => {
      const text = value?.trim().replace(/\s+/g, ' ');
      const scale = text ? textScale(themeKey, key, text.length) : 1;
      return text && scale < 1 ? [{ text, scale }] : [];
    })
    .sort((a, b) => a.scale - b.scale);
}

/**
 * The limit of a text on a design: its usual `max`, or, when the design holds less at its own size, the length that
 * fits written smaller (`smallerTextLimit`), whichever is lower.
 */
export function themeTextLimit(themeKey: string | null | undefined, key: string, max: number): number;
export function themeTextLimit(themeKey: string | null | undefined, key: string, max: number | null): number | null;
export function themeTextLimit(themeKey: string | null | undefined, key: string, max: number | null): number | null {
  const fits = themeKey ? THEME_TEXT_LIMITS[themeKey]?.[key] : undefined;
  if (fits === undefined) return max;
  const own = CHECKED_MAX[themeKey!]?.[key] ?? smallerTextLimit(key, fits);
  return max === null ? own : Math.min(max, own);
}

/** The printed card back's limits on a design. */
export function cardBackLimits(themeKey: string | null | undefined, base: CardBackLimits): CardBackLimits {
  return { title: themeTextLimit(themeKey, 'card_title', base.title), message: themeTextLimit(themeKey, 'card_message', base.message) };
}
