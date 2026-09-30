import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentAdmin } from '@/server/auth/current';
import { nextAuthStep } from '@/server/auth/session';
import { AUTH_STEP_PATHS } from '@/server/auth/guard';
import { AuthCard } from '@/components/admin/AuthCard';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { LocaleToggle } from '@/components/admin/LocaleToggle';
import { loginAction } from '../_actions/auth';
import { setAdminLocaleAction } from '../_actions/preferences';

export default async function LoginPage() {
  const current = await getCurrentAdmin();
  if (current) redirect(AUTH_STEP_PATHS[nextAuthStep(current.user, current.session)]);
  const t = await getTranslations('admin');

  return (
    <AuthCard title={t('login.heading')} brand={t('title')}>
      <ActionForm action={loginAction} className="space-y-4">
        <Field label={t('login.email')} name="email" type="email" autoComplete="username" dir="ltr" inputMode="email" />
        <Field label={t('login.password')} name="password" type="password" autoComplete="current-password" dir="ltr" />
        <SubmitButton>{t('login.submit')}</SubmitButton>
      </ActionForm>
      <div className="mt-6 flex justify-center">
        <LocaleToggle action={setAdminLocaleAction} />
      </div>
    </AuthCard>
  );
}
