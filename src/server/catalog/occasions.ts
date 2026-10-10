import 'server-only';
import { and, asc, eq, inArray, or } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { sections, themeExtraSections } from '@/server/db/schema';

/**
 * A design's occasions (section keys): its main one first, then any others it is also sold in (Admin →
 * Themes → "Also sold in"). Only occasions shown on the website.
 */
export async function themeOccasions(db: DbOrTx, themeId: string, mainSectionId: string | null) {
  const extra = db.select({ id: themeExtraSections.sectionId }).from(themeExtraSections).where(eq(themeExtraSections.themeId, themeId));
  const rows = await db
    .select({ id: sections.id, key: sections.key, sortOrder: sections.sortOrder })
    .from(sections)
    .where(and(eq(sections.status, 'ACTIVE'), or(mainSectionId ? eq(sections.id, mainSectionId) : undefined, inArray(sections.id, extra))))
    .orderBy(asc(sections.sortOrder));
  return rows.sort((a, b) => Number(b.id === mainSectionId) - Number(a.id === mainSectionId)).map((r) => r.key);
}

/** The section id for an occasion key, if the design is sold in it. */
export async function occasionSectionId(db: DbOrTx, themeId: string, mainSectionId: string | null, key: string) {
  if (!(await themeOccasions(db, themeId, mainSectionId)).includes(key)) return null;
  const [s] = await db.select({ id: sections.id }).from(sections).where(eq(sections.key, key));
  return s?.id ?? null;
}
