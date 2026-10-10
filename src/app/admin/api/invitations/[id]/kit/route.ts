import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { invitations, themeVersions } from '@/server/db/schema';
import { getCurrentAdmin } from '@/server/auth/current';
import { nextAuthStep } from '@/server/auth/session';
import { can } from '@/server/rbac/authz';
import { KitFileError, getKitFile } from '@/server/kit/documents';
import { kitFileResponse, parseKitRequest } from '@/server/kit/request';
import { isDesignKit } from '@/theme-registry';

/** Admin download of any design-kit file for an invitation (e.g. to help a customer). */
export async function GET(req: Request, ctx: RouteContext<'/admin/api/invitations/[id]/kit'>) {
  const current = await getCurrentAdmin();
  if (!current || nextAuthStep(current.user, current.session) !== 'ok') return new Response('Unauthorized', { status: 401 });
  if (!can(current.authz, 'documents.generate')) return new Response('Forbidden', { status: 403 });
  const { id } = await ctx.params;
  const request = parseKitRequest(new URL(req.url).searchParams);
  if (!z.uuid().safeParse(id).success || !request) return new Response('Bad request', { status: 400 });
  const [row] = await db()
    .select({ inv: invitations, codeRef: themeVersions.codeRef })
    .from(invitations)
    .innerJoin(themeVersions, eq(themeVersions.id, invitations.themeVersionId))
    .where(eq(invitations.id, id));
  if (!row || !isDesignKit(row.codeRef)) return new Response('Not found', { status: 404 });
  try {
    return kitFileResponse(await getKitFile(db(), row.inv, request.unit, request.format, request.options));
  } catch (e) {
    if (e instanceof KitFileError) return new Response('Not found', { status: 404 });
    console.error('[kit] file generation failed', e);
    return new Response('The file could not be made right now.', { status: 503 });
  }
}
