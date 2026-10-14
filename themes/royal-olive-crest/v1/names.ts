/**
 * The couple's names are the largest thing on every page, in script (Pinyon Script for Latin letters, Aref Ruqaa
 * for Arabic and Kurdish). A long name steps down so it stays whole on narrow cards instead of breaking mid-word.
 * Returns a factor (in em) for the name's own font size.
 */
export function nameScale(name: string | undefined): number {
  const n = Array.from(name?.trim() ?? '').length;
  return n <= 9 ? 1 : n <= 12 ? 0.86 : n <= 16 ? 0.74 : n <= 24 ? 0.64 : 0.55;
}
