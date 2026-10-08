import 'server-only';
import { connection } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { packages, themes, type CardOptions } from '@/server/db/schema';
import type { Locale } from '@/i18n/config';
import { localized } from '@/lib/localized';
import { signatureUrls } from '@/server/invitation/load';
import { CARD_BACK_LIMITS } from '@/server/orders/extras';
import { listPalettes, themeColorSlots } from '@/server/catalog/palettes';
import type { OrderFormExtras } from '@/components/storefront/order/OrderForm';
import { findByPreviewToken } from '@/server/orders/drafts';
import { orderFields } from './catalog';

/** Everything the review and edit screens need about a customer's draft, found by its preview token. */
export async function draftByToken(token: string) {
  await connection();
  const inv = await findByPreviewToken(db(), token);
  if (!inv) return null;
  const [row] = await db()
    .select({ theme: themes, pkg: packages })
    .from(themes)
    .innerJoin(packages, eq(packages.id, inv.packageId))
    .where(eq(themes.id, inv.themeId));
  if (!row) return null;
  return {
    status: inv.status,
    locale: inv.locale,
    values: inv.fieldValues,
    featureKeys: inv.featureKeys,
    fields: await orderFields(inv.themeId, inv.sectionId, inv.fieldKeys),
    themeId: inv.themeId,
    current: { cardOptions: inv.cardOptions, signatureSrcs: await signatureUrls(db(), inv), colors: inv.colors },
    theme: { key: row.theme.key, name: row.theme.name },
    pkg: { id: row.pkg.id, name: row.pkg.name, priceIqd: row.pkg.priceIqd },
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
  current: { cardOptions?: CardOptions | null; signatureSrcs?: string[]; colors?: Record<string, string> | null } = {},
): Promise<OrderFormExtras> {
  const extras: OrderFormExtras = {};
  if (featureKeys.includes('print_card')) {
    extras.cardBack = { title: current.cardOptions?.backTitle ?? '', message: current.cardOptions?.backMessage ?? '', limits: CARD_BACK_LIMITS };
  }
  if (featureKeys.includes('signature')) extras.signature = { current: current.signatureSrcs ?? [] };
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
