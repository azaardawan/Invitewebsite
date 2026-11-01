import type { PosterText } from '@/theme-sdk/manifest';
import type { PosterOrientation } from '@/catalog/posters';

type Locale = 'ar' | 'en' | 'ckb' | 'bdn';

/** What a poster text starts from: the page's own text (a wording line, a field, the couple's names) or the default. */
export function posterTextDefault(
  def: PosterText,
  page: { fields: Readonly<Partial<Record<string, string>>>; wording: Readonly<Record<string, string>>; and: string; locale: Locale },
): string {
  if (def.from === 'couple') return [page.fields.person_1_name, page.fields.person_2_name].filter((n) => n?.trim()).join(` ${page.and} `);
  if (def.from?.startsWith('wording:')) return page.wording[def.from.slice(8)] ?? '';
  if (def.from?.startsWith('field:')) return page.fields[def.from.slice(6)]?.trim() ?? '';
  return def.default ? (def.default[page.locale] ?? def.default.ar) : '';
}

/**
 * Every text of one poster, by key: the customer's own words for this poster ('' leaves it out), else what it starts
 * from (posterTextDefault).
 */
export function resolvePosterTexts(
  defs: readonly PosterText[],
  orientation: PosterOrientation,
  own: Readonly<Record<string, string>> | undefined,
  page: Parameters<typeof posterTextDefault>[1],
): Record<string, string> {
  return Object.fromEntries(defs.filter((d) => d.on.includes(orientation)).map((d) => [d.key, own?.[d.key] ?? posterTextDefault(d, page)]));
}
