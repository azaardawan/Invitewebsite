import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret, generateRecoveryCodes, hashRecoveryCode, verifyTotp, generateTotpSecret } from '@/server/auth/totp';
import { hashPassword, passwordProblem, verifyPassword } from '@/server/auth/password';
import { clientIpFrom } from '@/server/auth/request-context';
import { totpCode } from '../helpers';

describe('password hashing', () => {
  it('verifies the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('a very long passphrase');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'a very long passphrase')).toBe(true);
    expect(await verifyPassword(hash, 'a very long passphrasE')).toBe(false);
  });

  it('never throws on a malformed hash', async () => {
    expect(await verifyPassword('not-a-hash', 'x')).toBe(false);
  });

  it('enforces the password policy', () => {
    expect(passwordProblem('short')).toBe('tooShort');
    expect(passwordProblem('aaaaaaaaaaaaaaaa')).toBe('tooSimple');
    expect(passwordProblem('sara.owner-2026-xyz', { email: 'sara.owner@bahja.iq' })).toBe('containsEmail');
    expect(passwordProblem('x'.repeat(129))).toBe('tooLong');
    expect(passwordProblem('Jasmine river 2026!')).toBeNull();
  });
});

describe('TOTP secret encryption', () => {
  it('round-trips and uses a fresh IV each time', () => {
    const a = encryptSecret('JBSWY3DPEHPK3PXP');
    const b = encryptSecret('JBSWY3DPEHPK3PXP');
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('rejects tampered ciphertext', () => {
    const [iv, tag, enc] = encryptSecret('JBSWY3DPEHPK3PXP').split('.');
    const flipped = Buffer.from(enc!, 'base64url');
    flipped[0] = flipped[0]! ^ 1;
    expect(() => decryptSecret([iv, tag, flipped.toString('base64url')].join('.'))).toThrow();
  });
});

describe('TOTP verification', () => {
  it('accepts current and adjacent steps, rejects others and junk', () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const step = Math.floor(now / 30000);
    expect(verifyTotp(secret, totpCode(secret, 0), now)).toBe(step);
    expect(verifyTotp(secret, totpCode(secret, 1), now)).toBe(step + 1);
    expect(verifyTotp(secret, totpCode(secret, 5), now)).toBeNull();
    expect(verifyTotp(secret, 'abcdef', now)).toBeNull();
    expect(verifyTotp(secret, '12345', now)).toBeNull();
  });
});

describe('recovery codes', () => {
  it('are unique, formatted, and hash independently of case and dashes', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const c of codes) expect(c).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{2}$/);
    expect(hashRecoveryCode(codes[0]!.toUpperCase().replace(/-/g, ' '))).toBe(hashRecoveryCode(codes[0]!));
  });
});

describe('client IP extraction', () => {
  it('prefers the edge header, then the first forwarded hop', () => {
    expect(clientIpFrom(new Headers({ 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' }))).toBe('1.1.1.1');
    expect(clientIpFrom(new Headers({ 'x-forwarded-for': '2.2.2.2, 10.0.0.1' }))).toBe('2.2.2.2');
    expect(clientIpFrom(new Headers())).toBeNull();
  });
});
