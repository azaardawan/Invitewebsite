import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { listCustomers } from '@/server/customers/admin';
import { formatIqd } from '@/lib/currency';
import { Card } from '@/components/admin/bits';

export default async function CustomersPage({ searchParams }: PageProps<'/admin/customers'>) {
  await requireAdmin({ permission: 'customers.view' });
  const t = await getTranslations('admin.customers');
  const intl = (await getLocale()) === 'ar' ? 'ar-IQ' : 'en-GB';
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 60) : '';
  const rows = await listCustomers(db(), { q: q || undefined });
  const date = (d: Date) => new Intl.DateTimeFormat(intl, { dateStyle: 'medium', timeZone: 'Asia/Baghdad' }).format(d);

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('heading')}</h1>
        <p className="mt-1 text-muted">{t('intro')}</p>
      </header>
      <form method="get" className="flex flex-wrap items-end gap-2">
        <input name="q" defaultValue={q} aria-label={t('search')} placeholder={t('search')} className="w-72 rounded-md border border-line bg-surface px-3 py-2" />
        <button className="rounded-md border border-line bg-surface px-4 py-2 text-sm">{t('searchButton')}</button>
      </form>
      {rows.length === 0 ? <p className="text-muted">{t('empty')}</p> : null}
      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.phone}>
            <Card className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium" dir="auto">
                  {c.name}
                </p>
                <p className="text-sm text-muted" dir="ltr">
                  {c.phone} · {c.email}
                </p>
              </div>
              <div className="text-sm text-muted">
                <p>{t('orders', { count: c.orderCount })}</p>
                <p>{t('paidTotal', { amount: formatIqd(c.paidIqd, intl) })}</p>
                <p>{t('lastOrder', { date: date(c.lastOrderAt) })}</p>
              </div>
              <Link href={`/admin/customers/${c.id}`} className="text-sm text-accent underline">
                {t('open')}
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
