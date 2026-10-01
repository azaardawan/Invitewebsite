import { z } from 'zod';
import { db } from '@/server/db/client';
import { getCurrentAdmin } from '@/server/auth/current';
import { nextAuthStep } from '@/server/auth/session';
import { requestContext } from '@/server/auth/request-context';
import { can } from '@/server/rbac/authz';
import { DocumentError, ensureDocument } from '@/server/documents/documents';

/**
 * Admin download of an invitation's printable card or keepsake PDF
 * (`documents.generate`). `?fresh=1` regenerates it even if nothing changed.
 */
export async function GET(req: Request, { params }: RouteContext<'/admin/api/documents/[id]/[kind]'>) {
  const current = await getCurrentAdmin();
  if (!current || nextAuthStep(current.user, current.session) !== 'ok') return new Response('Unauthorized', { status: 401 });
  if (!can(current.authz, 'documents.generate')) return new Response('Forbidden', { status: 403 });
  const { id, kind } = await params;
  if (!z.uuid().safeParse(id).success || (kind !== 'card' && kind !== 'keepsake')) return new Response('Not found', { status: 404 });
  const force = new URL(req.url).searchParams.get('fresh') === '1';
  try {
    const { pdf, fileName } = await ensureDocument(db(), id, kind, { actor: { adminId: current.user.id, ipHash: (await requestContext()).ipHash }, force });
    return new Response(new Uint8Array(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}"`, 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    if (e instanceof DocumentError) return new Response(e.code, { status: e.code === 'notFound' ? 404 : 409 });
    throw e;
  }
}
