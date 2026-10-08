import { after } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { ensurePreview } from '@/server/documents/documents';
import { isLocale, type Locale } from '@/i18n/config';
import { localized } from '@/server/catalog/common';
import { env } from '@/server/env';
import { formatIqdIn } from '@/lib/currency';
import { formatLongDate } from '@/server/invitation/theme-props';
import { ReceiptActions } from '@/components/receipt/ReceiptActions';
import { ConfirmingPayment, PayButton } from '@/components/receipt/PaymentStatus';
import { DocumentPreview } from '@/components/receipt/DocumentPreview';
import { GuestbookChoice } from '@/components/receipt/GuestbookChoice';
import { db } from '@/server/db/client';
import { getReceipt } from '@/server/orders/receipt';
import { paymentWindowOpen, refreshOrderPayment } from '@/server/payments/service';
import { onlinePaymentsEnabled } from '@/server/payments/wayl';
import { getSettings } from '@/server/settings/service';
import { receiptFor } from './data';
import { attendanceAction, cardBackAction, guestbookAction, payAction } from './actions';
import { CARD_BACK_LIMITS } from '@/server/orders/extras';
import { attendanceCounts } from '@/server/guests/attendance';
import { SELF_EDIT_LIMIT } from '@/server/invitation/customer-edit';

/**
 * Private receipt/confirmation page. Reachable only with its unguessable
 * token; rendered from the order's immutable snapshot. (Visual design follows
 * the approved storefront design in M4.)
 */
