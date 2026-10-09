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

/** Bump to regenerate every stored extra after a design change in the platform's components. */
const PRODUCT_PIPELINE_VERSION = 1;

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
};

export const PRODUCT_ITEMS = Object.keys(KIND) as ProductItem[];
export const isPreview = (item: ProductItem) => item.endsWith('.preview');

export class ProductError extends Error {
  constructor(public readonly code: 'notFound' | 'notIncluded' | 'notPaid') {
    super(code);
  }
}

export function contentType(item: ProductItem) {
  if (item.endsWith('.pdf')) return 'application/pdf';
  return item === 'sticker.preview' || item.endsWith('.png') ? 'image/png' : 'image/jpeg';
}

/** The download name, e.g. `story-ABC123.png`, `stickers-ABC123.pdf`. */
export function productFileName(item: ProductItem, publicId: string) {
  const [what, ext] = item.split('.') as [string, string];
  const base = { story: 'story', sticker: what === 'sticker' && ext === 'pdf' ? 'stickers-sheet' : 'sticker', bottle: ext === 'pdf' ? 'bottle-labels-sheet' : 'bottle-label', card: 'card' }[what] ?? what;
  return `${base}-${publicId}.${ext === 'preview' ? (contentType(item) === 'image/png' ? 'png' : 'jpg') : ext}`;
}

/**
 * A newborn extra for an invitation, stored and reused while nothing it shows has changed. Previews can be
 * seen before paying and are watermarked until then (the watermark is part of what is stored, so paying
 * renders a clean copy); the files themselves (PNG, PDF sheets) are only given out once paid.
 */
export async function ensureProductFile(db: DbOrTx, invitationId: string, item: ProductItem, render: ProductRenderer = renderProduct) {
  const [inv] = await db.select().from(invitations).where(eq(invitations.id, invitationId));
  if (!inv) throw new ProductError('notFound');
  if (!inv.featureKeys.includes(FEATURE[item])) throw new ProductError('notIncluded');
  const paid = isPaid(inv);
  if (!isPreview(item) && !paid) throw new ProductError('notPaid');

  const shown =
    item === 'card.preview'
      ? await (async () => {
          const d = await printData(db, inv, 'card');
          return d.kind === 'card' ? { props: d.props, design: d.design.front } : null;
        })()
      : await productData(db, inv);
  const sourceHash = sha256(JSON.stringify({ v: PRODUCT_PIPELINE_VERSION, item, shown, watermark: !paid }));

  const [existing] = await db
    .select()
    .from(generatedDocuments)
    .where(and(eq(generatedDocuments.invitationId, inv.id), eq(generatedDocuments.kind, KIND[item])));
  if (existing && existing.sourceHash === sourceHash) {
    const stored = await storage().get(existing.storageKey);
    if (stored) return { data: stored, type: contentType(item), fileName: productFileName(item, inv.publicId) };
  }
  const data = await render(item, inv.id);
  const ext = contentType(item) === 'application/pdf' ? 'pdf' : contentType(item) === 'image/png' ? 'png' : 'jpg';
  const storageKey = `documents/${randomUUID()}.${ext}`;
  await storage().put(storageKey, data, contentType(item));
  const values = { invitationId: inv.id, kind: KIND[item], storageKey, sourceHash, themeVersionId: inv.themeVersionId, messageCount: null, byteSize: data.length, generatedBy: null, generatedAt: new Date() };
  await db
    .insert(generatedDocuments)
    .values(values)
    .onConflictDoUpdate({ target: [generatedDocuments.invitationId, generatedDocuments.kind], set: values });
  if (existing && existing.storageKey !== storageKey) await storage().delete(existing.storageKey).catch(() => {});
  return { data, type: contentType(item), fileName: productFileName(item, inv.publicId) };
}

/** Which extras an invitation's package includes, in the order shown to the customer. */
export function includedProducts(inv: Pick<typeof invitations.$inferSelect, 'featureKeys'>) {
  return (['story', 'sticker', 'bottle_label'] as const).filter((f) => inv.featureKeys.includes(f));
}
