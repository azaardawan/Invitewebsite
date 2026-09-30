import type { MetadataRoute } from 'next';
import { getPathname } from '@/i18n/navigation';
import { locales } from '@/i18n/config';
import { storefrontSections, storefrontThemes } from '@/server/storefront/catalog';

/** Public storefront pages in every language (never invitations, previews or receipts). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? 'http://localhost:3000';
  const [sections, themes] = await Promise.all([storefrontSections(), storefrontThemes()]);
  const hrefs = ['/', '/themes', ...sections.map((s) => `/occasions/${s.key}`), ...themes.map((t) => `/themes/${t.key}`)];
  return hrefs.map((href) => ({
    url: `${base}${getPathname({ locale: 'ar', href })}`,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${base}${getPathname({ locale: l, href })}`])) },
  }));
}
