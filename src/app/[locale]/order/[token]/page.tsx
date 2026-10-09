import { randomBytes } from 'node:crypto';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/localized';
import type { Locale } from '@/i18n/config';
import { draftByToken } from '@/server/storefront/order';
import { Price } from '@/components/storefront/currency';
import { CheckoutForm } from '@/components/storefront/order/CheckoutForm';
import { OrderSteps } from '@/components/storefront/order/OrderSteps';
import { ExtrasPreview } from '@/components/storefront/order/ExtrasPreview';
import { onlinePaymentsEnabled } from '@/server/payments/wayl';
import { placeOrderAction } from '../../_actions/order';

export const dynamicParams = true;

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

/** Review: the customer's real invitation in its theme, then contact details and confirmation. */
export default async function ReviewPage({ params }: PageProps<'/[locale]/order/[token]'>) {
  const { locale, token } = (await params) as { locale: Locale; token: string };
  setRequestLocale(locale);
  const t = await getTranslations('store');
  const draft = await draftByToken(token);
  if (!draft) {
    return (
      <div className="mx-auto flex max-w-[560px] flex-col items-center gap-6 px-6 py-24 text-center">
        <p className="text-lg">{t('errors.previewExpired')}</p>
        <Link href="/themes" className="inline-flex h-12 items-center rounded-full bg-accent px-7 font-semibold text-accent-ink">
          {t('catalogTitle')}
        </Link>
      </div>
    );
  }
  const previewSrc = `/p/${token}`;

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-10 lg:px-10 lg:pt-16">
      <div className="mx-auto max-w-[640px] lg:mx-0">
        <OrderSteps current={1} />
      </div>
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-20">
        <div className="flex flex-col items-center gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="w-full max-w-[380px] rounded-[44px] bg-heading p-3 shadow-[0_30px_60px_rgb(58_21_32/0.25)]">
            <iframe src={previewSrc} title={t('reviewTitle')} className="block h-[640px] w-full rounded-[34px] bg-surface lg:h-[700px]" />
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-accent">
            {draft.status === 'DRAFT' ? (
              <Link href={`/order/${token}/edit`} className="underline underline-offset-4">
                {t('edit')}
              </Link>
            ) : null}
            <a href={previewSrc} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              {t('openPreview')}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[36px] leading-[1.3] font-bold text-heading lg:text-[48px]">{t('reviewTitle')}</h1>
            <p className="text-[15px] leading-relaxed text-muted">{t('reviewSubtitle')}</p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-[22px] border border-line bg-paper px-5 py-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted">{t('packageLabel')}</span>
              <span className="font-semibold text-heading">
                {localized(draft.theme.name, locale)} · {localized(draft.pkg.name, locale)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted">{t('total')}</span>
              <span className="text-lg font-semibold text-accent">
                <Price iqd={draft.pkg.priceIqd} />
              </span>
            </div>
          </div>
          <ExtrasPreview
            base={`/p/${token}/extra`}
            featureKeys={draft.featureKeys}
            stickerShape={draft.current.stickerShape}
            watermarked
            labels={{
              title: t('extras.title'),
              note: t('extras.watermarkNote'),
              card: t('extras.card'),
              story: t('extras.story'),
              sticker: t('extras.sticker'),
              bottle: t('extras.bottle'),
              downloadPng: t('extras.downloadPng'),
              downloadSheet: t('extras.downloadSheet'),
            }}
          />
          <section aria-labelledby="contact-title" className="flex flex-col gap-4">
            <div>
              <h2 id="contact-title" className="text-xl font-semibold text-heading">
                {t('contactTitle')}
              </h2>
              <p className="mt-1 text-sm text-muted">{t('contactNote')}</p>
            </div>
            <CheckoutForm
              action={placeOrderAction}
              token={token}
              idempotencyKey={randomBytes(18).toString('base64url')}
              paymentNote={onlinePaymentsEnabled() ? t('paymentNext') : t('paymentSoon')}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
