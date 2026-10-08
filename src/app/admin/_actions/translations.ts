'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { requestContext } from '@/server/auth/request-context';
import { saveTranslation, TranslationError } from '@/server/i18n/translations';
import type { Locale } from '@/i18n/config';
import type { ActionState } from './state';

/** Saves one text in Admin → Translations. Sorani and Badini are the owner's to approve, so only the owner may change them. */
export async function saveTranslationAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user, authz } = await requireAdmin({ permission: 'translations.manage' });
  const key = String(form.get('key') ?? '');
  const locales: Locale[] = authz.roleKeys.includes('OWNER') ? ['ar', 'en', 'ckb', 'bdn'] : ['ar', 'en'];
  const values: Partial<Record<Locale, string>> = {};
  for (const l of locales) if (form.has(l)) values[l] = String(form.get(l) ?? '');
  try {
    const changed = await saveTranslation(db(), key, values, { adminId: user.id, ipHash: (await requestContext()).ipHash });
    revalidatePath('/admin/translations');
    return { ok: true, message: changed ? 'translations.saved' : 'translations.unchanged', nonce: Date.now() };
  } catch (e) {
    if (e instanceof TranslationError) return { error: `translations.errors.${e.code}`, details: e.detail ? [e.detail] : undefined };
    throw e;
  }
}
