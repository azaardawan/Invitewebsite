import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { deviceCookie } from '@/server/auth/current';
import { isThisDevice, listTrustedDevices } from '@/server/auth/trusted-device';
import { deviceName } from '@/lib/device-name';
import { AuthCard } from '@/components/admin/AuthCard';
import { ActionForm, SubmitButton } from '@/components/admin/forms';
import { forgetDeviceAction } from '@/app/admin/_actions/auth';

/** The signed-in admin's remembered devices (no code asked for 30 days), each removable. */
export default async function DevicesPage() {
  const { user } = await requireAdmin();
  const t = await getTranslations('admin');
  const format = await getFormatter();
  const [devices, token] = await Promise.all([listTrustedDevices(db(), user.id), deviceCookie()]);
  const day = (d: Date) => format.dateTime(d, { dateStyle: 'medium' });
  return (
    <AuthCard title={t('devices.heading')} brand={t('title')}>
      <p className="mb-4 text-sm text-muted">{t('devices.intro')}</p>
      {devices.length ? (
        <ul className="divide-y divide-line rounded-md border border-line">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0 text-sm">
                <p className="font-medium">
                  {deviceName(d.userAgent) ?? t('devices.unknown')}
                  {isThisDevice(d, token) ? <span className="ms-2 rounded-full border border-line px-2 py-0.5 text-xs font-normal text-muted">{t('devices.thisDevice')}</span> : null}
                </p>
                <p className="text-xs text-muted">
                  {t('devices.lastUsed', { date: day(d.lastUsedAt) })} · {t('devices.until', { date: day(d.expiresAt) })}
                </p>
              </div>
              <ActionForm action={forgetDeviceAction}>
                <input type="hidden" name="id" value={d.id} />
                <SubmitButton tone="secondary">{t('devices.forget')}</SubmitButton>
              </ActionForm>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-line px-3 py-4 text-sm text-muted">{t('devices.none')}</p>
      )}
      {devices.length > 1 ? (
        <ActionForm action={forgetDeviceAction} className="mt-4">
          <input type="hidden" name="all" value="1" />
          <SubmitButton tone="danger">{t('devices.forgetAll')}</SubmitButton>
        </ActionForm>
      ) : null}
      <Link href="/admin/account/password" className="mt-4 inline-block text-sm text-muted underline">
        {t('nav.account')}
      </Link>
    </AuthCard>
  );
}
