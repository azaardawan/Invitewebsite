import 'server-only';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { assets, themes, type CardDesign, type CardSideDesign, type ExtrasLook } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { publicMediaUrl } from '@/server/storage';
import type { ArtworkSide } from '@/components/print/ArtworkCard';
import { CatalogError, auditActor, type Actor } from './common';

export const CARD_FONTS = ['ruqaa', 'sans', 'vazir'] as const;

/** Every artwork slot: the card's sides and the newborn extras. */
export const ARTWORK_SLOTS = ['front', 'back', 'story', 'sticker', 'bottle'] as const;
export type ArtworkSlot = (typeof ARTWORK_SLOTS)[number];
export const EXTRA_SLOTS = ['story', 'sticker', 'bottle'] as const;
export type ExtraSlot = (typeof EXTRA_SLOTS)[number];
const isExtra = (slot: ArtworkSlot): slot is ExtraSlot => (EXTRA_SLOTS as readonly string[]).includes(slot);

/** Each extra's layouts (the first is the default). Drawn by src/components/print/Products.tsx. */
export const PRODUCT_LAYOUTS = {
  story: ['classic', 'top', 'framed'],
  sticker: ['classic', 'name', 'badge'],
  bottle: ['classic', 'split', 'band'],
} as const satisfies Record<ExtraSlot, readonly string[]>;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const cardSideInput = z.object({
  /** Card sides: null = go back to the theme's own design. Extras: null = no picture, drawn on the look. */
  assetId: z.uuid().nullable(),
  ink: hex,
  accent: hex,
  headingFont: z.enum(CARD_FONTS),
  bodyFont: z.enum(CARD_FONTS),
  align: z.enum(['top', 'center', 'bottom']),
  insetMm: z.coerce.number().int().min(0).max(50),
  scale: z.coerce.number().int().min(60).max(160),
  layout: z.string().max(20).optional(),
  show: z.object({ gender: z.boolean(), date: z.boolean(), parents: z.boolean(), quote: z.boolean() }).optional(),
  ownLook: z.boolean().optional(),
  paper: hex.optional(),
});

