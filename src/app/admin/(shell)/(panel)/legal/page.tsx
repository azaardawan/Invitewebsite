import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { POLICY_SLUGS, POLICY_TYPES, policyAdminView } from '@/server/legal/policies';
import { Badge, Card } from '@/components/admin/bits';

export default async function LegalListPage() {
  await requireAdmin({ permission: 'legal.manage' });
  const t = await getTranslations('admin.legal');
  const intl = (await getLocale()) === 'ar' ? 'ar-IQ' : 'en-GB';
  const views = await Promise.all(POLICY_TYPES.map(async (type) => ({ type, ...(await policyAdminView(db(), type)) })));

  return (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t('heading')}</h1>
        <p className="text-sm text-muted">{t('intro')}</p>
      </header>
      {views.map((v) => {
        const live = v.published[0];
        return (
          <Card key={v.type} className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-semibold">{t(`types.${v.type}`)}</h2>
              <p className="text-sm text-muted">
                {live?.publishedAt
                  ? t('liveVersion', { version: live.version, date: new Intl.DateTimeFormat(intl, { dateStyle: 'medium' }).format(live.publishedAt) })
                  : t('notPublished')}
              </p>
              {v.draft ? <Badge status="READY_FOR_REVIEW">{t('hasDraft', { version: v.draft.version })}</Badge> : null}
            </div>
            <Link href={`/admin/legal/${POLICY_SLUGS[v.type]}`} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
              {t('edit')}
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
