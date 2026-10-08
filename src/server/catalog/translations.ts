import 'server-only';
import { asc, ne } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { fieldDefinitions, packages, sectionDefaultFields, sections, subsections, themeFields, themes, type I18nContent } from '@/server/db/schema';
import { getSettings } from '@/server/settings/service';

export type MissingTranslation = { kind: 'theme' | 'package' | 'section' | 'subsection' | 'field' | 'contact' | 'payment'; name: string; href: string };

/** True when a written text lacks Sorani or Badini (an empty optional text needs nothing). */
function lacksKurdish(v: I18nContent | null | undefined) {
  return Boolean(v && (v.ar || v.en) && (!v.ckb?.trim() || !v.bdn?.trim()));
}

/**
 * Owner-written texts that Kurdish visitors would otherwise see in Arabic:
 * design, package and occasion names/descriptions, field labels and contact
 * details. Shown on the dashboard until every one has both Kurdish dialects.
 */
export async function missingKurdish(db: DbOrTx): Promise<MissingTranslation[]> {
  const [themeRows, packageRows, sectionRows, fieldRows, sectionFieldRows, themeFieldRows, settings, subRows] = await Promise.all([
    db.select().from(themes).where(ne(themes.status, 'ARCHIVED')).orderBy(asc(themes.sortOrder)),
    db.select().from(packages).where(ne(packages.status, 'ARCHIVED')).orderBy(asc(packages.sortOrder)),
    db.select().from(sections).where(ne(sections.status, 'ARCHIVED')).orderBy(asc(sections.sortOrder)),
    db.select().from(fieldDefinitions),
    db.select().from(sectionDefaultFields),
    db.select().from(themeFields),
    getSettings(db),
    db.select().from(subsections).where(ne(subsections.status, 'ARCHIVED')).orderBy(asc(subsections.sortOrder)),
  ]);
  const out: MissingTranslation[] = [];
  const themeById = new Map(themeRows.map((t) => [t.id, t]));
  for (const t of themeRows) {
    const fieldsLack = themeFieldRows.some((f) => f.themeId === t.id && lacksKurdish(f.label));
    if (lacksKurdish(t.name) || lacksKurdish(t.description) || fieldsLack) out.push({ kind: 'theme', name: t.name.en, href: `/admin/themes/${t.id}` });
  }
  for (const p of packageRows) {
    const t = themeById.get(p.themeId);
    if (t && (lacksKurdish(p.name) || lacksKurdish(p.description))) out.push({ kind: 'package', name: `${t.name.en} · ${p.name.en}`, href: `/admin/themes/${t.id}` });
  }
  for (const s of sectionRows) {
    const fieldsLack = sectionFieldRows.some((f) => f.sectionId === s.id && lacksKurdish(f.label));
    if (lacksKurdish(s.name) || lacksKurdish(s.description) || fieldsLack) out.push({ kind: 'section', name: s.name.en, href: `/admin/sections/${s.id}` });
  }
  const sectionById = new Map(sectionRows.map((x) => [x.id, x]));
  for (const sub of subRows) {
    const parent = sectionById.get(sub.sectionId);
    if (parent && (lacksKurdish(sub.name) || lacksKurdish(sub.description))) out.push({ kind: 'subsection', name: `${parent.name.en} · ${sub.name.en}`, href: `/admin/sections/${parent.id}` });
  }
  for (const f of fieldRows) if (lacksKurdish(f.label)) out.push({ kind: 'field', name: f.label.en, href: '/admin/fields' });
  if (lacksKurdish(settings.contact.address) || lacksKurdish(settings.contact.hours)) out.push({ kind: 'contact', name: '', href: '/admin/settings' });
  if (lacksKurdish(settings.payment.manualInstructions)) out.push({ kind: 'payment', name: '', href: '/admin/settings' });
  return out;
}
