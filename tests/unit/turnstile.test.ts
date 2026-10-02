import { describe, expect, it } from 'vitest';
import { verifyTurnstile } from '@/server/guests/turnstile';

const answer = (body: unknown) => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;

describe('Turnstile bot check', () => {
  it('is off when no secret is configured', async () => {
    expect(await verifyTurnstile(undefined, { secret: '' })).toBe(true);
  });

  it('requires a token Cloudflare accepts', async () => {
    const secret = 'test-secret';
    expect(await verifyTurnstile(undefined, { secret, fetcher: answer({ success: true }) })).toBe(false);
    expect(await verifyTurnstile('tok', { secret, fetcher: answer({ success: true }) })).toBe(true);
    expect(await verifyTurnstile('tok', { secret, fetcher: answer({ success: false }) })).toBe(false);
  });

  it('fails closed when Cloudflare cannot be reached', async () => {
    const down = (async () => {
      throw new Error('network');
    }) as unknown as typeof fetch;
    expect(await verifyTurnstile('tok', { secret: 'test-secret', fetcher: down })).toBe(false);
  });
});
