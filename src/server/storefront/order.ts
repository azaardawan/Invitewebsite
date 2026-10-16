import 'server-only';
import { MAIN_CARD, chosenCards, shapeIncluded } from '@/catalog/features';
import { connection } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { invitations, packages, sections, themeVersions, themes, type CardOptions } from '@/server/db/schema';
import { listPhotos, photoSpec } from '@/server/photos/photos';
import { manifestByCodeRef } from '@/theme-registry';
import type { CardShape, DesignSwitch, ThemeManifest, WordingLine } from '@/theme-sdk/manifest';
import type { Locale } from '@/i18n/config';
import { localized } from '@/lib/localized';
import { signatureUrls } from '@/server/invitation/load';
import { CARD_BACK_LIMITS } from '@/server/orders/extras';
import { listPalettes, themeColorSlots } from '@/server/catalog/palettes';
import type { OrderFormExtras } from '@/components/storefront/order/OrderForm';
import { findByPreviewToken } from '@/server/orders/drafts';
import { POLICY_SLUGS, termsPolicyFor } from '@/server/legal/policies';
import { orderFields } from './catalog';
import { BOTTLE_SIZE_KEYS, DEFAULT_BOTTLE_SIZE, type BottleSize } from '@/catalog/products';
import { BIRTH_DATE_DIGITS, BIRTH_DATE_STYLES, formatBirthDate, type DateStyle, type DigitStyle } from '@/lib/birth-date-format';
import { localeMeta } from '@/i18n/config';
import { invitationMessages } from '@/server/invitation/theme-props';
import { baghdadToday } from '@/server/orders/validation';

/** Everything the review and edit screens need about a customer's draft, found by its preview token. */
export async function draftByToken(token: string) {
  await connection();
  const inv = await findByPreviewToken(db(), token);
  if (!inv) return null;
  const [row] = await db()
    .select({ theme: themes, pkg: packages, codeRef: themeVersions.codeRef, manifest: themeVersions.manifest })
    .from(themes)
    .innerJoin(packages, eq(packages.id, inv.packageId))
    .innerJoin(themeVersions, eq(themeVersions.id, inv.themeVersionId))
    .where(eq(themes.id, inv.themeId));
  if (!row) return null;
  const [section] = inv.sectionId ? await db().select({ key: sections.key }).from(sections).where(eq(sections.id, inv.sectionId)) : [];
  return {
    status: inv.status,
    /** The terms this order will accept (newborn invitations have their own): its /legal/… page. */
    termsSlug: POLICY_SLUGS[await termsPolicyFor(db(), section?.key)] as 'terms' | 'terms-newborn',
    locale: inv.locale,
    values: inv.fieldValues,
    featureKeys: inv.featureKeys,
    fields: await orderFields(inv.themeId, inv.sectionId, inv.fieldKeys),
    themeId: inv.themeId,
    current: {
      cardOptions: inv.cardOptions,
      signatureSrcs: await signatureUrls(db(), inv),
      colors: inv.colors,
      stickerShape: inv.stickerShape,
      cardChoices: inv.cardChoices,
      cardShapes: (row.manifest as ThemeManifest).print?.shapes ?? [],
      bottleSize: inv.bottleSize,
      birthDate: { style: inv.birthDateStyle, digits: inv.birthDateDigits, value: inv.fieldValues.birth_date ?? null },
      wordingLines: (row.manifest as ThemeManifest).wording ?? [],
      wording: inv.wording,
      switchDefs: (row.manifest as ThemeManifest).switches ?? [],
      switches: inv.switches,
    },
    fieldKeys: inv.fieldKeys,
    theme: { key: row.theme.key, name: row.theme.name },
    /** False for a design sold only as files (no online invitation). */
    onlineInvitation: manifestByCodeRef(row.codeRef)?.onlineInvitation !== false,
    pkg: { id: row.pkg.id, name: row.pkg.name, priceIqd: row.pkg.priceIqd, lifetime: row.pkg.lifetime },
    /** The design's photo places and the customer's photos so far (packages with `photos`), or null. */
    photos: await photoState(inv),
  };
}

/** A design's photo places (how many, their frame and names in the invitation's language) and the photos so far. */
export async function photoState(inv: typeof invitations.$inferSelect) {
  const spec = await photoSpec(db(), inv);
  if (!spec) return null;
  const list = await listPhotos(db(), inv.id);
  return {
    max: spec.max,
    min: spec.min,
    aspect: spec.aspect,
    aspects: spec.aspects,
    names: Array.from({ length: spec.max }, (_, i) => {
      const l = spec.labels?.[i];
      return l ? (l[inv.locale] ?? l.ar) : null;
    }),
    photos: list.map((p) => ({ position: p.position, src: p.src, width: p.width, height: p.height, focus: p.focus })),
  };
}

/**
 * The optional order-form sections for a package: back of the card (print_card), signature pad
 * (signature) and colour sets (color_choice, when the owner made some), with the current choices.
 */
