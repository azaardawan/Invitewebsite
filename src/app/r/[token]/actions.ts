'use server';

import { redirect } from 'next/navigation';
import { db } from '@/server/db/client';
import { requestContext } from '@/server/auth/request-context';
import { getReceipt } from '@/server/orders/receipt';
import { OrderError } from '@/server/orders/common';
import { consumeRateLimit } from '@/server/rate-limit';
import { startPayment } from '@/server/payments/service';

/** "Pay now" on the private receipt: sends the customer to WAYL (reusing an open link). */
export async function payAction(form: FormData) {
  const token = String(form.get('token') ?? '');
  const r = await getReceipt(db(), token);
  if (!r) redirect(`/r/${encodeURIComponent(token)}`);
  const { ipHash } = await requestContext();
  if (ipHash && !(await consumeRateLimit(db(), `pay:${ipHash}`, 30, 3600))) redirect(`/r/${token}?pay=error`);
  let result;
  try {
    result = await startPayment(db(), r.orderId);
  } catch (e) {
    if (!(e instanceof OrderError)) throw e;
    redirect(`/r/${token}`);
  }
  if (result.kind === 'redirect') redirect(result.url);
  redirect(`/r/${token}${result.kind === 'error' || result.kind === 'busy' ? '?pay=error' : ''}`);
}
