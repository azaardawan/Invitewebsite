import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireAdmin } from '@/server/auth/guard';
import { can } from '@/server/rbac/authz';
import { LocaleToggle } from '@/components/admin/LocaleToggle';
import { logoutAction } from '@/app/admin/_actions/auth';
import { setAdminLocaleAction } from '@/app/admin/_actions/preferences';

export default async function PanelLayout({ children }: LayoutProps<'/admin'>) {
  const { user, authz } = await requireAdmin();
  const t = await getTranslations('admin');

  const links = [
    { href: '/admin', label: t('nav.dashboard'), show: true },
    { href: '/admin/analytics', label: t('nav.analytics'), show: can(authz, 'analytics.view') },
    { href: '/admin/orders', label: t('nav.orders'), show: can(authz, 'orders.view') },
    { href: '/admin/customers', label: t('nav.customers'), show: can(authz, 'customers.view') },
    { href: '/admin/invitations', label: t('nav.invitations'), show: can(authz, 'invitations.view') },
    { href: '/admin/sections', label: t('nav.sections'), show: can(authz, 'sections.manage') },
    { href: '/admin/themes', label: t('nav.themes'), show: can(authz, 'themes.view') },
    { href: '/admin/fields', label: t('nav.fields'), show: can(authz, 'sections.manage') },
    { href: '/admin/music', label: t('nav.music'), show: can(authz, 'music.manage') },
    { href: '/admin/coupons', label: t('nav.coupons'), show: can(authz, 'coupons.manage') },
    { href: '/admin/translations', label: t('nav.translations'), show: can(authz, 'translations.manage') },
    { href: '/admin/settings', label: t('nav.settings'), show: can(authz, 'settings.manage') },
    { href: '/admin/legal', label: t('nav.legal'), show: can(authz, 'legal.manage') },
    { href: '/admin/users', label: t('nav.users'), show: can(authz, 'users.manage') },
    { href: '/admin/audit', label: t('nav.audit'), show: can(authz, 'audit.view') },
    { href: '/admin/account/password', label: t('nav.account'), show: true },
  ];

  return (
    <div className="min-h-dvh md:flex">
      <aside className="border-b border-line bg-surface md:w-64 md:shrink-0 md:border-b-0 md:border-e">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="font-semibold text-accent">{t('title')}</span>
          <LocaleToggle action={setAdminLocaleAction} />
        </div>
        <nav aria-label={t('title')} className="px-2 pb-4">
          <ul className="flex gap-1 overflow-x-auto md:flex-col">
            {links
              .filter((l) => l.show)
              .map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-canvas">
                    {l.label}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
        <div className="hidden border-t border-line px-4 py-4 text-sm md:block">
          <p className="truncate">{user.name}</p>
          <p className="truncate text-muted" dir="ltr">
            {user.email}
          </p>
          <form action={logoutAction} className="mt-2">
            <button type="submit" className="text-danger underline-offset-4 hover:underline">
              {t('nav.logout')}
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-8">
        {children}
        <form action={logoutAction} className="mt-10 md:hidden">
          <button type="submit" className="text-sm text-danger">
            {t('nav.logout')}
          </button>
        </form>
      </main>
    </div>
  );
}
