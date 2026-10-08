import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { can } from '@/server/rbac/authz';
import { customerProfile } from '@/server/customers/admin';
import { whatsappLink } from '@/server/documents/delivery';
import { localized } from '@/server/catalog/common';
import { formatIqd } from '@/lib/currency';
import { Badge, Card } from '@/components/admin/bits';

export default async function CustomerPage({ params }: PageProps<'/admin/customers/[id]'>) {
  const { authz } = await requireAdmin({ permission: 'customers.view' });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const c = await customerProfile(db(), id);
  if (!c) notFound();
  const t = await getTranslations('admin.customers');
  const tr = await getTranslations('receipt');
  const locale = await getLocale();
  const intl = locale === 'ar' ? 'ar-IQ' : 'en-GB';
  const date = (d: Date) => new Intl.DateTimeFormat(intl, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Baghdad' }).format(d);
  const canOrders = can(authz, 'orders.view');
  const canInvitations = can(authz, 'invitations.view');

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/customers" className="text-sm text-accent underline">
        {t('back')}
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold" dir="auto">
          {c.name}
        </h1>
        <p className="text-muted">
          {t('orders', { count: c.orders.length })} · {t('paidTotal', { amount: formatIqd(c.paidIqd, intl) })}
        </p>
      </header>

      <Card className="space-y-2 text-sm">
        <h2 className="font-semibold">{t('contact')}</h2>
        <p dir="ltr" className="text-start">
          {c.phone}
        </p>
        {c.emails.map((e) => (
          <p key={e} dir="ltr" className="text-start">
            {e}
          </p>
        ))}
        {c.names.length > 1 ? (
          <p className="text-muted">
            {t('namesUsed')}: <span dir="auto">{c.names.join('، ')}</span>
          </p>
        ) : null}
        <a href={whatsappLink(c.phone, '')} target="_blank" rel="noopener noreferrer" className="inline-block text-accent underline">
          {t('whatsapp')}
        </a>
      </Card>

      <section className="space-y-3">
        <h2 className="font-semibold">{t('ordersTitle')}</h2>
        {c.orders.map((o) => (
          <Card key={o.id} className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="font-mono" dir="ltr">
                {o.orderNumber}
              </p>
              {o.invoiceNumber ? (
                <p className="font-mono text-xs text-muted" dir="ltr">
                  {o.invoiceNumber}
                </p>
              ) : null}
              <p className="text-xs text-muted">{date(o.createdAt)}</p>
            </div>
            <div>
              <p>{localized(o.snapshot.theme.name, locale)}</p>
              <p className="text-muted">{localized(o.snapshot.package.name, locale)}</p>
              <p className="mt-1">
                {t('invitation')}: {o.invitation.live ? t('live') : t('notLive')}
              </p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <Badge status={o.status === 'PAID' ? 'ACTIVE' : o.status === 'PENDING' || o.status === 'AWAITING_PAYMENT' ? 'READY_FOR_REVIEW' : 'ARCHIVED'}>
                {tr(`statuses.${o.status}`)}
              </Badge>
              <span className="font-medium">{formatIqd(o.amountIqd, intl)}</span>
              {canOrders ? (
                <>
                  <span className="text-muted">
                    {t('accessCode')}: <span dir="ltr" className="inline-block">{o.accessCode}</span>
                  </span>
                  <Link href={o.receiptPath} target="_blank" className="text-accent underline">
                    {t('receipt')}
                  </Link>
                </>
              ) : null}
              {canInvitations ? (
                <Link href={`/admin/invitations/${o.invitation.id}`} className="text-accent underline">
                  {t('openInvitation')}
                </Link>
              ) : null}
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
