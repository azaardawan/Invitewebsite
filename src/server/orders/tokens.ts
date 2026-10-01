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
