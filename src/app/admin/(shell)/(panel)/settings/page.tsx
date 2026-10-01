import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { getSettings } from '@/server/settings/service';
import { formatIqd, formatUsd } from '@/lib/currency';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { Card } from '@/components/admin/bits';
import { contactSettingsAction, currencySettingsAction, paymentSettingsAction } from '@/app/admin/_actions/settings';
import { I18nInputs } from '@/components/admin/I18nInputs';

export default async function SettingsPage() {
  await requireAdmin({ permission: 'settings.manage' });
  const t = await getTranslations('admin.settings');
  const locale = (await getLocale()) === 'ar' ? 'ar-IQ' : 'en-US';
  const { currency, payment, contact } = await getSettings(db());
  const example = 75000;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{t('heading')}</h1>
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t('currencyHeading')}</h2>
        <p className="text-sm text-muted">{t('currencyIntro')}</p>
        <ActionForm action={currencySettingsAction} className="space-y-4">
          <div className="w-64">
            <Field
              label={t('usdRate')}
              name="usdRateIqd"
              inputMode="numeric"
              dir="ltr"
              required={false}
              defaultValue={currency.usdRateIqd ? String(currency.usdRateIqd) : undefined}
            />
          </div>
          <p className="text-xs text-muted">{t('usdRateHint')}</p>
          {currency.usdRateIqd ? (
            <p className="text-sm">
              {t('example', {
                iqd: formatIqd(example, locale),
                usd: formatUsd(example / currency.usdRateIqd, locale),
              })}
            </p>
          ) : null}
          <SubmitButton>{t('save')}</SubmitButton>
        </ActionForm>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t('paymentHeading')}</h2>
        <p className="text-sm text-muted">{t('paymentIntro')}</p>
        <ActionForm action={paymentSettingsAction} className="space-y-4">
          <div className="w-72">
            <Field label={t('whatsapp')} name="whatsapp" type="tel" dir="ltr" required={false} defaultValue={payment.whatsapp ?? undefined} />
          </div>
          <p className="text-xs text-muted">{t('whatsappHint')}</p>
          <I18nInputs name="manualInstructions" label={t('manualInstructions')} multiline required={false} maxLength={1000} defaultValue={payment.manualInstructions ?? undefined} />
          <SubmitButton>{t('save')}</SubmitButton>
        </ActionForm>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t('contactHeading')}</h2>
        <p className="text-sm text-muted">{t('contactIntro')}</p>
        <ActionForm action={contactSettingsAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('phone')} name="phone" type="tel" dir="ltr" required={false} defaultValue={contact.phone ?? undefined} />
            <Field label={t('email')} name="email" type="email" dir="ltr" required={false} defaultValue={contact.email ?? undefined} />
            <Field label={t('instagram')} name="instagram" dir="ltr" required={false} defaultValue={contact.instagram ?? undefined} />
            <Field label={t('facebook')} name="facebook" dir="ltr" required={false} defaultValue={contact.facebook ?? undefined} />
            <Field label={t('tiktok')} name="tiktok" dir="ltr" required={false} defaultValue={contact.tiktok ?? undefined} />
          </div>
          <p className="text-xs text-muted">{t('handleHint')}</p>
          <I18nInputs name="address" label={t('address')} required={false} maxLength={300} defaultValue={contact.address ?? undefined} />
          <I18nInputs name="hours" label={t('hours')} required={false} maxLength={200} defaultValue={contact.hours ?? undefined} />
          <SubmitButton>{t('save')}</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
