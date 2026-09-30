'use client';

import { useTranslations } from 'next-intl';

type I18nValue = { ar: string; en: string; ckb?: string | null; bdn?: string | null } | null | undefined;

const LANGS = [
  { code: 'ar', dir: 'rtl', lang: 'ar' },
  { code: 'en', dir: 'ltr', lang: 'en' },
  { code: 'ckb', dir: 'rtl', lang: 'ckb' },
  { code: 'bdn', dir: 'rtl', lang: 'kmr-Arab' },
] as const;

/**
 * Four-language input group. Arabic and English are required (unless the
 * whole value is optional); Kurdish is always optional and falls back to Arabic.
 */
export function I18nInputs({
  name,
  label,
  defaultValue,
  required = true,
  multiline = false,
  maxLength,
}: {
  name: string;
  label: string;
  defaultValue?: I18nValue;
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
}) {
  const t = useTranslations('admin.catalog.common');
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {LANGS.map(({ code, dir, lang }) => {
        const isRequired = required && (code === 'ar' || code === 'en');
        const props = {
          name: `${name}.${code}`,
          defaultValue: defaultValue?.[code] ?? '',
          required: isRequired,
          dir,
          lang,
          maxLength,
          className: 'w-full rounded-md border border-line bg-surface px-3 py-2 text-base',
        };
        return (
          <label key={code} className="block">
            <span className="mb-0.5 block text-xs text-muted">
              {t(`lang.${code}`)}
              {!isRequired ? ` (${t('optional')})` : ''}
            </span>
            {multiline ? <textarea rows={2} {...props} /> : <input type="text" {...props} />}
          </label>
        );
      })}
      <p className="text-xs text-muted">{t('kurdishHint')}</p>
    </fieldset>
  );
}
