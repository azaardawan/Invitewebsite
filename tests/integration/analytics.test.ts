import { beforeAll, describe, expect, it } from 'vitest';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { analyticsEvents } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { trackEvent, deviceClass, isBot, referrerHost } from '@/server/analytics/events';
import { analyticsReport } from '@/server/analytics/report';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

describe('analytics events', () => {
  it('records each order step where it happens, without personal data', async () => {
    const visitor = { ...ctx, ipHash: randomToken(8) };
    const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, visitor);
    const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
    await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
    await markOrderPaid(db(), o.orderId, { kind: 'WAYL' }); // a duplicate webhook is not counted twice

    const rows = await db().select().from(analyticsEvents).where(eq(analyticsEvents.invitationId, d.invitationId));
    expect(rows.map((r) => r.name).sort()).toEqual(['order_paid', 'order_placed', 'order_started']);
    expect(rows.every((r) => r.themeId === shop.theme.id)).toBe(true);
    expect(JSON.stringify(rows)).not.toMatch(/زبون|0770|example\.com/);
  });

  it('classifies devices, drops bots and keeps only the referring host', () => {
    expect(deviceClass('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148')).toBe('mobile');
    expect(deviceClass('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('tablet');
    expect(deviceClass('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop');
    expect(isBot('Googlebot/2.1')).toBe(true);
    expect(isBot('WhatsApp/2.23')).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(referrerHost('https://l.instagram.com/?u=https%3A%2F%2Fbahjaaa.com', 'bahjaaa.com')).toBe('instagram.com');
    expect(referrerHost('https://www.bahjaaa.com/themes', 'bahjaaa.com')).toBeNull();
    expect(referrerHost('not a url', 'bahjaaa.com')).toBeNull();
  });
});

describe('analytics report', () => {
  it('counts visitors by session, funnel steps, and revenue from paid orders', async () => {
    const now = new Date('2031-05-20T12:00:00Z'); // a quiet window of its own
    const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000);
    // The test database persists between runs: clear this window first.
    await db().delete(analyticsEvents).where(and(gte(analyticsEvents.occurredAt, at(60)), lte(analyticsEvents.occurredAt, now)));
    const [a, b] = [randomToken(12), randomToken(12)];
    const ids: string[] = [];
    for (const e of [
      { name: 'page_view' as const, sessionId: a, occurredAt: at(1), referrerHost: 'instagram.com' },
      { name: 'page_view' as const, sessionId: a, occurredAt: at(1), themeId: shop.theme.id },
      { name: 'page_view' as const, sessionId: b, occurredAt: at(2), deviceClass: 'mobile' as const },
      { name: 'order_started' as const, occurredAt: at(1), themeId: shop.theme.id },
      { name: 'invitation_open' as const, sessionId: b, occurredAt: at(2) },
      { name: 'page_view' as const, sessionId: randomToken(12), occurredAt: at(40) }, // outside 30 days
    ]) {
      await trackEvent(db(), e);
    }
    const r = await analyticsReport(db(), 30, now);
    expect(r.totals).toMatchObject({ visitors: 2, pageViews: 3, themeViews: 1, started: 1, invitationOpens: 1 });
    expect(r.funnel.map((f) => f.value).slice(0, 3)).toEqual([2, 1, 1]);
    expect(r.series).toHaveLength(30);
    expect(r.series.reduce((s, p) => s + p.visitors, 0)).toBe(2);
    expect(r.referrers[0]).toEqual({ host: 'instagram.com', sessions: 1 });
    expect(r.themes[0]).toMatchObject({ views: 1 });

    const mine = await db().select({ id: analyticsEvents.id }).from(analyticsEvents).where(inArray(analyticsEvents.sessionId, [a, b]));
    ids.push(...mine.map((m) => String(m.id)));
    expect(ids.length).toBeGreaterThan(0);
  });
});
