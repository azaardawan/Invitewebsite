import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { PDFDocument } from 'pdf-lib';
import type { DbOrTx } from '@/server/db/client';
import { generatedDocuments, invitations, type CardOptions } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { auditActor, type Actor } from '@/server/catalog/common';
import { storage } from '@/server/storage';
import { sha256 } from '@/lib/crypto';
import { printData } from './data';
import { CARD_BACK_LIMITS } from '@/server/orders/extras';
import { renderPdf, renderPreview, renderShapePng, type PdfRenderer, type PreviewKind, type PreviewRenderer, type ShapePngRenderer } from './render';
import { invitationRenderData } from '@/server/invitation/load';
import { isLive } from '@/server/orders/payment';
import type { DocumentKind } from './tokens';

/** Bump when the print pipeline changes in a way that should regenerate every stored PDF. */
// 3: printable cards have a back page. 4: the back is landscape. 5: denser watermark. 6: the preview note only.
const PIPELINE_VERSION = 6;

const KIND = { card: 'PRINT_CARD', keepsake: 'KEEPSAKE_PDF' } as const;
const PREVIEW_KIND = { card: 'PRINT_CARD_PREVIEW', cardBack: 'PRINT_CARD_BACK_PREVIEW', keepsake: 'KEEPSAKE_PREVIEW', og: 'OG_IMAGE' } as const;
const FEATURE = { card: 'print_card', keepsake: 'keepsake_pdf' } as const;

/** The owner's card artwork, when a side uses it (left out otherwise, so older files keep their hash). */
function artwork(data: Awaited<ReturnType<typeof printData>>) {
  return data.kind === 'card' && (data.design.front || data.design.back) ? data.design : undefined;
}

export class DocumentError extends Error {
  constructor(public readonly code: 'notFound' | 'notIncluded' | 'notPaid' | 'notPdf' | 'notA5' | 'tooLarge' | 'tooLong' | 'rateLimited') {
    super(code);
  }
}

type InvitationRow = typeof invitations.$inferSelect;

/** The card exists once the invitation is paid; the keepsake once it has been published. */
export function documentAvailable(inv: Pick<InvitationRow, 'status' | 'featureKeys' | 'publishedAt'>, kind: DocumentKind) {
  if (!inv.featureKeys.includes(FEATURE[kind])) return false;
  return inv.status === 'PAID' || inv.status === 'PUBLISHED' || (inv.status === 'UNPUBLISHED' && inv.publishedAt !== null);
}

/**
 * Returns the PDF for an invitation, reusing the stored copy while nothing it
 * shows has changed, otherwise rendering a fresh one (a few seconds).
 * `force` regenerates even when fresh (Admin "Regenerate").
 */
