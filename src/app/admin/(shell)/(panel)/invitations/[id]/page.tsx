import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { can } from '@/server/rbac/authz';
import { env } from '@/server/env';
import { activeMusicTracks, getInvitation, invitationState } from '@/server/invitation/admin';
import { orderFields } from '@/server/storefront/catalog';
import { localized } from '@/server/catalog/common';
import { localeMeta } from '@/i18n/config';
import { invitationPath } from '@/lib/ids';
import { Badge, Card } from '@/components/admin/bits';
import { ActionForm, SubmitButton } from '@/components/admin/forms';
import { editInvitationAction, extendInvitationAction, invitationMusicAction, publishInvitationAction } from '../../../../_actions/invitations';

const BADGE = { live: 'ACTIVE', expired: 'ARCHIVED', unpublished: 'ARCHIVED', awaiting: 'READY_FOR_REVIEW', paid: 'READY_FOR_REVIEW', draft: 'DEVELOPMENT' } as const;
const input = 'w-full rounded-md border border-line bg-surface px-3 py-2 text-base';

export default async function InvitationDetailPage({ params }: PageProps<'/admin/invitations/[id]'>) {
  const { authz } = await requireAdmin({ permission: 'invitations.view' });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const row = await getInvitation(db(), id);
  if (!row) notFound();
  const t = await getTranslations('admin.invitations');
  const locale = await getLocale();
  const intl = locale === 'ar' ? 'ar-IQ' : 'en-GB';
  const inv = row.invitation;
  const state = invitationState(inv);
  const path = invitationPath(inv.slug, inv.publicId);
  const url = `${env().APP_URL.replace(/\/$/, '')}${path}`;
  const date = (d: Date | null) => (d ? new Intl.DateTimeFormat(intl, { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Baghdad' }).format(d) : '—');
  const published = Boolean(inv.publishedAt);
  const [fields, tracks] = await Promise.all([orderFields(inv.themeId, inv.sectionId, inv.fieldKeys), activeMusicTracks(db())]);
  const reason = (
    <label className="block">
      <span className="mb-1 block text-sm">{t('reason')}</span>
      <input name="reason" required minLength={5} maxLength={500} className={input} />
    </label>
  );

  return (
    <div className="max-w-5xl space-y-6">
      <header className="space-y-2">
        <Link href="/admin/invitations" className="text-sm text-accent underline">
          {t('heading')}
        </Link>
        <h1 className="text-2xl font-semibold" dir="auto">
          {[inv.fieldValues.person_1_name, inv.fieldValues.person_2_name].filter(Boolean).join(' · ') || inv.publicId}
        </h1>
        <Badge status={BADGE[state]}>{t(`states.${state}`)}</Badge>
      </header>

      <Card className="grid gap-3 text-sm sm:grid-cols-2">
        {published ? (
          <div className="sm:col-span-2">
            <p className="text-muted">{t('link')}</p>
            <p className="flex flex-wrap items-center gap-3">
              <span className="break-all font-mono" dir="ltr">
                {url}
              </span>
              <a href={path} target="_blank" rel="noopener" className="text-accent underline">
                {t('openLink')}
              </a>
            </p>
          </div>
        ) : null}
        <p>
          <span className="text-muted">{t('publishedAt')}: </span>
          {date(inv.publishedAt)}
        </p>
        <p>
          <span className="text-muted">{t('expiresAt')}: </span>
          {date(inv.expiresAt)}
        </p>
        <p>
          <span className="text-muted">{t('theme')}: </span>
          {localized(row.themeName, locale)} <span className="font-mono text-xs text-muted">({row.themeKey})</span>
        </p>
        <p>
          <span className="text-muted">{t('package')}: </span>
          {localized(row.packageName, locale)}
        </p>
        <p>
          <span className="text-muted">{t('language')}: </span>
          {localeMeta[inv.locale].autonym}
        </p>
        <p>
          <span className="text-muted">{t('music')}: </span>
          {row.music?.title ?? t('noMusic')}
        </p>
        {row.orders.map((o) => (
          <p key={o.id}>
            <span className="text-muted">{t('order')}: </span>
            <Link href={`/admin/orders?q=${o.orderNumber}`} className="font-mono text-accent underline" dir="ltr">
              {o.orderNumber}
            </Link>{' '}
            <span className="text-muted">({o.status})</span>
          </p>
        ))}
      </Card>

      {published && can(authz, 'invitations.extend') ? (
        <Card>
          <h2 className="mb-3 font-semibold">{t('extendTitle')}</h2>
          <ActionForm action={extendInvitationAction} className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
            <input type="hidden" name="id" value={inv.id} />
            <label className="block">
              <span className="mb-1 block text-sm">{t('extendDays')}</span>
              <select name="days" defaultValue="7" className={input}>
                {[3, 7, 14, 30].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            {reason}
            <SubmitButton>{t('extend')}</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}

      {published && can(authz, 'invitations.publish') ? (
        <Card>
          <h2 className="mb-1 font-semibold">{t('unpublishTitle')}</h2>
          <p className="mb-3 text-sm text-muted">{t('unpublishHelp')}</p>
          <ActionForm
            action={publishInvitationAction}
            confirmMessage={inv.status === 'PUBLISHED' ? t('unpublishConfirm') : undefined}
            className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          >
            <input type="hidden" name="id" value={inv.id} />
            <input type="hidden" name="published" value={inv.status === 'PUBLISHED' ? 'false' : 'true'} />
            {reason}
            <SubmitButton tone={inv.status === 'PUBLISHED' ? 'danger' : 'primary'}>{inv.status === 'PUBLISHED' ? t('unpublish') : t('republish')}</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}

      {can(authz, 'invitations.edit') ? (
        <>
          <Card>
            <h2 className="mb-1 font-semibold">{t('editTitle')}</h2>
            <p className="mb-3 text-sm text-muted">{t('editHelp')}</p>
            <ActionForm action={editInvitationAction} className="grid gap-3">
              <input type="hidden" name="id" value={inv.id} />
              <input type="hidden" name="version" value={inv.version} />
              {fields.map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-sm font-medium">{localized(f.label, locale)}</span>
                  {f.type === 'longtext' ? (
                    <textarea name={`f.${f.key}`} defaultValue={inv.fieldValues[f.key] ?? ''} rows={3} dir="auto" className={input} />
                  ) : (
                    <input
                      name={`f.${f.key}`}
                      defaultValue={inv.fieldValues[f.key] ?? ''}
                      type={f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : f.type === 'url' ? 'url' : 'text'}
                      dir={f.type === 'url' ? 'ltr' : 'auto'}
                      className={input}
                    />
                  )}
                </label>
              ))}
              {reason}
              <div>
                <SubmitButton>{t('save')}</SubmitButton>
              </div>
            </ActionForm>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">{t('musicTitle')}</h2>
            <ActionForm action={invitationMusicAction} className="grid gap-3 sm:grid-cols-[14rem_1fr_auto] sm:items-end">
              <input type="hidden" name="id" value={inv.id} />
              <label className="block">
                <span className="mb-1 block text-sm">{t('music')}</span>
                <select name="musicTrackId" defaultValue={inv.musicTrackId ?? ''} className={input}>
                  <option value="">{t('noMusic')}</option>
                  {tracks.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </label>
              {reason}
              <SubmitButton>{t('saveMusic')}</SubmitButton>
            </ActionForm>
          </Card>
        </>
      ) : null}

      {state === 'live' ? (
        <Card>
          <h2 className="mb-3 font-semibold">{t('preview')}</h2>
          <iframe src={path} title={t('preview')} className="mx-auto block h-[640px] w-full max-w-[380px] rounded-2xl border border-line" />
        </Card>
      ) : null}
    </div>
  );
}
