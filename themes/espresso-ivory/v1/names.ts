/** Names longer than this (in letters) switch the cover and the lace card to the compact stacked layout from the design. */
export const LONG_NAME = 10;

export function isLong(...names: (string | undefined)[]): boolean {
  return names.some((n) => Array.from(n?.trim() ?? '').length > LONG_NAME);
}

/** The first letter of each name, for the round monogram at the end of the invitation. */
export function initial(name: string | undefined): string {
  return Array.from(name?.trim() ?? '')[0] ?? '';
}
