import 'server-only';
import { z } from 'zod';
import type { I18nContent } from '@/server/db/schema';

export class CatalogError extends Error {
  constructor(
    public readonly code: string,
    public readonly details: string[] = [],
  ) {
    super(details.length ? `${code}: ${details.join('; ')}` : code);
  }
}

export type Actor = { adminId: string | null; ipHash: string | null };

export function auditActor(actor: Actor) {
  return { actorType: actor.adminId ? ('ADMIN' as const) : ('SYSTEM' as const), actorAdminId: actor.adminId, ipHash: actor.ipHash };
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

/** Arabic and English are required; Kurdish is optional and falls back to Arabic when shown. */
export function i18nContent(max: number) {
  return z.object({
    ar: z.string().trim().min(1).max(max),
    en: z.string().trim().min(1).max(max),
    ckb: optionalText(max),
    bdn: optionalText(max),
  });
}

/** Like `i18nContent` but the whole value may be empty (all four blank → null). */
export function optionalI18nContent(max: number) {
  return z
    .object({ ar: optionalText(max), en: optionalText(max), ckb: optionalText(max), bdn: optionalText(max) })
    .nullish()
    .transform((v, ctx): I18nContent | null => {
      if (!v || (!v.ar && !v.en && !v.ckb && !v.bdn)) return null;
      if (!v.ar || !v.en) {
        ctx.addIssue({ code: 'custom', message: 'Arabic and English are required when any language is filled' });
        return z.NEVER;
      }
      return { ar: v.ar, en: v.en, ckb: v.ckb, bdn: v.bdn };
    });
}

/** Pick the text for a website locale, falling back to Arabic. */
export function localized(content: I18nContent | null | undefined, locale: string): string {
  if (!content) return '';
  const value = (content as Record<string, string | null | undefined>)[locale];
  return value || content.ar;
}

/** Returns `ids` with `id` moved one step up/down (no-op at the ends). */
export function moveInList(ids: string[], id: string, direction: 'up' | 'down'): string[] {
  const i = ids.indexOf(id);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return ids;
  const next = [...ids];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}
