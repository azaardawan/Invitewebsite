'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Price } from '../currency';

/**
 * The signature board, an add-on at the end of the order form (owner, 2026-11-27): ticked or not, at the owner's
 * price. The server checks it is offered and prices it again at checkout.
 */
export function SignatureBoardAddon({ priceIqd, perBoard, current, error }: { priceIqd: number; perBoard: number; current: boolean; error?: string }) {
  const t = useTranslations('store.signatureBoard');
  const [on, setOn] = useState(current);
  return (
    <fieldset data-signature-board-addon="" className={`flex flex-col gap-3 rounded-[22px] border-2 px-5 py-4 ${on ? 'border-accent bg-accent/5' : 'border-line bg-paper'}`}>
      <input type="hidden" name="sb.sent" value="1" />
      <input type="hidden" name="sb.on" value={on ? '1' : '0'} />
      <legend className="px-1 text-xs font-semibold tracking-wide text-gold uppercase">{t('addOn')}</legend>
      <label className="flex cursor-pointer items-start justify-between gap-4">
        <span className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-heading">{t('title')}</span>
          <span className="text-sm leading-relaxed text-muted">{t('help', { perBoard })}</span>
          <span className="text-sm font-medium text-heading">
            + <Price iqd={priceIqd} />
          </span>
        </span>
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="mt-1 size-6 shrink-0 accent-accent" aria-label={t('title')} />
      </label>
      {error ? <p className="text-sm text-danger">{t('error')}</p> : null}
    </fieldset>
  );
}
