import 'server-only';
import type { DbOrTx } from '@/server/db/client';
import { analyticsEvents } from '@/server/db/schema';

/**
 * Event names. Client beacons may only send the first two; the rest are recorded by the server
 * where the thing actually happens.
 */
export const CLIENT_EVENTS = ['page_view', 'invitation_open'] as const;
export const SERVER_EVENTS = ['order_started', 'order_placed', 'order_paid', 'guest_reply', 'card_download', 'keepsake_download'] as const;
export type AnalyticsEventName = (typeof CLIENT_EVENTS)[number] | (typeof SERVER_EVENTS)[number];

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  sessionId?: string | null;
  locale?: string | null;
  deviceClass?: 'mobile' | 'tablet' | 'desktop' | null;
  referrerHost?: string | null;
  themeId?: string | null;
  packageId?: string | null;
  invitationId?: string | null;
  orderId?: string | null;
  occurredAt?: Date;
};

/**
 * Records one event. Analytics must never break a page or an order: the insert runs in its own
 * savepoint (when called inside an order's transaction, a failure can't abort that transaction) and
 * failures are only logged.
 */
export async function trackEvent(db: DbOrTx, e: AnalyticsEvent) {
  try {
    await db.transaction(async (tx) => {
      await tx.insert(analyticsEvents).values({
      name: e.name,
      sessionId: e.sessionId ?? null,
      locale: e.locale ?? null,
      deviceClass: e.deviceClass ?? null,
      referrerHost: e.referrerHost ?? null,
      themeId: e.themeId ?? null,
      packageId: e.packageId ?? null,
      invitationId: e.invitationId ?? null,
      orderId: e.orderId ?? null,
      ...(e.occurredAt ? { occurredAt: e.occurredAt } : {}),
      });
    });
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'analytics.track_failed', event: e.name, error: String(err) }));
  }
}

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|monitor/i;

export function isBot(userAgent: string | null) {
  return !userAgent || BOT.test(userAgent);
}

export function deviceClass(userAgent: string | null): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent ?? '';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/mobi|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

/** Only the referring site's host (e.g. "instagram.com"), never the full URL; own site = null. */
export function referrerHost(referrer: string | null | undefined, ownHost: string) {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^(www|m|l|lm)\./, '').toLowerCase();
    return host && host !== ownHost.replace(/^www\./, '') ? host.slice(0, 100) : null;
  } catch {
    return null;
  }
}
