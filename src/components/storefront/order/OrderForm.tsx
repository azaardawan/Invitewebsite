'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { locales, localeMeta, type Locale } from '@/i18n/config';

export type OrderFormField = { key: string; type: string; maxLength: number | null; label: string };
type State = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

const inputCls =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 aria-[invalid=true]:border-danger';

/** The customer's invitation details (create or edit). Validation is repeated on the server. */
export function OrderForm({
  action,
  hidden,
  fields,
  initialValues = {},
  invitationLocale,
  minDate,
  submitLabel,
}: {
  action: (prev: State, form: FormData) => Promise<State>;
  hidden: Record<string, string>;
  fields: OrderFormField[];
  initialValues?: Record<string, string>;
  invitationLocale: Locale;
  minDate: string;
  submitLabel: string;
}) {
  const t = useTranslations('store');
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initialValues;
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {state.error ? (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {t(state.error as 'errors.generic')}
        </p>
      ) : null}

      {fields.map((f) => {
        const id = `f-${f.key}`;
        const err = errors[f.key];
        const common = {
          id,
          name: `f.${f.key}`,
          defaultValue: values[f.key] ?? '',
          required: true,
          'aria-invalid': err ? true : undefined,
          'aria-describedby': err ? `${id}-err` : f.type === 'date' || f.key === 'venue_map_url' ? `${id}-hint` : undefined,
          className: inputCls,
        } as const;
        return (
          <div key={f.key} className="flex flex-col gap-2">
            <label htmlFor={id} className="text-[15px] font-medium text-heading">
              {f.label}
            </label>
            {f.type === 'longtext' ? (
              <textarea {...common} dir="auto" rows={3} maxLength={f.maxLength ?? 500} />
            ) : f.type === 'date' ? (
              <input {...common} type="date" min={minDate} />
            ) : f.type === 'past_date' ? (
              // `minDate` is today: a date that already happened can't be later.
              <input {...common} type="date" max={minDate} />
            ) : f.type === 'time' ? (
              <input {...common} type="time" />
            ) : f.type === 'url' ? (
              <input {...common} type="url" inputMode="url" dir="ltr" autoComplete="off" />
            ) : f.type === 'phone' ? (
              <input {...common} type="tel" inputMode="tel" dir="ltr" autoComplete="tel" />
            ) : (
              <input {...common} type="text" dir="auto" maxLength={f.maxLength ?? 80} autoComplete="off" />
            )}
            {err ? (
              <p id={`${id}-err`} className="text-sm text-danger">
                {t(`fieldErrors.${err}` as 'fieldErrors.required')}
              </p>
            ) : f.type === 'date' ? (
              <p id={`${id}-hint`} className="text-sm text-muted">{t('dateHint')}</p>
            ) : f.key === 'venue_map_url' ? (
              <p id={`${id}-hint`} className="text-sm text-muted">{t('mapHint')}</p>
            ) : null}
          </div>
        );
      })}

      <div className="flex flex-col gap-2">
        <label htmlFor="invitationLocale" className="text-[15px] font-medium text-heading">
          {t('languageLabel')}
        </label>
        <select id="invitationLocale" name="invitationLocale" defaultValue={invitationLocale} className={inputCls}>
          {locales.map((l) => (
            <option key={l} value={l}>
              {localeMeta[l].autonym}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-[56px] items-center justify-center rounded-full bg-accent px-9 text-base font-semibold text-accent-ink shadow-[0_10px_22px_rgb(110_31_51/0.25)] transition hover:bg-accent-deep disabled:opacity-60"
      >
        {pending ? t('saving') : submitLabel}
      </button>
    </form>
  );
}
