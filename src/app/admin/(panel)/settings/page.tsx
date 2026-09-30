import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { getSettings } from '@/server/settings/service';
import { formatIqd, formatUsd } from '@/lib/currency';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { Card } from '@/components/admin/bits';
import { currencySettingsAction } from '../../_actions/settings';

export default async function SettingsPage() {
  await requireAdmin({ permission: 'settings.manage' });
  const t = await getTranslations('admin.settings');
  const locale = (await getLocale()) === 'ar' ? 'ar-IQ' : 'en-US';
  const { currency } = await getSettings(db());
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
      <p className="text-sm text-muted">{t('more')}</p>
    </div>
  );
}
