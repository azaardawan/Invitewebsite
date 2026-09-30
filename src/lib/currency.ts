/**
 * Money display. Every payment is charged in IQD; USD is only a converted
 * display using the owner's exchange rate (IQD per 1 USD).
 */
export type DisplayCurrency = 'IQD' | 'USD';

export function iqdToUsd(iqd: number, usdRateIqd: number): number {
  return iqd / usdRateIqd;
}

export function formatIqd(amount: number, intlLocale: string): string {
  return new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);
}

/** Whole dollars from $10 up; cents below that. Always marked approximate by the caller. */
export function formatUsd(amount: number, intlLocale: string): string {
  const fraction = amount >= 10 ? 0 : 2;
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(amount);
}

export function formatDisplayPrice(iqd: number, currency: DisplayCurrency, usdRateIqd: number | null, intlLocale: string): string {
  if (currency === 'USD' && usdRateIqd) return `≈ ${formatUsd(iqdToUsd(iqd, usdRateIqd), intlLocale)}`;
  return formatIqd(iqd, intlLocale);
}
