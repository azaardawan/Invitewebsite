'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { isLocale, localeMeta } from '@/i18n/config';
import { formatDisplayPrice, type DisplayCurrency } from '@/lib/currency';

/*
 * The visitor's display currency is a convenience preference kept in this
 * browser only (localStorage). It never affects what is charged: payment is IQD.
 */
const STORAGE_KEY = 'bahja.currency';
const listeners = new Set<() => void>();

function read(): DisplayCurrency {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'USD' ? 'USD' : 'IQD';
  } catch {
    return 'IQD';
  }
}

function write(value: DisplayCurrency) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* private mode: preference just isn't remembered */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && listener();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useDisplayCurrency(): [DisplayCurrency, (c: DisplayCurrency) => void] {
  const value = useSyncExternalStore(subscribe, read, () => 'IQD' as const);
  return [value, write];
}

let ratePromise: Promise<number | null> | undefined;
function fetchRate(): Promise<number | null> {
  ratePromise ??= fetch('/api/public/currency')
    .then((r) => (r.ok ? r.json() : { usdRateIqd: null }))
    .then((j: { usdRateIqd: number | null }) => j.usdRateIqd)
    .catch(() => null);
  return ratePromise;
}

export function useUsdRate(): number | null {
  const [rate, setRate] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    fetchRate().then((r) => alive && setRate(r));
    return () => {
      alive = false;
    };
  }, []);
  return rate;
}

function useIntlLocale() {
  const locale = useLocale();
  return isLocale(locale) ? localeMeta[locale].intlLocale : 'ar-IQ';
}

/** IQD / USD toggle. Hidden entirely until the owner sets an exchange rate. */
export function CurrencySwitcher() {
  const t = useTranslations('common');
  const [currency, setCurrency] = useDisplayCurrency();
  const rate = useUsdRate();
  if (!rate) return null;
  return (
    <div role="group" aria-label={t('currency')} className="flex gap-1 text-sm">
      {(['IQD', 'USD'] as const).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={currency === c}
          onClick={() => setCurrency(c)}
          className={`rounded-full px-2 py-0.5 ${currency === c ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'}`}
        >
          {c === 'IQD' ? t('currencyIqd') : t('currencyUsd')}
        </button>
      ))}
    </div>
  );
}

/** A price in the visitor's display currency. The amount charged is always the IQD value. */
export function Price({ iqd, className }: { iqd: number; className?: string }) {
  const t = useTranslations('common');
  const [currency] = useDisplayCurrency();
  const rate = useUsdRate();
  const intlLocale = useIntlLocale();
  const showUsd = currency === 'USD' && rate !== null;
  return (
    <span className={className} title={showUsd ? t('usdApproxNote') : undefined}>
      {formatDisplayPrice(iqd, showUsd ? 'USD' : 'IQD', rate, intlLocale)}
    </span>
  );
}
