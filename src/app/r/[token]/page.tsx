import { getTranslations } from 'next-intl/server';
import { isLocale, localeMeta, type Locale } from '@/i18n/config';
import { localized } from '@/server/catalog/common';
import { env } from '@/server/env';
import { formatIqd } from '@/lib/currency';
import { ReceiptActions } from '@/components/receipt/ReceiptActions';
import { ConfirmingPayment, PayButton } from '@/components/receipt/PaymentStatus';
import { db } from '@/server/db/client';
import { getReceipt } from '@/server/orders/receipt';
import { paymentWindowOpen, refreshOrderPayment } from '@/server/payments/service';
import { onlinePaymentsEnabled } from '@/server/payments/wayl';
import { getSettings } from '@/server/settings/service';
import { receiptFor } from './data';
import { payAction } from './actions';

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
  const brand = (await getTranslations({ locale, namespace: 'common' }))('brand');
  if (!r) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6 text-center">
        <p>{t('notFound')}</p>
      </main>
    );
  }
  const intl = localeMeta[locale].intlLocale;
  const date = (d: Date | null) => (d ? new Intl.DateTimeFormat(intl, { dateStyle: 'long', timeZone: 'Asia/Baghdad' }).format(d) : '—');
  const url = r.invitation.path ? `${env().APP_URL}${r.invitation.path}` : null;
  const paid = r.status === 'PAID';
  const stillPayable = paymentWindowOpen(r);
  const online = onlinePaymentsEnabled();
  const canPay = stillPayable && online;
  // Manual collection has no time limit: the team confirms whenever the customer pays.
  const waitingManual = (r.status === 'PENDING' || r.status === 'AWAITING_PAYMENT') && !online;
  const { payment } = waitingManual ? await getSettings(db()) : { payment: null };
  const waText = t('waMessage', { order: r.orderNumber, amount: formatIqd(r.amountIqd, intl) });
  const rows: [string, string][] = [
    [t('orderNumber'), r.orderNumber],
    ...(r.invoiceNumber ? ([[t('invoiceNumber'), r.invoiceNumber]] as [string, string][]) : []),
    [t('status'), t(`statuses.${r.status}`)],
    [t('customer'), r.snapshot.customer.name],
    [t('phone'), r.snapshot.customer.phone],
    [t('email'), r.snapshot.customer.email],
    [t('theme'), localized(r.snapshot.theme.name, locale)],
    [t('package'), localized(r.snapshot.package.name, locale)],
    [t('amount'), formatIqd(r.amountIqd, intl)],
    [t('purchaseDate'), date(r.createdAt)],
    ...(r.paidAt ? ([[t('paidDate'), date(r.paidAt)]] as [string, string][]) : []),
    ...(r.invitation.publishedAt ? ([[t('publishedAt'), date(r.invitation.publishedAt)], [t('expiresAt'), date(r.invitation.expiresAt)]] as [string, string][]) : []),
  ];

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <p className="text-2xl font-semibold text-accent">{brand}</p>
      <h1 className="mt-6 text-xl font-semibold">{paid ? t('paidTitle') : t('pendingTitle')}</h1>
      <p className="text-sm text-muted">{t('title')}</p>

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
              <PayButton label={t('payNow', { amount: formatIqd(r.amountIqd, intl) })} pendingLabel={t('payOpening')} />
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
          confirmText={t('confirmText', { invoice: r.invoiceNumber ?? r.orderNumber, url: url ?? '', expires: date(r.invitation.expiresAt) })}
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

      <p className="mt-8 text-sm">{t('corrections')}</p>
      <p className="mt-2 text-xs text-muted print:hidden">{t('keepLink')}</p>
    </main>
  );
}
