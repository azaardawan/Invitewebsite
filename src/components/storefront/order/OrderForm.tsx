'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { locales, localeMeta, type Locale } from '@/i18n/config';
import { SignaturePad } from './SignaturePad';
import { fieldOptions } from '@/catalog/fields';

export type OrderFormField = { key: string; type: string; maxLength: number | null; label: string };

/** Optional sections, each present only when the package includes it. */
export type OrderFormExtras = {
  /** Back of the printable card (print_card): current text. */
  cardBack?: { title: string; message: string; limits: { title: number; message: number } };
  /** Signature pads (signature): the current signature images (none, one or two). */
  signature?: { current: string[] };
  /** Chocolate stickers (sticker): round or square. */
  sticker?: { current: 'round' | 'square' };
  /** Bottle labels (bottle_label): which bottle size. */
  bottle?: { current: string; sizes: readonly string[] };
  /** Date of birth: how it is written; `examples` is `${style}:${digits}` → the date written that way. */
  birthDate?: { style: string; digits: string; examples: Record<string, string>; showDigits: boolean };
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
  occasions,
}: {
  action: (prev: State, form: FormData) => Promise<State>;
  hidden: Record<string, string>;
  fields: OrderFormField[];
  initialValues?: Record<string, string>;
  invitationLocale: Locale;
  minDate: string;
  submitLabel: string;
  extras?: OrderFormExtras;
  /** For a design sold in several occasions when the customer hasn't picked one yet: which one is it? */
  occasions?: { key: string; label: string }[];
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

      {occasions?.length ? (
        <fieldset className="flex flex-col gap-3" aria-describedby={errors.occasion ? 'occasion-err' : undefined}>
          <legend className="text-[15px] font-medium text-heading">{t('occasionQuestion')}</legend>
          <div className="flex flex-wrap gap-2">
            {occasions.map((o) => (
              <label
                key={o.key}
                className="inline-flex h-11 cursor-pointer items-center rounded-full border border-line bg-surface px-5 text-sm font-medium transition has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-ink"
              >
                <input type="radio" name="occasion" value={o.key} defaultChecked={values.occasion === o.key} className="sr-only" />
                {o.label}
              </label>
            ))}
          </div>
          {errors.occasion ? (
            <p id="occasion-err" className="text-sm text-danger">
              {t('occasionRequired')}
            </p>
          ) : null}
        </fieldset>
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
            <label htmlFor={id} id={`${id}-label`} className="text-[15px] font-medium text-heading">
              {f.label}
            </label>
            {f.type === 'choice' ? (
              <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
                {fieldOptions(f.key).map((o) => (
                  <label
                    key={o}
                    className="inline-flex h-11 cursor-pointer items-center rounded-full border border-line bg-surface px-5 text-sm font-medium transition has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-ink"
                  >
                    <input type="radio" name={`f.${f.key}`} value={o} defaultChecked={values[f.key] === o} className="sr-only" />
                    {t(`fieldOptions.${f.key}.${o}` as 'fieldOptions.baby_gender.boy')}
                  </label>
                ))}
              </div>
            ) : f.type === 'longtext' ? (
              <textarea {...common} dir="auto" rows={3} maxLength={f.maxLength ?? 500} />
            ) : f.type === 'birthdate' ? (
              <input {...common} type="date" />
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

      {extras.sticker ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-[15px] font-medium text-heading">{t('stickerShape.heading')}</legend>
          <p className="text-sm text-muted">{t('stickerShape.help')}</p>
          <div className="flex gap-3">
            {(['round', 'square'] as const).map((shape) => (
              <label
                key={shape}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 has-[:checked]:border-accent has-[:checked]:ring-2 has-[:checked]:ring-accent/20"
              >
                <input type="radio" name="stickerShape" value={shape} defaultChecked={(values.stickerShape || extras.sticker!.current) === shape} className="sr-only" />
                <span aria-hidden className={`block size-10 border-2 border-accent bg-blush ${shape === 'round' ? 'rounded-full' : 'rounded-md'}`} />
                <span className="text-sm font-medium">{t(`stickerShape.${shape}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {extras.birthDate ? <BirthDateFormat extra={extras.birthDate} values={values} label={(k) => t(`birthDateFormat.${k}` as 'birthDateFormat.heading')} /> : null}

      {extras.bottle ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="bottleSize" className="text-[15px] font-medium text-heading">
            {t('bottleSize.heading')}
          </label>
          <p className="text-sm text-muted">{t('bottleSize.help')}</p>
          <select id="bottleSize" name="bottleSize" defaultValue={values.bottleSize || extras.bottle.current} className={inputCls}>
            {extras.bottle.sizes.map((size) => (
              <option key={size} value={size}>
                {t('bottleSize.option', { ml: size })}
              </option>
            ))}
          </select>
        </div>
      ) : null}

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
            count: t('signature.count'),
            one: t('signature.one'),
            two: t('signature.two'),
            first: t('signature.first'),
            second: t('signature.second'),
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

/** How the date of birth is written on the designs: four styles (shown on the customer's date) and the digits. */
function BirthDateFormat({
  extra,
  values,
  label,
}: {
  extra: NonNullable<OrderFormExtras['birthDate']>;
  values: Record<string, string>;
  label: (key: 'heading' | 'help' | 'digits' | 'arab' | 'latn') => string;
}) {
  const [digits, setDigits] = useState(values.birthDateDigits || extra.digits);
  const initialStyle = values.birthDateStyle || extra.style;
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-[15px] font-medium text-heading">{label('heading')}</legend>
      <p className="text-sm text-muted">{label('help')}</p>
      <div className="flex flex-col gap-2">
        {(['long', 'numeric', 'hijri', 'both'] as const).map((style) => (
          <label
            key={style}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 has-[:checked]:border-accent has-[:checked]:ring-2 has-[:checked]:ring-accent/20"
          >
            <input type="radio" name="birthDateStyle" value={style} defaultChecked={initialStyle === style} className="mt-1" />
            <span className="whitespace-pre-line text-sm" dir="auto">
              {extra.examples[`${style}:${extra.showDigits ? digits : 'latn'}`]}
            </span>
          </label>
        ))}
      </div>
      {extra.showDigits ? (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium">{label('digits')}</span>
          {(['arab', 'latn'] as const).map((d) => (
            <label key={d} className="flex items-center gap-2">
              <input type="radio" name="birthDateDigits" value={d} checked={digits === d} onChange={() => setDigits(d)} />
              {label(d)}
            </label>
          ))}
        </div>
      ) : (
        <input type="hidden" name="birthDateDigits" value="latn" />
      )}
    </fieldset>
  );
}
