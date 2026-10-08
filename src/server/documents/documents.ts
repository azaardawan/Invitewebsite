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
import { renderPdf, renderPreview, type PdfRenderer, type PreviewRenderer } from './render';
import type { DocumentKind } from './tokens';

/** Bump when the print pipeline changes in a way that should regenerate every stored PDF. */
// 3: printable cards have a back page.
const PIPELINE_VERSION = 3;

const KIND = { card: 'PRINT_CARD', keepsake: 'KEEPSAKE_PDF' } as const;
const PREVIEW_KIND = { card: 'PRINT_CARD_PREVIEW', keepsake: 'KEEPSAKE_PREVIEW' } as const;
const FEATURE = { card: 'print_card', keepsake: 'keepsake_pdf' } as const;

export class DocumentError extends Error {
  constructor(public readonly code: 'notFound' | 'notIncluded' | 'notPaid' | 'notPdf' | 'notA5' | 'tooLarge' | 'tooLong') {
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
  opts: { actor?: Actor; force?: boolean; render?: PdfRenderer } = {},
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

  const data = await printData(db, inv, kind);
  const sourceHash = sha256(JSON.stringify({ v: PIPELINE_VERSION, codeRef: data.codeRef, page: data.page, props: data.props, back: 'back' in data ? data.back : null }));
  const fileName = `${kind === 'card' ? 'invitation-card' : 'keepsake'}-${inv.publicId}.pdf`;

  const [existing] = await db
    .select()
    .from(generatedDocuments)
    .where(and(eq(generatedDocuments.invitationId, inv.id), eq(generatedDocuments.kind, KIND[kind])));
  if (existing && existing.sourceHash === sourceHash && !opts.force) {
    const stored = await storage().get(existing.storageKey);
    if (stored) return { pdf: stored, fileName };
  }

  const pdf = await (opts.render ?? renderPdf)(kind, inv.id);
  const storageKey = `documents/${randomUUID()}.pdf`;
  await storage().put(storageKey, pdf, 'application/pdf');
  const messageCount = kind === 'keepsake' && 'messages' in data.props ? data.props.messages.length : null;
  const values = {
    invitationId: inv.id,
    kind: KIND[kind],
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
    .onConflictDoUpdate({ target: [generatedDocuments.invitationId, generatedDocuments.kind], set: values });
  if (opts.actor?.adminId) {
    await recordAudit(db, {
      ...auditActor(opts.actor),
      action: `document.generate`,
      objectType: 'invitation',
      objectId: inv.id,
      after: { kind: KIND[kind], messageCount, forced: Boolean(opts.force) },
    });
  }
  if (existing && existing.storageKey !== storageKey) await storage().delete(existing.storageKey).catch(() => {});
  return { pdf, fileName };
}

/**
 * A JPEG of the document's first page for the receipt (the card, or the keepsake cover). Stored and reused
 * like the PDF while nothing it shows has changed. Null when the team uploaded its own card (no automatic
 * page to picture): the receipt then shows a plain PDF tile.
 */
export async function ensurePreview(db: DbOrTx, invitationId: string, kind: DocumentKind, render: PreviewRenderer = renderPreview): Promise<Buffer | null> {
  const [inv] = await db.select().from(invitations).where(eq(invitations.id, invitationId));
  if (!inv) throw new DocumentError('notFound');
  if (!inv.featureKeys.includes(FEATURE[kind])) throw new DocumentError('notIncluded');
  if (!documentAvailable(inv, kind)) throw new DocumentError('notPaid');
  if (kind === 'card' && inv.cardCustomKey) return null;

  const data = await printData(db, inv, kind);
  const sourceHash = sha256(JSON.stringify({ v: PIPELINE_VERSION, preview: true, codeRef: data.codeRef, props: data.props }));
  const [existing] = await db
    .select()
    .from(generatedDocuments)
    .where(and(eq(generatedDocuments.invitationId, inv.id), eq(generatedDocuments.kind, PREVIEW_KIND[kind])));
  if (existing && existing.sourceHash === sourceHash) {
    const stored = await storage().get(existing.storageKey);
    if (stored) return stored;
  }
  const image = await render(kind, inv.id);
  const storageKey = `documents/${randomUUID()}.jpg`;
  await storage().put(storageKey, image, 'image/jpeg');
  const values = { invitationId: inv.id, kind: PREVIEW_KIND[kind], storageKey, sourceHash, themeVersionId: inv.themeVersionId, messageCount: null, byteSize: image.length, generatedBy: null, generatedAt: new Date() };
  await db
    .insert(generatedDocuments)
    .values(values)
    .onConflictDoUpdate({ target: [generatedDocuments.invitationId, generatedDocuments.kind], set: values });
  if (existing && existing.storageKey !== storageKey) await storage().delete(existing.storageKey).catch(() => {});
  return image;
}

/**
 * The automatic card with its 3 mm bleed for a print shop (Admin only). Rendered fresh each time,
 * not stored. With an uploaded custom card, that file is returned as is.
 */
export async function printShopCard(db: DbOrTx, invitationId: string, render: PdfRenderer = renderPdf) {
  const [inv] = await db.select().from(invitations).where(eq(invitations.id, invitationId));
  if (!inv) throw new DocumentError('notFound');
  if (!documentAvailable(inv, 'card')) throw new DocumentError(inv.featureKeys.includes('print_card') ? 'notPaid' : 'notIncluded');
  if (inv.cardCustomKey) {
    const custom = await storage().get(inv.cardCustomKey);
    if (custom) return { pdf: custom, fileName: `invitation-card-${inv.publicId}.pdf` };
  }
  return { pdf: await render('cardBleed', inv.id), fileName: `invitation-card-${inv.publicId}-print-shop.pdf` };
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

/** A5 portrait: 148 × 210 mm = 419.5 × 595.3 pt. Allow 2 pt for rounding in design tools. */
function isA5(width: number, height: number) {
  return Math.abs(width - 419.53) <= 2 && Math.abs(height - 595.28) <= 2;
}

/**
 * Replaces the automatic card with a PDF the team designed (Canva, Photoshop…). Every page must be
 * A5 portrait. Returns the page count.
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