export async function ensureDocument(
  db: DbOrTx,
  invitationId: string,
  kind: DocumentKind,
  /** `card`: which of the customer's printed cards (`a5` or a shape key); left out, their first. */
  opts: { actor?: Actor; force?: boolean; render?: PdfRenderer; card?: string | null } = {},
): Promise<{ pdf: Buffer; fileName: string }> {
  const [inv] = await db.select().from(invitations).where(eq(invitations.id, invitationId));
  if (!inv) throw new DocumentError('notFound');
  if (!inv.featureKeys.includes(FEATURE[kind])) throw new DocumentError('notIncluded');
  if (!documentAvailable(inv, kind)) throw new DocumentError('notPaid');

  // A card the team designed and uploaded replaces the automatic one.
  if (kind === 'card' && inv.cardCustomKey) {
    const custom = await storage().get(inv.cardCustomKey);
    if (custom) return { pdf: custom, fileName: `invitation-card-${inv.publicId}.pdf` };
  }

  const data = await printData(db, inv, kind, { card: opts.card });
  // A shaped card is its own file (and stored copy), next to the A5 card when the customer wants both.
  const shapeKey = data.kind === 'card' ? (data.shape?.key ?? null) : null;
  const variant = shapeKey ?? '';
  const sourceHash = sha256(JSON.stringify({ v: PIPELINE_VERSION, codeRef: data.codeRef, page: data.page, props: data.props, back: 'back' in data ? data.back : null, design: artwork(data), ...(shapeKey ? { shape: data.kind === 'card' ? data.shape : null } : {}) }));
  const fileName = `${kind === 'card' ? (shapeKey ? `invitation-card-${shapeKey}` : 'invitation-card') : 'keepsake'}-${inv.publicId}.pdf`;

  const [existing] = await db
    .select()
    .from(generatedDocuments)
    .where(and(eq(generatedDocuments.invitationId, inv.id), eq(generatedDocuments.kind, KIND[kind]), eq(generatedDocuments.variant, variant)));
  if (existing && existing.sourceHash === sourceHash && !opts.force) {
    const stored = await storage().get(existing.storageKey);
    if (stored) return { pdf: stored, fileName };
  }

  const pdf = await (opts.render ?? renderPdf)(kind, inv.id, shapeKey ? { card: shapeKey } : {});
  const storageKey = `documents/${randomUUID()}.pdf`;
  await storage().put(storageKey, pdf, 'application/pdf');
  const messageCount = kind === 'keepsake' && 'messages' in data.props ? data.props.messages.length : null;
  const values = {
    invitationId: inv.id,
    kind: KIND[kind],
    variant,
    storageKey,
    sourceHash,
    themeVersionId: inv.themeVersionId,
    messageCount,
    byteSize: pdf.length,
    generatedBy: opts.actor?.adminId ?? null,
    generatedAt: new Date(),
  };
  await db
    .insert(generatedDocuments)
    .values(values)
    .onConflictDoUpdate({ target: [generatedDocuments.invitationId, generatedDocuments.kind, generatedDocuments.variant], set: values });
  if (opts.actor?.adminId) {
    await recordAudit(db, {
      ...auditActor(opts.actor),
      action: `document.generate`,
      objectType: 'invitation',
      objectId: inv.id,
      after: { kind: KIND[kind], ...(variant ? { card: variant } : {}), messageCount, forced: Boolean(opts.force) },
    });
  }
  if (existing && existing.storageKey !== storageKey) await storage().delete(existing.storageKey).catch(() => {});
  return { pdf, fileName };
}

/**
 * A JPEG for the receipt (the card's front or back, the keepsake cover) or for link previews (`og`: the live
 * invitation's cover). Stored and reused while nothing it shows has changed. Null when there is nothing
 * automatic to picture: an uploaded card (the receipt shows a plain PDF tile), or an invitation not live (og).
 */
export async function ensurePreview(
  db: DbOrTx,
  invitationId: string,
  kind: PreviewKind,
  render: PreviewRenderer = renderPreview,
  mayRender?: () => Promise<boolean>,
  /** For the card: which of the customer's printed cards (`a5` or a shape key); left out, their first. */
  card?: string | null,
): Promise<Buffer | null> {
  const [inv] = await db.select().from(invitations).where(eq(invitations.id, invitationId));
  if (!inv) throw new DocumentError('notFound');
  let sourceHash: string;
  let variant = '';
  if (kind === 'og') {
    if (!isLive(inv)) return null;
    // What the cover shows (not the reply counts or guest messages, which change all the time).
    const { codeRef, props } = await invitationRenderData(db, inv, 'live');
    const shown = { ...props, attendance: null, guestbook: null };
    sourceHash = sha256(JSON.stringify({ v: PIPELINE_VERSION, og: true, codeRef, shown }));
  } else {
    const doc = kind === 'cardBack' ? 'card' : kind;
    if (!inv.featureKeys.includes(FEATURE[doc])) throw new DocumentError('notIncluded');
    if (!documentAvailable(inv, doc)) throw new DocumentError('notPaid');
    if (doc === 'card' && inv.cardCustomKey) return null;
    const data = await printData(db, inv, doc, { card });
    const shown = kind === 'cardBack' && data.kind === 'card' ? data.back : data.props;
    const design = data.kind === 'card' ? (kind === 'cardBack' ? data.design.back : data.design.front) ?? undefined : undefined;
    const shape = data.kind === 'card' ? data.shape : null;
    variant = shape?.key ?? '';
    sourceHash = sha256(JSON.stringify({ v: PIPELINE_VERSION, preview: kind, codeRef: data.codeRef, shown, design, ...(shape ? { shape } : {}) }));
  }
  const [existing] = await db
    .select()
    .from(generatedDocuments)
    .where(and(eq(generatedDocuments.invitationId, inv.id), eq(generatedDocuments.kind, PREVIEW_KIND[kind]), eq(generatedDocuments.variant, variant)));
  if (existing && existing.sourceHash === sourceHash) {
    const stored = await storage().get(existing.storageKey);
    if (stored) return stored;
  }
  // Only a fresh picture costs a browser render; the caller may cap those (a stored one is not counted).
  if (mayRender && !(await mayRender())) throw new DocumentError('rateLimited');
  const image = await render(kind, inv.id, variant ? { card: variant } : {});
  const storageKey = `documents/${randomUUID()}.jpg`;
  await storage().put(storageKey, image, 'image/jpeg');
  const values = { invitationId: inv.id, kind: PREVIEW_KIND[kind], variant, storageKey, sourceHash, themeVersionId: inv.themeVersionId, messageCount: null, byteSize: image.length, generatedBy: null, generatedAt: new Date() };
  await db
    .insert(generatedDocuments)
    .values(values)
    .onConflictDoUpdate({ target: [generatedDocuments.invitationId, generatedDocuments.kind, generatedDocuments.variant], set: values });
  if (existing && existing.storageKey !== storageKey) await storage().delete(existing.storageKey).catch(() => {});
  return image;
}

