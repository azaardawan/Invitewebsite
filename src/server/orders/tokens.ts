import 'server-only';
import { createHmac } from 'node:crypto';
import { secretKey } from '@/server/env';
import { randomToken, sha256 } from '@/lib/crypto';

/** Opaque preview link token for a draft (only its hash is stored). */
export function newPreviewToken() {
  return randomToken(32);
}

export function previewTokenHash(token: string) {
  return sha256(`preview:${token}`);
}

/**
 * Private receipt link token, derived from the order id with a server secret so
 * a repeated checkout request can return the same link without storing it.
 */
export function receiptTokenFor(orderId: string) {
  return createHmac('sha256', secretKey('TOKEN_SECRET')).update(`receipt:${orderId}`).digest('base64url');
}

export function receiptTokenHash(token: string) {
  return sha256(`receipt:${token}`);
}

/**
 * The customer's 10-digit invitation number (e.g. 482 199 3015). Typed on the
 * "My invitation" page it opens their private receipt, with the invitation,
 * card, keepsake and edit links, without an account. Derived from the order
 * id with a server secret (like the receipt link); only its hash is stored.
 */
export function accessCodeFor(orderId: string) {
  const n = createHmac('sha256', secretKey('TOKEN_SECRET')).update(`access:${orderId}`).digest().readBigUInt64BE(0) % 10_000_000_000n;
  return n.toString().padStart(10, '0');
}

export function accessCodeHash(code: string) {
  return sha256(`access:${code}`);
}

/** `4821993015` → `482 199 3015`, for display. */
export function formatAccessCode(code: string) {
  return `${code.slice(0, 3)} ${code.slice(3, 6)} ${code.slice(6)}`;
}

/** What a customer typed (any spacing, Arabic-Indic or Persian digits) → the 10 digits, or null. */
export function normalizeAccessCode(input: string): string | null {
  const digits = input
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, '');
  return digits.length === 10 ? digits : null;
}
