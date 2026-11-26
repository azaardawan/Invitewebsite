/** Names longer than this (in letters) switch the cover and the lace card to the compact stacked layout from the design. */
export const LONG_NAME = 10;

export function isLong(...names: (string | undefined)[]): boolean {
  return names.some((n) => Array.from(n?.trim() ?? '').length > LONG_NAME);
}