/**
 * The automatic card with its 3 mm bleed for a print shop (Admin only). Rendered fresh each time,
 * not stored. With an uploaded custom card, that file is returned as is.
 */
export async function printShopCard(db: DbOrTx, invitationId: string, render: PdfRenderer = renderPdf, card?: string | null) {
  const [inv] = await db.select().from(invitations).where(eq(invitations.id, invitationId));
  if (!inv) throw new DocumentError('notFound');
  if (!documentAvailable(inv, 'card')) throw new DocumentError(inv.featureKeys.includes('print_card') ? 'notPaid' : 'notIncluded');
  if (inv.cardCustomKey) {
    const custom = await storage().get(inv.cardCustomKey);
    if (custom) return { pdf: custom, fileName: `invitation-card-${inv.publicId}.pdf` };
  }
  const data = await printData(db, inv, 'cardBleed', { card });
  const shapeKey = data.kind === 'card' ? (data.shape?.key ?? null) : null;
  return { pdf: await render('cardBleed', inv.id, shapeKey ? { card: shapeKey } : {}), fileName: `invitation-card-${shapeKey ? `${shapeKey}-` : ''}${inv.publicId}-print-shop.pdf` };
}

/**
 * One side of a shaped card the customer chose (leaf, heart…; `card`, else their first) as a transparent PNG, for print shops that
 * place or resize it themselves. Rendered fresh each time (not stored). Null without a shaped card.
 */
export async function shapeCardPng(db: DbOrTx, invitationId: string, side: 'front' | 'back', render: ShapePngRenderer = renderShapePng, card?: string | null) {
  const [inv] = await db.select().from(invitations).where(eq(invitations.id, invitationId));
  if (!inv) throw new DocumentError('notFound');
  if (!documentAvailable(inv, 'card')) throw new DocumentError(inv.featureKeys.includes('print_card') ? 'notPaid' : 'notIncluded');
  if (inv.cardCustomKey) return null;
  const data = await printData(db, inv, 'card', { card });
  if (data.kind !== 'card' || !data.shape) return null;
  return { png: await render(side, inv.id, { card: data.shape.key }), fileName: `invitation-${data.shape.key}-${side}-${inv.publicId}.png` };
}

export const CARD_LIMITS = { message: 300, extraLine: 120, uploadBytes: 15 * 1024 * 1024 } as const;

