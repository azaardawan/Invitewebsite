import { randomBytes } from 'node:crypto';
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

/** A structurally valid MPEG-1 Layer III file (silent frames) of roughly `seconds` length. */
export function makeMp3(seconds = 2): Buffer {
  const header = Buffer.from([0xff, 0xfb, 0x90, 0x64]); // MPEG1 L3, 128 kbps, 44.1 kHz, no padding
  const frameSize = Math.floor((144 * 128000) / 44100); // 417 bytes
  const frames = Math.ceil((seconds * 44100) / 1152);
  const frame = Buffer.concat([header, Buffer.alloc(frameSize - header.length)]);
  // Random audio bytes in the first frame make every file unique, so fixtures never collide as duplicate songs.
  const first = Buffer.concat([header, randomBytes(frameSize - header.length)]);
  return Buffer.concat([first, ...Array.from({ length: frames - 1 }, () => frame)]);
}

let keyCounter = 0;
export function uniqueKey(prefix: string) {
  keyCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${keyCounter}`;
}
