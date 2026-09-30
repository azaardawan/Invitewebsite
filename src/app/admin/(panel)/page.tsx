import { getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/server/auth/guard';

export default async function DashboardPage({ searchParams }: PageProps<'/admin'>) {
  const { user, authz } = await requireAdmin({ permission: 'dashboard.view' });
  const t = await getTranslations('admin');
  const { recovery } = await searchParams;
  const roleNames = authz.roleKeys.map((k) => (['OWNER', 'MANAGER', 'DESIGNER', 'SUPPORT'].includes(k) ? t(`roles.${k}` as never) : k));

  return (
    <div className="max-w-3xl space-y-4">
      {recovery ? (
        <p role="status" className="rounded-md border border-line bg-surface p-3 text-sm">
          {t('verify.recoveryUsed')}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold">{t('dashboard.welcome', { name: user.name })}</h1>
      <p className="text-muted">{t('dashboard.intro')}</p>
      <p className="text-sm">{t('dashboard.roles', { roles: roleNames.join('، ') })}</p>
    </div>
  );
}
