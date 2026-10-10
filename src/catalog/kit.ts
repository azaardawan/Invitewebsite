import type { KitFeatureKey } from './features';

/**
 * Design kits: instead of an online invitation, the customer downloads
 * print-ready and shareable files (an Instagram story, an A5 card, chocolate
 * stickers, a water-bottle wrap). The platform owns sizes, sheets, cut lines
 * and file generation; a kit theme only designs one unit of each.
 *
 * All geometry is in millimetres (print) or CSS pixels at 96 dpi (screen),
 * so it is the same for the preview, the PDF and the PNG.
 */

export const MM = 96 / 25.4;

/** The individual designs a kit theme draws. */
export const KIT_UNITS = ['story', 'card', 'sticker-round', 'sticker-square', 'bottle'] as const;
export type KitUnitKey = (typeof KIT_UNITS)[number];

export const KIT_FORMATS = ['png', 'pdf'] as const;
export type KitFormat = (typeof KIT_FORMATS)[number];

/** What a package feature gives the customer. */
export const KIT_PRODUCTS: Record<KitFeatureKey, { units: readonly KitUnitKey[]; formats: readonly KitFormat[] }> = {
  kit_story: { units: ['story'], formats: ['png'] },
  kit_card: { units: ['card'], formats: ['pdf', 'png'] },
  kit_sticker: { units: ['sticker-round', 'sticker-square'], formats: ['pdf', 'png'] },
  kit_bottle: { units: ['bottle'], formats: ['pdf', 'png'] },
};

export function kitFeatureForUnit(unit: KitUnitKey): KitFeatureKey {
  return (Object.keys(KIT_PRODUCTS) as KitFeatureKey[]).find((f) => KIT_PRODUCTS[f].units.includes(unit))!;
}

/** Instagram story: 1080 × 1920 px. */
export const STORY = { widthPx: 360, heightPx: 640, scale: 3 } as const;
/** A5 card with 3 mm bleed and a 5 mm safe area. */
export const CARD = { trimW: 148, trimH: 210, bleed: 3, safe: 5 } as const;
/** The most common favour-sticker size; the large PNG can be printed at any size. */
export const STICKER = { trim: 50, bleed: 2, safe: 4, pngPx: 2000 } as const;

/**
 * Bottle wraps: the label goes all the way round the bottle and overlaps by
 * `BOTTLE_OVERLAP_MM` where it is glued. Sizes are typical; the PNG can be
 * resized for any other bottle.
 */
export const BOTTLE_SIZES = {
  '250': { trimW: 170, trimH: 45 },
  '330': { trimW: 200, trimH: 50 },
  '500': { trimW: 215, trimH: 55 },
  '600': { trimW: 225, trimH: 60 },
} as const;
export type BottleSize = keyof typeof BOTTLE_SIZES;
export const BOTTLE_SIZE_KEYS = Object.keys(BOTTLE_SIZES) as BottleSize[];
export const DEFAULT_BOTTLE: BottleSize = '330';
export const BOTTLE = { bleed: 2, safe: 4, overlap: 10 } as const;

/** Print resolution for PNGs of print items. */
export const PRINT_DPI = 300;

/** How the birth date is written; chosen by the customer when downloading. */
export const DATE_STYLES = ['long', 'numeric', 'hijri', 'both'] as const;
export type DateStyle = (typeof DATE_STYLES)[number];
export const DIGIT_STYLES = ['arab', 'latn'] as const;
export type DigitStyle = (typeof DIGIT_STYLES)[number];

export type KitOptions = { dateStyle: DateStyle; digits: DigitStyle; bottle: BottleSize };
export const DEFAULT_KIT_OPTIONS: KitOptions = { dateStyle: 'long', digits: 'arab', bottle: DEFAULT_BOTTLE };

/** One unit's size, in CSS pixels, including bleed. Themes lay out inside it with container units. */
export type UnitGeometry = {
  /** Full drawing area (trim + bleed on every side). */
  width: number;
  height: number;
  /** Bleed on every side: artwork continues here, text never does. */
  bleed: number;
  /** Distance inside the trim edge that text must stay within. */
  safe: number;
  /** Bottle wraps only: the glued strip at the right edge, covered by the other end when wrapped. */
  overlap: number;
  shape: 'rect' | 'circle';
  /** Trim size in mm (null for the story, which is a screen image). */
  trimMm: { w: number; h: number } | null;
};

export function unitGeometry(unit: KitUnitKey, bottle: BottleSize = DEFAULT_BOTTLE): UnitGeometry {
  switch (unit) {
    case 'story':
      return { width: STORY.widthPx, height: STORY.heightPx, bleed: 0, safe: 20, overlap: 0, shape: 'rect', trimMm: null };
    case 'card':
      return box(CARD.trimW, CARD.trimH, CARD.bleed, CARD.safe, 0, 'rect');
    case 'sticker-round':
    case 'sticker-square':
      return box(STICKER.trim, STICKER.trim, STICKER.bleed, STICKER.safe, 0, unit === 'sticker-round' ? 'circle' : 'rect');
    case 'bottle': {
      const b = BOTTLE_SIZES[bottle];
      return box(b.trimW, b.trimH, BOTTLE.bleed, BOTTLE.safe, BOTTLE.overlap, 'rect');
    }
  }
}

