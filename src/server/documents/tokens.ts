import 'server-only';
import { createHmac } from 'node:crypto';
import { secretKey } from '@/server/env';
import { safeEqual } from '@/lib/crypto';

export type DocumentKind = 'card' | 'keepsake';
/** What the print page renders: the stored documents, plus the card with its bleed for print shops. */
export type RenderKind = DocumentKind | 'cardBleed';

const sign = (payload: string) => createHmac('sha256', secretKey('TOKEN_SECRET')).update(`print:${payload}`).digest('base64url');

/**
 * Short-lived link for the internal print page that Chromium turns into a PDF.
 * The print page shows unpaid/private data, so it opens only with this token.
 */
export function printToken(kind: RenderKind, invitationId: string, ttlSeconds = 300, now = Date.now()): string {
  const payload = `${kind}.${invitationId}.${Math.floor(now / 1000) + ttlSeconds}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyPrintToken(token: string, now = Date.now()): { kind: RenderKind; invitationId: string } | null {
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [kind, invitationId, exp, sig] = parts as [string, string, string, string];
  if ((kind !== 'card' && kind !== 'cardBleed' && kind !== 'keepsake') || !/^\d+$/.test(exp)) return null;
  if (!safeEqual(sig, sign(`${kind}.${invitationId}.${exp}`))) return null;
  if (Number(exp) * 1000 < now) return null;
  return { kind, invitationId };
}
