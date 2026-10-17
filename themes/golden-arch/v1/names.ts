/** "Class of …": the customer's class year, or the year of the celebration. */
export function classYear(classYearField: string | undefined, eventYear: string | undefined): string | null {
  return classYearField?.trim() || eventYear || null;
}

/** Names longer than this (in letters) step down a size so they stay on one or two lines. */
const LONG_NAME = 18;

export function isLong(name: string | undefined): boolean {
  return Array.from(name?.trim() ?? '').length > LONG_NAME;
}
