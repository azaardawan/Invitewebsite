import { z } from 'zod';
import { db } from '@/server/db/client';
import { getCurrentAdmin } from '@/server/auth/current';
import { nextAuthStep } from '@/server/auth/session';
import { requestContext } from '@/server/auth/request-context';
import { can } from '@/server/rbac/authz';
import { DocumentError, ensureDocument, printShopCard } from '@/server/documents/documents';

/**
 * Admin download of an invitation's printable card or keepsake PDF
 * (`documents.generate`). `?fresh=1` regenerates it even if nothing changed;
 * `?bleed=1` (card only) gives the print-shop version with 3 mm bleed.
 */
export async function GET(req: Request, { params }: RouteContext<'/admin/api/documents/[id]/[kind]'>) {
  const current = await getCurrentAdmin();
  if (!current || nextAuthStep(current.user, current.session) !== 'ok') return new Response('Unauthorized', { status: 401 });
  if (!can(current.authz, 'documents.generate')) return new Response('Forbidden', { status: 403 });
  const { id, kind } = await params;
  if (!z.uuid().safeParse(id).success || (kind !== 'card' && kind !== 'keepsake')) return new Response('Not found', { status: 404 });
  const sp = new URL(req.url).searchParams;
  const force = sp.get('fresh') === '1';
  try {
    const actor = { adminId: current.user.id, ipHash: (await requestContext()).ipHash };
    const { pdf, fileName } = kind === 'card' && sp.get('bleed') === '1' ? await printShopCard(db(), id) : await ensureDocument(db(), id, kind, { actor, force });
    return new Response(new Uint8Array(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}"`, 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    if (e instanceof DocumentError) return new Response(e.code, { status: e.code === 'notFound' ? 404 : 409 });
    throw e;
  }
}
