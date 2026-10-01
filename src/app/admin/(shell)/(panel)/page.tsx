import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { and, count, eq, gt, inArray } from 'drizzle-orm';
import { requireAdmin } from '@/server/auth/guard';
import { can } from '@/server/rbac/authz';
import { db } from '@/server/db/client';
import { invitations, orders } from '@/server/db/schema';
import { Card } from '@/components/admin/bits';

async function counts(now = new Date()) {
  const [[awaiting], [live]] = await Promise.all([
    db().select({ n: count() }).from(orders).where(inArray(orders.status, ['PENDING', 'AWAITING_PAYMENT'])),
    db().select({ n: count() }).from(invitations).where(and(eq(invitations.status, 'PUBLISHED'), gt(invitations.expiresAt, now))),
  ]);
  return { awaiting: awaiting?.n ?? 0, live: live?.n ?? 0 };
}

export default async function DashboardPage({ searchParams }: PageProps<'/admin'>) {
  const { user, authz } = await requireAdmin({ permission: 'dashboard.view' });
  const t = await getTranslations('admin');
  const { recovery } = await searchParams;
  const c = await counts();
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
      <div className="grid gap-3 sm:grid-cols-2">
        {can(authz, 'orders.view') ? (
          <Card className="space-y-2">
            <p className="text-lg font-semibold">{t('dashboard.awaitingPayment', { count: c.awaiting })}</p>
            <Link href="/admin/orders?status=PENDING" className="text-sm text-accent underline">
              {t('dashboard.viewOrders')}
            </Link>
          </Card>
        ) : null}
        {can(authz, 'invitations.view') ? (
          <Card>
            <p className="text-lg font-semibold">{t('dashboard.liveInvitations', { count: c.live })}</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
