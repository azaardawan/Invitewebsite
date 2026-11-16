import { getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/server/auth/guard';
import { AuthCard } from '@/components/admin/AuthCard';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { verifyAction } from '@/app/admin/_actions/auth';

export default async function VerifyPage() {
  await requireAdmin({ steps: ['verify-2fa'] });
  const t = await getTranslations('admin');
  return (
    <AuthCard title={t('verify.heading')} brand={t('title')}>
      <p className="mb-4 text-sm text-muted">{t('verify.intro')}</p>
      <ActionForm action={verifyAction} className="space-y-4">
        <Field label={t('verify.code')} name="code" autoComplete="one-time-code" dir="ltr" />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="remember" className="mt-0.5 size-4 shrink-0 accent-accent" />
          <span>
            {t('verify.remember')}
            <span className="mt-0.5 block text-xs text-muted">{t('verify.rememberHint')}</span>
          </span>
        </label>
        <SubmitButton>{t('verify.submit')}</SubmitButton>
      </ActionForm>
    </AuthCard>
  );
}
