import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/localized';
import type { Locale } from '@/i18n/config';
import { storefrontSections, storefrontThemes } from '@/server/storefront/catalog';
import { PageHeading, ThemeGrid } from '@/components/storefront/ThemeGrid';

export const dynamicParams = true;

async function load(key: string) {
  return (await storefrontSections()).find((s) => s.key === key) ?? null;
}

export async function generateMetadata({ params }: PageProps<'/[locale]/occasions/[key]'>): Promise<Metadata> {
  const { locale, key } = (await params) as { locale: Locale; key: string };
  const s = await load(key);
  if (!s) return {};
  return { title: localized(s.name, locale), description: s.description ? localized(s.description, locale) : undefined };
}

export default async function OccasionPage({ params }: PageProps<'/[locale]/occasions/[key]'>) {
  const { locale, key } = (await params) as { locale: Locale; key: string };
  setRequestLocale(locale);
  const section = await load(key);
  if (!section) notFound();
  const t = await getTranslations('store');
  const themes = await storefrontThemes({ sectionKey: key });

  return (
    <>
      <PageHeading title={localized(section.name, locale)} subtitle={section.description ? localized(section.description, locale) : t('themesCount', { count: themes.length })} />
      <div className="mx-auto mt-12 max-w-[1440px] lg:mt-16">
        {themes.length ? (
          <ThemeGrid
            themes={themes.map((th) => ({ key: th.key, name: localized(th.name, locale), section: localized(th.sectionName, locale), coverUrl: th.coverUrl, minPriceIqd: th.minPriceIqd }))}
          />
        ) : (
          <p className="px-6 py-16 text-center text-muted">{t('empty')}</p>
        )}
      </div>
      <div className="mt-14 flex justify-center">
        <Link href="/#occasions" className="text-base font-semibold text-accent underline decoration-gold-soft underline-offset-8">
          {t('backToOccasions')}
        </Link>
      </div>
    </>
  );
}
