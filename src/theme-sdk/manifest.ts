import { z } from 'zod';
import { FEATURE_KEYS, featureDependencyProblems, isPlatformFeature, type FeatureKey } from '@/catalog/features';
import { FIELD_KEYS, type FieldKey } from '@/catalog/fields';

/**
 * A theme version's manifest: what the theme supports and which package
 * combinations it was designed for. See docs/THEME_GUIDE.md and
 * docs/ARCHITECTURE_PROPOSAL.md §6.
 */
export type ThemeManifest = {
  /** Stable identifier, lowercase-kebab. Must match the folder name. */
  key: string;
  /** Integer version. Must match the `v<N>` folder name. */
  version: number;
  /** Working title shown in Admin until the owner sets the display name. */
  title: { ar: string; en: string };
  /** Experience format (see §13 of the architecture). V1: invitations only. */
  experience: 'INVITATION';
  /** Section keys this theme was designed for (e.g. `wedding`); first is the default. */
  sections: string[];
  /** Every field the complete theme renders. */
  fields: FieldKey[];
  /** Every feature the complete theme supports. */
  features: FeatureKey[];
  /**
   * Example package states the designer drew (shown in previews and tested
   * automatically). The owner may build packages from any combination of the
   * theme's features and fields, so a theme must look right with any subset.
   * The complete theme (all fields and features) must be one of them.
   */
  validStates: { features: FeatureKey[]; fields: FieldKey[] }[];
  /** Print companions, required when `print_card` / `keepsake_pdf` are supported. */
  print?: {
    card?: { size: 'A5' | '5x7'; bleedMm: number; qr: boolean };
    keepsake?: { size: 'A4' };
  };
  /** Internal/demo themes can never be activated for sale. */
  internal?: boolean;
};

export function defineTheme<const T extends ThemeManifest>(manifest: T): T {
  return manifest;
}

const fieldKey = z.enum(FIELD_KEYS as [FieldKey, ...FieldKey[]]);
const featureKey = z.enum(FEATURE_KEYS as [FeatureKey, ...FeatureKey[]]);

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && new Set(a).size === a.length && a.every((x) => b.includes(x));

export const manifestSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, 'lowercase-kebab'),
    version: z.number().int().min(1),
    title: z.object({ ar: z.string().min(1), en: z.string().min(1) }),
    experience: z.literal('INVITATION'),
    sections: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)).min(1),
    fields: z.array(fieldKey).min(1),
    features: z.array(featureKey),
    validStates: z.array(z.object({ features: z.array(featureKey), fields: z.array(fieldKey).min(1) })).min(1).max(10),
    print: z
      .object({
        card: z.object({ size: z.enum(['A5', '5x7']), bleedMm: z.number().min(0).max(10), qr: z.boolean() }).optional(),
        keepsake: z.object({ size: z.literal('A4') }).optional(),
      })
      .optional(),
    internal: z.boolean().optional(),
  })
  .superRefine((m, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (new Set(m.fields).size !== m.fields.length) issue('fields contain duplicates');
    if (new Set(m.features).size !== m.features.length) issue('features contain duplicates');
    for (const [i, s] of m.validStates.entries()) {
      for (const f of s.features) if (!m.features.includes(f)) issue(`validStates[${i}] uses undeclared feature ${f}`);
      for (const f of s.fields) if (!m.fields.includes(f)) issue(`validStates[${i}] uses undeclared field ${f}`);
      for (const p of featureDependencyProblems(s.features, s.fields)) issue(`validStates[${i}]: ${p}`);
      m.validStates.slice(0, i).forEach((prev, j) => {
        if (sameSet(prev.features, s.features) && sameSet(prev.fields, s.fields)) issue(`validStates[${i}] duplicates validStates[${j}]`);
      });
    }
    if (!m.validStates.some((s) => sameSet(s.features, m.features) && sameSet(s.fields, m.fields))) {
      issue('validStates must include the complete theme (all features and fields) as the top package');
    }
    if (m.features.includes('print_card') && !m.print?.card) issue('print_card requires print.card');
    if (m.features.includes('keepsake_pdf') && !m.print?.keepsake) issue('keepsake_pdf requires print.keepsake');
  });

/**
 * Why a package's feature/field combination can't be sold with this theme (empty = fine):
 * anything the theme doesn't support, no fields, or a missing dependency
 * (e.g. guest messages need the guest form, the map needs the map-link field).
 */
export function packageShapeProblems(
  manifest: Pick<ThemeManifest, 'features' | 'fields'>,
  features: readonly string[],
  fields: readonly string[],
): string[] {
  const problems: string[] = [];
  for (const f of features) if (!(manifest.features as string[]).includes(f) && !isPlatformFeature(f)) problems.push(`theme does not support feature ${f}`);
  for (const f of fields) if (!(manifest.fields as string[]).includes(f)) problems.push(`theme does not show field ${f}`);
  if (fields.length === 0) problems.push('at least one field is required');
  problems.push(...featureDependencyProblems(features as FeatureKey[], fields as FieldKey[]));
  return problems;
}

/** True if the exact feature/field combination is one of the manifest's designed states. */
export function matchesValidState(
  manifest: Pick<ThemeManifest, 'validStates'>,
  features: readonly string[],
  fields: readonly string[],
): boolean {
  return manifest.validStates.some((s) => sameSet(s.features, features) && sameSet(s.fields, fields));
}

export function codeRef(m: Pick<ThemeManifest, 'key' | 'version'>) {
  return `${m.key}@${m.version}`;
}
