import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { env } from '@/server/env';
import { requireAdmin } from '@/server/auth/guard';
import { listTours, tourState } from '@/server/tours/tours';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { Badge, Card } from '@/components/admin/bits';
import { CopyLink } from '@/components/admin/TourModelUpload';
import { createTourAction } from '@/app/admin/_actions/tours';

const TONE = { live: 'ACTIVE', off: 'DEVELOPMENT', ended: 'ARCHIVED' } as const;

/** Virtual tours (owner, 2026-11-21): cafés' own 3D places, each with its link for an Instagram bio and an end date. */
export default async function ToursPage() {
  await requireAdmin({ permission: 'tours.manage' });
  const t = await getTranslations('admin.tours');
  const locale = await getLocale();
  const intl = locale === 'ar' ? 'ar-IQ' : 'en-GB';
  const list = await listTours(db());
  const base = env().APP_URL.replace(/\/$/, '');
  const now = new Date();

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('heading')}</h1>
        <p className="mt-1 text-muted">{t('intro')}</p>
      </header>

      {list.length === 0 ? <p className="text-muted">{t('none')}</p> : null}
      <ul className="space-y-3">
        {list.map((tour) => {
          const state = tourState(tour, now);
          const days = tour.endsAt ? Math.ceil((tour.endsAt.getTime() - now.getTime()) / 86400000) : null;
          return (
            <li key={tour.id}>
              <Card className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/admin/tours/${tour.id}`} className="font-medium underline">
                    {tour.name}
                  </Link>
                  <Badge status={TONE[state]}>{t(`state.${state}`)}</Badge>
                </div>
                <CopyLink url={`${base}/tour/${tour.slug}`} />
                <p className="text-sm text-muted">
                  {t('visits', { n: tour.visits })} ·{' '}
                  {tour.endsAt
                    ? state === 'ended'
                      ? t('endedOn', { date: tour.endsAt.toLocaleDateString(intl, { timeZone: 'Asia/Baghdad' }) })
                      : t('endsIn', { n: days ?? 0, date: tour.endsAt.toLocaleDateString(intl, { timeZone: 'Asia/Baghdad' }) })
                    : t('noEnd')}
                  {!tour.modelAssetId ? ` · ${t('noModelYet')}` : ''}
                </p>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t('add')}</h2>
        <ActionForm action={createTourAction} className="max-w-md space-y-3">
          <Field label={t('name')} name="name" />
          <Field label={t('slug')} name="slug" dir="ltr" />
          <p className="text-xs text-muted" dir="ltr">
            {base}/tour/…
          </p>
          <SubmitButton>{t('add')}</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
