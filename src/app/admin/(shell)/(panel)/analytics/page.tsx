import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { analyticsReport, PERIODS, type Period } from '@/server/analytics/report';
import { localized } from '@/lib/localized';
import { formatIqd } from '@/lib/currency';
import { Card } from '@/components/admin/bits';
import { DailyBars } from '@/components/admin/DailyBars';

export default async function AnalyticsPage({ searchParams }: PageProps<'/admin/analytics'>) {
  await requireAdmin({ permission: 'analytics.view' });
  const t = await getTranslations('admin.analytics');
  const locale = await getLocale();
  const intl = locale === 'ar' ? 'ar-IQ' : 'en-GB';
  const raw = Number((await searchParams).days);
  const days: Period = (PERIODS as readonly number[]).includes(raw) ? (raw as Period) : 30;
  const r = await analyticsReport(db(), days);
  const num = (n: number) => new Intl.NumberFormat(intl).format(n);
  const pct = (a: number, b: number) => (b > 0 ? new Intl.NumberFormat(intl, { style: 'percent', maximumFractionDigits: 1 }).format(a / b) : '—');
  const dayFmt = new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const longDay = new Intl.DateTimeFormat(intl, { dateStyle: 'medium', timeZone: 'UTC' });
  const asDate = (d: string) => new Date(`${d}T00:00:00Z`);
  const mid = r.series[Math.floor((r.series.length - 1) / 2)]!;
  const dayLabels = Object.fromEntries([r.series[0]!, mid, r.series.at(-1)!].map((p) => [p.day, dayFmt.format(asDate(p.day))]));

  const tiles: [string, string, string?][] = [
    [t('visitors'), num(r.totals.visitors), t('pageViews', { n: num(r.totals.pageViews) })],
    [t('paidOrders'), num(r.totals.paidOrders), t('conversion', { pct: pct(r.totals.paidOrders, r.totals.visitors) })],
    [t('revenue'), formatIqd(r.totals.revenueIqd, intl)],
    [t('invitationOpens'), num(r.totals.invitationOpens), t('published', { n: num(r.totals.publishedInvitations) })],
    [t('guestReplies'), num(r.totals.guestReplies)],
    [t('downloads'), num(r.totals.cardDownloads + r.totals.keepsakeDownloads), t('downloadsSplit', { card: num(r.totals.cardDownloads), keepsake: num(r.totals.keepsakeDownloads) })],
  ];
  const funnelMax = Math.max(1, r.funnel[0].value);

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t('heading')}</h1>
          <p className="text-sm text-muted">{t('intro')}</p>
        </div>
        <nav aria-label={t('period')} className="flex gap-1 rounded-md border border-line bg-surface p-1 text-sm">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin/analytics?days=${p}`}
              aria-current={p === days ? 'page' : undefined}
              className="rounded px-3 py-1.5 aria-[current=page]:bg-accent aria-[current=page]:text-accent-ink"
            >
              {t('lastDays', { n: p })}
            </Link>
          ))}
        </nav>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(([label, value, sub]) => (
          <Card key={label} className="space-y-1">
            <p className="text-sm text-muted">{label}</p>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
            {sub ? <p className="text-xs text-muted">{sub}</p> : null}
          </Card>
        ))}
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold">{t('dailyVisitors')}</h2>
        <DailyBars
          label={t('dailyVisitors')}
          dayLabels={dayLabels}
          points={r.series.map((p) => ({ day: p.day, value: p.visitors, title: t('dayTooltip', { day: longDay.format(asDate(p.day)), visitors: p.visitors, paid: p.paid }) }))}
        />
        <details className="text-sm">
          <summary className="cursor-pointer text-accent">{t('showTable')}</summary>
          <table className="mt-2 w-full">
            <thead className="text-muted">
              <tr>
                <th className="p-1 text-start font-normal">{t('day')}</th>
                <th className="p-1 text-end font-normal">{t('visitors')}</th>
                <th className="p-1 text-end font-normal">{t('paidOrders')}</th>
              </tr>
            </thead>
            <tbody>
              {r.series.map((p) => (
                <tr key={p.day} className="border-t border-line">
                  <td className="p-1">{longDay.format(asDate(p.day))}</td>
                  <td className="p-1 text-end tabular-nums">{num(p.visitors)}</td>
                  <td className="p-1 text-end tabular-nums">{num(p.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">{t('funnel')}</h2>
        <p className="text-sm text-muted">{t('funnelHelp')}</p>
        <ol className="space-y-2">
          {r.funnel.map((f) => (
            <li key={f.key} className="grid grid-cols-[9rem_1fr_6rem] items-center gap-3 text-sm sm:grid-cols-[12rem_1fr_7rem]">
              <span>{t(`steps.${f.key}`)}</span>
              <span className="h-3 rounded-e-[4px] bg-line/60" aria-hidden>
                <span className="block h-3 rounded-e-[4px] bg-[#9b3a52]" style={{ width: `${Math.max(f.value > 0 ? 1.5 : 0, (f.value / funnelMax) * 100)}%` }} />
              </span>
              <span className="text-end tabular-nums">
                {num(f.value)} <span className="text-muted">({pct(f.value, funnelMax)})</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="font-semibold">{t('topThemes')}</h2>
          {r.themes.length ? (
            <table className="w-full text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="p-1 text-start font-normal">{t('theme')}</th>
                  <th className="p-1 text-end font-normal">{t('views')}</th>
                  <th className="p-1 text-end font-normal">{t('paidOrders')}</th>
                  <th className="p-1 text-end font-normal">{t('revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {r.themes.map((th, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="p-1">{localized(th.name, locale)}</td>
                    <td className="p-1 text-end tabular-nums">{num(th.views)}</td>
                    <td className="p-1 text-end tabular-nums">{num(th.paid)}</td>
                    <td className="p-1 text-end tabular-nums">{formatIqd(th.revenueIqd, intl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted">{t('noData')}</p>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">{t('sources')}</h2>
          {r.referrers.length ? (
            <table className="w-full text-sm">
              <tbody>
                {r.referrers.map((s) => (
                  <tr key={s.host ?? 'direct'} className="border-t border-line first:border-0">
                    <td className="p-1" dir={s.host ? 'ltr' : undefined}>
                      {s.host ?? t('direct')}
                    </td>
                    <td className="p-1 text-end tabular-nums">
                      {num(s.sessions)} <span className="text-muted">({pct(s.sessions, r.totals.visitors)})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted">{t('noData')}</p>
          )}
          {r.devices.length ? (
            <p className="text-sm text-muted">
              {r.devices.map((d) => `${t(`devices.${d.device}` as never)} ${pct(d.sessions, r.totals.visitors)}`).join(' · ')}
            </p>
          ) : null}
        </Card>
      </div>
      <p className="text-xs text-muted">{t('privacyNote')}</p>
    </div>
  );
}
