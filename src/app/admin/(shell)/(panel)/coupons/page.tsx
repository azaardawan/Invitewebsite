import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { listCoupons } from '@/server/orders/coupons';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import { Badge, Card, formatIqd } from '@/components/admin/bits';
import { couponStatusAction, createCouponAction } from '@/app/admin/_actions/coupons';

/** Discount codes: the owner decides what each one gives (e.g. 50%, 10,000 IQD, or 100% for their own invitations). */
export default async function CouponsPage() {
  await requireAdmin({ permission: 'coupons.manage' });
  const t = await getTranslations('admin.coupons');
  const locale = await getLocale();
  const intl = locale === 'ar' ? 'ar-IQ' : 'en-GB';
  const list = await listCoupons(db());
  const now = new Date();
  const input = 'w-full rounded-md border border-line bg-surface px-3 py-2';

  return (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t('heading')}</h1>
        <p className="text-sm text-muted">{t('intro')}</p>
      </header>

      <Card>
        <h2 className="mb-3 font-semibold">{t('create')}</h2>
        <ActionForm action={createCouponAction} className="grid gap-4 sm:grid-cols-2">
          <Field label={t('code')} name="code" dir="ltr" />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('kind')}</span>
            <select name="kind" defaultValue="PERCENT" className={input}>
              <option value="PERCENT">{t('kindPercent')}</option>
              <option value="AMOUNT">{t('kindAmount')}</option>
            </select>
          </label>
          <Field label={t('value')} name="value" inputMode="numeric" dir="ltr" />
          <Field label={t('maxUses')} name="maxUses" inputMode="numeric" dir="ltr" required={false} />
          <Field label={t('expiresAt')} name="expiresAt" type="date" dir="ltr" required={false} />
          <Field label={t('note')} name="note" required={false} />
          <p className="text-xs text-muted sm:col-span-2">{t('hint')}</p>
          <div className="sm:col-span-2">
            <SubmitButton>{t('createButton')}</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">{t('list')}</h2>
        {list.length === 0 ? <p className="text-sm text-muted">{t('empty')}</p> : null}
        {list.map((c) => {
          const expired = c.expiresAt !== null && c.expiresAt <= now;
          const usedUp = c.maxUses !== null && c.usedCount >= c.maxUses;
          const live = c.status === 'ACTIVE' && !expired && !usedUp;
          return (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 first-of-type:border-0 first-of-type:pt-0">
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-mono text-base font-semibold" dir="ltr">
                    {c.code}
                  </span>{' '}
                  <Badge status={live ? 'ACTIVE' : 'ARCHIVED'}>{live ? t('live') : expired ? t('expired') : usedUp ? t('usedUp') : t('stopped')}</Badge>
                </p>
                <p>{c.kind === 'PERCENT' ? t('percentOff', { n: c.value }) : t('amountOff', { amount: formatIqd(c.value, locale) })}</p>
                <p className="text-muted">
                  {t('uses', { used: c.usedCount, max: c.maxUses ?? '∞' })}
                  {c.expiresAt ? ` · ${t('until', { date: new Intl.DateTimeFormat(intl, { dateStyle: 'medium', timeZone: 'Asia/Baghdad' }).format(c.expiresAt) })}` : ''}
                  {c.note ? ` · ${c.note}` : ''}
                </p>
              </div>
              <ActionForm action={couponStatusAction}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="status" value={c.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'} />
                <SubmitButton tone={c.status === 'ACTIVE' ? 'danger' : undefined}>{c.status === 'ACTIVE' ? t('stop') : t('restart')}</SubmitButton>
              </ActionForm>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
