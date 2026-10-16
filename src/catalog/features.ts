import type { FieldKey } from './fields';

/**
 * Platform features a package can include or remove. Each carries platform
 * logic (music player, guest form storage, PDF generation…), so the list is
 * defined in code; packages choose from it in Admin.
 */
export const FEATURES = {
  music: { requires: [], requiresFields: [] },
  countdown: { requires: [], requiresFields: ['event_date'] },
  map: { requires: [], requiresFields: ['venue_map_url'] },
  /** Guest form: name + attending / not attending. */
  rsvp: { requires: [], requiresFields: [] },
  /** Adds a message to the couple in the guest form. */
  congratulations: { requires: ['rsvp'], requiresFields: [] },
  /** Theme-styled PDF of guest messages. */
  keepsake_pdf: { requires: ['congratulations'], requiresFields: [] },
  /** Printable invitation card PDF for the customer. */
  print_card: { requires: [], requiresFields: [] },
  /** The customer may choose the design's leaf-shaped card instead of the card. */
  card_leaf: { requires: ['print_card'], requiresFields: [] },
  /** The customer may choose the design's heart-shaped card instead of the card. */
  card_heart: { requires: ['print_card'], requiresFields: [] },
  /** The customer can change their invitation's details themselves after publishing (a few times). */
  self_edit: { requires: [], requiresFields: [] },
  /** The customer draws their own signature when ordering; the theme shows it where its designer placed it. */
  signature: { requires: [], requiresFields: [] },
  /** The customer picks one of the colour sets the owner made for the theme (themes declare colour slots). */
  color_choice: { requires: [], requiresFields: [] },
  /** An Instagram story picture (1080 × 1920 PNG) on the owner's story artwork. */
  story: { requires: [], requiresFields: [] },
  /** Chocolate stickers, round or square (the customer chooses): a print-ready A4 sheet (PDF) and one sticker (PNG). */
  sticker: { requires: [], requiresFields: [] },
  /** A label that wraps around a water bottle: a print-ready A4 sheet (PDF) and one label (PNG). */
  bottle_label: { requires: [], requiresFields: [] },
} as const satisfies Record<string, { requires: readonly string[]; requiresFields: readonly FieldKey[] }>;

/**
 * Features handled entirely by the platform: any theme can be sold with them,
 * so they are never listed in a theme's manifest.
 */
export const PLATFORM_FEATURES = ['self_edit', 'story', 'sticker', 'bottle_label'] as const satisfies readonly (keyof typeof FEATURES)[];
export function isPlatformFeature(key: string) {
  return (PLATFORM_FEATURES as readonly string[]).includes(key);
}

export type FeatureKey = keyof typeof FEATURES;

/**
 * Shaped printed cards: each shape a design can offer (manifest `print.shapes[].key`) and the feature that sells
 * it, so a package can include the leaf, the heart, both or neither.
 */
export const CARD_SHAPE_FEATURES = { leaf: 'card_leaf', heart: 'card_heart' } as const satisfies Record<string, FeatureKey>;
export type CardShapeKey = keyof typeof CARD_SHAPE_FEATURES;

export function isCardShapeKey(value: string): value is CardShapeKey {
  return Object.hasOwn(CARD_SHAPE_FEATURES, value);
}

/** Whether a package's features include the given shape (an unknown shape is never included). */
export function shapeIncluded(featureKeys: readonly string[], shape: string | null | undefined): boolean {
  return !!shape && isCardShapeKey(shape) && featureKeys.includes(CARD_SHAPE_FEATURES[shape]);
}

/** The regular (A5) card among the cards a customer picks; a design's shapes never use this key. */
export const MAIN_CARD = 'a5';

/**
 * The printed cards an invitation gets: the ones the customer ticked (the A5 card and/or the design's shapes) that the
 * package includes, in a fixed order (the card first, then the shapes in the design's order). Never empty: with
 * nothing valid ticked, the A5 card.
 */
export function chosenCards(featureKeys: readonly string[], choices: readonly string[] | null | undefined, shapeOrder: readonly string[]): string[] {
  const picked = new Set(choices ?? []);
  const list = [MAIN_CARD, ...shapeOrder.filter((k) => k !== MAIN_CARD)].filter((k) => picked.has(k) && (k === MAIN_CARD || shapeIncluded(featureKeys, k)));
  return list.length ? list : [MAIN_CARD];
}
export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];

export function isFeatureKey(value: string): value is FeatureKey {
  return Object.hasOwn(FEATURES, value);
}

/** Problems with a feature/field combination (missing dependencies), as readable codes. */
export function featureDependencyProblems(features: readonly FeatureKey[], fields: readonly FieldKey[]): string[] {
  const problems: string[] = [];
  const f = new Set(features);
  const d = new Set(fields);
  for (const key of features) {
    for (const req of FEATURES[key].requires as readonly FeatureKey[]) {
      if (!f.has(req)) problems.push(`${key} requires feature ${req}`);
    }
    for (const req of FEATURES[key].requiresFields as readonly FieldKey[]) {
      if (!d.has(req)) problems.push(`${key} requires field ${req}`);
    }
  }
  return problems;
}
