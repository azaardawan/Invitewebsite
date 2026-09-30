import 'server-only';
import { headers } from 'next/headers';
import { sha256 } from '@/lib/crypto';
import { env } from '@/server/env';

export type RequestContext = { ipHash: string | null; userAgent: string | null };

/**
 * Client IP, preferring the header set by our edge (Cloudflare), then the
 * first X-Forwarded-For hop added by the hosting load balancer.
 */
export function clientIpFrom(h: Headers): string | null {
  const cf = h.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || null;
  return h.get('x-real-ip');
}

export function hashIp(ip: string | null): string | null {
  return ip ? sha256(`${env().IP_HASH_SALT}:${ip}`) : null;
}

export async function requestContext(): Promise<RequestContext> {
  const h = await headers();
  return { ipHash: hashIp(clientIpFrom(h)), userAgent: h.get('user-agent')?.slice(0, 300) ?? null };
}
