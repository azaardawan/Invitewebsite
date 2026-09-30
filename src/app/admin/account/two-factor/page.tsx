import QRCode from 'qrcode';
import { getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { beginTotpEnrollment } from '@/server/auth/service';
import { AuthCard } from '@/components/admin/AuthCard';
import { TwoFactorSetup } from '@/components/admin/TwoFactorSetup';
import { confirmTwoFactorAction } from '../../_actions/auth';

export default async function TwoFactorSetupPage() {
  // Verified sessions may stay here: setting the new session cookie refreshes
  // this page, and the recovery codes must still be shown to the user.
  const { user } = await requireAdmin({ steps: ['setup-2fa', 'change-password', 'ok'] });
  const t = await getTranslations('admin');

  if (user.totpEnabledAt) {
    return (
      <AuthCard title={t('setup2fa.heading')} brand={t('title')}>
        <TwoFactorSetup action={confirmTwoFactorAction} enrollment={null} />
      </AuthCard>
    );
  }

  const { secret, uri } = await beginTotpEnrollment(db(), user.id);
  const qrSvg = await QRCode.toString(uri, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
  return (
    <AuthCard title={t('setup2fa.heading')} brand={t('title')}>
      <TwoFactorSetup action={confirmTwoFactorAction} enrollment={{ qrSvg, secret }} />
    </AuthCard>
  );
}