export async function orderFormExtras(
  locale: Locale,
  themeId: string,
  featureKeys: readonly string[],
  current: {
    cardOptions?: CardOptions | null;
    signatureSrcs?: string[];
    colors?: Record<string, string> | null;
    stickerShape?: 'round' | 'square' | 'both';
    /** The design's shaped cards (manifest `print.shapes`) and the cards chosen (`a5` and/or shape keys). */
    cardShapes?: readonly CardShape[];
    cardChoices?: readonly string[];
    bottleSize?: BottleSize;
    birthDate?: { style: DateStyle; digits: DigitStyle; value: string | null };
    /** The design's changeable lines (manifest `wording`) and what the customer chose so far. */
    wordingLines?: readonly WordingLine[];
    wording?: Record<string, string>;
    /** The design's yes/no choices (manifest `switches`) and the customer's answers so far. */
    switchDefs?: readonly DesignSwitch[];
    switches?: Record<string, boolean>;
  } = {},
  fieldKeys: readonly string[] = [],
): Promise<OrderFormExtras> {
  const extras: OrderFormExtras = {};
  if (featureKeys.includes('print_card')) {
    extras.cardBack = { title: current.cardOptions?.backTitle ?? '', message: current.cardOptions?.backMessage ?? '', limits: CARD_BACK_LIMITS };
  }
  if (featureKeys.includes('signature')) extras.signature = { current: current.signatureSrcs ?? [] };
  if (featureKeys.includes('sticker')) extras.sticker = { current: current.stickerShape ?? 'round' };
  // Only the shapes this package sells (the leaf and the heart are separate features).
  const shapes = (current.cardShapes ?? []).filter((x) => shapeIncluded(featureKeys, x.key));
  if (shapes.length) {
    extras.cardShape = {
      current: chosenCards(featureKeys, current.cardChoices ?? [MAIN_CARD], shapes.map((x) => x.key)),
      options: shapes.map((x) => ({ key: x.key, label: localized(x.label, locale), widthMm: x.widthMm, heightMm: x.heightMm, outline: x.outline })),
    };
  }
  if (featureKeys.includes('bottle_label')) extras.bottle = { current: current.bottleSize ?? DEFAULT_BOTTLE_SIZE, sizes: BOTTLE_SIZE_KEYS };
  if (fieldKeys.includes('birth_date')) {
    // Each style shown on the customer's own date (or today's, until they enter it).
    const example = current.birthDate?.value ?? baghdadToday();
    const names = invitationMessages(locale);
    const examples: Record<string, string> = {};
    for (const style of BIRTH_DATE_STYLES) {
      for (const digits of BIRTH_DATE_DIGITS) {
        examples[`${style}:${digits}`] = (formatBirthDate(example, style, digits, { locale, intlLocale: localeMeta[locale].intlLocale }, names) ?? []).join('\n');
      }
    }
    extras.birthDate = { style: current.birthDate?.style ?? 'long', digits: current.birthDate?.digits ?? 'arab', examples, showDigits: locale !== 'en' };
  }
  if (current.wordingLines?.length) {
    extras.wording = {
      lines: current.wordingLines.map((l) => ({
        key: l.key,
        label: localized(l.label, locale),
        ar: l.ar,
        versions: l.versions ?? {},
        defaultIn: [...(l.defaultIn ?? [])],
        options: [...(l.options ?? [])],
        custom: l.custom !== false,
        maxLength: l.maxLength,
      })),
      current: current.wording ?? {},
    };
  }
  if (current.switchDefs?.length) {
    extras.switches = current.switchDefs.map((d) => ({ key: d.key, label: localized(d.label, locale), on: current.switches?.[d.key] ?? d.default }));
  }
  if (featureKeys.includes('color_choice')) {
    const [slots, palettes] = await Promise.all([themeColorSlots(db(), themeId), listPalettes(db(), themeId, { activeOnly: true })]);
    if (slots.length && palettes.length) {
      const swatches = (colors: Record<string, string>) => slots.map((s) => colors[s.key] ?? s.default);
      const same = (a: Record<string, string>, b: Record<string, string>) => slots.every((s) => (a[s.key] ?? s.default).toLowerCase() === (b[s.key] ?? s.default).toLowerCase());
      extras.palettes = {
        current: current.colors ? (palettes.find((p) => same(p.colors, current.colors!))?.id ?? '') : '',
        original: swatches({}),
        options: palettes.map((p) => ({ id: p.id, name: localized(p.name, locale), swatches: swatches(p.colors) })),
      };
    }
  }
  return extras;
}

/** The ticked printed cards as ExtrasPreview pictures them: key, the shape's name, and each side's width ÷ height. */
export function cardPictures(featureKeys: readonly string[], choices: readonly string[] | null | undefined, shapes: readonly CardShape[], locale: Locale) {
  return chosenCards(featureKeys, choices, shapes.map((x) => x.key)).map((key) => {
    const s = shapes.find((x) => x.key === key);
    if (!s) return { key, ratio: 148 / 210, backRatio: 210 / 148 };
    return { key, label: localized(s.label, locale), ratio: s.widthMm / s.heightMm, backRatio: s.backSideways ? s.heightMm / s.widthMm : s.widthMm / s.heightMm };
  });
}
