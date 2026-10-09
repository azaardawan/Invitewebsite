import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/localized';
import type { Locale } from '@/i18n/config';
import { isFeatureKey } from '@/catalog/features';
import { storefrontTheme } from '@/server/storefront/catalog';
import { ThemeShowcase } from '@/components/storefront/theme/ThemeShowcase';
import { publicContact } from '@/server/settings/public';
import { whatsappHref } from '@/lib/contact-links';
import { env } from '@/server/env';
import { RankBadge } from '@/components/storefront/RankBadge';

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps<'/[locale]/themes/[key]'>): Promise<Metadata> {
  const { locale, key } = (await params) as { locale: Locale; key: string };
  const th = await storefrontTheme(key);
  if (!th) return {};
  return {
    title: localized(th.name, locale),
    description: th.description ? localized(th.description, locale) : undefined,
    openGraph: th.coverUrl ? { images: [th.coverUrl] } : undefined,
  };
}

export default async function ThemePage({ params, searchParams }: PageProps<'/[locale]/themes/[key]'>) {
  const { locale, key } = (await params) as { locale: Locale; key: string };
  setRequestLocale(locale);
  const th = await storefrontTheme(key);
  if (!th) notFound();
  // A design sold in several occasions keeps the one the customer came from (wording, order).
  const { occasion: occasionParam } = await searchParams;
  const occasion = th.occasions.length > 1 ? th.occasions.find((o) => o.key === occasionParam) : undefined;
  const t = await getTranslations('store');
  const home = await getTranslations('home');
  const { whatsapp } = await publicContact();
  const pageUrl = `${env().APP_URL.replace(/\/$/, '')}${locale === 'ar' ? '' : `/${locale}`}/themes/${th.key}`;

  return (
    <div className="mx-auto max-w-[1440px] px-6 pt-10 lg:px-[110px] lg:pt-16">
      <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-start">
        <p className="flex flex-wrap justify-center gap-x-2 text-sm font-medium text-gold lg:justify-start">
          {(occasion ? [occasion, ...th.occasions.filter((o) => o.key !== occasion.key)] : th.occasions).map((o, i) => (
            <span key={o.key}>
              {i > 0 ? <span aria-hidden>· </span> : null}
              <Link href={`/occasions/${o.key}`} className="hover:underline">
                {localized(o.name, locale)}
              </Link>
            </span>
          ))}
        </p>
        <RankBadge rank={th.rank} labels={{ bestSeller: home('bestSeller'), topPick: home('topPick') }} />
        <h1 className="bh-rise font-display text-[42px] leading-[1.3] font-bold text-heading lg:text-[64px]">{localized(th.name, locale)}</h1>
        {th.description ? <p className="bh-rise-2 max-w-2xl text-[15px] leading-relaxed text-muted lg:text-lg">{localized(th.description, locale)}</p> : null}
      </div>
      <div className="mt-10 lg:mt-14">
        <ThemeShowcase
          themeKey={th.key}
          lang={locale}
          occasion={occasion?.key}
          packages={th.packages.map((p) => ({
            id: p.id,
            name: localized(p.name, locale),
            description: p.description ? localized(p.description, locale) : null,
            priceIqd: p.priceIqd,
            features: p.featureKeys.filter(isFeatureKey).map((f) => t(`features.${f}`)),
            fieldsCount: p.fieldKeys.length,
          }))}
        />
      </div>
      {whatsapp ? (
        <p className="mt-10 text-center text-[15px] text-muted">
          {t('askTheme')}{' '}
          <a
            href={whatsappHref(whatsapp, t('askThemeText', { theme: localized(th.name, locale), url: pageUrl }))}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent underline"
          >
            {t('askThemeLink')}
          </a>
        </p>
      ) : null}
    </div>
  );
}
