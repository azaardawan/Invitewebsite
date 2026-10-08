import 'server-only';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { assets, themes, type CardDesign, type CardSideDesign } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { publicMediaUrl } from '@/server/storage';
import type { ArtworkSide } from '@/components/print/ArtworkCard';
import { CatalogError, auditActor, type Actor } from './common';

export const CARD_FONTS = ['ruqaa', 'sans', 'vazir'] as const;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const cardSideInput = z.object({
  /** null = go back to the theme's own design for this side. */
  assetId: z.uuid().nullable(),
  ink: hex,
  accent: hex,
  headingFont: z.enum(CARD_FONTS),
  bodyFont: z.enum(CARD_FONTS),
  align: z.enum(['top', 'center', 'bottom']),
  insetMm: z.coerce.number().int().min(0).max(50),
  scale: z.coerce.number().int().min(60).max(160),
});

/** Starting values for the Admin form. */
export const CARD_SIDE_DEFAULTS: Omit<CardSideDesign, 'assetId'> = {
  ink: '#3b2f2a',
  accent: '#8a6a3b',
  headingFont: 'ruqaa',
  bodyFont: 'sans',
  align: 'center',
  insetMm: 18,
  scale: 100,
};

export type ResolvedCardDesign = { front: ArtworkSide | null; back: ArtworkSide | null };

/** The owner's card artwork for a theme, with picture URLs; a side is null when the theme's own design is used. */
export async function themeCardDesign(db: DbOrTx, themeId: string): Promise<ResolvedCardDesign> {
  const [row] = await db.select({ design: themes.cardDesign }).from(themes).where(eq(themes.id, themeId));
  const design = row?.design ?? {};
  const ids = [design.front?.assetId, design.back?.assetId].filter((id): id is string => !!id);
  const keys = ids.length ? new Map((await db.select({ id: assets.id, key: assets.storageKey }).from(assets).where(inArray(assets.id, ids))).map((a) => [a.id, a.key])) : new Map<string, string>();
  const resolve = (side: CardSideDesign | null | undefined): ArtworkSide | null => {
    const key = side ? keys.get(side.assetId) : undefined;
    if (!side || !key) return null;
    return { ink: side.ink, accent: side.accent, headingFont: side.headingFont, bodyFont: side.bodyFont, align: side.align, insetMm: side.insetMm, scale: side.scale, src: publicMediaUrl(key) };
  };
  return { front: resolve(design.front), back: resolve(design.back) };
}

/** Sets (or removes) the owner's artwork for one side of a theme's printable card. Audited. */
export async function updateThemeCardSide(db: DbOrTx, themeId: string, side: 'front' | 'back', input: z.input<typeof cardSideInput>, actor: Actor) {
  const data = cardSideInput.parse(input);
  await db.transaction(async (tx) => {
    const [before] = await tx.select({ design: themes.cardDesign }).from(themes).where(eq(themes.id, themeId)).for('update');
    if (!before) throw new CatalogError('notFound');
    if (data.assetId) {
      const [a] = await tx.select({ kind: assets.kind }).from(assets).where(eq(assets.id, data.assetId));
      if (a?.kind !== 'IMAGE') throw new CatalogError('invalidAsset');
    }
    const { assetId, ...style } = data;
    const next: CardDesign = { ...(before.design ?? {}), [side]: assetId ? { assetId, ...style } : null };
    const empty = !next.front && !next.back;
    await tx.update(themes).set({ cardDesign: empty ? null : next }).where(eq(themes.id, themeId));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'theme.card_design_updated',
      objectType: 'theme',
      objectId: themeId,
      before: { [side]: before.design?.[side] ?? null },
      after: { [side]: next[side] ?? null },
    });
  });
}
