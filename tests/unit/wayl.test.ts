import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { httpWaylClient, linkOutcome, WaylError } from '@/server/payments/wayl';
import { validWebhookSignature } from '@/server/payments/service';

type Call = { url: string; init: RequestInit };
function stubFetch(status: number, body: unknown) {
  const calls: Call[] = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { f, calls };
}

const linkBody = { data: { referenceId: 'ORD-AAAA1111-1', id: 'l1', total: '35000', currency: 'IQD', status: 'Created', url: 'https://link.thewayl.com/pay/x', completedAt: null }, message: 'ok' };

describe('WAYL HTTP client (per the official OpenAPI spec)', () => {
  it('creates links with the merchant key header and the documented body', async () => {
    const { f, calls } = stubFetch(201, linkBody);
    const c = httpWaylClient({ baseUrl: 'https://api.thewayl.com/', apiKey: 'k_test', fetchImpl: f });
    const link = await c.createLink({
      referenceId: 'ORD-AAAA1111-1',
      totalIqd: 35000,
      env: 'test',
      label: 'Theme · Package',
      webhookUrl: 'https://bahjaaa.com/api/webhooks/wayl',
      webhookSecret: 'secret-secret',
      redirectionUrl: 'https://bahjaaa.com/r/tok?paid=1',
      linkExpiresIn: '2h',
    });
    expect(link).toMatchObject({ referenceId: 'ORD-AAAA1111-1', total: 35000, status: 'Created', url: 'https://link.thewayl.com/pay/x' });
    expect(calls[0]!.url).toBe('https://api.thewayl.com/api/v1/links');
    expect((calls[0]!.init.headers as Record<string, string>)['X-WAYL-AUTHENTICATION']).toBe('k_test');
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({
      env: 'test',
      referenceId: 'ORD-AAAA1111-1',
      total: 35000,
      currency: 'IQD',
      lineItem: [{ label: 'Theme · Package', amount: 35000, type: 'increase' }],
      webhookUrl: 'https://bahjaaa.com/api/webhooks/wayl',
      webhookSecret: 'secret-secret',
      redirectionUrl: 'https://bahjaaa.com/r/tok?paid=1',
      linkExpiresIn: '2h',
    });
  });

  it('reads a link by reference; 404 means none', async () => {
    const ok = stubFetch(200, linkBody);
    expect(await httpWaylClient({ baseUrl: 'https://x', apiKey: 'k', fetchImpl: ok.f }).getLink('ORD-AAAA1111-1')).toMatchObject({ total: 35000 });
    expect(ok.calls[0]!.url).toBe('https://x/api/v1/links/ORD-AAAA1111-1');
    const missing = stubFetch(404, { message: 'not found' });
    expect(await httpWaylClient({ baseUrl: 'https://x', apiKey: 'k', fetchImpl: missing.f }).getLink('nope')).toBeNull();
  });

  it('errors carry the HTTP status (null when unreachable)', async () => {
    const bad = stubFetch(422, 'bad');
    await expect(httpWaylClient({ baseUrl: 'https://x', apiKey: 'k', fetchImpl: bad.f }).getLink('r')).rejects.toMatchObject({ status: 422 });
    const down = (async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    const err = await httpWaylClient({ baseUrl: 'https://x', apiKey: 'k', fetchImpl: down }).getLink('r').catch((e) => e);
    expect(err).toBeInstanceOf(WaylError);
    expect(err.status).toBeNull();
  });

  it('maps WAYL statuses to outcomes', () => {
    expect(['Complete', 'Delivered'].map(linkOutcome)).toEqual(['PAID', 'PAID']);
    expect(['Created', 'Pending', 'Processing'].map(linkOutcome)).toEqual(['OPEN', 'OPEN', 'OPEN']);
    expect(['Cancelled', 'Rejected'].map(linkOutcome)).toEqual(['FAILED', 'FAILED']);
    expect(linkOutcome('Returned')).toBe('RETURNED');
  });

  it('webhook signatures are HMAC-SHA256 of the raw body, compared in constant time', () => {
    const raw = Buffer.from('{"referenceId":"R-1"}');
    const sig = createHmac('sha256', 'the-secret').update(raw).digest('hex');
    expect(validWebhookSignature(raw, sig, 'the-secret')).toBe(true);
    expect(validWebhookSignature(raw, `sha256=${sig}`, 'the-secret')).toBe(true);
    expect(validWebhookSignature(raw, sig, 'other-secret')).toBe(false);
    expect(validWebhookSignature(Buffer.from('{"referenceId":"R-2"}'), sig, 'the-secret')).toBe(false);
    expect(validWebhookSignature(raw, null, 'the-secret')).toBe(false);
  });
});
