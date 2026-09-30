import { authenticator } from 'otplib';
import { db } from '@/server/db/client';
import { createAdminUser } from '@/server/admin/users';
import { seedRbac } from '@/server/rbac/seed';
import type { RequestContext } from '@/server/auth/request-context';

export const ctx: RequestContext = { ipHash: 'test-ip-hash', userAgent: 'vitest' };

let seeded = false;
export async function ensureSeeded() {
  if (!seeded) {
    await seedRbac(db());
    seeded = true;
  }
}

let counter = 0;
export function uniqueEmail(prefix = 'admin') {
  counter += 1;
  return `${prefix}.${Date.now()}.${counter}@example.test`;
}

export async function makeAdmin(roleKeys: string[] = ['OWNER'], password = 'correct horse battery staple') {
  await ensureSeeded();
  const email = uniqueEmail();
  const { id } = await createAdminUser(db(), { email, name: 'Test Admin', roleKeys, password }, { adminId: null, ipHash: null, type: 'SYSTEM' });
  return { id, email, password };
}

/** A valid TOTP code for the time step `offsetSteps` away from now. */
export function totpCode(secret: string, offsetSteps = 0) {
  return authenticator.clone({ ...authenticator.options, epoch: Date.now() + offsetSteps * 30_000 }).generate(secret);
}
