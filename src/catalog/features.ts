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
  /** Design kits (src/catalog/kit.ts): downloadable files instead of an online invitation. */
  kit_story: { requires: [], requiresFields: [] },
  kit_card: { requires: [], requiresFields: [] },
  kit_sticker: { requires: [], requiresFields: [] },
  kit_bottle: { requires: [], requiresFields: [] },
} as const satisfies Record<string, { requires: readonly string[]; requiresFields: readonly FieldKey[] }>;

export type FeatureKey = keyof typeof FEATURES;
export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];

/** Features that belong to design kits; invitation themes can't use them and kits can use only these. */
export const KIT_FEATURE_KEYS = ['kit_story', 'kit_card', 'kit_sticker', 'kit_bottle'] as const satisfies readonly FeatureKey[];
export type KitFeatureKey = (typeof KIT_FEATURE_KEYS)[number];

export function isKitFeature(value: string): value is KitFeatureKey {
  return (KIT_FEATURE_KEYS as readonly string[]).includes(value);
}

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
