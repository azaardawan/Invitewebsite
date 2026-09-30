import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { authenticator } from 'otplib';
import { env } from '@/server/env';
import { randomToken, sha256 } from '@/lib/crypto';

authenticator.options = { step: 30, window: 1, digits: 6 };

const ISSUER = 'Bahja Admin';

export function generateTotpSecret(): string {
  return authenticator.generateSecret(20);
}

export function totpUri(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

/**
 * Verifies a 6-digit code and returns the accepted time-step, or null.
 * Callers must reject steps <= the user's last accepted step (replay protection).
 */
export function verifyTotp(secret: string, code: string, now = Date.now()): number | null {
  const token = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(token)) return null;
  const currentStep = Math.floor(now / 1000 / 30);
  const delta = authenticator.clone({ ...authenticator.options, epoch: now }).checkDelta(token, secret);
  return delta === null ? null : currentStep + delta;
}

function key(): Buffer {
  return Buffer.from(env().TOTP_ENCRYPTION_KEY, 'base64');
}

/** AES-256-GCM. Output: base64url(iv).base64url(tag).base64url(ciphertext) */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64url')).join('.');
}

export function decryptSecret(payload: string): string {
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64url'));
  if (!iv || !tag || !enc) throw new Error('Malformed encrypted secret');
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

const RECOVERY_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Ten one-time recovery codes like `k7mq-x2pd-9h`. Only their hashes are stored. */
export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const raw = Array.from(randomBytes(10), (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]).join('');
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
  });
}

export function normalizeRecoveryCode(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function hashRecoveryCode(code: string): string {
  return sha256(`recovery:${normalizeRecoveryCode(code)}`);
}

export { randomToken };
