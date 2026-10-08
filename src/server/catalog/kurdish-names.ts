import 'server-only';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { packages, themes, type I18nContent } from '@/server/db/schema';

type Name = { ckb: string; bdn: string; approved: boolean };

/**
 * Kurdish for design and package names typed in Admin, matched by their exact Arabic (or English) text.
 * Only owner-approved lines (docs/translations/KURDISH_REVIEW.md) are used. A name is filled only where
 * its Sorani or Badini is still empty, so anything the owner wrote in Admin is never replaced.
 */
export const KURDISH_NAMES: Record<string, Name> = {
  // Batch 17 — design names
  'علبة الخاتم الزيتونية': { ckb: 'سندوقی ئەڵقەی زەیتوونی', bdn: 'سندوقا ئەنگوستیلا زەیتوونی', approved: true },
  'زاخو بالألوان المائية': { ckb: 'زاخۆ بە ڕەنگی ئاوی', bdn: 'زاخۆ ب ڕەنگێن ئاڤی', approved: true },
  // Batch 17 — package names
  عادي: { ckb: 'ئاسایی', bdn: 'ئاسایی', approved: true },
  مميز: { ckb: 'تایبەت', bdn: 'تایبەت', approved: true },
  'مميز جداً': { ckb: 'زۆر تایبەت', bdn: 'گەلەک تایبەت', approved: true },
  VIP: { ckb: 'VIP', bdn: 'VIP', approved: true },
  VVIP: { ckb: 'VVIP', bdn: 'VVIP', approved: true },
};

/** The name with any missing Kurdish filled from the approved list, or null when nothing changes. */
export function withKurdishName(name: I18nContent, list: Record<string, Name> = KURDISH_NAMES): I18nContent | null {
  if (name.ckb?.trim() && name.bdn?.trim()) return null;
  const k = list[name.ar.trim()] ?? list[name.en.trim()];
  if (!k?.approved) return null;
  return { ...name, ckb: name.ckb?.trim() || k.ckb, bdn: name.bdn?.trim() || k.bdn };
}

/** Run by `pnpm db:seed` on every deploy, after the theme sync. */
export async function addKurdishNames(db: DbOrTx) {
  let filled = 0;
  for (const t of await db.select({ id: themes.id, name: themes.name }).from(themes)) {
    const name = withKurdishName(t.name);
    if (name) {
      await db.update(themes).set({ name }).where(eq(themes.id, t.id));
      filled++;
    }
  }
  for (const p of await db.select({ id: packages.id, name: packages.name }).from(packages)) {
    const name = withKurdishName(p.name);
    if (name) {
      await db.update(packages).set({ name }).where(eq(packages.id, p.id));
      filled++;
    }
  }
  return filled;
}
