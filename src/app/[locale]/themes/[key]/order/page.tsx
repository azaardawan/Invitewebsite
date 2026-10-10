import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/localized';
import type { Locale } from '@/i18n/config';
import { storefrontTheme } from '@/server/storefront/catalog';
import { orderFormExtras } from '@/server/storefront/order';
import { baghdadToday } from '@/server/orders/validation';
import { OrderForm } from '@/components/storefront/order/OrderForm';
import { Price } from '@/components/storefront/currency';
import { OrderSteps } from '@/components/storefront/order/OrderSteps';
import { startOrderAction } from '../../../_actions/order';

export const dynamicParams = true;

export const metadata: Metadata = { robots: { index: false } };

export default async function OrderPage({ params, searchParams }: PageProps<'/[locale]/themes/[key]/order'>) {
  const { locale, key } = (await params) as { locale: Locale; key: string };
  setRequestLocale(locale);
  const th = await storefrontTheme(key);
  if (!th || !th.packages.length) notFound();
  const { pkg: pkgParam, occasion: occasionParam } = await searchParams;
  // A design sold in several occasions: the one the customer came from, or they choose on the form.
  const occasion = th.occasions.length > 1 ? th.occasions.find((o) => o.key === occasionParam) : undefined;
  const pkg = th.packages.find((p) => p.id === pkgParam) ?? th.packages[0]!;
  // A newborn design from the Boy or Girl group starts with that gender chosen (the customer can change it).
  const gender = th.section.key === 'newborn' && (th.subsectionKey === 'boy' || th.subsectionKey === 'girl') ? th.subsectionKey : undefined;
  const t = await getTranslations('store');

  return (
    <div className="mx-auto max-w-[640px] px-6 pt-10 lg:pt-16">
      <OrderSteps current={0} />
      <h1 className="mt-8 font-display text-[36px] leading-[1.3] font-bold text-heading lg:text-[48px]">{t('orderTitle')}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{t('orderSubtitle')}</p>

      <div className="mt-8 flex items-center justify-between gap-4 rounded-[22px] border border-line bg-paper px-5 py-4">
        <div className="flex flex-col">
          <span className="text-xs text-muted">{t('packageLabel')}</span>
          <span className="font-semibold text-heading">
            {localized(th.name, locale)} · {localized(pkg.name, locale)}
            {occasion ? ` · ${localized(occasion.name, locale)}` : ''}
          </span>
          <span className="text-sm text-accent">
            <Price iqd={pkg.priceIqd} />
          </span>
        </div>
        <Link href={`/themes/${th.key}#preview`} className="shrink-0 text-sm font-medium text-accent underline underline-offset-4">
          {t('changePackage')}
        </Link>
      </div>

      <div className="mt-8">
        <OrderForm
          action={startOrderAction}
          hidden={{ themeKey: th.key, packageId: pkg.id, siteLocale: locale, ...(occasion ? { occasion: occasion.key } : {}) }}
          occasions={th.occasions.length > 1 && !occasion ? th.occasions.map((o) => ({ key: o.key, label: localized(o.name, locale) })) : undefined}
          fields={th.fields.filter((f) => pkg.fieldKeys.includes(f.key)).map((f) => ({ key: f.key, type: f.type, maxLength: f.maxLength, label: localized(f.label, locale) }))}
          initialValues={gender ? { baby_gender: gender } : undefined}
          invitationLocale={locale}
          minDate={baghdadToday()}
          submitLabel={t('continue')}
          extras={await orderFormExtras(locale, th.id, pkg.featureKeys)}
        />
      </div>
    </div>
  );
}
