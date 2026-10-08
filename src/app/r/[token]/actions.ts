'use server';

import { redirect } from 'next/navigation';
import { db } from '@/server/db/client';
import { requestContext } from '@/server/auth/request-context';
import { getReceipt } from '@/server/orders/receipt';
import { OrderError } from '@/server/orders/common';
import { consumeRateLimit } from '@/server/rate-limit';
import { startPayment } from '@/server/payments/service';
import { setPublicGuestbook } from '@/server/guests/guestbook';
import { setPublicAttendance } from '@/server/guests/attendance';
import { saveCustomerCardBack } from '@/server/documents/card-back';
import { customerEditInvitation } from '@/server/invitation/customer-edit';

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

/** The customer's choice from their receipt: guest messages public under the invitation, or keepsake only. Saved on tap. */
export async function guestbookAction(token: string, isPublic: boolean): Promise<{ ok: boolean }> {
  const r = await getReceipt(db(), token);
  if (!r || r.status !== 'PAID' || !r.invitation.hasMessages) return { ok: false };
  const { ipHash } = await requestContext();
  if (ipHash && !(await consumeRateLimit(db(), `guestbook:${ipHash}`, 30, 3600))) return { ok: false };
  return { ok: await setPublicGuestbook(db(), r.invitation.id, isPublic === true, { type: 'CUSTOMER', ipHash }) };
}

/** The customer's choice from their receipt: reply counts shown on the invitation, or seen only by them. Saved on tap. */
export async function attendanceAction(token: string, isPublic: boolean): Promise<{ ok: boolean }> {
  const r = await getReceipt(db(), token);
  if (!r || r.status !== 'PAID' || !r.invitation.hasRsvp) return { ok: false };
  const { ipHash } = await requestContext();
  if (ipHash && !(await consumeRateLimit(db(), `attendance:${ipHash}`, 30, 3600))) return { ok: false };
  return { ok: await setPublicAttendance(db(), r.invitation.id, isPublic === true, { type: 'CUSTOMER', ipHash }) };
}

/** The customer changes the back of their printable card from the receipt. */
export async function cardBackAction(form: FormData) {
  const token = String(form.get('token') ?? '');
  const r = await getReceipt(db(), token);
  const back = `/r/${encodeURIComponent(token)}`;
  if (!r || r.status !== 'PAID' || !r.invitation.hasPrintCard) redirect(back);
  const { ipHash } = await requestContext();
  if (ipHash && !(await consumeRateLimit(db(), `cardback:${ipHash}`, 30, 3600))) redirect(`${back}?cardBack=error#card-back`);
  const ok = await saveCustomerCardBack(db(), r.invitation.id, { title: String(form.get('title') ?? ''), message: String(form.get('message') ?? '') }, ipHash);
  redirect(`${back}?cardBack=${ok ? 'saved' : 'error'}#card-back`);
}

type EditState = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

/** The customer edits their published invitation (packages with `self_edit`). Errors are keys under `store`. */
export async function customerEditAction(token: string, _prev: EditState, form: FormData): Promise<EditState> {
  const values: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (k.startsWith('f.') && typeof v === 'string') values[k.slice(2)] = v;
  const result = await customerEditInvitation(db(), {
    receiptToken: token,
    values,
    locale: String(form.get('invitationLocale') ?? ''),
    ipHash: (await requestContext()).ipHash,
  });
  if (result.ok) redirect(`/r/${encodeURIComponent(token)}?edited=1#edit`);
  if (result.error === 'invalidFields') return { error: 'errors.invalidFields', fieldErrors: result.fieldErrors, values };
  const code = { notFound: 'errors.notFound', notAllowed: 'errors.editNotAllowed', limitReached: 'errors.editLimitReached', rateLimited: 'errors.rateLimited' }[result.error];
  return { error: code, values };
}
