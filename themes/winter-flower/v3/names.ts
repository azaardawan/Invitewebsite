/**
 * The names are set in spaced capitals, one per line, so a long word must shrink to stay on its line. Returns a
 * factor (in em) for the name's font size: 1 up to 7 letters, then smaller in proportion.
 */
export function nameScale(name: string | undefined): number {
  const longestWord = Math.max(0, ...(name?.trim().split(/\s+/) ?? []).map((w) => Array.from(w).length));
  return longestWord <= 7 ? 1 : Math.max(0.5, 7 / longestWord);
}
