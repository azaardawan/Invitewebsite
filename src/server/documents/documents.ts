import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { generatedDocuments, invitations } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { auditActor, type Actor } from '@/server/catalog/common';
import { storage } from '@/server/storage';
import { sha256 } from '@/lib/crypto';
import { printData } from './data';
import { renderPdf, type PdfRenderer } from './render';
import type { DocumentKind } from './tokens';

/** Bump when the print pipeline changes in a way that should regenerate every stored PDF. */
const PIPELINE_VERSION = 1;

const KIND = { card: 'PRINT_CARD', keepsake: 'KEEPSAKE_PDF' } as const;
const FEATURE = { card: 'print_card', keepsake: 'keepsake_pdf' } as const;

export class DocumentError extends Error {
  constructor(public readonly code: 'notFound' | 'notIncluded' | 'notPaid') {
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

  const data = await printData(db, inv, kind);
  const sourceHash = sha256(JSON.stringify({ v: PIPELINE_VERSION, codeRef: data.codeRef, page: data.page, props: data.props }));
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
