import 'server-only';
import { locales, type Locale } from '@/i18n/config';

/**
 * The language of a tour page: the visitor's browser languages (Sorani and
 * Badini readers' browsers often say only `ku`, read as Sorani), else Arabic.
 */
export function tourLocale(acceptLanguage: string | null): Locale {
  const wanted = (acceptLanguage ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';');
      const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1);
      return { tag: tag ?? '', q: Number.isFinite(q) ? q : 0 };
    })
    .filter((x) => x.tag && x.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of wanted) {
    const base = tag.split('-')[0]!;
    if (base === 'kmr' || base === 'bdn') return 'bdn';
    if (base === 'ckb' || base === 'ku') return 'ckb';
    if ((locales as readonly string[]).includes(base)) return base as Locale;
  }
  return 'ar';
}
