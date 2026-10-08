import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/localized';
import type { Locale } from '@/i18n/config';
import { storefrontSections, storefrontSubsections, storefrontThemes } from '@/server/storefront/catalog';
import { PageHeading, ThemeGrid } from '@/components/storefront/ThemeGrid';

export async function generateMetadata({ params }: PageProps<'/[locale]/themes'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'store' });
  return { title: t('metaThemes'), description: t('catalogSubtitle') };
}

export default async function ThemesPage({ params, searchParams }: PageProps<'/[locale]/themes'>) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations('store');
  const { occasion, sub } = await searchParams;
  const sections = await storefrontSections();
  const active = typeof occasion === 'string' && sections.some((s) => s.key === occasion) ? occasion : undefined;
  // The chosen occasion's subsections (second row of chips).
  const subs = active ? await storefrontSubsections(active) : [];
  const activeSub = typeof sub === 'string' && subs.some((s) => s.key === sub) ? sub : undefined;
  const themes = await storefrontThemes({ sectionKey: active, subsectionKey: activeSub });

  const chip = (href: string, label: string, on: boolean) => (
    <Link
      key={href}
      href={href}
      aria-current={on ? 'page' : undefined}
      className="inline-flex h-11 shrink-0 items-center rounded-full border border-line px-5 text-sm font-medium transition aria-[current=page]:border-accent aria-[current=page]:bg-accent aria-[current=page]:text-accent-ink"
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeading title={t('catalogTitle')} subtitle={t('catalogSubtitle')} />
      {sections.length > 1 ? (
        <nav aria-label={t('catalogTitle')} className="no-scrollbar mt-10 flex gap-2 overflow-x-auto px-6 lg:justify-center">
          {chip('/themes', t('all'), !active)}
          {sections.map((s) => chip(`/themes?occasion=${s.key}`, localized(s.name, locale), active === s.key))}
        </nav>
      ) : null}
      {subs.length ? (
        <nav aria-label={localized(sections.find((s) => s.key === active)!.name, locale)} className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-6 lg:justify-center">
          {chip(`/themes?occasion=${active}`, t('all'), !activeSub)}
          {subs.map((s) => chip(`/themes?occasion=${active}&sub=${s.key}`, localized(s.name, locale), activeSub === s.key))}
        </nav>
      ) : null}
      <div className="mx-auto mt-10 max-w-[1440px] lg:mt-14">
        {themes.length ? (
          <ThemeGrid
            themes={themes.map((th) => ({ key: th.key, name: localized(th.name, locale), section: th.subsection ? `${localized(th.sectionName, locale)} · ${localized(th.subsection.name, locale)}` : localized(th.sectionName, locale), coverUrl: th.coverUrl, minPriceIqd: th.minPriceIqd }))}
          />
        ) : (
          <p className="px-6 py-16 text-center text-muted">{t('empty')}</p>
        )}
      </div>
    </>
  );
}
