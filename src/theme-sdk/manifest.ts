import { z } from 'zod';
import { CARD_SHAPE_FEATURES, FEATURE_KEYS, featureDependencyProblems, isCardShapeKey, isPlatformFeature, type FeatureKey } from '@/catalog/features';
import { FIELD_KEYS, type FieldKey } from '@/catalog/fields';

/** A shaped printed card a design offers (manifest `print.shapes`). */
/** A design's own text in Arabic and English, plus the owner-approved Kurdish when there is one (else Arabic shows). */
export type ThemeText = { ar: string; en: string; ckb?: string; bdn?: string };

export type CardShape = {
  key: string;
  label: ThemeText;
  widthMm: number;
  heightMm: number;
  outline: string;
  /** The back is read with the card turned a quarter (a landscape design on a portrait card, like the A5 card's back). */
  backSideways?: boolean;
};

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
  title: ThemeText;
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
    /**
     * `qrColors`: the QR code in the design's colours instead of black on white (`dark` must contrast strongly
     * with `light` and with the paper under a transparent `light`, e.g. '#00000000').
     */
    card?: { size: 'A5' | '5x7'; bleedMm: number; qr: boolean; qrColors?: { dark: string; light: string } };
    keepsake?: { size: 'A4' };
    /**
     * Shaped printed cards (features `card_leaf`, `card_heart`; one per shape key `leaf`, `heart`): the customer may choose one of these instead of the
     * card. `outline` is the cut line, an SVG path in millimetres (origin top-left of a `widthMm` ×
     * `heightMm` box), traced from the front. The back is the same shape mirrored (the card turned over), or with
     * `backSideways` the card turned over and a quarter turn (its box is then `heightMm` × `widthMm`).
     * `print/Shape.tsx` draws both sides.
     */
    shapes?: CardShape[];
  };
  /**
   * Colours the theme takes from the platform (CSS variables `--bahja-color-<key>`), each with the
   * theme's own default. Required for `color_choice`: the owner makes colour sets for these slots in
   * Admin and the customer picks one. Without it the theme keeps its fixed colours.
   */
  colors?: { slots: { key: string; label: { ar: string; en: string }; default: string }[] };
  /**
   * `false`: the design has no online invitation page; customers buy only its files (the printable card
   * and newborn extras such as the story, stickers and bottle label). No public link, no QR code, nothing
   * to share; `Theme.tsx` is used only for previews. Default `true`.
   */
  onlineInvitation?: boolean;
  /**
   * Lines of the design's own wording the customer may change on the order form (never Quran or du'a):
   * the Arabic is the default (except in the languages listed in `defaultIn`, which default to their
   * version); `versions` are offered as a choice for orders in that language; or the customer writes their
   * own (up to `maxLength`). A line with `options` offers those fixed alternatives too, and `custom: false`
   * takes away the customer's own text. The theme reads `props.wording[key]`.
   */
  wording?: WordingLine[];
  /**
   * Yes/no choices for the customer on the order form (e.g. "show the father's name on the stickers"),
   * each with its default. The theme reads `props.switches[key]`.
   */
  switches?: DesignSwitch[];
  /** Internal/demo themes can never be activated for sale. */
  internal?: boolean;
};

export type WordingLine = {
  key: string;
  /** What the line is, shown on the order form. */
  label: ThemeText;
  /** The default text, in every language. */
  ar: string;
  /** The same line in other languages, offered as a choice. */
  versions?: Partial<Record<'en' | 'ckb' | 'bdn', string>>;
  /** Languages whose version is the default instead of the Arabic. */
  defaultIn?: readonly ('en' | 'ckb' | 'bdn')[];
  /** Fixed alternatives offered besides `ar` (which stays the first and default), e.g. «أوّل / ثاني / ثالث». */
  options?: readonly string[];
  /** `false`: the customer cannot write their own text for this line (only the offered choices). */
  custom?: boolean;
  maxLength: number;
};

export type DesignSwitch = {
  key: string;
  /** The question, shown next to the tick box on the order form. */
  label: { ar: string; en: string };
  default: boolean;
};

/** A line's default text for an invitation language: its version where `defaultIn` lists the language, else the Arabic. */
export function wordingDefault(line: Pick<WordingLine, 'ar' | 'versions' | 'defaultIn'>, locale: string): string {
  const l = locale as 'en' | 'ckb' | 'bdn';
  return (line.defaultIn?.includes(l) && line.versions?.[l]) || line.ar;
}

export function defineTheme<const T extends ThemeManifest>(manifest: T): T {
  return manifest;
}

