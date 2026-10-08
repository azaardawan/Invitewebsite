'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { locales, localeMeta, type Locale } from '@/i18n/config';
import { SignaturePad } from './SignaturePad';

export type OrderFormField = { key: string; type: string; maxLength: number | null; label: string };

/** Optional sections, each present only when the package includes it. */
export type OrderFormExtras = {
  /** Back of the printable card (print_card): current text. */
  cardBack?: { title: string; message: string; limits: { title: number; message: number } };
  /** Signature pad (signature): the current signature image, if any. */
  signature?: { current: string | null };
  /** Colour sets (color_choice): '' = the theme's own colours. */
  palettes?: { current: string; original: string[]; options: { id: string; name: string; swatches: string[] }[] };
};
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
  extras = {},
}: {
  action: (prev: State, form: FormData) => Promise<State>;
  hidden: Record<string, string>;
  fields: OrderFormField[];
  initialValues?: Record<string, string>;
  invitationLocale: Locale;
  minDate: string;
  submitLabel: string;
  extras?: OrderFormExtras;
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

      {extras.palettes ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-[15px] font-medium text-heading">{t('colors.heading')}</legend>
          <p className="text-sm text-muted">{t('colors.help')}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[{ id: '', name: t('colors.original'), swatches: extras.palettes.original }, ...extras.palettes.options].map((p) => (
              <label key={p.id || 'original'} className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-line bg-surface p-3 has-[:checked]:border-accent has-[:checked]:ring-2 has-[:checked]:ring-accent/20">
                <input type="radio" name="palette" value={p.id} defaultChecked={extras.palettes!.current === p.id} className="sr-only" />
                <span className="flex" aria-hidden>
                  {p.swatches.map((c, i) => (
                    <span key={i} className="-ms-1.5 size-7 rounded-full border-2 border-surface first:ms-0" style={{ background: c }} />
                  ))}
                </span>
                <span className="text-sm font-medium">{p.name}</span>
              </label>
            ))}
          </div>
          {errors.palette ? <p className="text-sm text-danger">{t('fieldErrors.invalidText')}</p> : null}
        </fieldset>
      ) : null}

      {extras.signature ? (
        <SignaturePad
          current={extras.signature.current}
          error={errors.signature ? t('signature.invalid') : undefined}
          labels={{
            heading: t('signature.heading'),
            help: t('signature.help'),
            pad: t('signature.pad'),
            clear: t('signature.clear'),
            include: t('signature.include'),
            current: t('signature.current'),
            redraw: t('signature.redraw'),
          }}
        />
      ) : null}

      {extras.cardBack ? (
        <fieldset className="flex flex-col gap-4 rounded-[22px] border border-line bg-paper px-5 py-4">
          <legend className="px-1 text-[15px] font-medium text-heading">{t('cardBack.heading')}</legend>
          <p className="text-sm text-muted">{t('cardBack.help')}</p>
          <div className="flex flex-col gap-2">
            <label htmlFor="cb-title" className="text-sm font-medium text-heading">
              {t('cardBack.title')}
            </label>
            <input
              id="cb-title"
              name="cb.title"
              dir="auto"
              defaultValue={values['cb.title'] ?? extras.cardBack.title}
              maxLength={extras.cardBack.limits.title}
              placeholder={t('cardBack.titlePlaceholder')}
              aria-invalid={errors.cardBackTitle ? true : undefined}
              className={inputCls}
            />
            {errors.cardBackTitle ? <p className="text-sm text-danger">{t(`fieldErrors.${errors.cardBackTitle}` as 'fieldErrors.tooLong')}</p> : null}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="cb-message" className="text-sm font-medium text-heading">
              {t('cardBack.message')}
            </label>
            <textarea
              id="cb-message"
              name="cb.message"
              dir="auto"
              rows={4}
              defaultValue={values['cb.message'] ?? extras.cardBack.message}
              maxLength={extras.cardBack.limits.message}
              placeholder={t('cardBack.messagePlaceholder')}
              aria-invalid={errors.cardBackMessage ? true : undefined}
              className={inputCls}
            />
            {errors.cardBackMessage ? <p className="text-sm text-danger">{t(`fieldErrors.${errors.cardBackMessage}` as 'fieldErrors.tooLong')}</p> : null}
          </div>
        </fieldset>
      ) : null}

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
