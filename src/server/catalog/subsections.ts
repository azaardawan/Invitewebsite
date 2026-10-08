import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { sections, subsections } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { auditActor, CatalogError, i18nContent, moveInList, optionalI18nContent, type Actor } from './common';

export type SubsectionRecord = typeof subsections.$inferSelect;

/** A section's subsections in their order (archived last), with how many themes each holds. */
export async function listSubsections(db: DbOrTx, sectionId: string, opts: { activeOnly?: boolean } = {}) {
  return db
    .select({
      subsection: subsections,
      // Spelled out: without a join the query builder leaves column names unqualified (ambiguous "id").
      themeCount: sql<number>`(select count(*)::int from "themes" t where t."subsection_id" = "subsections"."id")`,
    })
    .from(subsections)
    .where(opts.activeOnly ? and(eq(subsections.sectionId, sectionId), eq(subsections.status, 'ACTIVE')) : eq(subsections.sectionId, sectionId))
    .orderBy(asc(subsections.status), asc(subsections.sortOrder), asc(subsections.createdAt));
}

const createInput = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z][a-z0-9-]{1,39}$/),
  name: i18nContent(60),
});

export async function createSubsection(db: DbOrTx, sectionId: string, input: z.input<typeof createInput>, actor: Actor) {
  const data = createInput.parse(input);
  return db.transaction(async (tx) => {
    const [section] = await tx.select({ id: sections.id }).from(sections).where(eq(sections.id, sectionId));
    if (!section) throw new CatalogError('notFound');
    const [exists] = await tx.select({ id: subsections.id }).from(subsections).where(and(eq(subsections.sectionId, sectionId), eq(subsections.key, data.key)));
    if (exists) throw new CatalogError('keyTaken');
    const [max] = await tx.select({ n: sql<number>`coalesce(max(${subsections.sortOrder}), -1)::int` }).from(subsections).where(eq(subsections.sectionId, sectionId));
    const [row] = await tx.insert(subsections).values({ sectionId, key: data.key, name: data.name, sortOrder: (max?.n ?? -1) + 1 }).returning();
    await recordAudit(tx, { ...auditActor(actor), action: 'subsection.created', objectType: 'section', objectId: sectionId, after: { subsectionId: row!.id, ...data } });
    return row!;
  });
}

const updateInput = z.object({ name: i18nContent(60), description: optionalI18nContent(300) });

export async function updateSubsection(db: DbOrTx, id: string, input: z.input<typeof updateInput>, actor: Actor) {
  const data = updateInput.parse(input);
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(subsections).where(eq(subsections.id, id)).for('update');
    if (!before) throw new CatalogError('notFound');
    await tx.update(subsections).set({ name: data.name, description: data.description }).where(eq(subsections.id, id));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'subsection.updated',
      objectType: 'section',
      objectId: before.sectionId,
      before: { subsectionId: id, name: before.name, description: before.description },
      after: { subsectionId: id, ...data },
    });
  });
}

/** Hides (or shows again) a subsection on the website. Its themes stay on sale, listed with the section. */
export async function setSubsectionStatus(db: DbOrTx, id: string, status: 'ACTIVE' | 'ARCHIVED', actor: Actor) {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(subsections).where(eq(subsections.id, id)).for('update');
    if (!row) throw new CatalogError('notFound');
    if (row.status === status) return;
    await tx.update(subsections).set({ status }).where(eq(subsections.id, id));
    await recordAudit(tx, { ...auditActor(actor), action: status === 'ARCHIVED' ? 'subsection.archived' : 'subsection.restored', objectType: 'section', objectId: row.sectionId, before: { subsectionId: id, status: row.status }, after: { subsectionId: id, status } });
  });
}

export async function moveSubsection(db: DbOrTx, id: string, direction: 'up' | 'down', actor: Actor) {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(subsections).where(eq(subsections.id, id));
    if (!row) throw new CatalogError('notFound');
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${'subsections_order:' + row.sectionId}))`);
    const rows = await tx
      .select({ id: subsections.id })
      .from(subsections)
      .where(and(eq(subsections.sectionId, row.sectionId), eq(subsections.status, 'ACTIVE')))
      .orderBy(asc(subsections.sortOrder), asc(subsections.createdAt));
    const ids = rows.map((r) => r.id);
    if (!ids.includes(id)) throw new CatalogError('notFound');
    const next = moveInList(ids, id, direction);
    for (const [i, sid] of next.entries()) await tx.update(subsections).set({ sortOrder: i }).where(eq(subsections.id, sid));
    await recordAudit(tx, { ...auditActor(actor), action: 'subsection.reordered', objectType: 'section', objectId: row.sectionId, before: ids, after: next });
  });
}