const fieldKey = z.enum(FIELD_KEYS as [FieldKey, ...FieldKey[]]);
const featureKey = z.enum(FEATURE_KEYS as [FeatureKey, ...FeatureKey[]]);

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && new Set(a).size === a.length && a.every((x) => b.includes(x));

const themeText = z.object({ ar: z.string().min(1), en: z.string().min(1), ckb: z.string().min(1).optional(), bdn: z.string().min(1).optional() });

export const manifestSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, 'lowercase-kebab'),
    version: z.number().int().min(1),
    title: themeText,
    experience: z.literal('INVITATION'),
    sections: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)).min(1),
    fields: z.array(fieldKey).min(1),
    features: z.array(featureKey),
    validStates: z.array(z.object({ features: z.array(featureKey), fields: z.array(fieldKey).min(1) })).min(1).max(10),
    print: z
      .object({
        card: z
          .object({
            size: z.enum(['A5', '5x7']),
            bleedMm: z.number().min(0).max(10),
            qr: z.boolean(),
            qrColors: z.object({ dark: z.string().regex(/^#[0-9a-fA-F]{6}$/), light: z.string().regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/) }).optional(),
          })
          .optional(),
        keepsake: z.object({ size: z.literal('A4') }).optional(),
        shapes: z
          .array(
            z.object({
              key: z.string().regex(/^[a-z][a-z0-9-]*$/),
              label: themeText,
              widthMm: z.number().min(40).max(300),
              heightMm: z.number().min(40).max(300),
              outline: z.string().regex(/^M[0-9.\s,MLCQZz-]+$/).max(40_000),
              backSideways: z.boolean().optional(),
            }),
          )
          .min(1)
          .max(4)
          .optional(),
      })
      .optional(),
    colors: z
      .object({
        slots: z
          .array(
            z.object({
              key: z.string().regex(/^[a-z][a-z0-9-]*$/),
              label: z.object({ ar: z.string().min(1), en: z.string().min(1) }),
              default: z.string().regex(/^#[0-9a-fA-F]{6}$/),
            }),
          )
          .min(1)
          .max(8),
      })
      .optional(),
    onlineInvitation: z.boolean().optional(),
    wording: z
      .array(
        z.object({
          key: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
          label: themeText,
          ar: z.string().min(1),
          versions: z.object({ en: z.string().min(1), ckb: z.string().min(1), bdn: z.string().min(1) }).partial().optional(),
          defaultIn: z.array(z.enum(['en', 'ckb', 'bdn'])).optional(),
          options: z.array(z.string().min(1)).max(8).optional(),
          custom: z.boolean().optional(),
          maxLength: z.number().int().min(1).max(120),
        }),
      )
      .max(6)
      .optional(),
    switches: z
      .array(z.object({ key: z.string().regex(/^[a-z][a-zA-Z0-9]*$/), label: z.object({ ar: z.string().min(1), en: z.string().min(1) }), default: z.boolean() }))
      .max(6)
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
    for (const [shape, feature] of Object.entries(CARD_SHAPE_FEATURES)) {
      const has = m.print?.shapes?.some((x) => x.key === shape);
      if (m.features.includes(feature) && !has) issue(`${feature} requires a "${shape}" shape in print.shapes`);
      if (has && !m.features.includes(feature)) issue(`print.shapes "${shape}" is sold with the ${feature} feature: list it in features`);
    }
    if (m.print?.shapes?.some((x) => !isCardShapeKey(x.key))) issue(`print.shapes keys must be one of: ${Object.keys(CARD_SHAPE_FEATURES).join(', ')}`);
    if (m.print?.shapes && new Set(m.print.shapes.map((x) => x.key)).size !== m.print.shapes.length) issue('print.shapes contain duplicate keys');
    if (m.print?.shapes?.some((x) => x.key === 'a5')) issue('print.shapes: "a5" is the card itself, not a shape');
    if (m.features.includes('color_choice') && !m.colors) issue('color_choice requires colors.slots');
    if (m.colors && new Set(m.colors.slots.map((c) => c.key)).size !== m.colors.slots.length) issue('colors.slots contain duplicate keys');
    if (m.wording && new Set(m.wording.map((w) => w.key)).size !== m.wording.length) issue('wording contains duplicate keys');
    if (m.switches && new Set(m.switches.map((w) => w.key)).size !== m.switches.length) issue('switches contain duplicate keys');
    for (const w of m.wording ?? []) {
      for (const l of w.defaultIn ?? []) if (!w.versions?.[l]) issue(`wording.${w.key}: defaultIn ${l} has no version`);
      for (const text of [w.ar, ...Object.values(w.versions ?? {}), ...(w.options ?? [])]) if (text.length > w.maxLength) issue(`wording.${w.key}: "${text}" is longer than maxLength`);
    }
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
