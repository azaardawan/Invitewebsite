import 'server-only';
import { createHmac } from 'node:crypto';
import { z } from 'zod';
import { BOTTLE_SIZE_KEYS, DATE_STYLES, DIGIT_STYLES, KIT_FORMATS, KIT_UNITS, type KitFormat, type KitOptions, type KitUnitKey } from '@/catalog/kit';
import { secretKey } from '@/server/env';
import { safeEqual } from '@/lib/crypto';

/** One file to make: which invitation, which unit, which format and options. */
export type KitJob = { invitationId: string; unit: KitUnitKey; format: KitFormat; options: KitOptions };

const jobSchema = z.object({
  invitationId: z.uuid(),
  unit: z.enum(KIT_UNITS),
  format: z.enum(KIT_FORMATS),
  options: z.object({ dateStyle: z.enum(DATE_STYLES), digits: z.enum(DIGIT_STYLES), bottle: z.enum(BOTTLE_SIZE_KEYS as [string, ...string[]]) }),
  exp: z.number().int(),
});

const RENDER_TOKEN_TTL_MS = 5 * 60_000;

function sign(payload: string) {
  return createHmac('sha256', secretKey('TOKEN_SECRET')).update(`kit-render:${payload}`).digest('base64url');
}

/**
 * A short-lived, signed link the file generator's browser opens to draw one
 * file. It is minted on the server for an already-authorized download and
 * grants nothing else.
 */
export function renderToken(job: KitJob, now = new Date()): string {
  const payload = Buffer.from(JSON.stringify({ ...job, exp: now.getTime() + RENDER_TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readRenderToken(token: string, now = new Date()): KitJob | null {
  if (!token || token.length > 2000) return null;
  const [payload, mac] = token.split('.');
  if (!payload || !mac || !safeEqual(mac, sign(payload))) return null;
  try {
    const parsed = jobSchema.safeParse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')));
    if (!parsed.success || parsed.data.exp < now.getTime()) return null;
    const { invitationId, unit, format, options } = parsed.data;
    return { invitationId, unit, format, options: options as KitJob['options'] };
  } catch {
    return null;
  }
}
