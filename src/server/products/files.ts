import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { generatedDocuments, invitations } from '@/server/db/schema';
import { storage } from '@/server/storage';
import { sha256 } from '@/lib/crypto';
import { printData } from '@/server/documents/data';
import { renderProduct, type ProductItem, type ProductRenderer } from '@/server/documents/render';
import { isPaid, productData } from './data';

/** Bump to regenerate every stored extra after a design change in the platform's components (2: denser watermark; 3: the note only). */
const PRODUCT_PIPELINE_VERSION = 3;

const KIND = {
  'story.png': 'STORY_PNG',
  'sticker.png': 'STICKER_PNG',
  'sticker.pdf': 'STICKER_PDF',
  'bottle.png': 'BOTTLE_PNG',
  'bottle.pdf': 'BOTTLE_PDF',
  'story.preview': 'STORY_PREVIEW',
  'sticker.preview': 'STICKER_PREVIEW',
  'bottle.preview': 'BOTTLE_PREVIEW',
  'card.preview': 'CARD_DRAFT_PREVIEW',
  'cardBack.preview': 'CARD_BACK_DRAFT_PREVIEW',
  'sticker-square.png': 'STICKER_SQUARE_PNG',
  'sticker-square.pdf': 'STICKER_SQUARE_PDF',
  'sticker-square.preview': 'STICKER_SQUARE_PREVIEW',
  'collage-polaroids.jpg': 'COLLAGE_POLAROIDS_JPG',
  'collage-polaroids.preview': 'COLLAGE_POLAROIDS_PREVIEW',
  'collage-story.jpg': 'COLLAGE_STORY_JPG',
  'collage-story.preview': 'COLLAGE_STORY_PREVIEW',
  'collage-wall.jpg': 'COLLAGE_WALL_JPG',
  'collage-wall.preview': 'COLLAGE_WALL_PREVIEW',
  'poster-landscape.jpg': 'POSTER_LANDSCAPE_JPG',
  'poster-landscape.preview': 'POSTER_LANDSCAPE_PREVIEW',
  'poster-portrait.jpg': 'POSTER_PORTRAIT_JPG',
  'poster-portrait.preview': 'POSTER_PORTRAIT_PREVIEW',
} as const satisfies Record<ProductItem, string>;

const FEATURE: Record<ProductItem, string> = {
  'story.png': 'story',
  'story.preview': 'story',
  'sticker.png': 'sticker',
  'sticker.pdf': 'sticker',
  'sticker.preview': 'sticker',
  'bottle.png': 'bottle_label',
  'bottle.pdf': 'bottle_label',
  'bottle.preview': 'bottle_label',
  'card.preview': 'print_card',
  'cardBack.preview': 'print_card',
  'sticker-square.png': 'sticker',
  'sticker-square.pdf': 'sticker',
  'sticker-square.preview': 'sticker',
  'collage-polaroids.jpg': 'collage_polaroids',
  'collage-polaroids.preview': 'collage_polaroids',
  'collage-story.jpg': 'collage_story',
  'collage-story.preview': 'collage_story',
  'collage-wall.jpg': 'collage_wall',
  'collage-wall.preview': 'collage_wall',
  'poster-landscape.jpg': 'couple_poster',
  'poster-landscape.preview': 'couple_poster',
  'poster-portrait.jpg': 'couple_poster',
  'poster-portrait.preview': 'couple_poster',
};

/** The square sticker set exists only when the customer chose both shapes. */
export const isSquareSet = (item: ProductItem) => item.startsWith('sticker-square.');

export const PRODUCT_ITEMS = Object.keys(KIND) as ProductItem[];
export const isPreview = (item: ProductItem) => item.endsWith('.preview');

export class ProductError extends Error {
  constructor(public readonly code: 'notFound' | 'notIncluded' | 'notPaid' | 'rateLimited') {
    super(code);
  }
}

export function contentType(item: ProductItem) {
  if (item.endsWith('.pdf')) return 'application/pdf';
  return item === 'sticker.preview' || item === 'sticker-square.preview' || item.endsWith('.png') ? 'image/png' : 'image/jpeg';
}

