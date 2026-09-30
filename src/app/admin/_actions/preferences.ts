'use server';

import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { adminUsers } from '@/server/db/schema';
import { getCurrentAdmin } from '@/server/auth/current';
import { ADMIN_LOCALE_COOKIE, isAdminLocale } from '@/i18n/config';

export async function setAdminLocaleAction(form: FormData): Promise<void> {
  const locale = form.get('locale');
  if (!isAdminLocale(locale)) return;
  (await cookies()).set(ADMIN_LOCALE_COOKIE, locale, {
    path: '/admin',
    sameSite: 'strict',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });
  const current = await getCurrentAdmin();
  if (current) await db().update(adminUsers).set({ preferredLocale: locale }).where(eq(adminUsers.id, current.user.id));
}
