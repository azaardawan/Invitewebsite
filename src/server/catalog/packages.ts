import 'server-only';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { packageFeatures, packageFields, packages, sections, themeVersions, themes } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { FEATURE_KEYS, type FeatureKey } from '@/catalog/features';
import { FIELD_KEYS, type FieldKey } from '@/catalog/fields';
import { matchesValidState, type ThemeManifest } from '@/theme-sdk/manifest';
import { CatalogError, auditActor, i18nContent, moveInList, optionalI18nContent, type Actor } from './common';
import { assertStillReady, packagesWithShape } from './themes';

export const MAX_ACTIVE_PACKAGES = 3;

export const packageInput = z.object({
  name: i18nContent(40),
  description: optionalI18nContent(300),
  /** Whole Iraqi dinars. */
  priceIqd: z.coerce.number().int().min(1000).max(100_000_000),
  fieldKeys: z.array(z.enum(FIELD_KEYS as [FieldKey, ...FieldKey[]])).min(1),
  featureKeys: z.array(z.enum(FEATURE_KEYS as [FeatureKey, ...FeatureKey[]])),
});
export type PackageInput = z.input<typeof packageInput>;

/** Locks the theme row and checks the package shape against its current version and section rules. */
async function lockAndValidate(tx: DbOrTx, themeId: string, fields: string[], features: string[]) {
  const [row] = await tx
    .select({ theme: themes, version: themeVersions, section: sections })
    .from(themes)
    .leftJoin(themeVersions, eq(themeVersions.id, themes.currentVersionId))
    .leftJoin(sections, eq(sections.id, themes.sectionId))
    .where(eq(themes.id, themeId))
    .for('update', { of: themes });
  if (!row) throw new CatalogError('notFound');
  if (!row.version) throw new CatalogError('noVersion');
  if (!matchesValidState(row.version.manifest as ThemeManifest, features, fields)) throw new CatalogError('notValidState');
  const missing = (row.section?.requiredFeatures ?? []).filter((r) => !features.includes(r));
  if (missing.length) throw new CatalogError('missingRequiredFeature', missing);
  return row;
}

async function activeCount(tx: DbOrTx, themeId: string, excludeId?: string) {
  const [r] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(packages)
    .where(and(eq(packages.themeId, themeId), eq(packages.status, 'ACTIVE'), excludeId ? ne(packages.id, excludeId) : undefined));
  return r?.n ?? 0;
}

async function writeShape(tx: DbOrTx, packageId: string, fields: string[], features: string[]) {
  await tx.delete(packageFields).where(eq(packageFields.packageId, packageId));
  await tx.delete(packageFeatures).where(eq(packageFeatures.packageId, packageId));
  await tx.insert(packageFields).values(fields.map((fieldKey) => ({ packageId, fieldKey })));
  if (features.length) await tx.insert(packageFeatures).values(features.map((featureKey) => ({ packageId, featureKey })));
}

function snapshot(p: { name: unknown; description: unknown; priceIqd: number }, fields: string[], features: string[]) {
  return { name: p.name, description: p.description, priceIqd: p.priceIqd, fieldKeys: [...fields].sort(), featureKeys: [...features].sort() };
}

export async function createPackage(db: DbOrTx, themeId: string, input: PackageInput, actor: Actor) {
  const data = packageInput.parse(input);
  const fields = [...new Set(data.fieldKeys)];
  const features = [...new Set(data.featureKeys)];
  return db.transaction(async (tx) => {
    await lockAndValidate(tx, themeId, fields, features);
    if ((await activeCount(tx, themeId)) >= MAX_ACTIVE_PACKAGES) throw new CatalogError('tooManyPackages');
    const [max] = await tx
      .select({ n: sql<number>`coalesce(max(${packages.sortOrder}), -1)::int` })
      .from(packages)
      .where(eq(packages.themeId, themeId));
    const [row] = await tx
      .insert(packages)
      .values({ themeId, name: data.name, description: data.description, priceIqd: data.priceIqd, sortOrder: (max?.n ?? -1) + 1 })
      .returning();
    await writeShape(tx, row!.id, fields, features);
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'package.created',
      objectType: 'package',
      objectId: row!.id,
      after: { themeId, ...snapshot(row!, fields, features) },
    });
    return row!;
  });
}

