import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { NextIntlClientProvider } from 'next-intl';
import { signatureUrls } from '@/server/invitation/load';
import { getMessages, getTranslations } from 'next-intl/server';
import { isLocale, type Locale } from '@/i18n/config';
import { db } from '@/server/db/client';
import { invitations } from '@/server/db/schema';
import { localized } from '@/server/catalog/common';
import { orderFields } from '@/server/storefront/catalog';
import { SELF_EDIT_LIMIT } from '@/server/invitation/customer-edit';
import { OrderForm } from '@/components/storefront/order/OrderForm';
import { receiptFor } from '../data';
import { customerEditAction } from '../actions';

/** The customer changes their published invitation (packages with `self_edit`), from their private receipt. */
export default async function CustomerEditPage({ params }: PageProps<'/r/[token]/edit'>) {
  const { token } = await params;
  const r = await receiptFor(token);
  if (!r || r.status !== 'PAID' || !r.invitation.selfEdit.included) notFound();
  const locale: Locale = isLocale(r.snapshot.invitation.locale) ? r.snapshot.invitation.locale : 'ar';
  const t = await getTranslations({ locale, namespace: 'receipt' });
  const back = (
    <a href={`/r/${encodeURIComponent(token)}#edit`} className="text-sm text-accent underline">
      {t('editBack')}
    </a>
  );
  if (!r.invitation.selfEdit.allowed) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-xl font-semibold">{t('editTitle')}</h1>
        <p className="mt-3 text-sm text-muted">{r.invitation.selfEdit.left === 0 ? t('editLimitReached') : t('editClosed')}</p>
        <p className="mt-6">{back}</p>
      </main>
    );
  }
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, r.invitation.id));
  const fields = await orderFields(inv!.themeId, inv!.sectionId, inv!.fieldKeys);
  const messages = (await getMessages({ locale })) as Record<string, unknown>;
  const today = new Date().toISOString().slice(0, 10);
  const existingDate = inv!.fieldValues.event_date;
  const minDate = existingDate && existingDate < today ? existingDate : today;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <p className="mb-6">{back}</p>
      <h1 className="text-xl font-semibold">{t('editTitle')}</h1>
      <p className="mt-2 text-sm text-muted">{t('editHelp', { left: r.invitation.selfEdit.left, total: SELF_EDIT_LIMIT })}</p>
      <div className="mt-8">
        <NextIntlClientProvider locale={locale} messages={{ store: messages.store } as never}>
          <OrderForm
            action={customerEditAction.bind(null, token)}
            hidden={{}}
            fields={fields.map((f) => ({ key: f.key, type: f.type, maxLength: f.maxLength, label: localized(f.label, locale) }))}
            initialValues={inv!.fieldValues as Record<string, string>}
            invitationLocale={inv!.locale}
            minDate={minDate}
            submitLabel={t('editSave')}
            extras={inv!.featureKeys.includes('signature') ? { signature: { current: await signatureUrls(db(), inv!) } } : {}}
          />
        </NextIntlClientProvider>
      </div>
    </main>
  );
}
