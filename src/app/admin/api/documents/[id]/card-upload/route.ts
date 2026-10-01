import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { getCurrentAdmin } from '@/server/auth/current';
import { nextAuthStep } from '@/server/auth/session';
import { isSameOrigin } from '@/server/auth/same-origin';
import { requestContext } from '@/server/auth/request-context';
import { can } from '@/server/rbac/authz';
import { CARD_LIMITS, DocumentError, uploadCustomCard } from '@/server/documents/documents';

/** Upload a printable card the team designed (A5 PDF); it replaces the automatic card for this invitation. */
export async function POST(req: NextRequest, { params }: RouteContext<'/admin/api/documents/[id]/card-upload'>) {
  if (!isSameOrigin(req.headers)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const current = await getCurrentAdmin();
  if (!current || nextAuthStep(current.user, current.session) !== 'ok') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!can(current.authz, 'documents.generate')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'notFound' }, { status: 404 });
  const length = Number(req.headers.get('content-length') ?? 0);
  if (!length || length > CARD_LIMITS.uploadBytes + 64 * 1024) return NextResponse.json({ error: 'tooLarge' }, { status: 413 });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const value = form.get('file');
    file = value instanceof File ? value : null;
  } catch {
    file = null;
  }
  if (!file) return NextResponse.json({ error: 'notPdf' }, { status: 400 });
  try {
    const pages = await uploadCustomCard(db(), id, Buffer.from(await file.arrayBuffer()), { adminId: current.user.id, ipHash: (await requestContext()).ipHash });
    return NextResponse.json({ ok: true, pages });
  } catch (e) {
    if (e instanceof DocumentError) return NextResponse.json({ error: e.code }, { status: e.code === 'notFound' ? 404 : 400 });
    throw e;
  }
}
