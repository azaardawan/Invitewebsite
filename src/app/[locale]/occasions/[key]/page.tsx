import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/localized';
import type { Locale } from '@/i18n/config';
import { storefrontSections, storefrontSubsections, storefrontThemes, type StorefrontTheme } from '@/server/storefront/catalog';
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

/**
 * One occasion's designs. When the owner made subsections (Admin → Sections), the designs are grouped
 * under their headings, with chips to show one subsection; designs without one come last.
 */
export default async function OccasionPage({ params, searchParams }: PageProps<'/[locale]/occasions/[key]'>) {
  const { locale, key } = (await params) as { locale: Locale; key: string };
  setRequestLocale(locale);
  const section = await load(key);
  if (!section) notFound();
  const t = await getTranslations('store');
  const subs = await storefrontSubsections(key);
  const subParam = (await searchParams).sub;
  const active = typeof subParam === 'string' ? subs.find((s) => s.key === subParam) : undefined;
  const themes = await storefrontThemes({ sectionKey: key, subsectionKey: active?.key });
  const grid = (list: StorefrontTheme[]) => (
    <ThemeGrid
      themes={list.map((th) => ({
        key: th.key,
        name: localized(th.name, locale),
        section: th.subsection ? localized(th.subsection.name, locale) : localized(th.sectionName, locale),
        coverUrl: th.coverUrl,
        minPriceIqd: th.minPriceIqd,
        rank: th.rank,
      }))}
    />
  );
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
  // Grouped view (no filter): each subsection, then the designs in none.
  const groups = !active && subs.length ? [...subs.map((s) => ({ key: s.key, title: localized(s.name, locale), themes: themes.filter((th) => th.subsection?.key === s.key) })), { key: '', title: t('moreDesigns'), themes: themes.filter((th) => !th.subsection) }].filter((g) => g.themes.length) : null;

  return (
    <>
      <PageHeading
        title={active ? `${localized(section.name, locale)} · ${localized(active.name, locale)}` : localized(section.name, locale)}
        subtitle={active?.description ? localized(active.description, locale) : !active && section.description ? localized(section.description, locale) : t('themesCount', { count: themes.length })}
      />
      {subs.length ? (
        <nav aria-label={localized(section.name, locale)} className="no-scrollbar mt-10 flex gap-2 overflow-x-auto px-6 lg:justify-center">
          {chip(`/occasions/${key}`, t('all'), !active)}
          {subs.map((s) => chip(`/occasions/${key}?sub=${s.key}`, localized(s.name, locale), active?.key === s.key))}
        </nav>
      ) : null}
      <div className="mx-auto mt-12 max-w-[1440px] lg:mt-16">
        {!themes.length ? (
          <p className="px-6 py-16 text-center text-muted">{t('empty')}</p>
        ) : groups ? (
          <div className="flex flex-col gap-14 lg:gap-20">
            {groups.map((g) => (
              <section key={g.key || 'more'} aria-labelledby={`sub-${g.key || 'more'}`} className="flex flex-col gap-6">
                <div className="flex items-baseline justify-between gap-4 px-6 lg:px-[110px]">
                  <h2 id={`sub-${g.key || 'more'}`} className="font-display text-[26px] font-bold text-heading lg:text-[34px]">
                    {g.title}
                  </h2>
                  {g.key ? (
                    <Link href={`/occasions/${key}?sub=${g.key}`} className="shrink-0 text-sm font-medium text-accent underline underline-offset-4">
                      {t('seeAll')}
                    </Link>
                  ) : null}
                </div>
                {grid(g.themes)}
              </section>
            ))}
          </div>
        ) : (
          grid(themes)
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
