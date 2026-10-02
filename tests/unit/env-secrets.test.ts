import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

describe('secret keys', () => {
  it('uses a base64 32-byte key as is, and hashes any other long random string', async () => {
    vi.resetModules();
    const b64 = Buffer.alloc(32, 5).toString('base64');
    process.env.TOKEN_SECRET = b64;
    const { secretKey } = await import('@/server/env');
    expect(secretKey('TOKEN_SECRET')).toEqual(Buffer.alloc(32, 5));

    vi.resetModules();
    const generated = 'k2J9vQ7xLmP4sT8wZ1aB6cD3eF0gH5iJ9kL2mN7oP4q';
    process.env.TOKEN_SECRET = generated;
    const again = await import('@/server/env');
    expect(again.secretKey('TOKEN_SECRET')).toEqual(createHash('sha256').update(generated).digest());
    process.env.TOKEN_SECRET = b64;
  });
});

describe('optional settings', () => {
  it('treats a variable left empty in the dashboard as not set', async () => {
    vi.resetModules();
    process.env.TURNSTILE_SITE_KEY = '';
    process.env.TURNSTILE_SECRET_KEY = '';
    const { env } = await import('@/server/env');
    expect(env().TURNSTILE_SITE_KEY).toBeUndefined();
    expect(env().TURNSTILE_SECRET_KEY).toBeUndefined();
    delete process.env.TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
  });
});
