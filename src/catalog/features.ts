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
} as const satisfies Record<string, { requires: readonly string[]; requiresFields: readonly FieldKey[] }>;

export type FeatureKey = keyof typeof FEATURES;
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