export async function updatePackage(db: DbOrTx, packageId: string, input: PackageInput, actor: Actor) {
  const data = packageInput.parse(input);
  const fields = [...new Set(data.fieldKeys)];
  const features = [...new Set(data.featureKeys)];
  return db.transaction(async (tx) => {
    const [pkg] = await tx.select().from(packages).where(eq(packages.id, packageId));
    if (!pkg) throw new CatalogError('notFound');
    await lockAndValidate(tx, pkg.themeId, fields, features);
    const before = (await packagesWithShape(tx, pkg.themeId)).find((p) => p.id === packageId)!;
    await tx
      .update(packages)
      .set({ name: data.name, description: data.description, priceIqd: data.priceIqd })
      .where(eq(packages.id, packageId));
    await writeShape(tx, packageId, fields, features);
    await assertStillReady(tx, pkg.themeId);
    await recordAudit(tx, {
      ...auditActor(actor),
      // Price changes never alter past orders: orders keep their own snapshot (M5).
      action: before.priceIqd !== data.priceIqd ? 'package.price_changed' : 'package.updated',
      objectType: 'package',
      objectId: packageId,
      before: snapshot(before, before.fieldKeys, before.featureKeys),
      after: snapshot({ ...data, description: data.description }, fields, features),
    });
  });
}

export async function setPackageStatus(db: DbOrTx, packageId: string, status: 'ACTIVE' | 'ARCHIVED', actor: Actor, reason?: string) {
  return db.transaction(async (tx) => {
    const [pkg] = await tx.select().from(packages).where(eq(packages.id, packageId));
    if (!pkg) throw new CatalogError('notFound');
    if (pkg.status === status) return;
    if (status === 'ACTIVE') {
      const shape = (await packagesWithShape(tx, pkg.themeId)).find((p) => p.id === packageId)!;
      await lockAndValidate(tx, pkg.themeId, shape.fieldKeys, shape.featureKeys);
      if ((await activeCount(tx, pkg.themeId, packageId)) >= MAX_ACTIVE_PACKAGES) throw new CatalogError('tooManyPackages');
    } else {
      await tx.select({ id: themes.id }).from(themes).where(eq(themes.id, pkg.themeId)).for('update');
    }
    await tx.update(packages).set({ status }).where(eq(packages.id, packageId));
    await assertStillReady(tx, pkg.themeId);
    await recordAudit(tx, {
      ...auditActor(actor),
      action: status === 'ARCHIVED' ? 'package.archived' : 'package.restored',
      objectType: 'package',
      objectId: packageId,
      before: { status: pkg.status },
      after: { status },
      reason,
    });
  });
}

export async function movePackage(db: DbOrTx, packageId: string, direction: 'up' | 'down', actor: Actor) {
  return db.transaction(async (tx) => {
    const [pkg] = await tx.select().from(packages).where(eq(packages.id, packageId));
    if (!pkg) throw new CatalogError('notFound');
    await tx.select({ id: themes.id }).from(themes).where(eq(themes.id, pkg.themeId)).for('update');
    const rows = await tx
      .select({ id: packages.id })
      .from(packages)
      .where(and(eq(packages.themeId, pkg.themeId), eq(packages.status, 'ACTIVE')))
      .orderBy(asc(packages.sortOrder), asc(packages.createdAt));
    const ids = rows.map((r) => r.id);
    const next = moveInList(ids, packageId, direction);
    for (const [i, id] of next.entries()) await tx.update(packages).set({ sortOrder: i }).where(eq(packages.id, id));
    await recordAudit(tx, { ...auditActor(actor), action: 'package.reordered', objectType: 'package', objectId: packageId, before: ids, after: next });
  });
}
