import { after } from 'next/server';
import { isForever } from '@/catalog/lifetime';
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
import { ExtrasPreview } from '@/components/storefront/order/ExtrasPreview';
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
import { listGuestResponses } from '@/server/guests/responses';
import { SELF_EDIT_LIMIT } from '@/server/invitation/customer-edit';

/**
 * Private receipt/confirmation page. Reachable only with its unguessable
 * token; rendered from the order's immutable snapshot. After paying (owner, 2026-10-29): the design's picture with the
 * names and status at the top, a sticky row of chips to jump between sections, and every section as its own card.
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
  const common = await getTranslations({ locale, namespace: 'common' });
  /** An invitation's end: its date, or "No end date" for a package that lasts forever. */
  const until = (d: Date | null) => (isForever(d) ? common('noEnd') : date(d));
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
    ...(r.invitation.publishedAt && r.invitation.onlineInvitation ? ([[t('publishedAt'), date(r.invitation.publishedAt)], [t('expiresAt'), until(r.invitation.expiresAt)]] as [string, string][]) : []),
  ];

  const base = `/r/${encodeURIComponent(token)}`;
  // Have the WhatsApp link-preview picture ready before the customer shares the invitation.
  if (paid && r.invitation.live && r.invitation.onlineInvitation) after(() => ensurePreview(db(), r!.invitation.id, 'og').then(() => undefined, (e) => console.error('[og] warm-up failed', e)));
  const replies = paid && r.invitation.hasRsvp ? await attendanceCounts(db(), r.invitation.id) : null;
  // Who replied, coming or not, with their message (hidden messages left out), newest first.
  const replyList = replies ? (await listGuestResponses(db(), r.invitation.id)).reverse() : [];
  const num = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ar-IQ');
  // The two PDFs side by side at the end: the card, and the keepsake from publication (it grows as guests write).
  const files = paid
    ? [
        // One file per printed card the customer ticked (the A5 card and/or shapes); an uploaded card replaces them.
        ...(r.invitation.hasPrintCard
          ? (r.invitation.customCard ? ['a5'] : r.invitation.cards).map((c) => ({
              kind: 'card' as const,
              key: `card-${c}`,
              // Only the A5 card: the same addresses as before; with shapes, each file is asked for by key.
              query: r.invitation.customCard || (r.invitation.cards.length === 1 && c === 'a5') ? '' : `card=${c}`,
              title: r.invitation.cardLabels[c] ? `${t('printCardTitle')} · ${localized(r.invitation.cardLabels[c]!, locale)}` : t('printCardTitle'),
              download: t('printCardDownload'),
              preview: !r.invitation.customCard,
            }))
          : []),
        ...(r.invitation.hasKeepsake ? [{ kind: 'keepsake' as const, key: 'keepsake', query: '', title: t('keepsakeTitle'), download: t('keepsakeDownload'), preview: true }] : []),
      ]
    : [];

  const v = r.snapshot.invitation.fieldValues;
  const names = [v.person_1_name, v.person_2_name].filter(Boolean).join(' ♡ ') || v.baby_name || '';
  const rawDate = v.event_date || v.birth_date || '';
  const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? date(new Date(`${rawDate}T12:00:00Z`)) : '';
  const hasExtras = paid && r.invitation.featureKeys.some((k) => ['story', 'sticker', 'bottle_label'].includes(k) || k.startsWith('collage_') || k === 'couple_poster');
  // The sections a paid customer jumps between (a sticky row of chips; each section scrolls into place below it).
  const nav = paid
    ? ([
        r.invitation.onlineInvitation ? ['invitation', t('navInvitation')] : null,
        r.invitation.selfEdit.included ? ['edit', t('navEdit')] : null,
        replies ? ['attendance', t('navReplies')] : null,
        r.invitation.hasMessages ? ['guestbook', t('navGuestbook')] : null,
        files.length ? ['files', t('navFiles')] : null,
        hasExtras ? ['extras', t('navExtras')] : null,
        ['details', t('navDetails')],
      ].filter(Boolean) as [string, string][])
    : [];
  const card = 'scroll-mt-20 rounded-3xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] print:break-inside-avoid';

  const details = (
    <section id="details" className={card} aria-labelledby="details-title">
      <h2 id="details-title" className="font-semibold">
        {t('detailsTitle')}
      </h2>
      <dl className="mt-3 divide-y divide-line">
        {rows.map(([k, val]) => (
          <div key={k} className="flex flex-wrap justify-between gap-2 py-2.5 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium" dir="auto">
              {val}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">{t('amountNote')}</p>
    </section>
  );

  return (
    <main className="mx-auto max-w-xl px-4 pt-6 pb-16">
      <p className="text-2xl font-semibold text-accent">{brand}</p>

      {/* The header: the design's own picture, what was ordered and where things stand. */}
      <header className="relative mt-4 overflow-hidden rounded-[2rem] bg-blush" data-receipt-hero>
        {r.invitation.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.invitation.coverUrl} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl" />
        ) : null}
        <div className="relative flex flex-col items-center gap-4 px-6 pt-8 pb-7 text-center">
          {r.invitation.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.invitation.coverUrl}
              alt={localized(r.snapshot.theme.name, locale)}
              className="aspect-[5/7] w-40 rounded-2xl object-cover shadow-[0_18px_40px_-12px_rgb(0_0_0/0.35)] ring-4 ring-surface/80"
            />
          ) : null}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${paid ? 'bg-accent text-accent-ink' : 'bg-surface/90 text-ink'}`}
          >
            {paid ? '✓ ' : null}
            {t(`statuses.${r.status}`)}
          </span>
          <h1 className="text-2xl font-semibold">{paid ? t('paidTitle') : t('pendingTitle')}</h1>
          {names ? (
            <p className="text-lg font-medium" dir="auto">
              {names}
            </p>
          ) : null}
          <p className="text-sm text-muted">
            {localized(r.snapshot.theme.name, locale)} · {localized(r.snapshot.package.name, locale)}
            {eventDate ? (
              <>
                {' · '}
                <span dir="auto">{eventDate}</span>
              </>
            ) : null}
          </p>
          <p className="max-w-sm text-sm leading-relaxed">{paid ? t('heroPaid') : t('heroPending')}</p>
        </div>
      </header>

      {nav.length > 1 ? (
        <nav aria-label={t('navLabel')} className="sticky top-0 z-20 -mx-4 mt-4 bg-canvas/90 px-4 py-2 backdrop-blur print:hidden" data-receipt-nav>
          <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {nav.map(([id, label]) => (
              <li key={id} className="shrink-0">
                <a href={`#${id}`} className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-4 text-sm font-medium hover:border-accent hover:text-accent">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="mt-4 flex flex-col gap-4">
        {canPay || waitingManual ? (
          <section className={`${card} flex flex-col gap-3 print:hidden`}>
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

        <section className={`${card} flex flex-wrap items-center justify-between gap-3`} aria-labelledby="access-code-title">
          <div>
            <h2 id="access-code-title" className="text-sm font-semibold">
              {t('accessCodeTitle')}
            </h2>
            <p className="mt-1 text-xs text-muted">{t('accessCodeHelp', { site: env().APP_URL.replace(/^https?:\/\//, '') })}</p>
          </div>
          <p className="rounded-2xl bg-canvas px-4 py-2 text-2xl font-semibold tracking-widest" dir="ltr">
            {r.accessCode}
          </p>
        </section>

        {/* Designs without an online invitation are files only: no link to show or share. */}
        {r.invitation.onlineInvitation ? (
          <section id="invitation" className={`${card} space-y-4`}>
            <h2 className="font-semibold">{t('invitationLink')}</h2>
            {url && r.invitation.live && r.invitation.path ? (
              // How the link looks when shared on WhatsApp: the same picture, the link under it.
              <a href={url} target="_blank" rel="noopener" className="block overflow-hidden rounded-2xl border border-line bg-canvas" data-invitation-preview>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${r.invitation.path}/og`} alt={t('invitationPictureAlt')} loading="lazy" className="aspect-[1200/630] w-full object-cover" />
                <span className="block truncate px-4 py-2 text-sm text-muted" dir="ltr">
                  {url}
                </span>
              </a>
            ) : url ? (
              <p className="break-all rounded-xl bg-canvas px-3 py-2 text-sm" dir="ltr">
                {url}
              </p>
            ) : (
              <p className="text-sm text-muted">{t('notPublishedYet')}</p>
            )}
            <ReceiptActions
              url={url}
              shareText={t('shareText', { url: url ?? '' })}
              confirmText={`${t('confirmText', { invoice: r.invoiceNumber ?? r.orderNumber, url: url ?? '', expires: until(r.invitation.expiresAt) })}\n${t('receiptLinkLine', { url: `${env().APP_URL.replace(/\/$/, '')}${base}` })}\n${t('accessCodeLine', { code: r.accessCode })}`}
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
        ) : null}
        {paid && r.invitation.selfEdit.included ? (
          <section id="edit" className={`${card} space-y-2 print:hidden`}>
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
          <section id="guestbook" className={`${card} space-y-3 print:hidden`}>
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
          <section id="attendance" className={`${card} space-y-3 print:hidden`}>
            <h2 className="font-semibold">{t('attendanceTitle')}</h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-lg font-semibold">
              <li>{t('attendanceComing', { count: num.format(replies.attending) })}</li>
              <li className="text-muted">{t('attendanceNotComing', { count: num.format(replies.notAttending) })}</li>
            </ul>
            {replyList.length ? (
              <details open={replyList.length <= 30} className="rounded-xl border border-line bg-paper px-4 py-3" data-guest-replies>
                <summary className="cursor-pointer text-sm font-medium">{t('repliesList', { count: num.format(replyList.length) })}</summary>
                <ul className="mt-3 divide-y divide-line">
                  {replyList.map((g) => (
                    <li key={g.id} className="flex flex-col gap-1 py-2" data-guest-reply={g.attendance}>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium" dir="auto">
                          {g.guestName}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${g.attendance === 'ATTENDING' ? 'bg-accent/10 text-accent' : 'bg-line/60 text-muted'}`}
                        >
                          {g.attendance === 'ATTENDING' ? t('replyComing') : t('replyNotComing')}
                        </span>
                        {g.partySize > 1 ? (
                          <span className="text-xs font-semibold text-muted" data-guest-party={g.partySize}>
                            {t('replyParty', { count: num.format(g.partySize) })}
                          </span>
                        ) : null}
                      </span>
                      {g.message && g.messageStatus === 'VISIBLE' ? (
                        <p className="text-sm whitespace-pre-line text-muted" dir="auto">
                          {g.message}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
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

        {hasExtras ? (
          <div className={`${card} print:hidden`}>
            <ExtrasPreview
              base={`${base}/extra`}
              featureKeys={r.invitation.featureKeys}
              stickerShape={r.invitation.stickerShape}
              watermarked={false}
              downloads
              labels={{
                title: tStore('extras.title'),
                note: tStore('extras.watermarkNote'),
                card: tStore('extras.card'),
                cardBack: tStore('cardBack.heading'),
                story: tStore('extras.story'),
                sticker: tStore('extras.sticker'),
                round: tStore('stickerShape.round'),
                square: tStore('stickerShape.square'),
                bottle: tStore('extras.bottle'),
                downloadPng: tStore('extras.downloadPng'),
                downloadSheet: tStore('extras.downloadSheet'),
                collagePolaroids: tStore('extras.collagePolaroids'),
                collageStory: tStore('extras.collageStory'),
                collageWall: tStore('extras.collageWall'),
                posterLandscape: tStore('extras.posterLandscape'),
                posterPortrait: tStore('extras.posterPortrait'),
                downloadJpg: tStore('extras.downloadJpg'),
              }}
            />
          </div>
        ) : null}

        {files.length ? (
          <section id="files" className={`${card} space-y-3 print:hidden`} aria-labelledby="files-title">
            <h2 id="files-title" className="font-semibold">
              {t('filesTitle')}
            </h2>
            <p className="text-sm text-muted">{t('filesHelp')}</p>
            <div className={`grid gap-4 ${files.length > 1 ? 'grid-cols-2' : 'mx-auto max-w-[220px] grid-cols-1'}`}>
              {files.map((f) => (
                <DocumentPreview
                  key={f.key}
                  title={f.title}
                  imageSrc={f.preview ? `${base}/preview/${f.kind}${f.query ? `?${f.query}` : ''}` : null}
                  back={f.kind === 'card' && f.preview ? { src: `${base}/preview/cardBack${f.query ? `?${f.query}` : ''}`, title: tStore('cardBack.heading') } : undefined}
                  openHref={`${base}/${f.kind}?inline=1${f.query ? `&${f.query}` : ''}`}
                  downloadHref={`${base}/${f.kind}${f.query ? `?${f.query}` : ''}`}
                  labels={{ download: f.download, pdf: t('pdfFile'), flip: t('flipCard') }}
                />
              ))}
            </div>
            {r.invitation.hasPrintCard && r.invitation.cards.some((c) => c !== 'a5') && !r.invitation.customCard ? (
              <div className="space-y-2">
                <p className="text-xs text-muted">{t('shapeCardHelp')}</p>
                {r.invitation.cards
                  .filter((c) => c !== 'a5')
                  .map((c) => (
                    <p key={c} className="flex flex-wrap items-center gap-2" data-shape-pngs={c}>
                      {r.invitation.cards.length > 1 && r.invitation.cardLabels[c] ? <span className="text-sm font-medium">{localized(r.invitation.cardLabels[c]!, locale)}</span> : null}
                      {(['front', 'back'] as const).map((side) => (
                        <a key={side} href={`${base}/card-png/${side}?card=${c}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium" download>
                          {t(side === 'front' ? 'shapePngFront' : 'shapePngBack')}
                        </a>
                      ))}
                    </p>
                  ))}
              </div>
            ) : r.invitation.hasPrintCard ? (
              <p className="text-xs text-muted">{t('printCardHelp')}</p>
            ) : null}
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

        {details}
      </div>

      <p className="mt-8 text-sm">{t('corrections')}</p>
      <p className="mt-2 text-xs text-muted print:hidden">{t('keepLink')}</p>
    </main>
  );
}
