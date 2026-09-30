import { getTranslations } from 'next-intl/server';
import { isLocale, localeMeta, type Locale } from '@/i18n/config';
import { localized } from '@/server/catalog/common';
import { env } from '@/server/env';
import { formatIqd } from '@/lib/currency';
import { ReceiptActions } from '@/components/receipt/ReceiptActions';
import { receiptFor } from './data';

/**
 * Private receipt/confirmation page. Reachable only with its unguessable
 * token; rendered from the order's immutable snapshot. (Visual design follows
 * the approved storefront design in M4.)
 */
export default async function ReceiptPage({ params }: PageProps<'/r/[token]'>) {
  const { token } = await params;
  const r = await receiptFor(token);
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
