import { afterEach, describe, expect, it, vi } from 'vitest';

describe('owner WhatsApp notice', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('says what was paid without customer details, and links to the order in Admin', async () => {
    const { paidOrderMessage } = await import('@/server/notify/owner');
    const text = paidOrderMessage({ orderNumber: 'ORD-ABC12345', amountIqd: 25000, theme: 'زاخو', pkg: 'عادي', via: 'WAYL' });
    expect(text).toContain('ORD-ABC12345');
    expect(text).toContain('زاخو · عادي');
    expect(text).toMatch(/\/admin\/orders\?q=ORD-ABC12345$/);
  });

  it('is off unless both settings are present, and never throws', async () => {
    const { notifyOwner } = await import('@/server/notify/owner');
    const fake = vi.fn();
    expect(await notifyOwner('hi', fake as never)).toBe(false);
    expect(fake).not.toHaveBeenCalled();

    vi.resetModules();
    vi.stubEnv('OWNER_WHATSAPP_PHONE', '+9647701234567');
    vi.stubEnv('CALLMEBOT_API_KEY', 'key123');
    const fresh = await import('@/server/notify/owner');
    const ok = vi.fn(async () => new Response('ok'));
    expect(await fresh.notifyOwner('مرحبا', ok as never)).toBe(true);
    expect(String((ok.mock.calls[0] as unknown[])[0])).toContain('phone=9647701234567');
    const broken = vi.fn(async () => {
      throw new Error('network');
    });
    expect(await fresh.notifyOwner('x', broken as never)).toBe(false);
  });
});

describe('owner WhatsApp settings', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('accept the number as people type it, and never stop the site when unusable', async () => {
    for (const [typed, stored] of [
      ['+964 770 123 4567', '9647701234567'],
      ['00964-770-123-4567', '9647701234567'],
      ['0770 123 4567', '9647701234567'],
      ['(964) 7701234567', '9647701234567'],
    ] as const) {
      vi.resetModules();
      vi.stubEnv('OWNER_WHATSAPP_PHONE', typed);
      vi.stubEnv('CALLMEBOT_API_KEY', 'key123');
      const { env } = await import('@/server/env');
      expect(env().OWNER_WHATSAPP_PHONE).toBe(stored);
    }
    vi.resetModules();
    vi.stubEnv('OWNER_WHATSAPP_PHONE', 'my phone');
    vi.stubEnv('CALLMEBOT_API_KEY', '');
    const { env } = await import('@/server/env');
    expect(env().OWNER_WHATSAPP_PHONE).toBeUndefined();
    const { notifyOwner } = await import('@/server/notify/owner');
    expect(await notifyOwner('x', vi.fn() as never)).toBe(false);
  });
});
