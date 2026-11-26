import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { localized } from '@/lib/localized';
import type { Locale } from '@/i18n/config';
import { draftByToken, livePreviewSpec, orderFormExtras } from '@/server/storefront/order';
import { LivePreview } from '@/components/storefront/order/LivePreview';
import { PreviewLayout } from '@/components/storefront/order/PreviewLayout';
import { baghdadToday } from '@/server/orders/validation';
import { OrderForm } from '@/components/storefront/order/OrderForm';
import { OrderSteps } from '@/components/storefront/order/OrderSteps';
import { editDraftAction } from '../../../_actions/order';

export const dynamicParams = true;

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default async function EditDraftPage({ params }: PageProps<'/[locale]/order/[token]/edit'>) {
  const { locale, token } = (await params) as { locale: Locale; token: string };
  setRequestLocale(locale);
  const t = await getTranslations('store');
  const draft = await draftByToken(token);
  if (!draft || draft.status !== 'DRAFT') {
    return (
      <div className="mx-auto flex max-w-[560px] flex-col items-center gap-6 px-6 py-24 text-center">
        <p className="text-lg">{draft ? t('lockedNote') : t('errors.previewExpired')}</p>
        <Link href={draft ? `/order/${token}` : '/themes'} className="inline-flex h-12 items-center rounded-full bg-accent px-7 font-semibold text-accent-ink">
          {draft ? t('reviewTitle') : t('catalogTitle')}
        </Link>
      </div>
    );
  }
  // A template design is edited in place, on the review page itself.
  if (draft.template) {
    redirect({ href: `/order/${token}`, locale });
    return null;
  }
  // The live preview beside the form (owner, 2026-11-26).
  const preview = await livePreviewSpec({ themeKey: draft.theme.key, packageId: draft.pkg.id, featureKeys: draft.featureKeys, fieldKeys: draft.fieldKeys, occasion: draft.current.event.occasion, locale: draft.locale });
  return (
    <div className={`mx-auto px-6 pt-10 lg:pt-16 ${preview ? 'max-w-[1180px]' : 'max-w-[640px]'}`}>
      <PreviewLayout preview={preview ? <LivePreview spec={preview} formId="order-form" initialLang={draft.locale} /> : null}>
      <OrderSteps current={0} />
      <h1 className="mt-8 font-display text-[36px] leading-[1.3] font-bold text-heading lg:text-[48px]">{t('editTitle')}</h1>
      <p className="mt-2 text-sm text-muted">
        {localized(draft.theme.name, locale)} · {localized(draft.pkg.name, locale)}
      </p>
      <div className="mt-8" id="order-form">
        <OrderForm
          action={editDraftAction}
          hidden={{ token, siteLocale: locale }}
          fields={draft.fields.map((f) => ({ key: f.key, type: f.type, maxLength: f.maxLength, label: localized(f.label, locale), optional: f.optional }))}
          initialValues={draft.values}
          optionalPlace={draft.optionalPlace}
          invitationLocale={draft.locale}
          minDate={baghdadToday()}
          submitLabel={t('saveChanges')}
          extras={await orderFormExtras(locale, draft.themeId, draft.featureKeys, draft.current, draft.fieldKeys)}
        />
      </div>
      <div className="mt-4 flex justify-center">
        <Link href={`/order/${token}`} className="h-11 px-4 text-sm leading-[44px] text-muted underline underline-offset-4">
          {t('cancel')}
        </Link>
      </div>
      </PreviewLayout>
    </div>
  );
}
