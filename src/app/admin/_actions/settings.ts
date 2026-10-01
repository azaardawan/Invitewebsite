'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { requestContext } from '@/server/auth/request-context';
import { updateCurrencySettings, updatePaymentSettings } from '@/server/settings/service';
import { optionalI18nContent } from '@/server/catalog/common';
import { normalizePhone } from '@/lib/phone';
import { catalogFailure, readI18n } from './form-helpers';
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

/** WhatsApp number and payment instructions shown to customers while payment is collected manually. */
export async function paymentSettingsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'settings.manage' });
  const rawPhone = String(form.get('whatsapp') ?? '').trim();
  const whatsapp = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !whatsapp) return { error: 'settings.invalidWhatsapp' };
  const instructions = optionalI18nContent(1000).safeParse(readI18n(form, 'manualInstructions'));
  if (!instructions.success) return { error: 'catalog.errors.invalid' };
  try {
    await updatePaymentSettings(db(), { whatsapp, manualInstructions: instructions.data }, { adminId: user.id, ipHash: (await requestContext()).ipHash });
  } catch (e) {
    return catalogFailure(e);
  }
  revalidatePath('/admin/settings');
  return { ok: true, message: 'catalog.common.saved', nonce: Date.now() };
}
