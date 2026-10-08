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