export default async function ReceiptPage({ params, searchParams }: PageProps<'/r/[token]'>) {
  const { token } = await params;
  const sp = await searchParams;
  let r = await receiptFor(token);
  const unpaid = r?.status === 'PENDING' || r?.status === 'AWAITING_PAYMENT';
  // Coming back from WAYL (or reloading): ask WAYL directly; the redirect itself proves nothing.
  const check = r && unpaid ? await refreshOrderPayment(db(), r.orderId) : null;
  if (check === 'PAID') r = await getReceipt(db(), token);
  const locale: Locale = r && isLocale(r.snapshot.invitation.locale) ? r.snapshot.invitation.locale : 'ar';
  const t = await getTranslations({ locale, namespace: 'receipt' });
  const tStore = await getTranslations({ locale, namespace: 'store' });
  const brand = (await getTranslations({ locale, namespace: 'common' }))('brand');
  if (!r) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6 text-center">
        <p>{t('notFound')}</p>
      </main>
    );
  }
  const date = (d: Date | null) => (d ? formatLongDate(d, locale) : '—');
  const url = r.invitation.path ? `${env().APP_URL}${r.invitation.path}` : null;
  const paid = r.status === 'PAID';
  const stillPayable = paymentWindowOpen(r);
  const online = onlinePaymentsEnabled();
  const canPay = stillPayable && online;
  // Manual collection has no time limit: the team confirms whenever the customer pays.
  const waitingManual = (r.status === 'PENDING' || r.status === 'AWAITING_PAYMENT') && !online;
  const { payment } = waitingManual ? await getSettings(db()) : { payment: null };
  const waText = t('waMessage', { order: r.orderNumber, amount: formatIqdIn(r.amountIqd, locale) });
  const rows: [string, string][] = [
    [t('orderNumber'), r.orderNumber],
    ...(r.invoiceNumber ? ([[t('invoiceNumber'), r.invoiceNumber]] as [string, string][]) : []),
    [t('status'), t(`statuses.${r.status}`)],
    [t('customer'), r.snapshot.customer.name],
    [t('phone'), r.snapshot.customer.phone],
    [t('email'), r.snapshot.customer.email],
    [t('theme'), localized(r.snapshot.theme.name, locale)],
    [t('package'), localized(r.snapshot.package.name, locale)],
    ...(r.snapshot.pricing.discountIqd
      ? ([
          [t('listPrice'), formatIqdIn(r.snapshot.pricing.listPriceIqd ?? r.amountIqd, locale)],
          [t('discount', { code: r.snapshot.pricing.couponCode ?? '' }), `− ${formatIqdIn(r.snapshot.pricing.discountIqd, locale)}`],
        ] as [string, string][])
      : []),
    [t('amount'), formatIqdIn(r.amountIqd, locale)],
    [t('purchaseDate'), date(r.createdAt)],
    ...(r.paidAt ? ([[t('paidDate'), date(r.paidAt)]] as [string, string][]) : []),
    ...(r.invitation.publishedAt ? ([[t('publishedAt'), date(r.invitation.publishedAt)], [t('expiresAt'), date(r.invitation.expiresAt)]] as [string, string][]) : []),
  ];

  const base = `/r/${encodeURIComponent(token)}`;
  // Have the WhatsApp link-preview picture ready before the customer shares the invitation.
  if (paid && r.invitation.live) after(() => ensurePreview(db(), r!.invitation.id, 'og').then(() => undefined, (e) => console.error('[og] warm-up failed', e)));
  const replies = paid && r.invitation.hasRsvp ? await attendanceCounts(db(), r.invitation.id) : null;
  const num = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ar-IQ');
  // The two PDFs side by side at the end: the card, and the keepsake from publication (it grows as guests write).
  const files = paid
    ? [
        ...(r.invitation.hasPrintCard
          ? [{ kind: 'card' as const, title: t('printCardTitle'), download: t('printCardDownload'), preview: !r.invitation.customCard }]
          : []),
        ...(r.invitation.hasKeepsake ? [{ kind: 'keepsake' as const, title: t('keepsakeTitle'), download: t('keepsakeDownload'), preview: true }] : []),
      ]
    : [];

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <p className="text-2xl font-semibold text-accent">{brand}</p>
      <h1 className="mt-6 text-xl font-semibold">{paid ? t('paidTitle') : t('pendingTitle')}</h1>
      <p className="text-sm text-muted">{t('title')}</p>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-4" aria-labelledby="access-code-title">
        <h2 id="access-code-title" className="text-sm font-semibold">
          {t('accessCodeTitle')}
        </h2>
        <p className="mt-1 text-2xl font-semibold tracking-widest" dir="ltr">
          {r.accessCode}
        </p>
        <p className="mt-1 text-xs text-muted">{t('accessCodeHelp', { site: env().APP_URL.replace(/^https?:\/\//, '') })}</p>
      </section>

      {canPay || waitingManual ? (
        <section className="mt-6 flex flex-col gap-3 print:hidden">
          {sp.paid === '1' && canPay ? <ConfirmingPayment confirming={t('confirming')} slow={t('confirmingSlow')} /> : null}
          {sp.pay === 'error' ? (
            <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {t('payError')}
            </p>
          ) : null}
          {canPay ? (
            <form action={payAction} className="flex flex-col gap-2">
              <input type="hidden" name="token" value={token} />
              <PayButton label={t('payNow', { amount: formatIqdIn(r.amountIqd, locale) })} pendingLabel={t('payOpening')} />
              <p className="text-center text-xs text-muted">{t('payNote')}</p>
            </form>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl bg-blush px-4 py-4 text-sm">
              <p className="whitespace-pre-line leading-relaxed" dir="auto">
                {payment?.manualInstructions ? localized(payment.manualInstructions, locale) : t('payManual')}
              </p>
              {payment?.whatsapp ? (
                <a
                  href={`https://wa.me/${payment.whatsapp.slice(1)}?text=${encodeURIComponent(waText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-accent-ink"
                >
                  {t('payWhatsApp')}
                </a>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      <dl className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium" dir="auto">
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">{t('amountNote')}</p>

      <section className="mt-8 space-y-3">
        <h2 className="font-semibold">{t('invitationLink')}</h2>
        {url ? (
          <p className="break-all rounded-md bg-canvas px-3 py-2 text-sm" dir="ltr">
            {url}
          </p>
        ) : (
          <p className="text-sm text-muted">{t('notPublishedYet')}</p>
        )}
        <ReceiptActions
          url={url}
          shareText={t('shareText', { url: url ?? '' })}
          confirmText={`${t('confirmText', { invoice: r.invoiceNumber ?? r.orderNumber, url: url ?? '', expires: date(r.invitation.expiresAt) })}\n${t('receiptLinkLine', { url: `${env().APP_URL.replace(/\/$/, '')}${base}` })}\n${t('accessCodeLine', { code: r.accessCode })}`}
          labels={{
            copyLink: t('copyLink'),
            copied: t('copied'),
            shareWhatsApp: t('shareWhatsApp'),
            saveWhatsApp: t('saveWhatsApp'),
            openInvitation: t('openInvitation'),
            print: t('print'),
          }}
        />
      </section>

      {paid && r.invitation.selfEdit.included ? (
        <section id="edit" className="mt-8 space-y-2 print:hidden">
          <h2 className="font-semibold">{t('editTitle')}</h2>
          {sp.edited === '1' ? (
            <p role="status" className="text-sm text-accent">
              {t('editSaved')}
            </p>
          ) : null}
          {r.invitation.selfEdit.allowed ? (
            <>
              <p className="text-sm text-muted">{t('editHelp', { left: r.invitation.selfEdit.left, total: SELF_EDIT_LIMIT })}</p>
              <a
                href={`/r/${encodeURIComponent(token)}/edit`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-accent px-6 text-sm font-semibold text-accent"
              >
                {t('editButton')}
              </a>
            </>
          ) : (
            <p className="text-sm text-muted">{r.invitation.selfEdit.left === 0 ? t('editLimitReached') : t('editClosed')}</p>
          )}
        </section>
      ) : null}

      {paid && r.invitation.hasMessages ? (
        <section id="guestbook" className="mt-8 space-y-3 print:hidden">
          <h2 className="font-semibold">{t('guestbookTitle')}</h2>
          <p className="text-sm text-muted">{t('guestbookHelp')}</p>
          <GuestbookChoice
            initialPublic={r.invitation.publicGuestbook}
            save={guestbookAction.bind(null, token)}
            labels={{
              title: t('guestbookTitle'),
              private: t('guestbookPrivate'),
              public: t('guestbookPublic'),
              saving: t('guestbookSaving'),
              saved: t('guestbookSaved'),
              error: t('guestbookError'),
            }}
          />
        </section>
      ) : null}

      {replies ? (
        <section id="attendance" className="mt-8 space-y-3 print:hidden">
          <h2 className="font-semibold">{t('attendanceTitle')}</h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-lg font-semibold">
            <li>{t('attendanceComing', { count: num.format(replies.attending) })}</li>
            <li className="text-muted">{t('attendanceNotComing', { count: num.format(replies.notAttending) })}</li>
          </ul>
          <p className="text-sm text-muted">{t('attendanceHelp')}</p>
          <GuestbookChoice
            name="attendanceVisibility"
            initialPublic={r.invitation.publicAttendance}
            save={attendanceAction.bind(null, token)}
            labels={{
              title: t('attendanceTitle'),
              private: t('attendancePrivate'),
              public: t('attendancePublic'),
              saving: t('guestbookSaving'),
              saved: t('guestbookSaved'),
              error: t('guestbookError'),
            }}
          />
        </section>
      ) : null}

      {files.length ? (
        <section id="files" className="mt-8 space-y-3 print:hidden" aria-labelledby="files-title">
          <h2 id="files-title" className="font-semibold">
            {t('filesTitle')}
          </h2>
          <p className="text-sm text-muted">{t('filesHelp')}</p>
          <div className={`grid gap-4 ${files.length > 1 ? 'grid-cols-2' : 'mx-auto max-w-[220px] grid-cols-1'}`}>
            {files.map((f) => (
              <DocumentPreview
                key={f.kind}
                title={f.title}
                imageSrc={f.preview ? `${base}/preview/${f.kind}` : null}
                back={f.kind === 'card' && f.preview ? { src: `${base}/preview/cardBack`, title: tStore('cardBack.heading') } : undefined}
                openHref={`${base}/${f.kind}?inline=1`}
                downloadHref={`${base}/${f.kind}`}
                labels={{ download: f.download, pdf: t('pdfFile'), flip: t('flipCard') }}
              />
            ))}
          </div>
          {r.invitation.hasPrintCard ? <p className="text-xs text-muted">{t('printCardHelp')}</p> : null}
          {r.invitation.hasPrintCard && !r.invitation.customCard ? (
            <details id="card-back" open={sp.cardBack !== undefined} className="rounded-2xl border border-line bg-surface px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold">{tStore('cardBack.heading')}</summary>
              <form action={cardBackAction} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="token" value={token} />
                <p className="text-xs text-muted">{tStore('cardBack.help')}</p>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">{tStore('cardBack.title')}</span>
                  <input name="title" dir="auto" defaultValue={r.invitation.cardBack.title} maxLength={CARD_BACK_LIMITS.title} placeholder={tStore('cardBack.titlePlaceholder')} className="rounded-xl border border-line bg-canvas px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">{tStore('cardBack.message')}</span>
                  <textarea name="message" dir="auto" rows={4} defaultValue={r.invitation.cardBack.message} maxLength={CARD_BACK_LIMITS.message} placeholder={tStore('cardBack.messagePlaceholder')} className="rounded-xl border border-line bg-canvas px-3 py-2" />
                </label>
                <div className="flex items-center gap-3">
                  <button type="submit" className="inline-flex h-10 items-center justify-center rounded-full border border-accent px-5 text-sm font-semibold text-accent">
                    {t('cardBackSave')}
                  </button>
                  {sp.cardBack === 'saved' ? (
                    <span role="status" className="text-sm font-semibold text-accent">
                      ✓ {t('guestbookSaved')}
                    </span>
                  ) : sp.cardBack === 'error' ? (
                    <span role="alert" className="text-sm text-danger">
                      {t('guestbookError')}
                    </span>
                  ) : null}
                </div>
              </form>
            </details>
          ) : null}
          {r.invitation.hasKeepsake ? (
            <p className="text-xs text-muted">
              {t('keepsakeHelp')} {r.invitation.keepsakeReady ? null : t('keepsakeGrowing')}
            </p>
          ) : null}
        </section>
      ) : null}

      <p className="mt-8 text-sm">{t('corrections')}</p>
      <p className="mt-2 text-xs text-muted print:hidden">{t('keepLink')}</p>
    </main>
  );
}
