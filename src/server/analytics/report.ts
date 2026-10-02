import 'server-only';
import { and, count, countDistinct, desc, eq, gte, isNotNull, sql, sum } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { analyticsEvents, invitations, orders, themes } from '@/server/db/schema';

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];
const DAY = 86_400_000;
/** Days are counted in Baghdad time (the business's day). */
const TZ = 'Asia/Baghdad';

type ThemeName = { ar: string; en: string; ckb?: string | null; bdn?: string | null };

/** Everything Admin → Analytics shows for the last `days` days. Money comes from orders, never from events. */
export async function analyticsReport(db: DbOrTx, days: Period, now = new Date()) {
  const from = new Date(now.getTime() - days * DAY);
  const inRange = gte(analyticsEvents.occurredAt, from);
  const named = (n: string) => and(eq(analyticsEvents.name, n), inRange);

  const [eventTotals, paid, published, daily, dailyPaid, topThemes, themeOrders, referrers, devices] = await Promise.all([
    db
      .select({
        visitors: sql<number>`count(distinct ${analyticsEvents.sessionId}) filter (where ${analyticsEvents.name} = 'page_view')::int`,
        pageViews: sql<number>`count(*) filter (where ${analyticsEvents.name} = 'page_view')::int`,
        themeViews: sql<number>`count(*) filter (where ${analyticsEvents.name} = 'page_view' and ${analyticsEvents.themeId} is not null)::int`,
        invitationOpens: sql<number>`count(*) filter (where ${analyticsEvents.name} = 'invitation_open')::int`,
        started: sql<number>`count(*) filter (where ${analyticsEvents.name} = 'order_started')::int`,
        placed: sql<number>`count(*) filter (where ${analyticsEvents.name} = 'order_placed')::int`,
        guestReplies: sql<number>`count(*) filter (where ${analyticsEvents.name} = 'guest_reply')::int`,
        cardDownloads: sql<number>`count(*) filter (where ${analyticsEvents.name} = 'card_download')::int`,
        keepsakeDownloads: sql<number>`count(*) filter (where ${analyticsEvents.name} = 'keepsake_download')::int`,
      })
      .from(analyticsEvents)
      .where(inRange),
    db
      .select({ n: count(), revenue: sum(orders.amountIqd) })
      .from(orders)
      .where(and(eq(orders.status, 'PAID'), gte(orders.paidAt, from))),
    db.select({ n: count() }).from(invitations).where(gte(invitations.publishedAt, from)),
    db
      .select({
        day: sql<string>`to_char(${analyticsEvents.occurredAt} at time zone ${TZ}, 'YYYY-MM-DD')`,
        visitors: countDistinct(analyticsEvents.sessionId),
      })
      .from(analyticsEvents)
      .where(named('page_view'))
      .groupBy(sql`1`),
    db
      .select({ day: sql<string>`to_char(${orders.paidAt} at time zone ${TZ}, 'YYYY-MM-DD')`, n: count() })
      .from(orders)
      .where(and(eq(orders.status, 'PAID'), gte(orders.paidAt, from)))
      .groupBy(sql`1`),
    db
      .select({ themeId: analyticsEvents.themeId, name: themes.name, views: count() })
      .from(analyticsEvents)
      .innerJoin(themes, eq(themes.id, analyticsEvents.themeId))
      .where(and(named('page_view'), isNotNull(analyticsEvents.themeId)))
      .groupBy(analyticsEvents.themeId, themes.name)
      .orderBy(desc(count()))
      .limit(10),
    db
      .select({ themeId: invitations.themeId, name: themes.name, paid: count(), revenue: sum(orders.amountIqd) })
      .from(orders)
      .innerJoin(invitations, eq(invitations.id, orders.invitationId))
      .innerJoin(themes, eq(themes.id, invitations.themeId))
      .where(and(eq(orders.status, 'PAID'), gte(orders.paidAt, from)))
      .groupBy(invitations.themeId, themes.name),
    db
      .select({ host: analyticsEvents.referrerHost, sessions: countDistinct(analyticsEvents.sessionId) })
      .from(analyticsEvents)
      .where(and(inRange, isNotNull(analyticsEvents.referrerHost)))
      .groupBy(analyticsEvents.referrerHost)
      .orderBy(desc(countDistinct(analyticsEvents.sessionId)))
      .limit(8),
    db
      .select({ device: analyticsEvents.deviceClass, sessions: countDistinct(analyticsEvents.sessionId) })
      .from(analyticsEvents)
      .where(named('page_view'))
      .groupBy(analyticsEvents.deviceClass),
  ]);

  const totals = eventTotals[0]!;
  const visitorsByDay = new Map(daily.map((d) => [d.day, Number(d.visitors)]));
  const paidByDay = new Map(dailyPaid.map((d) => [d.day, Number(d.n)]));
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const series = Array.from({ length: days }, (_, i) => {
    const day = fmt.format(new Date(now.getTime() - (days - 1 - i) * DAY));
    return { day, visitors: visitorsByDay.get(day) ?? 0, paid: paidByDay.get(day) ?? 0 };
  });

  // Themes: views from events, paid orders and revenue from orders.
  const byTheme = new Map<string, { name: ThemeName; views: number; paid: number; revenueIqd: number }>();
  for (const t of topThemes) byTheme.set(t.themeId!, { name: t.name as ThemeName, views: t.views, paid: 0, revenueIqd: 0 });
  for (const t of themeOrders) {
    const row = byTheme.get(t.themeId) ?? { name: t.name as ThemeName, views: 0, paid: 0, revenueIqd: 0 };
    row.paid = t.paid;
    row.revenueIqd = Number(t.revenue ?? 0);
    byTheme.set(t.themeId, row);
  }
  const referred = referrers.reduce((a, r) => a + Number(r.sessions), 0);

  return {
    days,
    totals: {
      ...totals,
      paidOrders: paid[0]?.n ?? 0,
      revenueIqd: Number(paid[0]?.revenue ?? 0),
      publishedInvitations: published[0]?.n ?? 0,
    },
    funnel: [
      { key: 'visitors', value: totals.visitors },
      { key: 'themeViews', value: totals.themeViews },
      { key: 'started', value: totals.started },
      { key: 'placed', value: totals.placed },
      { key: 'paid', value: paid[0]?.n ?? 0 },
    ] as const,
    series,
    themes: [...byTheme.values()].sort((a, b) => b.revenueIqd - a.revenueIqd || b.views - a.views),
    referrers: [
      ...referrers.map((r) => ({ host: r.host!, sessions: Number(r.sessions) })),
      ...(totals.visitors > referred ? [{ host: null, sessions: totals.visitors - referred }] : []),
    ],
    devices: devices.map((d) => ({ device: d.device ?? 'desktop', sessions: Number(d.sessions) })).sort((a, b) => b.sessions - a.sessions),
  };
}

export type AnalyticsReport = Awaited<ReturnType<typeof analyticsReport>>;
