'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Price } from '../currency';
import { BASE_CAP, DEFAULT_PER_GUEST, PER_GUEST_OPTIONS, STEP, guestPhotoPrice } from '@/catalog/guest-photos';

/**
 * Guest photo sharing, the add-on at the end of the order form (owner, 2026-11-21): ticked or not, photos per guest
 * (free) and the total (the basic total, or more at the owner's rate per 50). The server checks and prices it again.
 */
export function GuestPhotosAddon({
  pricing,
  current,
  error,
}: {
  pricing: { basePriceIqd: number; stepPriceIqd: number; maxCap: number };
  current: { cap: number; perGuest: number } | null;
  error?: string;
}) {
  const t = useTranslations('store.guestPhotos');
  const [on, setOn] = useState(Boolean(current));
  const [perGuest, setPerGuest] = useState(current?.perGuest ?? DEFAULT_PER_GUEST);
  const [cap, setCap] = useState(current?.cap ?? BASE_CAP);
  const max = Math.max(BASE_CAP, pricing.maxCap);
  const step = (d: number) => setCap((c) => Math.min(max, Math.max(BASE_CAP, c + d * STEP)));
  const pill = 'h-10 min-w-12 rounded-full border border-line bg-surface px-4 text-sm transition aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-ink';
  return (
    <fieldset data-guest-photos className={`flex flex-col gap-4 rounded-[22px] border-2 px-5 py-4 ${on ? 'border-accent bg-accent/5' : 'border-line bg-paper'}`}>
      <input type="hidden" name="gp.sent" value="1" />
      <input type="hidden" name="gp.on" value={on ? '1' : '0'} />
      <input type="hidden" name="gp.perGuest" value={perGuest} />
      <input type="hidden" name="gp.cap" value={cap} />
      <legend className="px-1 text-xs font-semibold tracking-wide text-gold uppercase">{t('addOn')}</legend>
      <label className="flex cursor-pointer items-start justify-between gap-4">
        <span className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-heading">{t('title')}</span>
          <span className="text-sm leading-relaxed text-muted">{t('help')}</span>
        </span>
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="mt-1 size-6 shrink-0 accent-accent" />
      </label>
      {on ? (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-medium text-heading">{t('perGuest')}</span>
            <div className="flex gap-2" role="group" aria-label={t('perGuest')}>
              {PER_GUEST_OPTIONS.map((n) => (
                <button key={n} type="button" aria-pressed={perGuest === n} onClick={() => setPerGuest(n)} className={pill}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          {max > BASE_CAP ? (
            <div className="flex flex-col gap-2">
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[15px] font-medium text-heading">{t('total')}</span>
                <span className="text-sm text-muted">
                  {t.rich('rate', { step: STEP, base: BASE_CAP, price: () => <Price iqd={pricing.stepPriceIqd} /> })}
                </span>
              </span>
              <div className="flex w-max items-center overflow-hidden rounded-full border border-line bg-surface">
                <button type="button" onClick={() => step(-1)} disabled={cap <= BASE_CAP} aria-label={t('fewer')} className="h-10 w-11 bg-blush text-lg disabled:opacity-40">
                  −
                </button>
                <output aria-live="polite" className="min-w-20 px-3 text-center font-semibold">
                  {cap.toLocaleString()}
                </output>
                <button type="button" onClick={() => step(1)} disabled={cap >= max} aria-label={t('more')} className="h-10 w-11 bg-blush text-lg disabled:opacity-40">
                  +
                </button>
              </div>
            </div>
          ) : null}
          <p className="flex items-center justify-between border-t border-dashed border-line pt-3 font-semibold">
            <span>{t('price')}</span>
            <Price iqd={guestPhotoPrice(cap, pricing)} className="text-accent" />
          </p>
          <p className="text-xs leading-relaxed text-muted">{t('includes', { base: BASE_CAP })}</p>
        </>
      ) : null}
      {error ? <p className="text-sm text-danger">{t('invalid')}</p> : null}
    </fieldset>
  );
}
