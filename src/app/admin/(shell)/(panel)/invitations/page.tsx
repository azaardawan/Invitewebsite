import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { invitationState, listInvitations } from '@/server/invitation/admin';
import { localized } from '@/server/catalog/common';
import { invitationPath } from '@/lib/ids';
import { Badge, Card } from '@/components/admin/bits';

const FILTERS = ['live', 'expired', 'unpublished', 'awaiting', 'draft'] as const;
const BADGE = { live: 'ACTIVE', expired: 'ARCHIVED', unpublished: 'ARCHIVED', awaiting: 'READY_FOR_REVIEW', paid: 'READY_FOR_REVIEW', draft: 'DEVELOPMENT' } as const;

export default async function InvitationsPage({ searchParams }: PageProps<'/admin/invitations'>) {
  await requireAdmin({ permission: 'invitations.view' });
  const t = await getTranslations('admin.invitations');
  const locale = await getLocale();
  const intl = locale === 'ar' ? 'ar-IQ' : 'en-GB';
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 60) : '';
  const filter = z.enum(FILTERS).safeParse(params.filter).data;
  const rows = await listInvitations(db(), { q: q || undefined, filter });
  const date = (d: Date | null) => (d ? new Intl.DateTimeFormat(intl, { dateStyle: 'medium', timeZone: 'Asia/Baghdad' }).format(d) : '—');

  return (
    <div className="max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('heading')}</h1>
        <p className="mt-1 text-muted">{t('intro')}</p>
      </header>
      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-sm">{t('search')}</span>
          <input name="q" defaultValue={q} className="rounded-md border border-line bg-surface px-3 py-2" />
        </label>
        <select name="filter" defaultValue={filter ?? ''} aria-label={t('filters.all')} className="rounded-md border border-line bg-surface px-3 py-2">
          <option value="">{t('filters.all')}</option>
          {FILTERS.map((f) => (
            <option key={f} value={f}>
              {t(`filters.${f}`)}
            </option>
          ))}
        </select>
        <button className="rounded-md border border-line bg-surface px-4 py-2 text-sm">{t('search')}</button>
      </form>

      {rows.length === 0 ? <p className="text-muted">{t('empty')}</p> : null}
      <ul className="space-y-3">
        {rows.map(({ invitation: inv, themeName, packageName, orderNumber }) => {
          const state = invitationState(inv);
          const names = [inv.fieldValues.person_1_name ?? inv.fieldValues.baby_name, inv.fieldValues.person_2_name].filter(Boolean).join(' · ');
          return (
            <li key={inv.id}>
              <Card className="grid gap-3 sm:grid-cols-4 sm:items-center">
                <div>
                  <p className="font-medium" dir="auto">
                    {names || inv.publicId}
                  </p>
                  <p className="font-mono text-xs text-muted" dir="ltr">
                    {invitationPath(inv.slug, inv.publicId)}
                  </p>
                </div>
                <div className="text-sm">
                  <p>{localized(themeName, locale)}</p>
                  <p className="text-muted">{localized(packageName, locale)}</p>
                </div>
                <div className="text-sm">
                  <Badge status={BADGE[state]}>{t(`states.${state}`)}</Badge>
                  <p className="mt-1 text-muted">
                    {t('expiresAt')}: {date(inv.expiresAt)}
                  </p>
                  {orderNumber ? (
                    <p className="font-mono text-xs text-muted" dir="ltr">
                      {orderNumber}
                    </p>
                  ) : null}
                </div>
                <div>
                  <Link href={`/admin/invitations/${inv.id}`} className="text-accent underline">
                    {t('open')}
                  </Link>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