/** Saves the team's tweaks to the automatic card; the next download regenerates it. */
export async function updateCardOptions(db: DbOrTx, invitationId: string, input: CardOptions, actor: Actor) {
  const next: CardOptions = {};
  if (input.message !== undefined) next.message = input.message.trim();
  if (input.extraLine?.trim()) next.extraLine = input.extraLine.trim();
  if (input.showQr === false) next.showQr = false;
  if (input.backTitle?.trim()) next.backTitle = input.backTitle.trim();
  if (input.backMessage?.trim()) next.backMessage = input.backMessage.replace(/\r\n/g, '\n').trim();
  if (
    (next.message?.length ?? 0) > CARD_LIMITS.message ||
    (next.extraLine?.length ?? 0) > CARD_LIMITS.extraLine ||
    (next.backTitle?.length ?? 0) > CARD_BACK_LIMITS.title ||
    (next.backMessage?.length ?? 0) > CARD_BACK_LIMITS.message
  )
    throw new DocumentError('tooLong');
  await db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invitations).where(eq(invitations.id, invitationId)).for('update');
    if (!inv) throw new DocumentError('notFound');
    // The back is the customer's text: kept unless this form sends it.
    if (input.backTitle === undefined && inv.cardOptions.backTitle) next.backTitle = inv.cardOptions.backTitle;
    if (input.backMessage === undefined && inv.cardOptions.backMessage) next.backMessage = inv.cardOptions.backMessage;
    await tx.update(invitations).set({ cardOptions: next }).where(eq(invitations.id, inv.id));
    await recordAudit(tx, { ...auditActor(actor), action: 'card.options_updated', objectType: 'invitation', objectId: inv.id, before: inv.cardOptions, after: next });
  });
}

/** A5, portrait (the front) or landscape (the back): 148 × 210 mm = 419.5 × 595.3 pt. Allow 2 pt for rounding in design tools. */
function isA5(width: number, height: number) {
  const portrait = (w: number, h: number) => Math.abs(w - 419.53) <= 2 && Math.abs(h - 595.28) <= 2;
  return portrait(width, height) || portrait(height, width);
}

/**
 * Replaces the automatic card with a PDF the team designed (Canva, Photoshop…). Every page must be
 * A5: usually the front in portrait, then the back in landscape. Returns the page count.
 */
export async function uploadCustomCard(db: DbOrTx, invitationId: string, file: Buffer, actor: Actor) {
  if (file.length > CARD_LIMITS.uploadBytes) throw new DocumentError('tooLarge');
  if (file.subarray(0, 5).toString('latin1') !== '%PDF-') throw new DocumentError('notPdf');
  let pages: { width: number; height: number }[];
  try {
    const doc = await PDFDocument.load(file, { ignoreEncryption: true, updateMetadata: false });
    pages = doc.getPages().map((p) => p.getSize());
  } catch {
    throw new DocumentError('notPdf');
  }
  if (!pages.length || !pages.every((p) => isA5(p.width, p.height))) throw new DocumentError('notA5');

  const [inv] = await db.select().from(invitations).where(eq(invitations.id, invitationId));
  if (!inv) throw new DocumentError('notFound');
  if (!inv.featureKeys.includes('print_card')) throw new DocumentError('notIncluded');
  const key = `documents/${randomUUID()}.pdf`;
  await storage().put(key, file, 'application/pdf');
  await db.transaction(async (tx) => {
    await tx.update(invitations).set({ cardCustomKey: key }).where(eq(invitations.id, inv.id));
    await recordAudit(tx, { ...auditActor(actor), action: 'card.custom_uploaded', objectType: 'invitation', objectId: inv.id, after: { pages: pages.length, bytes: file.length } });
  });
  if (inv.cardCustomKey) await storage().delete(inv.cardCustomKey).catch(() => {});
  return pages.length;
}

/** Goes back to the automatic card. */
export async function removeCustomCard(db: DbOrTx, invitationId: string, actor: Actor) {
  const [inv] = await db.select().from(invitations).where(eq(invitations.id, invitationId));
  if (!inv) throw new DocumentError('notFound');
  if (!inv.cardCustomKey) return;
  await db.transaction(async (tx) => {
    await tx.update(invitations).set({ cardCustomKey: null }).where(eq(invitations.id, inv.id));
    await recordAudit(tx, { ...auditActor(actor), action: 'card.custom_removed', objectType: 'invitation', objectId: inv.id });
  });
  await storage().delete(inv.cardCustomKey).catch(() => {});
}

