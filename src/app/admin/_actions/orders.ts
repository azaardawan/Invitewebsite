'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { markOrderPaid } from '@/server/orders/payment';
import { OrderError } from '@/server/orders/common';
import { verifyLatestForOrder } from '@/server/payments/service';
import { WaylError } from '@/server/payments/wayl';
import type { ActionState } from './state';

const id = z.uuid();

/** Asks WAYL for the order's latest payment right now (same verification as webhooks). */
export async function checkPaymentAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin({ permission: 'payments.view' });
  const orderId = id.safeParse(form.get('orderId'));
  if (!orderId.success) return { error: 'orders.errors.invalid' };
  try {
    const result = await verifyLatestForOrder(db(), orderId.data);
    revalidatePath('/admin/orders');
    return { ok: true, message: `orders.check.${result}`, nonce: Date.now() };
  } catch (e) {
    if (e instanceof WaylError) return { error: 'orders.errors.wayl' };
    throw e;
  }
}

/**
 * Records a payment received outside WAYL and publishes the invitation.
 * Requires a reason; audited; never changes WAYL payment records.
 */
export async function markPaidManuallyAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'payments.override' });
  const orderId = id.safeParse(form.get('orderId'));
  const reason = String(form.get('reason') ?? '').trim();
  if (!orderId.success) return { error: 'orders.errors.invalid' };
  if (reason.length < 5 || reason.length > 500) return { error: 'orders.errors.reason' };
  try {
    const r = await markOrderPaid(db(), orderId.data, { kind: 'MANUAL', adminId: user.id, reason });
    revalidatePath('/admin/orders');
    return { ok: true, message: r.alreadyPaid ? 'orders.alreadyPaid' : 'orders.markedPaid', nonce: Date.now() };
  } catch (e) {
    if (e instanceof OrderError) return { error: `orders.errors.${e.code === 'refunded' ? 'refunded' : 'invalid'}` };
    throw e;
  }
}
