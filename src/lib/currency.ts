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

/**
 * A dinar price in the site language. Kurdish locale data has only the Arabic
 * mark (د.ع.), so Sorani and Badini write the owner-approved word «دینار».
 */
export function formatIqdIn(amount: number, locale: string): string {
  if (locale === 'ckb' || locale === 'bdn') return `${new Intl.NumberFormat('ar-IQ', { maximumFractionDigits: 0 }).format(amount)} دینار`;
  return formatIqd(amount, locale === 'en' ? 'en-GB' : 'ar-IQ');
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

export function formatDisplayPrice(iqd: number, currency: DisplayCurrency, usdRateIqd: number | null, locale: string, intlLocale: string): string {
  if (currency === 'USD' && usdRateIqd) return `≈ ${formatUsd(iqdToUsd(iqd, usdRateIqd), intlLocale)}`;
  return formatIqdIn(iqd, locale);
}
