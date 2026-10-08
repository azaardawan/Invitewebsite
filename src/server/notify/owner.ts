import 'server-only';
import { env } from '@/server/env';
import { formatIqd } from '@/lib/currency';

/**
 * Sends the owner a WhatsApp message (CallMeBot) when OWNER_WHATSAPP_PHONE and CALLMEBOT_API_KEY are set.
 * Never throws and never blocks the order: a failed message is only logged. Messages carry no customer
 * name or phone (they pass through a third party); the link opens the order in Admin.
 */
export async function notifyOwner(text: string, fetchImpl: typeof fetch = fetch) {
  const e = env();
  if (!e.OWNER_WHATSAPP_PHONE || !e.CALLMEBOT_API_KEY) return false;
  const url = `https://api.callmebot.com/whatsapp.php?${new URLSearchParams({ phone: e.OWNER_WHATSAPP_PHONE.replace(/^\+/, ''), text, apikey: e.CALLMEBOT_API_KEY })}`;
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) console.error('[notify] WhatsApp message to owner failed', res.status);
    return res.ok;
  } catch (err) {
    console.error('[notify] WhatsApp message to owner failed', err);
    return false;
  }
}

/** "New paid order" text for the owner (Arabic, the admin language). */
export function paidOrderMessage(o: { orderNumber: string; amountIqd: number; theme: string; pkg: string; via: 'WAYL' | 'COUPON' | 'MANUAL' }) {
  const how = { WAYL: 'دفع إلكتروني (WAYL)', COUPON: 'رمز خصم', MANUAL: 'تأكيد يدوي' }[o.via];
  return [
    '🎉 طلب مدفوع جديد في بهجه',
    `الطلب: ${o.orderNumber}`,
    `المبلغ: ${formatIqd(o.amountIqd, 'ar-IQ')} (${how})`,
    `التصميم: ${o.theme} · ${o.pkg}`,
    `${env().APP_URL.replace(/\/$/, '')}/admin/orders?q=${encodeURIComponent(o.orderNumber)}`,
  ].join('\n');
}
