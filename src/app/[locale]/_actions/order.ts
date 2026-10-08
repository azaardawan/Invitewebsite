'use server';

import { redirect } from 'next/navigation';
import { getPathname } from '@/i18n/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { db } from '@/server/db/client';
import { requestContext } from '@/server/auth/request-context';
import { OrderError } from '@/server/orders/common';
import { createDraft, updateDraft } from '@/server/orders/drafts';
import type { OrderExtras } from '@/server/orders/extras';
import { createOrder } from '@/server/orders/checkout';
import { startPayment } from '@/server/payments/service';

/** What storefront order forms get back when something needs fixing. Codes are keys under `store`. */
export type OrderFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** What the customer typed, so a failed submit never loses it. */
  values?: Record<string, string>;
};

function str(form: FormData, name: string): string {
  const v = form.get(name);
  return typeof v === 'string' ? v : '';
}

function fieldValues(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (k.startsWith('f.') && typeof v === 'string') values[k.slice(2)] = v;
  return values;
}

/** Everything typed, so a failed submit puts it all back (fields plus the card back). */
function typedValues(form: FormData): Record<string, string> {
  return { ...fieldValues(form), 'cb.title': str(form, 'cb.title'), 'cb.message': str(form, 'cb.message') };
}

/** The optional order-form sections (card back, signature, colour set); absent sections are left alone. */
function orderExtras(form: FormData): OrderExtras {
  const extras: OrderExtras = {};
  if (form.has('cb.title') || form.has('cb.message')) extras.cardBack = { title: str(form, 'cb.title'), message: str(form, 'cb.message') };
  if (form.has('signature')) extras.signature = str(form, 'signature');
  if (form.has('signature2')) extras.signature2 = str(form, 'signature2');
  if (form.has('palette')) extras.paletteId = str(form, 'palette');
  return extras;
}

function siteLocale(form: FormData): Locale {
  const l = str(form, 'siteLocale');
  return isLocale(l) ? l : 'ar';
}

function invitationLocale(form: FormData, fallback: Locale): Locale {
  const l = str(form, 'invitationLocale');
  return isLocale(l) ? l : fallback;
}

function failure(e: unknown, values?: Record<string, string>): OrderFormState {
  if (e instanceof OrderError) return { error: `errors.${e.code}`, fieldErrors: e.fieldErrors, values };
  throw e;
}

const reviewPath = (locale: Locale, token: string) => getPathname({ locale, href: `/order/${token}` });

/** Step 1: the customer's details become a private draft, then they see it in their theme. */
export async function startOrderAction(_prev: OrderFormState, form: FormData): Promise<OrderFormState> {
  const locale = siteLocale(form);
  const values = fieldValues(form);
  let token: string;
  try {
    ({ previewToken: token } = await createDraft(
      db(),
      { themeKey: str(form, 'themeKey'), packageId: str(form, 'packageId'), locale: invitationLocale(form, locale), values, extras: orderExtras(form) },
      await requestContext(),
    ));
  } catch (e) {
    return failure(e, typedValues(form));
  }
  redirect(reviewPath(locale, token));
}

/** Corrections before paying; the preview link stays the same. */
export async function editDraftAction(_prev: OrderFormState, form: FormData): Promise<OrderFormState> {
  const locale = siteLocale(form);
  const token = str(form, 'token');
  const values = fieldValues(form);
  try {
    await updateDraft(db(), token, { values, locale: invitationLocale(form, locale), extras: orderExtras(form) });
  } catch (e) {
    return failure(e, typedValues(form));
  }
  redirect(reviewPath(locale, token));
}

/** Step 2: the order is created from the draft; the customer lands on their private receipt. */
export async function placeOrderAction(_prev: OrderFormState, form: FormData): Promise<OrderFormState> {
  const values = { name: str(form, 'name'), phone: str(form, 'phone'), email: str(form, 'email'), coupon: str(form, 'coupon') };
  let receiptToken: string;
  let orderId: string;
  let amountIqd: number;
  try {
    ({ receiptToken, orderId, amountIqd } = await createOrder(
      db(),
      {
        previewToken: str(form, 'token'),
        customer: values,
        acceptedTerms: form.get('terms') === 'on',
        idempotencyKey: str(form, 'idempotencyKey'),
        couponCode: values.coupon,
      },
      await requestContext(),
    ));
  } catch (e) {
    return failure(e, values);
  }
  // A 100% coupon: already paid and published, nothing to collect.
  if (amountIqd === 0) redirect(`/r/${receiptToken}`);
  // Straight on to WAYL; if that isn't possible right now, the receipt page offers "Pay now".
  const pay = await startPayment(db(), orderId).catch((e) => {
    console.error('[payments] start after checkout failed', e);
    return { kind: 'error' as const };
  });
  if (pay.kind === 'redirect') redirect(pay.url);
  redirect(`/r/${receiptToken}${pay.kind === 'error' ? '?pay=error' : ''}`);
}

