import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { fieldDefinitions, sections, themeVersions, themes } from '@/server/db/schema';
import { packagesWithShape } from '@/server/catalog/themes';
import type { FieldDef } from './validation';

export class OrderError extends Error {
  constructor(
    public readonly code:
      | 'notAvailable'
      | 'invalidFields'
      | 'previewExpired'
      | 'notFound'
      | 'locked'
      | 'termsRequired'
      | 'invalidCustomer'
      | 'packageChanged'
      | 'rateLimited'
      | 'refunded',
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(code);
  }
}

/** Public invitations stay live for this long after publication (owner decision, rev. 2). */
export const INVITATION_LIFETIME_DAYS = 30;
/** A draft's preview link stays valid this long after the last edit (decision J). */
export const PREVIEW_TTL_MS = 24 * 3600_000;


/** A theme + package that can be bought right now, with everything needed to validate an order. */
export async function loadPurchasable(db: DbOrTx, themeKey: string, packageId: string) {
  const [row] = await db
    .select({ theme: themes, version: themeVersions, section: sections })
    .from(themes)
    .innerJoin(themeVersions, eq(themeVersions.id, themes.currentVersionId))
    .leftJoin(sections, eq(sections.id, themes.sectionId))
    .where(eq(themes.key, themeKey));
  if (!row || row.theme.status !== 'ACTIVE' || row.section?.status !== 'ACTIVE' || !row.version.inBuild) {
    throw new OrderError('notAvailable');
  }
  const pkg = (await packagesWithShape(db, row.theme.id)).find((p) => p.id === packageId && p.status === 'ACTIVE');
  if (!pkg) throw new OrderError('notAvailable');
  return { ...row, pkg, defs: await fieldDefs(db, pkg.fieldKeys) };
}

export async function fieldDefs(db: DbOrTx, keys: readonly string[]): Promise<Map<string, FieldDef>> {
  if (!keys.length) return new Map();
  const rows = await db.select().from(fieldDefinitions).where(and(inArray(fieldDefinitions.key, [...keys])));
  return new Map(rows.map((r) => [r.key, { type: r.type, maxLength: r.maxLength }]));
}

export function sameSet(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((x) => b.includes(x));
}
