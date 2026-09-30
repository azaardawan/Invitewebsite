import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/server/auth/guard';
import { AuthCard } from '@/components/admin/AuthCard';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { changePasswordAction } from '../../_actions/auth';

export default async function PasswordPage() {
  const { user } = await requireAdmin({ steps: ['change-password', 'ok'] });
  const t = await getTranslations('admin');
  return (
    <AuthCard title={t('password.heading')} brand={t('title')}>
      {user.mustChangePassword ? <p className="mb-4 text-sm text-muted">{t('password.mustChange')}</p> : null}
      <ActionForm action={changePasswordAction} className="space-y-4">
        <Field label={t('password.current')} name="current" type="password" autoComplete="current-password" dir="ltr" />
        <Field label={t('password.next')} name="next" type="password" autoComplete="new-password" dir="ltr" />
        <Field label={t('password.confirm')} name="confirm" type="password" autoComplete="new-password" dir="ltr" />
        <SubmitButton>{t('password.submit')}</SubmitButton>
      </ActionForm>
      {!user.mustChangePassword ? (
        <Link href="/admin" className="mt-4 inline-block text-sm text-muted underline">
          {t('nav.dashboard')}
        </Link>
      ) : null}
    </AuthCard>
  );
}
