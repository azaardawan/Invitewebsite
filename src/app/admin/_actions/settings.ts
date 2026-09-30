'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { requestContext } from '@/server/auth/request-context';
import { updateCurrencySettings } from '@/server/settings/service';
import { catalogFailure } from './form-helpers';
import type { ActionState } from './state';

export async function currencySettingsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'settings.manage' });
  const raw = String(form.get('usdRateIqd') ?? '').replace(/[,\s٬]/g, '');
  try {
    await updateCurrencySettings(
      db(),
      { usdRateIqd: raw === '' ? null : Number(raw) },
      { adminId: user.id, ipHash: (await requestContext()).ipHash },
    );
  } catch (e) {
    return catalogFailure(e);
  }
  revalidatePath('/admin/settings');
  return { ok: true, message: 'catalog.common.saved', nonce: Date.now() };
}
