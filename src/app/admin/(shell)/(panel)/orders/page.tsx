import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { can } from '@/server/rbac/authz';
import { listOrders, maskEmail, maskPhone } from '@/server/orders/admin';
import { receiptTokenFor } from '@/server/orders/tokens';
import { localized } from '@/server/catalog/common';
import { formatIqd } from '@/lib/currency';
import { Badge, Card } from '@/components/admin/bits';
import { ActionForm, SubmitButton } from '@/components/admin/forms';
import { latestPayments } from '@/server/payments/admin';
import { checkPaymentAction, markPaidManuallyAction } from '../../../_actions/orders';

const STATUSES = ['PENDING', 'AWAITING_PAYMENT', 'PAID', 'CANCELLED', 'PAYMENT_EXPIRED', 'REFUNDED'] as const;

export default async function OrdersPage({ searchParams }: PageProps<'/admin/orders'>) {
  const { authz } = await requireAdmin({ permission: 'orders.view' });
  const t = await getTranslations('admin.orders');
  const tr = await getTranslations('receipt');
  const locale = await getLocale();
  const intl = locale === 'ar' ? 'ar-IQ' : 'en-GB';
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 60) : '';
  const status = z.enum(STATUSES).safeParse(params.status).data;
  const rows = await listOrders(db(), { q: q || undefined, status });
  const showContact = can(authz, 'customers.view');
  const canSeePayments = can(authz, 'payments.view');
  const canOverride = can(authz, 'payments.override');
  const pays = canSeePayments ? await latestPayments(db(), rows.map((r) => r.order.id)) : new Map();
  const date = (d: Date) => new Intl.DateTimeFormat(intl, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Baghdad' }).format(d);

  return (
    <div className="max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('heading')}</h1>
        <p className="mt-1 text-muted">{t('intro')}</p>
      </header>
      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-sm">{t('search')}</span>
          <input name="q" defaultValue={q} className="rounded-md border border-line bg-surface px-3 py-2" />
        </label>
        <select name="status" defaultValue={status ?? ''} aria-label={tr('status')} className="rounded-md border border-line bg-surface px-3 py-2">
          <option value="">{t('allStatuses')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {tr(`statuses.${s}`)}
            </option>
          ))}
        </select>
        <button className="rounded-md border border-line bg-surface px-4 py-2 text-sm">{t('filter')}</button>
      </form>

      {rows.length === 0 ? <p className="text-muted">{t('empty')}</p> : null}
      <ul className="space-y-3">
        {rows.map(({ order, customer, snapshot }) => (
          <li key={order.id}>
            <Card className="grid gap-3 sm:grid-cols-4">
              <div>
                <p className="font-mono text-sm" dir="ltr">
                  {order.orderNumber}
                </p>
                {order.invoiceNumber ? (
                  <p className="font-mono text-xs text-muted" dir="ltr">
                    {order.invoiceNumber}
                  </p>
                ) : null}
                <p className="text-xs text-muted">{date(order.createdAt)}</p>
              </div>
              <div className="text-sm">
                <p>{localized(snapshot.theme.name, locale)}</p>
                <p className="text-muted">{localized(snapshot.package.name, locale)}</p>
              </div>
              <div className="text-sm">
                <p>{customer.name}</p>
                <p className="text-muted" dir="ltr">
                  {showContact ? customer.phoneE164 : maskPhone(customer.phoneE164)}
                </p>
                <p className="text-muted" dir="ltr">
                  {showContact ? customer.email : maskEmail(customer.email)}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 text-sm">
                <Badge status={order.status === 'PAID' ? 'ACTIVE' : order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT' ? 'READY_FOR_REVIEW' : 'ARCHIVED'}>
                  {tr(`statuses.${order.status}`)}
                </Badge>
                <span className="font-medium">{formatIqd(order.amountIqd, intl)}</span>
                <Link href={`/r/${receiptTokenFor(order.id)}`} target="_blank" className="text-accent underline">
                  {t('receipt')}
                </Link>
              </div>
              {canSeePayments ? (
                <div className="border-t border-line pt-3 text-sm sm:col-span-4">
                  <PaymentLine p={pays.get(order.id)} date={date} t={t} />
                  {order.status === 'PENDING' || order.status === 'AWAITING_PAYMENT' ? (
                    <div className="mt-3 flex flex-wrap items-start gap-4">
                      {pays.get(order.id) ? (
                        <ActionForm action={checkPaymentAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <SubmitButton tone="secondary">{t('checkWayl')}</SubmitButton>
                        </ActionForm>
                      ) : null}
                      {canOverride ? (
                        <ActionForm action={markPaidManuallyAction} confirmMessage={t('markPaidConfirm')} className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="orderId" value={order.id} />
                          <label className="block">
                            <span className="mb-1 block text-xs text-muted">{t('markPaidReason')}</span>
                            <input name="reason" required minLength={5} maxLength={500} className="w-64 rounded-md border border-line bg-surface px-3 py-2" />
                          </label>
                          <SubmitButton tone="danger">{t('markPaid')}</SubmitButton>
                        </ActionForm>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Pay = Awaited<ReturnType<typeof latestPayments>> extends Map<string, infer P> ? P : never;

function PaymentLine({ p, date, t }: { p: Pay | undefined; date: (d: Date) => string; t: Awaited<ReturnType<typeof getTranslations<'admin.orders'>>> }) {
  if (!p) return <p className="text-muted">{t('noPayment')}</p>;
  return (
    <p className="flex flex-wrap gap-x-3 gap-y-1">
      <span className="font-medium">{t('payment')}:</span>
      <span>{t(`paymentStatuses.${p.status}`)}</span>
      <span className="text-muted">{t('attempt', { n: p.attempt })}</span>
      <span className="font-mono text-xs text-muted" dir="ltr">
        {p.providerReference} · {p.providerEnv}
        {p.providerStatus ? ` · ${p.providerStatus}` : ''}
      </span>
      {p.lastCheckedAt ? <span className="text-muted">{t('lastChecked', { when: date(p.lastCheckedAt) })}</span> : null}
      {p.problem ? <span className="text-danger">{p.problem}</span> : null}
    </p>
  );
}
