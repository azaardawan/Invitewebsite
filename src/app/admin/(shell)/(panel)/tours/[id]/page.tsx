import Link from 'next/link';
import { notFound } from 'next/navigation';
import { inArray } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { assets } from '@/server/db/schema';
import { env } from '@/server/env';
import { requireAdmin } from '@/server/auth/guard';
import { publicMediaUrl } from '@/server/storage';
import { getTour, TOUR_MODEL_MAX_BYTES, tourPath, tourState } from '@/server/tours/tours';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { Badge, Card } from '@/components/admin/bits';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { CopyLink, TourModelUpload } from '@/components/admin/TourModelUpload';
import { tourLiveAction, tourLogoAction, tourPrivacyAction, updateTourAction } from '@/app/admin/_actions/tours';

const TONE = { live: 'ACTIVE', off: 'DEVELOPMENT', ended: 'ARCHIVED' } as const;

/** One virtual tour: its details, end date, logo and model, and switching it on or off. */
export default async function TourPage(props: PageProps<'/admin/tours/[id]'>) {
  await requireAdmin({ permission: 'tours.manage' });
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const tour = await getTour(db(), id);
  if (!tour) notFound();
  const t = await getTranslations('admin.tours');
  const ids = [tour.modelAssetId, tour.logoAssetId].filter((x): x is string => !!x);
  const rows = ids.length ? await db().select().from(assets).where(inArray(assets.id, ids)) : [];
  const model = rows.find((r) => r.id === tour.modelAssetId);
  const logo = rows.find((r) => r.id === tour.logoAssetId);
  const state = tourState(tour);
  const base = env().APP_URL.replace(/\/$/, '');
  const endsOn = tour.endsAt ? new Date(tour.endsAt.getTime() + 3 * 3600_000).toISOString().slice(0, 10) : '';

  return (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-2">
        <Link href="/admin/tours" className="text-sm text-accent">
          ← {t('heading')}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{tour.name}</h1>
          {tour.privateKey ? <Badge status="READY_FOR_REVIEW">{t('privateBadge')}</Badge> : null}
          <Badge status={TONE[state]}>{t(`state.${state}`)}</Badge>
        </div>
        <CopyLink url={`${base}${tourPath(tour)}`} />
        <p className="text-sm text-muted">{t('visits', { n: tour.visits })}</p>
      </header>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t('model')}</h2>
        <p className="text-sm">
          {model ? t('modelNow', { name: model.originalFilename ?? 'model.glb', mb: (model.bytes / 1048576).toFixed(1) }) : t('noModelYet')}
        </p>
        <TourModelUpload tourId={tour.id} maxMb={TOUR_MODEL_MAX_BYTES / 1048576} />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t('showing')}</h2>
        <p className="text-sm text-muted">{t('showingHint')}</p>
        <ActionForm action={tourLiveAction}>
          <input type="hidden" name="id" value={tour.id} />
          <input type="hidden" name="live" value={tour.live ? 'false' : 'true'} />
          <SubmitButton tone={tour.live ? 'danger' : 'primary'}>{tour.live ? t('turnOff') : t('turnOn')}</SubmitButton>
        </ActionForm>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t('link')}</h2>
        <p className="text-sm text-muted">{tour.privateKey ? t('linkPrivate') : t('linkPublic')}</p>
        <div className="flex flex-wrap gap-3">
          {tour.privateKey ? (
            <>
              <ActionForm action={tourPrivacyAction} confirmMessage={t('renewConfirm')}>
                <input type="hidden" name="id" value={tour.id} />
                <input type="hidden" name="mode" value="renew" />
                <SubmitButton tone="secondary">{t('renew')}</SubmitButton>
              </ActionForm>
              <ActionForm action={tourPrivacyAction} confirmMessage={t('makePublicConfirm')}>
                <input type="hidden" name="id" value={tour.id} />
                <input type="hidden" name="mode" value="public" />
                <SubmitButton tone="secondary">{t('makePublic')}</SubmitButton>
              </ActionForm>
            </>
          ) : (
            <ActionForm action={tourPrivacyAction} confirmMessage={t('makePrivateConfirm')}>
              <input type="hidden" name="id" value={tour.id} />
              <input type="hidden" name="mode" value="private" />
              <SubmitButton tone="secondary">{t('makePrivate')}</SubmitButton>
            </ActionForm>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t('details')}</h2>
        <ActionForm action={updateTourAction} className="max-w-md space-y-3">
          <input type="hidden" name="id" value={tour.id} />
          <Field label={t('name')} name="name" defaultValue={tour.name} />
          <Field label={t('slug')} name="slug" dir="ltr" defaultValue={tour.slug} />
          <Field label={t('endsOn')} name="endsOn" type="date" required={false} defaultValue={endsOn} />
          <p className="text-xs text-muted">{t('endsOnHint')}</p>
          <Field label={t('links.instagram')} name="instagram" dir="ltr" type="url" required={false} defaultValue={tour.links.instagram ?? ''} />
          <Field label={t('links.location')} name="location" dir="ltr" type="url" required={false} defaultValue={tour.links.location ?? ''} />
          <Field label={t('links.menu')} name="menu" dir="ltr" type="url" required={false} defaultValue={tour.links.menu ?? ''} />
          <Field label={t('links.whatsapp')} name="whatsapp" dir="ltr" inputMode="numeric" required={false} defaultValue={tour.links.whatsapp ?? ''} />
          <p className="text-xs text-muted">{t('linksHint')}</p>
          <SubmitButton>{t('save')}</SubmitButton>
        </ActionForm>
      </Card>

      <Card>
        <ActionForm action={tourLogoAction} className="space-y-3">
          <input type="hidden" name="id" value={tour.id} />
          <ImageUpload name="assetId" label={t('logo')} initial={logo ? { id: logo.id, url: publicMediaUrl(logo.storageKey) } : null} />
          <SubmitButton tone="secondary">{t('save')}</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