function box(w: number, h: number, bleed: number, safe: number, overlap: number, shape: 'rect' | 'circle'): UnitGeometry {
  return { width: (w + 2 * bleed) * MM, height: (h + 2 * bleed) * MM, bleed: bleed * MM, safe: safe * MM, overlap: overlap * MM, shape, trimMm: { w, h } };
}

/** A printed page: its size and where each copy of the unit's bleed box sits (all mm). */
export type SheetLayout = {
  pageW: number;
  pageH: number;
  items: { x: number; y: number }[];
  /** Crop marks around each item's trim box (true for rectangles printed on a sheet). */
  cropMarks: boolean;
  /** A dashed cutting guide on each trim edge (stickers). */
  cutGuide: boolean;
};

const A4 = { w: 210, h: 297 } as const;
/** Crop-mark margin around a single card. */
export const MARK_MARGIN = 12;

/** Lays out as many copies as fit, in a centred grid. */
function grid(pageW: number, pageH: number, itemW: number, itemH: number, gap: number, margin: number): { x: number; y: number }[] {
  const cols = Math.max(1, Math.floor((pageW - 2 * margin + gap) / (itemW + gap)));
  const rows = Math.max(1, Math.floor((pageH - 2 * margin + gap) / (itemH + gap)));
  const usedW = cols * itemW + (cols - 1) * gap;
  const usedH = rows * itemH + (rows - 1) * gap;
  const x0 = (pageW - usedW) / 2;
  const y0 = (pageH - usedH) / 2;
  const items: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) items.push({ x: x0 + c * (itemW + gap), y: y0 + r * (itemH + gap) });
  return items;
}

/** The PDF page for a unit: the card alone with crop marks; stickers and bottle wraps as full sheets. */
export function sheetLayout(unit: Exclude<KitUnitKey, 'story'>, bottle: BottleSize = DEFAULT_BOTTLE): SheetLayout {
  const g = unitGeometry(unit, bottle);
  const w = g.trimMm!.w + 2 * (g.bleed / MM);
  const h = g.trimMm!.h + 2 * (g.bleed / MM);
  if (unit === 'card') {
    return { pageW: w + 2 * MARK_MARGIN, pageH: h + 2 * MARK_MARGIN, items: [{ x: MARK_MARGIN, y: MARK_MARGIN }], cropMarks: true, cutGuide: false };
  }
  if (unit === 'bottle') {
    // A4 landscape: three or more wraps stacked, crop marks in the gaps (they only touch bleed that is cut off).
    return { pageW: A4.h, pageH: A4.w, items: grid(A4.h, A4.w, w, h, 4, 5), cropMarks: true, cutGuide: false };
  }
  // 5 mm page margin suits home and shop printers: 15 stickers per A4.
  return { pageW: A4.w, pageH: A4.h, items: grid(A4.w, A4.h, w, h, 3, 5), cropMarks: false, cutGuide: true };
}

/** PNG output: pixel scale over CSS px, and whether the bleed is cropped off. */
export function pngSpec(unit: KitUnitKey): { scale: number; trimOnly: boolean } {
  if (unit === 'story') return { scale: STORY.scale, trimOnly: false };
  if (unit === 'sticker-round' || unit === 'sticker-square') return { scale: STICKER.pngPx / (STICKER.trim * MM), trimOnly: true };
  return { scale: PRINT_DPI / 96, trimOnly: true };
}

/** Exact pixel size and DPI of a unit's PNG (print items at their trim size). */
export function pngTarget(unit: KitUnitKey, bottle: BottleSize = DEFAULT_BOTTLE): { width: number; height: number; dpi: number } {
  if (unit === 'story') return { width: STORY.widthPx * STORY.scale, height: STORY.heightPx * STORY.scale, dpi: 72 };
  if (unit === 'sticker-round' || unit === 'sticker-square') {
    return { width: STICKER.pngPx, height: STICKER.pngPx, dpi: Math.round(STICKER.pngPx / (STICKER.trim / 25.4)) };
  }
  const trim = unitGeometry(unit, bottle).trimMm!;
  const px = (mm: number) => Math.round((mm / 25.4) * PRINT_DPI);
  return { width: px(trim.w), height: px(trim.h), dpi: PRINT_DPI };
}

/** Units included in a package, in display order. */
export function kitUnits(features: readonly string[]): KitUnitKey[] {
  return KIT_UNITS.filter((u) => features.includes(kitFeatureForUnit(u)));
}

export function isKitUnit(v: unknown): v is KitUnitKey {
  return typeof v === 'string' && (KIT_UNITS as readonly string[]).includes(v);
}
export function isBottleSize(v: unknown): v is BottleSize {
  return typeof v === 'string' && Object.hasOwn(BOTTLE_SIZES, v);
}
export function isDateStyle(v: unknown): v is DateStyle {
  return typeof v === 'string' && (DATE_STYLES as readonly string[]).includes(v);
}
export function isDigitStyle(v: unknown): v is DigitStyle {
  return typeof v === 'string' && (DIGIT_STYLES as readonly string[]).includes(v);
}
