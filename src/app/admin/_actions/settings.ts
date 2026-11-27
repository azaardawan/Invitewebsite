'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { requestContext } from '@/server/auth/request-context';
import { updateContactSettings, updateCurrencySettings, updateGuestPhotoSettings, updatePaymentSettings, updateSignatureBoardSettings } from '@/server/settings/service';
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
  let instructions;
  try {
    instructions = optionalI18nContent(1000).safeParse(readI18n(form, 'manualInstructions'));
  } catch (e) {
    return catalogFailure(e);
  }
  if (!instructions.success) return { error: 'catalog.errors.invalid' };
  try {
    await updatePaymentSettings(db(), { whatsapp, manualInstructions: instructions.data }, { adminId: user.id, ipHash: (await requestContext()).ipHash });
  } catch (e) {
    return catalogFailure(e);
  }
  revalidatePath('/admin/settings');
  return { ok: true, message: 'catalog.common.saved', nonce: Date.now() };
}

/** Public contact details: footer and contact page. */
export async function contactSettingsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'settings.manage' });
  const text = (k: string) => String(form.get(k) ?? '').trim();
  const handle = (k: string) => text(k).replace(/^@/, '').replace(/^https?:\/\/(www\.)?[^/]+\//, '').replace(/\/$/, '') || null;
  const rawPhone = text('phone');
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !phone) return { error: 'settings.invalidPhone' };
  let address, hours;
  try {
    address = optionalI18nContent(300).safeParse(readI18n(form, 'address'));
    hours = optionalI18nContent(200).safeParse(readI18n(form, 'hours'));
  } catch (e) {
    return catalogFailure(e);
  }
  if (!address.success || !hours.success) return { error: 'catalog.errors.invalid' };
  try {
    await updateContactSettings(
      db(),
      { phone, email: text('email') || null, instagram: handle('instagram'), facebook: handle('facebook'), tiktok: handle('tiktok'), address: address.data, hours: hours.data },
      { adminId: user.id, ipHash: (await requestContext()).ipHash },
    );
  } catch (e) {
    if (e instanceof ZodError) return { error: 'settings.invalidContact' };
    return catalogFailure(e);
  }
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  return { ok: true, message: 'catalog.common.saved', nonce: Date.now() };
}


/** Guest photo sharing: offered or not, the basic price (750 photos), the price per 50 more, and the highest total. */
export async function guestPhotoSettingsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'settings.manage' });
  const num = (k: string) => Number(String(form.get(k) ?? '').replace(/[,\s٬]/g, ''));
  try {
    await updateGuestPhotoSettings(
      db(),
      { enabled: form.get('enabled') === 'on', basePriceIqd: num('basePriceIqd'), stepPriceIqd: num('stepPriceIqd'), maxCap: num('maxCap') },
      { adminId: user.id, ipHash: (await requestContext()).ipHash },
    );
  } catch (e) {
    if (e instanceof ZodError) return { error: 'settings.guestPhotosInvalid' };
    return catalogFailure(e);
  }
  revalidatePath('/admin/settings');
  return { ok: true, message: 'catalog.common.saved', nonce: Date.now() };
}

/** The signature board: offered or not, its price, and how many people go on each board. */
export async function signatureBoardSettingsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'settings.manage' });
  const num = (k: string) => Number(String(form.get(k) ?? '').replace(/[,\s٬]/g, ''));
  try {
    await updateSignatureBoardSettings(
      db(),
      { enabled: form.get('enabled') === 'on', priceIqd: num('priceIqd'), perBoard: num('perBoard') },
      { adminId: user.id, ipHash: (await requestContext()).ipHash },
    );
  } catch (e) {
    if (e instanceof ZodError) return { error: 'settings.signatureBoardInvalid' };
    return catalogFailure(e);
  }
  revalidatePath('/admin/settings');
  return { ok: true, message: 'catalog.common.saved', nonce: Date.now() };
}
