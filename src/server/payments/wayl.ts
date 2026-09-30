import 'server-only';
import { z } from 'zod';
import { env } from '@/server/env';

/*
 * WAYL client, written against the official OpenAPI spec
 * (docs/vendor/wayl-openapi.v1.json, fetched from api.thewayl.com/reference).
 * Everything the rest of the platform needs goes through `WaylClient`, so tests
 * and the e2e mock can swap the transport.
 */

export type WaylLink = {
  referenceId: string;
  id: string;
  total: number;
  currency: string;
  status: string;
  url: string;
  completedAt: string | null;
  raw: unknown;
};

export type CreateLinkInput = {
  referenceId: string;
  totalIqd: number;
  env: 'live' | 'test';
  label: string;
  webhookUrl: string;
  webhookSecret: string;
  redirectionUrl: string;
  /** e.g. "2h" (1m–30d). */
  linkExpiresIn: string;
};

export interface WaylClient {
  createLink(input: CreateLinkInput): Promise<WaylLink>;
  /** `null` when WAYL has no link with this reference. */
  getLink(referenceId: string): Promise<WaylLink | null>;
  invalidateIfPending(referenceId: string): Promise<void>;
  verifyAuthKey(): Promise<boolean>;
}

export class WaylError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message);
  }
}

const linkSchema = z.object({
  referenceId: z.string(),
  id: z.string(),
  total: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  currency: z.string(),
  status: z.string(),
  url: z.string().optional().default(''),
  completedAt: z.string().nullable().optional().default(null),
});

const envelope = z.object({ data: linkSchema });

function toLink(json: unknown): WaylLink {
  const parsed = envelope.parse(json);
  return { ...parsed.data, raw: json };
}

/** Link statuses from the spec: Created, Pending, Processing, Complete, Delivered, Cancelled, Rejected, Returned. */
export type LinkOutcome = 'PAID' | 'OPEN' | 'FAILED' | 'RETURNED';
export function linkOutcome(status: string): LinkOutcome {
  switch (status.toLowerCase()) {
    case 'complete':
    case 'delivered':
      return 'PAID';
    case 'cancelled':
    case 'rejected':
      return 'FAILED';
    case 'returned':
      return 'RETURNED';
    default:
      return 'OPEN';
  }
}

export function httpWaylClient(opts: { baseUrl: string; apiKey: string; timeoutMs?: number; fetchImpl?: typeof fetch }): WaylClient {
  const f = opts.fetchImpl ?? fetch;
  async function call(method: string, path: string, body?: unknown) {
    let res: Response;
    try {
      res = await f(`${opts.baseUrl.replace(/\/$/, '')}${path}`, {
        method,
        headers: { 'X-WAYL-AUTHENTICATION': opts.apiKey, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(opts.timeoutMs ?? 15_000),
        cache: 'no-store',
      });
    } catch (e) {
      throw new WaylError(`WAYL unreachable: ${(e as Error).message}`, null);
    }
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* non-JSON error page */
    }
    return { res, json, text };
  }
  return {
    async createLink(i) {
      const { res, json, text } = await call('POST', '/api/v1/links', {
        env: i.env,
        referenceId: i.referenceId,
        total: i.totalIqd,
        currency: 'IQD',
        lineItem: [{ label: i.label.slice(0, 255).padEnd(3, '.'), amount: i.totalIqd, type: 'increase' }],
        webhookUrl: i.webhookUrl,
        webhookSecret: i.webhookSecret,
        redirectionUrl: i.redirectionUrl,
        linkExpiresIn: i.linkExpiresIn,
      });
      if (!res.ok) throw new WaylError(`WAYL create link failed (${res.status}): ${text.slice(0, 300)}`, res.status);
      return toLink(json);
    },
    async getLink(referenceId) {
      const { res, json, text } = await call('GET', `/api/v1/links/${encodeURIComponent(referenceId)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new WaylError(`WAYL get link failed (${res.status}): ${text.slice(0, 300)}`, res.status);
      return toLink(json);
    },
    async invalidateIfPending(referenceId) {
      const { res, text } = await call('POST', `/api/v1/links/${encodeURIComponent(referenceId)}/invalidate-if-pending`);
      if (!res.ok && res.status !== 404) throw new WaylError(`WAYL invalidate failed (${res.status}): ${text.slice(0, 300)}`, res.status);
    },
    async verifyAuthKey() {
      const { res } = await call('GET', '/api/v1/verify-auth-key');
      return res.ok;
    },
  };
}

let override: WaylClient | null = null;

/** Tests inject a fake client here. */
export function setWaylClientForTests(client: WaylClient | null) {
  override = client;
}

/** The configured client, or `null` when online payment isn't set up (no API key). */
export function waylClient(): WaylClient | null {
  if (override) return override;
  const e = env();
  if (!e.WAYL_API_KEY) return null;
  return httpWaylClient({ baseUrl: e.WAYL_API_BASE_URL, apiKey: e.WAYL_API_KEY });
}

export function onlinePaymentsEnabled() {
  return waylClient() !== null;
}
