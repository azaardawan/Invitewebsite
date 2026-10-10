import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { invitations, orders } from '@/server/db/schema';
import { getReceipt } from '@/server/orders/receipt';
import { consumeRateLimit } from '@/server/rate-limit';
import { KitFileError, getKitFile } from '@/server/kit/documents';
import { kitFileResponse, parseKitRequest } from '@/server/kit/request';
import { isDesignKit } from '@/theme-registry';
import { sha256 } from '@/lib/crypto';

/** Plenty for a family trying every option, but not a file factory. */
const DOWNLOADS_PER_HOUR = 60;

/**
 * Design-kit downloads for the customer, authorized only by the private
 * receipt token, and only once the order is paid.
 */
export async function GET(req: Request, ctx: RouteContext<'/r/[token]/kit'>) {
  const { token } = await ctx.params;
  const request = parseKitRequest(new URL(req.url).searchParams);
  if (!request) return new Response('Bad request', { status: 400 });
  const receipt = await getReceipt(db(), token);
  if (!receipt || receipt.status !== 'PAID' || !isDesignKit(receipt.snapshot.themeVersion.codeRef)) return new Response('Not found', { status: 404 });
  if (!(await consumeRateLimit(db(), `kit:${sha256(token).slice(0, 32)}`, DOWNLOADS_PER_HOUR, 3600))) {
    return new Response('Too many downloads, please try again later.', { status: 429 });
  }
  const [row] = await db()
    .select({ inv: invitations })
    .from(orders)
    .innerJoin(invitations, eq(invitations.id, orders.invitationId))
    .where(eq(orders.id, receipt.orderId));
  try {
    return kitFileResponse(await getKitFile(db(), row!.inv, request.unit, request.format, request.options));
  } catch (e) {
    if (e instanceof KitFileError) return new Response('Not found', { status: 404 });
    console.error('[kit] file generation failed', e);
    return new Response('The file could not be made right now. Please try again in a minute.', { status: 503 });
  }
}
