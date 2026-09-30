import 'server-only';
import { connection } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { packages, themes } from '@/server/db/schema';
import { findByPreviewToken } from '@/server/orders/drafts';
import { orderFields } from './catalog';

/** Everything the review and edit screens need about a customer's draft, found by its preview token. */
export async function draftByToken(token: string) {
  await connection();
  const inv = await findByPreviewToken(db(), token);
  if (!inv) return null;
  const [row] = await db()
    .select({ theme: themes, pkg: packages })
    .from(themes)
    .innerJoin(packages, eq(packages.id, inv.packageId))
    .where(eq(themes.id, inv.themeId));
  if (!row) return null;
  return {
    status: inv.status,
    locale: inv.locale,
    values: inv.fieldValues,
    featureKeys: inv.featureKeys,
    fields: await orderFields(inv.themeId, inv.sectionId, inv.fieldKeys),
    theme: { key: row.theme.key, name: row.theme.name },
    pkg: { id: row.pkg.id, name: row.pkg.name, priceIqd: row.pkg.priceIqd },
  };
}
