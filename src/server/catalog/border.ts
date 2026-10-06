import 'server-only';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { assets, themes } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { publicMediaUrl } from '@/server/storage';
import type { ThemeBorderSpec } from '@/theme-sdk/border';
import { CatalogError, auditActor, type Actor } from './common';

/** The owner's replacement border for a theme, or null when the theme uses its own artwork. */
export async function themeBorder(db: DbOrTx, themeId: string): Promise<ThemeBorderSpec | null> {
  const [row] = await db
    .select({ style: themes.borderStyle, key: assets.storageKey })
    .from(themes)
    .innerJoin(assets, eq(assets.id, themes.borderAssetId))
    .where(eq(themes.id, themeId));
  if (!row?.style) return null;
  return { kind: row.style.kind, size: row.style.size, src: publicMediaUrl(row.key) };
}

export const themeBorderInput = z.object({
  /** null = go back to the theme's own border. */
  assetId: z.uuid().nullable(),
  kind: z.enum(['strips', 'corners']),
  /** px on a 390 px phone (print: 0.25 mm per px). */
  size: z.coerce.number().int().min(8).max(300),
});

/** Replaces (or restores) the border used on a theme's invitations, cards and keepsakes. Audited. */
export async function updateThemeBorder(db: DbOrTx, themeId: string, input: z.input<typeof themeBorderInput>, actor: Actor) {
  const data = themeBorderInput.parse(input);
  await db.transaction(async (tx) => {
    const [before] = await tx.select().from(themes).where(eq(themes.id, themeId)).for('update');
    if (!before) throw new CatalogError('notFound');
    if (data.assetId) {
      const [a] = await tx.select({ kind: assets.kind }).from(assets).where(eq(assets.id, data.assetId));
      if (a?.kind !== 'IMAGE') throw new CatalogError('invalidAsset');
    }
    const next = { borderAssetId: data.assetId, borderStyle: data.assetId ? { kind: data.kind, size: data.size } : null };
    await tx.update(themes).set(next).where(eq(themes.id, themeId));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'theme.border_updated',
      objectType: 'theme',
      objectId: themeId,
      before: { borderAssetId: before.borderAssetId, borderStyle: before.borderStyle },
      after: next,
    });
  });
}
