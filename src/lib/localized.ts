/** Pick owner-entered content for a locale, falling back to Arabic (never to a guess). */
export function localized(content: { ar: string; en: string; ckb?: string | null; bdn?: string | null } | null | undefined, locale: string): string {
  if (!content) return '';
  const value = (content as Record<string, string | null | undefined>)[locale];
  return value || content.ar;
}