export const extrasLookInput = z.object({
  paper: hex,
  ink: hex,
  accent: hex,
  headingFont: z.enum(CARD_FONTS),
  bodyFont: z.enum(CARD_FONTS),
  babyColours: z.boolean(),
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

/** What each extra shows until the owner changes it. */
export const DEFAULT_SHOW = { gender: true, date: true, parents: true, quote: true };

/** The shared look when the owner hasn't set one: the design's own colours, calligraphy for names. */
export function defaultLook(colors: Record<string, string>): ExtrasLook {
  return {
    paper: colors.paper ?? colors.background ?? '#fbf7f0',
    ink: colors.ink ?? colors.text ?? '#3b2f2a',
    accent: colors.accent ?? colors.primary ?? '#8a6a3b',
    headingFont: 'ruqaa',
    bodyFont: 'sans',
    babyColours: true,
  };
}

export type ResolvedCardDesign = { front: ArtworkSide | null; back: ArtworkSide | null };
export type ResolvedArtwork = Record<ArtworkSlot, ArtworkSide | null> & { look: ExtrasLook | null };

/** The owner's card artwork for a theme, with picture URLs; a side is null when the theme's own design is used. */
export async function themeCardDesign(db: DbOrTx, themeId: string): Promise<ResolvedCardDesign> {
  const all = await themeArtwork(db, themeId);
  return { front: all.front, back: all.back };
}

/**
 * All of a theme's artwork and settings, with picture URLs: card sides (null unless the owner uploaded
 * artwork), the extras (null when untouched; otherwise their layout, details, colours and optional
 * picture) and the shared look (null = from the design's colours).
 */
export async function themeArtwork(db: DbOrTx, themeId: string): Promise<ResolvedArtwork> {
  const [row] = await db.select({ design: themes.cardDesign }).from(themes).where(eq(themes.id, themeId));
  const design = row?.design ?? {};
  const ids = ARTWORK_SLOTS.map((k) => design[k]?.assetId).filter((id): id is string => !!id);
  const keys = ids.length ? new Map((await db.select({ id: assets.id, key: assets.storageKey }).from(assets).where(inArray(assets.id, ids))).map((a) => [a.id, a.key])) : new Map<string, string>();
  const resolve = (slot: ArtworkSlot): ArtworkSide | null => {
    const side = design[slot];
    if (!side) return null;
    const key = side.assetId ? keys.get(side.assetId) : undefined;
    // A card side only replaces the theme's design with a picture; an extra can be settings only.
    if (!key && !isExtra(slot)) return null;
    return {
      src: key ? publicMediaUrl(key) : '',
      ink: side.ink,
      accent: side.accent,
      headingFont: side.headingFont,
      bodyFont: side.bodyFont,
      align: side.align,
      insetMm: side.insetMm,
      scale: side.scale,
      layout: side.layout,
      show: side.show,
      ownLook: side.ownLook,
      paper: side.paper,
    };
  };
  return { ...(Object.fromEntries(ARTWORK_SLOTS.map((k) => [k, resolve(k)])) as Record<ArtworkSlot, ArtworkSide | null>), look: design.look ?? null };
}

async function lockDesign(tx: DbOrTx, themeId: string) {
  const [before] = await tx.select({ design: themes.cardDesign }).from(themes).where(eq(themes.id, themeId)).for('update');
  if (!before) throw new CatalogError('notFound');
  return before.design ?? {};
}

async function saveDesign(tx: DbOrTx, themeId: string, next: CardDesign) {
  const empty = ARTWORK_SLOTS.every((k) => !next[k]) && !next.look;
  await tx.update(themes).set({ cardDesign: empty ? null : next }).where(eq(themes.id, themeId));
}

/**
 * Sets one slot: a card side (artwork + text style; without artwork it goes back to the theme's own
 * design) or a newborn extra (layout, details shown, own colours or the shared look, optional artwork).
 * `remove` goes back to the default. Audited.
 */
export async function updateThemeCardSide(db: DbOrTx, themeId: string, side: ArtworkSlot, input: z.input<typeof cardSideInput>, actor: Actor, opts: { remove?: boolean } = {}) {
  const data = cardSideInput.parse(input);
  if (isExtra(side) && data.layout !== undefined && !(PRODUCT_LAYOUTS[side] as readonly string[]).includes(data.layout)) throw new CatalogError('invalid');
  await db.transaction(async (tx) => {
    const before = await lockDesign(tx, themeId);
    if (data.assetId) {
      const [a] = await tx.select({ kind: assets.kind }).from(assets).where(eq(assets.id, data.assetId));
      if (a?.kind !== 'IMAGE') throw new CatalogError('invalidAsset');
    }
    const keep = !opts.remove && (isExtra(side) || data.assetId);
    const value: CardSideDesign | null = keep
      ? isExtra(side)
        ? data
        : { assetId: data.assetId, ink: data.ink, accent: data.accent, headingFont: data.headingFont, bodyFont: data.bodyFont, align: data.align, insetMm: data.insetMm, scale: data.scale }
      : null;
    const next: CardDesign = { ...before, [side]: value };
    await saveDesign(tx, themeId, next);
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'theme.card_design_updated',
      objectType: 'theme',
      objectId: themeId,
      before: { [side]: before[side] ?? null },
      after: { [side]: next[side] ?? null },
    });
  });
}

/** Sets (or, with null, resets to the design's colours) the look all of a design's extras share. Audited. */
export async function updateThemeExtrasLook(db: DbOrTx, themeId: string, input: z.input<typeof extrasLookInput> | null, actor: Actor) {
  const look = input ? extrasLookInput.parse(input) : null;
  await db.transaction(async (tx) => {
    const before = await lockDesign(tx, themeId);
    await saveDesign(tx, themeId, { ...before, look });
    await recordAudit(tx, { ...auditActor(actor), action: 'theme.extras_look_updated', objectType: 'theme', objectId: themeId, before: { look: before.look ?? null }, after: { look } });
  });
}
