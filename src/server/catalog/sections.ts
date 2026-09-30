import 'server-only';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { assets, fieldDefinitions, sectionDefaultFields, sections, themes } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { FEATURE_KEYS, type FeatureKey } from '@/catalog/features';
import { CatalogError, auditActor, i18nContent, moveInList, optionalI18nContent, type Actor } from './common';

export type SectionRecord = typeof sections.$inferSelect;

export const createSectionInput = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z][a-z0-9-]{1,39}$/),
  name: i18nContent(60),
});

export async function listSections(db: DbOrTx, opts: { includeArchived?: boolean } = {}) {
  const rows = await db
    .select({
      section: sections,
      themeCount: sql<number>`(select count(*)::int from ${themes} where ${themes.sectionId} = ${sections.id})`,
      imageKey: assets.storageKey,
    })
    .from(sections)
    .leftJoin(assets, eq(assets.id, sections.imageAssetId))
    .where(opts.includeArchived ? undefined : eq(sections.status, 'ACTIVE'))
    .orderBy(asc(sections.status), asc(sections.sortOrder), asc(sections.createdAt));
  return rows;
}

export async function getSection(db: DbOrTx, id: string) {
  const [row] = await db.select().from(sections).where(eq(sections.id, id));
  if (!row) throw new CatalogError('notFound');
  const defaults = await db
    .select()
    .from(sectionDefaultFields)
    .where(eq(sectionDefaultFields.sectionId, id))
    .orderBy(asc(sectionDefaultFields.sortOrder));
  return { section: row, defaultFields: defaults };
}

export async function createSection(db: DbOrTx, input: z.input<typeof createSectionInput>, actor: Actor) {
  const data = createSectionInput.parse(input);
  return db.transaction(async (tx) => {
    const [exists] = await tx.select({ id: sections.id }).from(sections).where(eq(sections.key, data.key));
    if (exists) throw new CatalogError('keyTaken');
    const [max] = await tx.select({ n: sql<number>`coalesce(max(${sections.sortOrder}), -1)::int` }).from(sections);
    const [row] = await tx
      .insert(sections)
      .values({ key: data.key, name: data.name, sortOrder: (max?.n ?? -1) + 1 })
      .returning();
    await recordAudit(tx, { ...auditActor(actor), action: 'section.created', objectType: 'section', objectId: row!.id, after: data });
    return row!;
  });
}

export const updateSectionInput = z.object({
  name: i18nContent(60),
  description: optionalI18nContent(300),
  imageAssetId: z.uuid().nullish(),
  requiredFeatures: z.array(z.enum(FEATURE_KEYS as [FeatureKey, ...FeatureKey[]])).max(FEATURE_KEYS.length),
});

export async function updateSection(db: DbOrTx, id: string, input: z.input<typeof updateSectionInput>, actor: Actor) {
  const data = updateSectionInput.parse(input);
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(sections).where(eq(sections.id, id)).for('update');
    if (!before) throw new CatalogError('notFound');
    if (data.imageAssetId) {
      const [a] = await tx.select({ kind: assets.kind }).from(assets).where(eq(assets.id, data.imageAssetId));
      if (a?.kind !== 'IMAGE') throw new CatalogError('invalidAsset');
    }
    const next = {
      name: data.name,
      description: data.description,
      imageAssetId: data.imageAssetId ?? null,
      requiredFeatures: [...new Set(data.requiredFeatures)].sort(),
    };
    await tx.update(sections).set(next).where(eq(sections.id, id));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'section.updated',
      objectType: 'section',
      objectId: id,
      before: { name: before.name, description: before.description, imageAssetId: before.imageAssetId, requiredFeatures: before.requiredFeatures },
      after: next,
    });
  });
}

export const defaultFieldsInput = z
  .array(z.object({ fieldKey: z.string(), label: optionalI18nContent(120) }))
  .max(50);

/** Replaces the section's default fields (order = array order). New themes inherit these. */
export async function setSectionDefaultFields(
  db: DbOrTx,
  sectionId: string,
  input: z.input<typeof defaultFieldsInput>,
  actor: Actor,
) {
  const items = defaultFieldsInput.parse(input);
  const keys = items.map((i) => i.fieldKey);
  if (new Set(keys).size !== keys.length) throw new CatalogError('duplicateField');
  return db.transaction(async (tx) => {
    const [section] = await tx.select({ id: sections.id }).from(sections).where(eq(sections.id, sectionId)).for('update');
    if (!section) throw new CatalogError('notFound');
    if (keys.length) {
      const known = await tx.select({ key: fieldDefinitions.key }).from(fieldDefinitions).where(inArray(fieldDefinitions.key, keys));
      if (known.length !== keys.length) throw new CatalogError('unknownField');
    }
    const before = await tx.select().from(sectionDefaultFields).where(eq(sectionDefaultFields.sectionId, sectionId)).orderBy(asc(sectionDefaultFields.sortOrder));
    await tx.delete(sectionDefaultFields).where(eq(sectionDefaultFields.sectionId, sectionId));
    if (items.length) {
      await tx.insert(sectionDefaultFields).values(items.map((it, i) => ({ sectionId, fieldKey: it.fieldKey, sortOrder: i, label: it.label })));
    }
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'section.default_fields_updated',
      objectType: 'section',
      objectId: sectionId,
      before: before.map((b) => ({ fieldKey: b.fieldKey, label: b.label })),
      after: items,
    });
  });
}

/**
 * Archiving hides a section from new browsing. Existing themes, orders and
 * invitations keep working because nothing is deleted.
 */
export async function setSectionStatus(db: DbOrTx, id: string, status: 'ACTIVE' | 'ARCHIVED', actor: Actor, reason?: string) {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(sections).where(eq(sections.id, id)).for('update');
    if (!before) throw new CatalogError('notFound');
    if (before.status === status) return;
    await tx
      .update(sections)
      .set({ status, archivedAt: status === 'ARCHIVED' ? new Date() : null })
      .where(eq(sections.id, id));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: status === 'ARCHIVED' ? 'section.archived' : 'section.restored',
      objectType: 'section',
      objectId: id,
      before: { status: before.status },
      after: { status },
      reason,
    });
  });
}

export async function moveSection(db: DbOrTx, id: string, direction: 'up' | 'down', actor: Actor) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('sections_order'))`);
    const rows = await tx
      .select({ id: sections.id })
      .from(sections)
      .where(eq(sections.status, 'ACTIVE'))
      .orderBy(asc(sections.sortOrder), asc(sections.createdAt));
    const ids = rows.map((r) => r.id);
    if (!ids.includes(id)) throw new CatalogError('notFound');
    const next = moveInList(ids, id, direction);
    for (const [i, sid] of next.entries()) await tx.update(sections).set({ sortOrder: i }).where(eq(sections.id, sid));
    await recordAudit(tx, { ...auditActor(actor), action: 'section.reordered', objectType: 'section', objectId: id, before: ids, after: next });
  });
}

export async function sectionByKey(db: DbOrTx, key: string) {
  const [row] = await db.select().from(sections).where(and(eq(sections.key, key)));
  return row;
}
