'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { requestContext } from '@/server/auth/request-context';
import { createCoupon, setCouponStatus } from '@/server/orders/coupons';
import { catalogFailure, readString } from './form-helpers';
import type { ActionState } from './state';

async function actor() {
  const { user } = await requireAdmin({ permission: 'coupons.manage' });
  return { adminId: user.id, ipHash: (await requestContext()).ipHash };
}

export async function createCouponAction(_: ActionState, form: FormData): Promise<ActionState> {
  const a = await actor();
  try {
    const expires = readString(form, 'expiresAt');
    await createCoupon(
      db(),
      {
        code: String(form.get('code') ?? ''),
        kind: form.get('kind') === 'AMOUNT' ? 'AMOUNT' : 'PERCENT',
        value: Number(String(form.get('value') ?? '').replace(/[,\s٬]/g, '')),
        maxUses: readString(form, 'maxUses') ? Number(readString(form, 'maxUses')) : null,
        // End of the chosen day, Baghdad time.
        expiresAt: expires ? new Date(`${expires}T23:59:59+03:00`) : null,
        note: readString(form, 'note') ?? null,
      },
      a,
    );
  } catch (e) {
    return catalogFailure(e);
  }
  revalidatePath('/admin/coupons');
  return { ok: true, message: 'catalog.common.saved', nonce: Date.now() };
}

export async function couponStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  const a = await actor();
  try {
    await setCouponStatus(db(), z.uuid().parse(form.get('id')), form.get('status') === 'ACTIVE' ? 'ACTIVE' : 'ARCHIVED', a);
  } catch (e) {
    return catalogFailure(e);
  }
  revalidatePath('/admin/coupons');
  return { ok: true, message: 'catalog.common.saved', nonce: Date.now() };
}