/** The download name, e.g. `story-ABC123.png`, `stickers-ABC123.pdf`. */
export function productFileName(item: ProductItem, publicId: string, shape?: string | null) {
  const [what, ext] = item.split('.') as [string, string];
  const base =
    {
      story: 'story',
      sticker: ext === 'pdf' ? 'stickers-sheet' : 'sticker',
      'sticker-square': ext === 'pdf' ? 'square-stickers-sheet' : 'square-sticker',
      bottle: ext === 'pdf' ? 'bottle-labels-sheet' : 'bottle-label',
      card: shape ? `card-${shape}` : 'card',
      cardBack: shape ? `card-${shape}-back` : 'cardBack',
    }[what] ?? what;
  return `${base}-${publicId}.${ext === 'preview' ? (contentType(item) === 'image/png' ? 'png' : 'jpg') : ext}`;
}

/**
 * A newborn extra for an invitation, stored and reused while nothing it shows has changed. Previews can be
 * seen before paying and are watermarked until then (the watermark is part of what is stored, so paying
 * renders a clean copy); the files themselves (PNG, PDF sheets) are only given out once paid. `mayRender` is asked
 * only when a fresh file has to be drawn (the costly part): a stored one is handed out without counting.
 */
export async function ensureProductFile(
  db: DbOrTx,
  invitationId: string,
  item: ProductItem,
  render: ProductRenderer = renderProduct,
  mayRender?: () => Promise<boolean>,
  /** For the card's previews: which of the customer's printed cards (`a5` or a shape key); left out, their first. */
  card?: string | null,
) {
  const [inv] = await db.select().from(invitations).where(eq(invitations.id, invitationId));
  if (!inv) throw new ProductError('notFound');
  if (!inv.featureKeys.includes(FEATURE[item])) throw new ProductError('notIncluded');
  if (isSquareSet(item) && inv.stickerShape !== 'both') throw new ProductError('notIncluded');
  const paid = isPaid(inv);
  if (!isPreview(item) && !paid) throw new ProductError('notPaid');

  let variant = '';
  const shown =
    item === 'card.preview' || item === 'cardBack.preview'
      ? await (async () => {
          const d = await printData(db, inv, 'card', { card });
          variant = d.kind === 'card' ? (d.shape?.key ?? '') : '';
          // Each side with what it shows, and which card it is (the A5 card or a shape: leaf, heart).
          return d.kind === 'card' ? { props: d.props, design: item === 'card.preview' ? d.design.front : d.design.back, shape: d.shape?.key ?? null } : null;
        })()
      : await productData(db, inv, isSquareSet(item) ? { stickerShape: 'square' } : {});
  const sourceHash = sha256(JSON.stringify({ v: PRODUCT_PIPELINE_VERSION, item, shown, watermark: !paid }));

  const [existing] = await db
    .select()
    .from(generatedDocuments)
    .where(and(eq(generatedDocuments.invitationId, inv.id), eq(generatedDocuments.kind, KIND[item]), eq(generatedDocuments.variant, variant)));
  if (existing && existing.sourceHash === sourceHash) {
    const stored = await storage().get(existing.storageKey);
    if (stored) return { data: stored, type: contentType(item), fileName: productFileName(item, inv.publicId, variant || null) };
  }
  if (mayRender && !(await mayRender())) throw new ProductError('rateLimited');
  const data = await render(item, inv.id, { bottleSize: inv.bottleSize, ...(variant ? { card: variant } : {}) });
  const ext = contentType(item) === 'application/pdf' ? 'pdf' : contentType(item) === 'image/png' ? 'png' : 'jpg';
  const storageKey = `documents/${randomUUID()}.${ext}`;
  await storage().put(storageKey, data, contentType(item));
  const values = { invitationId: inv.id, kind: KIND[item], variant, storageKey, sourceHash, themeVersionId: inv.themeVersionId, messageCount: null, byteSize: data.length, generatedBy: null, generatedAt: new Date() };
  await db
    .insert(generatedDocuments)
    .values(values)
    .onConflictDoUpdate({ target: [generatedDocuments.invitationId, generatedDocuments.kind, generatedDocuments.variant], set: values });
  if (existing && existing.storageKey !== storageKey) await storage().delete(existing.storageKey).catch(() => {});
  return { data, type: contentType(item), fileName: productFileName(item, inv.publicId, variant || null) };
}

/** Which extras an invitation's package includes, in the order shown to the customer. */
export function includedProducts(inv: Pick<typeof invitations.$inferSelect, 'featureKeys'>) {
  return (['story', 'sticker', 'bottle_label', 'collage_polaroids', 'collage_story', 'collage_wall', 'couple_poster'] as const).filter((f) => inv.featureKeys.includes(f));
}
