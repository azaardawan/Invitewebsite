/**
 * Bottle labels come in four sizes; the customer picks theirs on the order form. Each wraps the bottle
 * with about 1 cm overlap (width × height in mm). Sizes are typical; the PNG can be resized for any bottle.
 */
export const BOTTLE_SIZES = {
  '250': { width: 170, height: 45 },
  '330': { width: 200, height: 50 },
  '500': { width: 215, height: 55 },
  '600': { width: 225, height: 60 },
} as const;
export type BottleSize = keyof typeof BOTTLE_SIZES;
export const BOTTLE_SIZE_KEYS = Object.keys(BOTTLE_SIZES) as BottleSize[];
export const DEFAULT_BOTTLE_SIZE: BottleSize = '500';

export function isBottleSize(v: unknown): v is BottleSize {
  return typeof v === 'string' && Object.hasOwn(BOTTLE_SIZES, v);
}

/** The cut gap between bottle labels on a print sheet (mm). */
export const BOTTLE_GAP_MM = 6;

/** How many labels of this size fit on an A4 landscape sheet (8 mm margins, cut gaps), at least one. */
export function bottlesPerSheet(size: BottleSize): number {
  const { height } = BOTTLE_SIZES[size];
  return Math.max(1, Math.floor((210 - 2 * 8 + BOTTLE_GAP_MM) / (height + BOTTLE_GAP_MM)));
}
