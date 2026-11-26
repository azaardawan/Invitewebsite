'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * What the wedding or engagement is held as (owner, 2026-11-26): the section's own event, a Nishani, a Henna night, or
 * the customer's own words. Every line of the design that names the event follows the choice.
 */
export function EventChoice({
  own,
  current,
  name,
  max,
  values,
  errors,
}: {
  own: string | null;
  current: string;
  name: string;
  max: number;
  values: Record<string, string>;
  errors: Record<string, string>;
}) {
  const t = useTranslations('store.event');
  const [kind, setKind] = useState(values.eventKind ?? current);
  const ownLabel = own === 'engagement' ? t('engagement') : own === 'wedding' ? t('wedding') : t('asChosen');
  const options: [string, string][] = [
    ['', ownLabel],
    ['nishani', t('nishani')],
    ['henna', t('henna')],
    ['custom', t('custom')],
  ];
  const chip =
    'cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm transition has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/30';
  return (
    <fieldset className="flex flex-col gap-3" data-event-choice>
      <legend className="mb-1 text-[15px] font-medium text-heading">{t('heading')}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([value, label]) => (
          <label key={value || 'own'} className={chip}>
            <input type="radio" name="eventKind" value={value} checked={kind === value} onChange={() => setKind(value)} className="sr-only" />
            {label}
          </label>
        ))}
      </div>
      <p className="text-sm text-muted">{t('help')}</p>
      {kind === 'custom' ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="eventName" className="text-[15px] font-medium text-heading">
            {t('nameLabel')}
          </label>
          <input
            id="eventName"
            name="eventName"
            defaultValue={values.eventName ?? name}
            maxLength={max}
            placeholder={t('namePlaceholder')}
            aria-invalid={errors.eventName ? true : undefined}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 aria-[invalid=true]:border-danger"
          />
          {errors.eventName ? <p className="text-sm text-danger">{t(errors.eventName === 'tooLong' ? 'nameTooLong' : 'nameRequired')}</p> : null}
        </div>
      ) : null}
    </fieldset>
  );
}
