import 'server-only';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { themePalettes, themeVersions, themes } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import type { ThemeManifest } from '@/theme-sdk/manifest';
import { auditActor, CatalogError, i18nContent, type Actor } from './common';

export type Palette = typeof themePalettes.$inferSelect;

/** Colour slots of the theme's version on sale (the slots a colour set fills). Empty = no colour choice. */
export async function themeColorSlots(db: DbOrTx, themeId: string) {
  const [row] = await db
    .select({ manifest: themeVersions.manifest })
    .from(themes)
    .innerJoin(themeVersions, eq(themeVersions.id, themes.currentVersionId))
    .where(eq(themes.id, themeId));
  return (row?.manifest as ThemeManifest | undefined)?.colors?.slots ?? [];
}

export async function listPalettes(db: DbOrTx, themeId: string, opts: { activeOnly?: boolean } = {}) {
  return db
    .select()
    .from(themePalettes)
    .where(opts.activeOnly ? and(eq(themePalettes.themeId, themeId), eq(themePalettes.status, 'ACTIVE')) : eq(themePalettes.themeId, themeId))
    .orderBy(asc(themePalettes.sortOrder), asc(themePalettes.createdAt));
}

const input = z.object({ name: i18nContent(40), colors: z.record(z.string(), z.string().regex(/^#[0-9a-fA-F]{6}$/)) });

/** A colour set for a theme with colour slots. Only the theme's slots are kept. */
export async function savePalette(db: DbOrTx, themeId: string, raw: unknown, actor: Actor, paletteId?: string) {
  const parsed = input.safeParse(raw);
  if (!parsed.success) throw new CatalogError('invalidInput', parsed.error.issues.map((i) => i.path.join('.')));
  const slots = await themeColorSlots(db, themeId);
  if (!slots.length) throw new CatalogError('noColorSlots');
  const colors = Object.fromEntries(slots.map((s) => [s.key, (parsed.data.colors[s.key] ?? s.default).toLowerCase()]));
  return db.transaction(async (tx) => {
    if (paletteId) {
      const [before] = await tx.select().from(themePalettes).where(and(eq(themePalettes.id, paletteId), eq(themePalettes.themeId, themeId))).for('update');
      if (!before) throw new CatalogError('notFound');
      await tx.update(themePalettes).set({ name: parsed.data.name, colors }).where(eq(themePalettes.id, paletteId));
      await recordAudit(tx, { ...auditActor(actor), action: 'palette.update', objectType: 'theme', objectId: themeId, before: { name: before.name, colors: before.colors }, after: { name: parsed.data.name, colors } });
      return paletteId;
    }
    const existing = await tx.select({ id: themePalettes.id }).from(themePalettes).where(eq(themePalettes.themeId, themeId));
    const [row] = await tx.insert(themePalettes).values({ themeId, name: parsed.data.name, colors, sortOrder: existing.length }).returning({ id: themePalettes.id });
    await recordAudit(tx, { ...auditActor(actor), action: 'palette.create', objectType: 'theme', objectId: themeId, after: { name: parsed.data.name, colors } });
    return row!.id;
  });
}

/** Stops (or restores) offering a colour set. Invitations that chose it keep their colours. */
export async function setPaletteStatus(db: DbOrTx, themeId: string, paletteId: string, status: 'ACTIVE' | 'ARCHIVED', actor: Actor) {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(themePalettes).where(and(eq(themePalettes.id, paletteId), eq(themePalettes.themeId, themeId))).for('update');
    if (!row) throw new CatalogError('notFound');
    if (row.status === status) return;
    await tx.update(themePalettes).set({ status }).where(eq(themePalettes.id, paletteId));
    await recordAudit(tx, { ...auditActor(actor), action: status === 'ARCHIVED' ? 'palette.archive' : 'palette.restore', objectType: 'theme', objectId: themeId, before: { status: row.status }, after: { status } });
  });
}
