import { themeNumber } from '@/theme-registry';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { can } from '@/server/rbac/authz';
import { env } from '@/server/env';
import { activeMusicTracks, getInvitation, invitationState } from '@/server/invitation/admin';
import { guestResponseCounts, listGuestResponses } from '@/server/guests/responses';
import { documentAvailable } from '@/server/documents/documents';
import { customerDelivery, keepsakeReady, whatsappLink } from '@/server/documents/delivery';
import { CardUploadForm } from '@/components/admin/CardUploadForm';
import { orderFields } from '@/server/storefront/catalog';
import { localized } from '@/server/catalog/common';
import { localeMeta } from '@/i18n/config';
import { invitationPath } from '@/lib/ids';
import { accessCodeFor, formatAccessCode } from '@/server/orders/tokens';
import { Badge, Card } from '@/components/admin/bits';
import { ActionForm, SubmitButton } from '@/components/admin/forms';
import {
  cardOptionsAction,
  editInvitationAction,
  extendInvitationAction,
  removeCustomCardAction,
  guestMessageStatusAction,
  guestbookVisibilityAction,
  attendanceVisibilityAction,
  invitationMusicAction,
  publishInvitationAction,
} from '../../../../_actions/invitations';

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
  const showGuests = inv.featureKeys.includes('rsvp') && can(authz, 'guests.view');
  const canDocs = can(authz, 'documents.generate');
  const hasCard = inv.featureKeys.includes('print_card');
  const hasKeepsake = inv.featureKeys.includes('keepsake_pdf');
  const delivery = canDocs && (hasCard || hasKeepsake) ? await customerDelivery(db(), inv.id) : null;
  // WhatsApp messages go to the customer in their invitation's language.
  const tr = await getTranslations({ locale: inv.locale, namespace: 'receipt' });
  // Every message also carries the private receipt link and the invitation number, so the customer can come back any time.
  const withReceiptLines = (text: string) =>
    delivery ? `${text}\n${tr('receiptLinkLine', { url: delivery.receiptUrl })}\n${tr('accessCodeLine', { code: delivery.accessCode })}` : text;
  const canModerate = can(authz, 'guests.moderate');
  const [fields, tracks, guests, counts] = await Promise.all([
    orderFields(inv.themeId, inv.sectionId, inv.fieldKeys),
    activeMusicTracks(db()),
    showGuests ? listGuestResponses(db(), inv.id) : Promise.resolve([]),
    showGuests ? guestResponseCounts(db(), inv.id) : Promise.resolve(null),
  ]);
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
          <span className="font-mono font-semibold" dir="ltr">#{themeNumber(row.themeKey) ?? '—'}</span> {localized(row.themeName, locale)}{' '}
          <span className="font-mono text-xs text-muted">({row.themeKey})</span>
        </p>
        {row.occasionName ? (
          <p>
            <span className="text-muted">{t('occasion')}: </span>
            {localized(row.occasionName, locale)}
          </p>
        ) : null}
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
            <span className="text-muted">({o.status})</span>{' '}
            <span className="text-muted">· {t('accessCode')}: </span>
            <span className="font-mono" dir="ltr">
              {formatAccessCode(accessCodeFor(o.id))}
            </span>
          </p>
        ))}
      </Card>

      {canDocs && (hasCard || hasKeepsake) ? (
        <Card className="space-y-5">
          <div>
            <h2 className="mb-1 font-semibold">{t('documentsTitle')}</h2>
            <p className="text-sm text-muted">{t('documentsHelp')}</p>
          </div>

          {hasCard ? (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">{t('cardTitle')}</h3>
              {documentAvailable(inv, 'card') ? (
                <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <a href={`/admin/api/documents/${inv.id}/card`} className="font-medium text-accent underline">
                    {t('downloadCard')}
                  </a>
                  <a href={`/admin/api/documents/${inv.id}/card?bleed=1`} className="text-accent underline">
                    {t('downloadCardBleed')}
                  </a>
                  {!inv.cardCustomKey ? (
                    <a href={`/admin/api/documents/${inv.id}/card?fresh=1`} className="text-muted underline">
                      {t('regenerate')}
                    </a>
                  ) : null}
                  {delivery ? (
                    <a
                      href={whatsappLink(delivery.phone, withReceiptLines(tr('waCardMessage', { name: delivery.name, url: delivery.cardUrl })))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline"
                    >
                      {t('sendWhatsApp')}
                    </a>
                  ) : null}
                </p>
              ) : (
                <p className="text-sm text-muted">{t('cardAfterPayment')}</p>
              )}

              {inv.cardCustomKey ? (
                <div className="flex flex-wrap items-center gap-3 rounded-md bg-canvas px-3 py-2 text-sm">
                  <span>{t('cardCustomActive')}</span>
                  <ActionForm action={removeCustomCardAction}>
                    <input type="hidden" name="id" value={inv.id} />
                    <SubmitButton tone="secondary">{t('cardBackToAutomatic')}</SubmitButton>
                  </ActionForm>
                </div>
              ) : (
                <details className="rounded-md border border-line px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium">{t('cardAdjust')}</summary>
                  <ActionForm action={cardOptionsAction} className="mt-3 grid gap-3">
                    <input type="hidden" name="id" value={inv.id} />
                    <fieldset className="space-y-1 text-sm">
                      <legend className="mb-1">{t('cardMessage')}</legend>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="messageMode" value="invitation" defaultChecked={inv.cardOptions.message === undefined} />
                        {t('cardMessageSame')}
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="messageMode" value="custom" defaultChecked={inv.cardOptions.message !== undefined} />
                        {t('cardMessageCustom')}
                      </label>
                    </fieldset>
                    <textarea name="message" rows={3} maxLength={300} defaultValue={inv.cardOptions.message ?? ''} dir="auto" className={input} aria-label={t('cardMessage')} />
                    <label className="block">
                      <span className="mb-1 block text-sm">{t('cardExtraLine')}</span>
                      <input name="extraLine" maxLength={120} defaultValue={inv.cardOptions.extraLine ?? ''} dir="auto" className={input} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm">{t('cardBackTitle')}</span>
                      <input name="backTitle" maxLength={40} defaultValue={inv.cardOptions.backTitle ?? ''} dir="auto" className={input} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm">{t('cardBackMessage')}</span>
                      <textarea name="backMessage" rows={3} maxLength={300} defaultValue={inv.cardOptions.backMessage ?? ''} dir="auto" className={input} />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="showQr" defaultChecked={inv.cardOptions.showQr !== false} />
                      {t('cardShowQr')}
                    </label>
                    <div>
                      <SubmitButton>{t('cardSaveOptions')}</SubmitButton>
                    </div>
                  </ActionForm>
                  <div className="mt-4 border-t border-line pt-3">
                    <p className="mb-2 text-sm text-muted">{t('cardUploadHelp')}</p>
                    <CardUploadForm invitationId={inv.id} />
                  </div>
                </details>
              )}
            </section>
          ) : null}

          {hasKeepsake ? (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">{t('keepsakeTitle')}</h3>
              {documentAvailable(inv, 'keepsake') ? (
                <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <a href={`/admin/api/documents/${inv.id}/keepsake`} className="font-medium text-accent underline">
                    {t('downloadKeepsake')}
                  </a>
                  <a href={`/admin/api/documents/${inv.id}/keepsake?fresh=1`} className="text-muted underline">
                    {t('regenerate')}
                  </a>
                  {delivery ? (
                    <a
                      href={whatsappLink(delivery.phone, withReceiptLines(tr('waKeepsakeMessage', { name: delivery.name, url: delivery.keepsakeUrl })))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline"
                    >
                      {t('sendWhatsApp')}
                    </a>
                  ) : null}
                </p>
              ) : (
                <p className="text-sm text-muted">{t('keepsakeAfterPublish')}</p>
              )}
              <p className="text-xs text-muted">{keepsakeReady(inv) ? t('keepsakeCustomerReady') : t('keepsakeCustomerLater')}</p>
            </section>
          ) : null}
        </Card>
      ) : null}

      {showGuests ? (
        <Card>
          <h2 className="mb-1 font-semibold">{t('guestsTitle')}</h2>
          {counts ? <p className="mb-3 text-sm text-muted">{t('guestsSummary', counts)}</p> : null}
          {inv.featureKeys.includes('rsvp') ? (
            <div className="mb-2 flex flex-wrap items-center gap-3 rounded-md bg-canvas px-3 py-2 text-sm">
              <span>{inv.publicAttendance ? t('attendancePublicOn') : t('attendancePublicOff')}</span>
              {can(authz, 'invitations.edit') ? (
                <ActionForm action={attendanceVisibilityAction}>
                  <input type="hidden" name="id" value={inv.id} />
                  <input type="hidden" name="public" value={inv.publicAttendance ? 'false' : 'true'} />
                  <SubmitButton tone="secondary">{inv.publicAttendance ? t('attendanceMakePrivate') : t('attendanceMakePublic')}</SubmitButton>
                </ActionForm>
              ) : null}
            </div>
          ) : null}
          {inv.featureKeys.includes('congratulations') ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md bg-canvas px-3 py-2 text-sm">
              <span>{inv.publicGuestbook ? t('guestbookPublicOn') : t('guestbookPublicOff')}</span>
              {can(authz, 'invitations.edit') ? (
                <ActionForm action={guestbookVisibilityAction}>
                  <input type="hidden" name="id" value={inv.id} />
                  <input type="hidden" name="public" value={inv.publicGuestbook ? 'false' : 'true'} />
                  <SubmitButton tone="secondary">{inv.publicGuestbook ? t('guestbookMakePrivate') : t('guestbookMakePublic')}</SubmitButton>
                </ActionForm>
              ) : null}
            </div>
          ) : null}
          {guests.length === 0 ? (
            <p className="text-sm text-muted">{t('guestsEmpty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-start text-muted">
                  <tr>
                    <th className="p-2 text-start font-normal">{t('guestName')}</th>
                    <th className="p-2 text-start font-normal">{t('guestAttendance')}</th>
                    <th className="p-2 text-start font-normal">{t('guestMessage')}</th>
                    <th className="p-2 text-start font-normal">{t('guestAt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g) => (
                    <tr key={g.id} className="border-t border-line align-top">
                      <td className="p-2" dir="auto">
                        {g.guestName}
                      </td>
                      <td className="p-2">{g.attendance === 'ATTENDING' ? t('attending') : t('notAttending')}</td>
                      <td className="max-w-md p-2">
                        {g.message ? (
                          <div className="space-y-2">
                            <p dir="auto" className={g.messageStatus === 'HIDDEN' ? 'text-muted line-through' : 'whitespace-pre-line'}>
                              {g.message}
                            </p>
                            {g.messageStatus === 'HIDDEN' ? <Badge status="ARCHIVED">{t('messageHidden')}</Badge> : null}
                            {canModerate ? (
                              <ActionForm action={guestMessageStatusAction}>
                                <input type="hidden" name="id" value={inv.id} />
                                <input type="hidden" name="responseId" value={g.id} />
                                <input type="hidden" name="status" value={g.messageStatus === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN'} />
                                <SubmitButton tone={g.messageStatus === 'HIDDEN' ? 'primary' : 'danger'}>
                                  {g.messageStatus === 'HIDDEN' ? t('restoreMessage') : t('hideMessage')}
                                </SubmitButton>
                              </ActionForm>
                            ) : null}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="whitespace-nowrap p-2">{date(g.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

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
