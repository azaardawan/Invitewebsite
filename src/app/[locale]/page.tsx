import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized, occasionsLabel } from '@/lib/localized';
import { storefrontSections, storefrontThemes, storefrontTopPicks } from '@/server/storefront/catalog';
import { TopPicks } from '@/components/storefront/home/TopPicks';
import { Hero } from '@/components/storefront/home/Hero';
import { ThemeCarousel } from '@/components/storefront/home/ThemeCarousel';
import { CtaBand, Faq, Features, HowItWorks, Occasions, SectionTitle } from '@/components/storefront/home/Sections';
import { publicContact } from '@/server/settings/public';
import { socialLinks } from '@/lib/contact-links';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const [sections, themes, top] = await Promise.all([storefrontSections(), storefrontThemes({ limit: 12 }), storefrontTopPicks()]);

  // What search engines show for the site: its name (بهجه, also known as Bahja) and its logo.
  const site = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const common = await getTranslations({ locale: 'ar', namespace: 'common' });
  const english = await getTranslations({ locale: 'en', namespace: 'common' });
  const structuredData = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: common('brand'), alternateName: [english('brand'), 'bahjaaa.com'], url: `${site}/` },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: common('brand'),
      alternateName: english('brand'),
      url: `${site}/`,
      logo: `${site}/logo.png`,
      sameAs: socialLinks(await publicContact()).map((l) => l.href),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <Hero />
      <Occasions sections={sections} />
      <TopPicks
        picks={top.map((th) => ({
          key: th.key,
          name: localized(th.name, locale),
          section: occasionsLabel(th.occasions, locale),
          coverUrl: th.coverUrl,
          coverFocus: th.coverFocus,
          minPriceIqd: th.minPriceIqd,
          rank: th.rank!,
        }))}
      />
      <section id="themes" aria-labelledby="themes-title" className="mx-auto max-w-[1440px] scroll-mt-6 pt-28 lg:pt-40">
        <SectionTitle id="themes-title" title={t('themesTitle')} subtitle={t('themesSubtitle')} />
        <div className="mt-8 lg:mt-12">
          {themes.length ? (
            <ThemeCarousel
              themes={themes.map((th) => ({
                key: th.key,
                name: localized(th.name, locale),
                section: occasionsLabel(th.occasions, locale),
                coverUrl: th.coverUrl,
                coverFocus: th.coverFocus,
                minPriceIqd: th.minPriceIqd,
                rank: th.rank,
              }))}
              labels={{ prev: t('prev'), next: t('next'), preview: t('preview'), choose: t('choose'), from: t('from'), bestSeller: t('bestSeller'), topPick: t('topPick') }}
            />
          ) : (
            <p className="px-6 text-center text-muted">{t('noThemes')}</p>
          )}
        </div>
        {themes.length ? (
          <div className="mt-6 flex justify-center">
            <Link href="/themes" className="text-base font-semibold text-accent underline decoration-gold-soft underline-offset-8">
              {t('allThemes')}
            </Link>
          </div>
        ) : null}
      </section>
      <HowItWorks />
      <Features />
      <Faq />
      <CtaBand />
    </>
  );
}
