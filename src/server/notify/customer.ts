import 'server-only';
import { and, asc, eq, gt, isNull } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { customers, invitations, orders, themeVersions } from '@/server/db/schema';
import { ensurePreview } from '@/server/documents/documents';
import { isLive } from '@/server/orders/payment';
import { receiptTokenFor } from '@/server/orders/tokens';
import { invitationPath } from '@/lib/ids';
import { manifestByCodeRef } from '@/theme-registry';
import { env } from '@/server/env';

/** Orders paid this long ago or less are still delivered (a missed run catches up; older ones never surprise anyone). */
const CATCH_UP_MS = 2 * 24 * 3600_000;

type Template = { name: string; params: string[] };
export type WhatsAppSender = (toE164: string, lang: string, template: Template) => Promise<boolean>;

/** Whether the customer messages are set up (docs/WHATSAPP_SETUP.md). */
export function customerWhatsAppEnabled() {
  const e = env();
  return Boolean(e.WHATSAPP_ACCESS_TOKEN && e.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * One approved template message through the WhatsApp Business Cloud API. Never throws: a failure is logged and
 * reported as false (the customer still has their page; Admin can send the links by hand).
 */
export const sendWhatsAppTemplate: WhatsAppSender = async (toE164, lang, template) => {
  const e = env();
  if (!e.WHATSAPP_ACCESS_TOKEN || !e.WHATSAPP_PHONE_NUMBER_ID) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/${e.WHATSAPP_API_VERSION}/${e.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${e.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toE164.replace(/^\+/, ''),
        type: 'template',
        template: {
          name: template.name,
          language: { code: lang },
          components: [{ type: 'body', parameters: template.params.map((text) => ({ type: 'text', text })) }],
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) console.error('[notify] WhatsApp message to customer failed', res.status, (await res.text().catch(() => '')).slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error('[notify] WhatsApp message to customer failed', err);
    return false;
  }
};

/** The template language for an invitation: Arabic, or English for English invitations (Kurdish ones get Arabic). */
function templateLang(locale: string) {
  return locale === 'en' ? 'en' : 'ar';
}

/**
 * After payment (owner, 2026-10-29): the customer immediately gets, on the WhatsApp number they gave,
 * 1. their private page (everything they paid for: printable cards, edits, files…), and
 * 2. the invitation link to send their guests (designs with an online invitation),
 * and the link-preview picture is drawn now, so the first share already shows it. Each paid order is delivered once
 * (`orders.delivered_at`, claimed atomically, so two runs or replicas never send twice). Returns what was done.
 */
export async function deliverPaidOrders(db: DbOrTx, opts: { now?: Date; send?: WhatsAppSender; warm?: (invitationId: string) => Promise<unknown>; enabled?: boolean } = {}) {
  const now = opts.now ?? new Date();
  const send = opts.send ?? sendWhatsAppTemplate;
  const enabled = opts.enabled ?? customerWhatsAppEnabled();
  const warm = opts.warm ?? ((id: string) => ensurePreview(db, id, 'og'));
  const due = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, 'PAID'), isNull(orders.deliveredAt), gt(orders.paidAt, new Date(now.getTime() - CATCH_UP_MS))))
    .orderBy(asc(orders.paidAt))
    .limit(20);
  const result = { delivered: 0, messages: 0, failed: 0 };
  const e = env();
  const site = e.APP_URL.replace(/\/$/, '');
  for (const { id } of due) {
    // Claim it first: whoever sets delivered_at sends.
    const [claimed] = await db
      .update(orders)
      .set({ deliveredAt: now })
      .where(and(eq(orders.id, id), isNull(orders.deliveredAt)))
      .returning({ id: orders.id, invitationId: orders.invitationId, customerId: orders.customerId });
    if (!claimed) continue;
    result.delivered++;
    const [row] = await db
      .select({ inv: invitations, codeRef: themeVersions.codeRef, phone: customers.phoneE164, name: customers.name })
      .from(invitations)
      .innerJoin(themeVersions, eq(themeVersions.id, invitations.themeVersionId))
      .innerJoin(customers, eq(customers.id, claimed.customerId))
      .where(eq(invitations.id, claimed.invitationId));
    if (!row) continue;
    const online = manifestByCodeRef(row.codeRef)?.onlineInvitation !== false;
    const live = online && isLive(row.inv, now);
    if (live) await warm(row.inv.id).catch((err) => console.error('[og] warm-up failed', err));
    if (!enabled || !row.phone) continue;
    const lang = templateLang(row.inv.locale);
    const firstName = row.name.trim().split(/\s+/)[0] || row.name;
    const page = `${site}/r/${receiptTokenFor(claimed.id)}`;
    const sent = [await send(row.phone, lang, { name: e.WHATSAPP_TEMPLATE_PAGE, params: [firstName, page] })];
    if (live) sent.push(await send(row.phone, lang, { name: e.WHATSAPP_TEMPLATE_INVITATION, params: [`${site}${invitationPath(row.inv.slug, row.inv.publicId)}`] }));
    result.messages += sent.filter(Boolean).length;
    result.failed += sent.filter((ok) => !ok).length;
  }
  return result;
}
