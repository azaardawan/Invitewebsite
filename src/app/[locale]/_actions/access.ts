'use server';

import { redirect } from 'next/navigation';
import { getPathname } from '@/i18n/navigation';
import { isLocale } from '@/i18n/config';
import { db } from '@/server/db/client';
import { requestContext } from '@/server/auth/request-context';
import { lookupAccessCode } from '@/server/orders/access';

/** "My invitation": the 10-digit number → the customer's private receipt (invitation, card, keepsake, edits). */
export async function accessAction(form: FormData) {
  const locale = String(form.get('locale') ?? 'ar');
  const result = await lookupAccessCode(db(), String(form.get('code') ?? ''), (await requestContext()).ipHash);
  if (result.ok) redirect(`/r/${result.receiptToken}`);
  redirect(`${getPathname({ href: '/access', locale: isLocale(locale) ? locale : 'ar' })}?e=${result.error}`);
}
