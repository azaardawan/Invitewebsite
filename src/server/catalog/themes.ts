import 'server-only';
import { and, asc, eq, ilike, inArray, ne, notInArray, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import {
  assets,
  fieldDefinitions,
  musicTracks,
  packageFeatures,
  packageFields,
  packages,
  sectionDefaultFields,
  sections,
  themeFields,
  themeVersions,
  themes,
  subsections,
} from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { env } from '@/server/env';
import { sha256 } from '@/lib/crypto';
import { codeRef, packageShapeProblems, type ThemeManifest } from '@/theme-sdk/manifest';
import { CatalogError, auditActor, i18nContent, localized, moveInList, optionalI18nContent, type Actor } from './common';
import { themeKeyByNumber } from '@/theme-registry';

export type ThemeStatus = (typeof themes.$inferSelect)['status'];

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function manifestHash(m: ThemeManifest) {
  return sha256(stableStringify(m));
}

export type SyncReport = { registeredThemes: string[]; registeredVersions: string[]; updatedVersions: string[]; conflicts: string[]; missing: string[] };

/**
 * Registers theme versions found in the deployed code (src/theme-registry).
 * New themes start in DEVELOPMENT and are never visible to customers until
 * activated. A frozen (activated) version's manifest can never change: that
 * is reported as a conflict and the stored manifest is kept.
 */
export async function syncThemesFromRegistry(
  db: DbOrTx,
  manifests: ThemeManifest[],
  actor: Actor,
  /** The full build registry marks absent versions as missing; a partial list (tests) must not. */
  opts: { complete?: boolean } = { complete: true },
): Promise<SyncReport> {
  const report: SyncReport = { registeredThemes: [], registeredVersions: [], updatedVersions: [], conflicts: [], missing: [] };
  const byKey = new Map<string, ThemeManifest[]>();
  for (const m of manifests) byKey.set(m.key, [...(byKey.get(m.key) ?? []), m].sort((a, b) => a.version - b.version));

  for (const [key, versions] of byKey) {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`theme:${key}`}))`);
      let [theme] = await tx.select().from(themes).where(eq(themes.key, key));
      const first = versions[0]!;
      if (!theme) {
        const [section] = await tx.select().from(sections).where(eq(sections.key, first.sections[0]!));
        const [max] = await tx
          .select({ n: sql<number>`coalesce(max(${themes.sortOrder}), -1)::int` })
          .from(themes)
          .where(section ? eq(themes.sectionId, section.id) : sql`${themes.sectionId} is null`);
        [theme] = await tx
          .insert(themes)
          .values({ key, name: { ...first.title, ckb: null, bdn: null }, sectionId: section?.id ?? null, sortOrder: (max?.n ?? -1) + 1 })
          .returning();
        report.registeredThemes.push(key);
        await recordAudit(tx, { ...auditActor(actor), action: 'theme.registered', objectType: 'theme', objectId: theme!.id, after: { key } });
      }
      const t = theme!;

      for (const m of versions) {
        const ref = codeRef(m);
        const hash = manifestHash(m);
        const [existing] = await tx.select().from(themeVersions).where(eq(themeVersions.codeRef, ref));
        if (!existing) {
          await tx.insert(themeVersions).values({ themeId: t.id, version: m.version, codeRef: ref, manifest: m, manifestHash: hash });
          report.registeredVersions.push(ref);
          await recordAudit(tx, { ...auditActor(actor), action: 'theme_version.registered', objectType: 'theme', objectId: t.id, after: { codeRef: ref } });
        } else if (existing.manifestHash !== hash) {
          if (existing.frozenAt) {
            report.conflicts.push(ref);
          } else {
            await tx.update(themeVersions).set({ manifest: m, manifestHash: hash, inBuild: true }).where(eq(themeVersions.id, existing.id));
            report.updatedVersions.push(ref);
            await recordAudit(tx, {
              ...auditActor(actor),
              action: 'theme_version.manifest_updated',
              objectType: 'theme',
              objectId: t.id,
              before: existing.manifest,
              after: m,
            });
          }
        } else if (!existing.inBuild) {
          await tx.update(themeVersions).set({ inBuild: true }).where(eq(themeVersions.id, existing.id));
        }
      }

      if (!t.currentVersionId) {
        const [v] = await tx.select().from(themeVersions).where(eq(themeVersions.codeRef, codeRef(versions.at(-1)!)));
        await tx.update(themes).set({ currentVersionId: v!.id }).where(eq(themes.id, t.id));
      }

      // Every field any version renders gets a theme-level entry (order + label override).
      const allFields = [...new Set(versions.flatMap((v) => v.fields))];
      const existingFields = await tx.select().from(themeFields).where(eq(themeFields.themeId, t.id));
      const have = new Set(existingFields.map((f) => f.fieldKey));
      const missing = allFields.filter((f) => !have.has(f));
      if (missing.length) {
        const sectionOrder = t.sectionId
          ? (await tx.select().from(sectionDefaultFields).where(eq(sectionDefaultFields.sectionId, t.sectionId))).map((d) => d.fieldKey)
          : [];
        const ordered = [...sectionOrder.filter((k) => missing.includes(k as never)), ...missing.filter((k) => !sectionOrder.includes(k))];
        const start = existingFields.length;
        await tx
          .insert(themeFields)
          .values(ordered.map((fieldKey, i) => ({ themeId: t.id, fieldKey, sortOrder: start + i })))
          .onConflictDoNothing();
      }
    });
  }

  if (opts.complete === false) return report;
  const present = manifests.map(codeRef);
  const gone = await db
    .update(themeVersions)
    .set({ inBuild: false })
    .where(and(eq(themeVersions.inBuild, true), present.length ? notInArray(themeVersions.codeRef, present) : undefined))
    .returning({ codeRef: themeVersions.codeRef });
  report.missing = gone.map((g) => g.codeRef);
  return report;
}

export async function listThemes(
  db: DbOrTx,
  filters: { search?: string; sectionId?: string; status?: ThemeStatus } = {},
) {
  const where: SQL[] = [];
  if (filters.sectionId) where.push(eq(themes.sectionId, filters.sectionId));
  if (filters.status) where.push(eq(themes.status, filters.status));
  if (filters.search) {
    const q = `%${filters.search.replace(/[%_\\]/g, '\\$&')}%`;
    // "7" or "#7" also finds theme number 7.
    const byNumber = /^#?\d{1,5}$/.test(filters.search.trim()) ? themeKeyByNumber(Number(filters.search.trim().replace('#', ''))) : undefined;
    where.push(or(ilike(themes.key, q), sql`${themes.name}->>'ar' ilike ${q}`, sql`${themes.name}->>'en' ilike ${q}`, byNumber ? eq(themes.key, byNumber) : undefined)!);
  }
  return db
    .select({
      theme: themes,
      sectionName: sections.name,
      sectionStatus: sections.status,
      versionRef: themeVersions.codeRef,
      musicTitle: musicTracks.title,
      coverKey: assets.storageKey,
      activePackages: sql<number>`(select count(*)::int from ${packages} where ${packages.themeId} = ${themes.id} and ${packages.status} = 'ACTIVE')`,
      minPrice: sql<number | null>`(select min(${packages.priceIqd})::bigint from ${packages} where ${packages.themeId} = ${themes.id} and ${packages.status} = 'ACTIVE')`,
    })
    .from(themes)
    .leftJoin(sections, eq(sections.id, themes.sectionId))
    .leftJoin(themeVersions, eq(themeVersions.id, themes.currentVersionId))
    .leftJoin(musicTracks, eq(musicTracks.id, themes.musicTrackId))
    .leftJoin(assets, eq(assets.id, themes.coverAssetId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(sections.sortOrder), asc(themes.status), asc(themes.sortOrder), asc(themes.createdAt));
}

export async function packagesWithShape(db: DbOrTx, themeId: string) {
  const rows = await db.select().from(packages).where(eq(packages.themeId, themeId)).orderBy(asc(packages.status), asc(packages.sortOrder));
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [f, x] = await Promise.all([
    db.select().from(packageFields).where(inArray(packageFields.packageId, ids)),
    db.select().from(packageFeatures).where(inArray(packageFeatures.packageId, ids)),
  ]);
  return rows.map((p) => ({
    ...p,
    fieldKeys: f.filter((r) => r.packageId === p.id).map((r) => r.fieldKey).sort(),
    featureKeys: x.filter((r) => r.packageId === p.id).map((r) => r.featureKey).sort(),
  }));
}

export type ReadinessProblem = { code: string; subject?: string };

/** Everything that must be true before a theme can be reviewed or sold. */
export async function themeReadiness(db: DbOrTx, themeId: string): Promise<ReadinessProblem[]> {
  const [row] = await db
    .select({ theme: themes, section: sections, version: themeVersions, music: musicTracks })
    .from(themes)
    .leftJoin(sections, eq(sections.id, themes.sectionId))
    .leftJoin(themeVersions, eq(themeVersions.id, themes.currentVersionId))
    .leftJoin(musicTracks, eq(musicTracks.id, themes.musicTrackId))
    .where(eq(themes.id, themeId));
  if (!row) throw new CatalogError('notFound');
  const problems: ReadinessProblem[] = [];
  if (!row.section) problems.push({ code: 'noSection' });
  else if (row.section.status !== 'ACTIVE') problems.push({ code: 'sectionArchived' });
  if (!row.version) problems.push({ code: 'noVersion' });
  else if (!row.version.inBuild) problems.push({ code: 'versionNotInBuild', subject: row.version.codeRef });
  if (!row.theme.coverAssetId) problems.push({ code: 'noCover' });

  const active = (await packagesWithShape(db, themeId)).filter((p) => p.status === 'ACTIVE');
  if (!active.length) problems.push({ code: 'noPackages' });
  const manifest = row.version?.manifest as ThemeManifest | undefined;
  const required = row.section?.requiredFeatures ?? [];
  for (const p of active) {
    const name = localized(p.name, 'en');
    if (manifest && packageShapeProblems(manifest, p.featureKeys, p.fieldKeys).length > 0) problems.push({ code: 'packageInvalid', subject: name });
    for (const r of required) if (!p.featureKeys.includes(r)) problems.push({ code: 'packageMissingRequired', subject: `${name}: ${r}` });
  }
  if (active.some((p) => p.featureKeys.includes('music'))) {
    if (!row.music) problems.push({ code: 'noMusic' });
    else if (row.music.status !== 'ACTIVE') problems.push({ code: 'musicArchived' });
  }
  return problems;
}

/** Called after edits to a theme that is live or under review, so an edit can't silently break it. */
export async function assertStillReady(tx: DbOrTx, themeId: string) {
  const [t] = await tx.select({ status: themes.status }).from(themes).where(eq(themes.id, themeId));
  if (t && (t.status === 'ACTIVE' || t.status === 'READY_FOR_REVIEW')) {
    const problems = await themeReadiness(tx, themeId);
    if (problems.length) throw new CatalogError('wouldBreakTheme', problems.map((p) => (p.subject ? `${p.code} (${p.subject})` : p.code)));
  }
}

/** Allowed lifecycle moves and the permission each needs. */
export const THEME_TRANSITIONS: Record<ThemeStatus, Partial<Record<ThemeStatus, 'themes.manage' | 'themes.activate'>>> = {
  DEVELOPMENT: { READY_FOR_REVIEW: 'themes.manage', ARCHIVED: 'themes.manage' },
  READY_FOR_REVIEW: { DEVELOPMENT: 'themes.manage', ACTIVE: 'themes.activate' },
  ACTIVE: { ARCHIVED: 'themes.activate' },
  ARCHIVED: { ACTIVE: 'themes.activate', DEVELOPMENT: 'themes.manage' },
};

export async function transitionTheme(db: DbOrTx, themeId: string, to: ThemeStatus, actor: Actor, reason?: string) {
  return db.transaction(async (tx) => {
    const [theme] = await tx.select().from(themes).where(eq(themes.id, themeId)).for('update');
    if (!theme) throw new CatalogError('notFound');
    if (!THEME_TRANSITIONS[theme.status][to]) throw new CatalogError('invalidTransition', [`${theme.status} → ${to}`]);

    if (to === 'READY_FOR_REVIEW' || to === 'ACTIVE') {
      const problems = await themeReadiness(tx, themeId);
      if (problems.length) throw new CatalogError('notReady', problems.map((p) => (p.subject ? `${p.code} (${p.subject})` : p.code)));
    }
    if (to === 'ACTIVE') {
      const [version] = await tx.select().from(themeVersions).where(eq(themeVersions.id, theme.currentVersionId!));
      if ((version!.manifest as ThemeManifest).internal && env().APP_ENV !== 'development') {
        throw new CatalogError('internalTheme');
      }
      // From now on this version's code/manifest must never change (existing customers rely on it).
      if (!version!.frozenAt) await tx.update(themeVersions).set({ frozenAt: new Date() }).where(eq(themeVersions.id, version!.id));
    }
    await tx
      .update(themes)
      .set({ status: to, archivedAt: to === 'ARCHIVED' ? new Date() : null })
      .where(eq(themes.id, themeId));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: `theme.status_changed`,
      objectType: 'theme',
      objectId: themeId,
      before: { status: theme.status },
      after: { status: to },
      reason,
    });
  });
}

export const themeSettingsInput = z.object({
  name: i18nContent(60),
  description: optionalI18nContent(500),
  sectionId: z.uuid().nullish(),
  /** A subsection of the same section; omitted keeps the current one (cleared if the section changes). */
  subsectionId: z.uuid().nullish(),
  coverAssetId: z.uuid().nullish(),
  musicTrackId: z.uuid().nullish(),
});

export async function updateThemeSettings(db: DbOrTx, themeId: string, input: z.input<typeof themeSettingsInput>, actor: Actor) {
  const data = themeSettingsInput.parse(input);
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(themes).where(eq(themes.id, themeId)).for('update');
    if (!before) throw new CatalogError('notFound');
    if (data.coverAssetId) {
      const [a] = await tx.select({ kind: assets.kind }).from(assets).where(eq(assets.id, data.coverAssetId));
      if (a?.kind !== 'IMAGE') throw new CatalogError('invalidAsset');
    }
    if (data.musicTrackId && data.musicTrackId !== before.musicTrackId) {
      const [m] = await tx.select({ status: musicTracks.status }).from(musicTracks).where(eq(musicTracks.id, data.musicTrackId));
      if (m?.status !== 'ACTIVE') throw new CatalogError('invalidMusic');
    }
    if (data.sectionId && data.sectionId !== before.sectionId) {
      const [s] = await tx.select({ id: sections.id }).from(sections).where(eq(sections.id, data.sectionId));
      if (!s) throw new CatalogError('notFound');
    }
    const sectionId = data.sectionId ?? null;
    let subsectionId = data.subsectionId === undefined ? before.subsectionId : data.subsectionId;
    if (subsectionId) {
      const [sub] = await tx.select({ sectionId: subsections.sectionId }).from(subsections).where(eq(subsections.id, subsectionId));
      if (!sub) throw new CatalogError('notFound');
      // A subsection from another section: dropped when the section changed, an error when chosen now.
      if (sub.sectionId !== sectionId) {
        if (data.subsectionId === undefined) subsectionId = null;
        else throw new CatalogError('subsectionMismatch');
      }
    }
    const next = {
      name: data.name,
      description: data.description,
      sectionId,
      subsectionId: subsectionId ?? null,
      coverAssetId: data.coverAssetId ?? null,
      musicTrackId: data.musicTrackId ?? null,
    };
    await tx.update(themes).set(next).where(eq(themes.id, themeId));
    await assertStillReady(tx, themeId);
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'theme.settings_updated',
      objectType: 'theme',
      objectId: themeId,
      before: { name: before.name, description: before.description, sectionId: before.sectionId, subsectionId: before.subsectionId, coverAssetId: before.coverAssetId, musicTrackId: before.musicTrackId },
      after: next,
    });
  });
}

export const themeFieldsInput = z.array(z.object({ fieldKey: z.string(), label: optionalI18nContent(120) })).max(50);

/** Reorders a theme's fields and sets per-theme labels. The set of fields is defined by the theme code. */
export async function setThemeFields(db: DbOrTx, themeId: string, input: z.input<typeof themeFieldsInput>, actor: Actor) {
  const items = themeFieldsInput.parse(input);
  return db.transaction(async (tx) => {
    const [theme] = await tx.select({ id: themes.id }).from(themes).where(eq(themes.id, themeId)).for('update');
    if (!theme) throw new CatalogError('notFound');
    const before = await tx.select().from(themeFields).where(eq(themeFields.themeId, themeId)).orderBy(asc(themeFields.sortOrder));
    const expected = new Set(before.map((b) => b.fieldKey));
    const given = items.map((i) => i.fieldKey);
    if (given.length !== expected.size || !given.every((k) => expected.has(k)) || new Set(given).size !== given.length) {
      throw new CatalogError('fieldSetMismatch');
    }
    for (const [i, it] of items.entries()) {
      await tx
        .update(themeFields)
        .set({ sortOrder: i, label: it.label })
        .where(and(eq(themeFields.themeId, themeId), eq(themeFields.fieldKey, it.fieldKey)));
    }
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'theme.fields_updated',
      objectType: 'theme',
      objectId: themeId,
      before: before.map((b) => ({ fieldKey: b.fieldKey, label: b.label })),
      after: items,
    });
  });
}

/** Switches which version new customers get. Existing invitations keep their version. */
export async function setCurrentVersion(db: DbOrTx, themeId: string, versionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const [theme] = await tx.select().from(themes).where(eq(themes.id, themeId)).for('update');
    if (!theme) throw new CatalogError('notFound');
    const [version] = await tx
      .select()
      .from(themeVersions)
      .where(and(eq(themeVersions.id, versionId), eq(themeVersions.themeId, themeId)));
    if (!version) throw new CatalogError('notFound');
    if (!version.inBuild) throw new CatalogError('versionNotInBuild');
    const manifest = version.manifest as ThemeManifest;
    const invalid = (await packagesWithShape(tx, themeId))
      .filter((p) => p.status === 'ACTIVE' && packageShapeProblems(manifest, p.featureKeys, p.fieldKeys).length > 0)
      .map((p) => localized(p.name, 'en'));
    if (invalid.length) throw new CatalogError('packagesInvalidForVersion', invalid);
    await tx.update(themes).set({ currentVersionId: versionId }).where(eq(themes.id, themeId));
    if (theme.status === 'ACTIVE' && !version.frozenAt) {
      await tx.update(themeVersions).set({ frozenAt: new Date() }).where(eq(themeVersions.id, versionId));
    }
    await assertStillReady(tx, themeId);
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'theme.version_changed',
      objectType: 'theme',
      objectId: themeId,
      before: { currentVersionId: theme.currentVersionId },
      after: { currentVersionId: versionId, codeRef: version.codeRef },
    });
  });
}

export async function moveTheme(db: DbOrTx, themeId: string, direction: 'up' | 'down', actor: Actor) {
  return db.transaction(async (tx) => {
    const [theme] = await tx.select().from(themes).where(eq(themes.id, themeId));
    if (!theme) throw new CatalogError('notFound');
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`themes_order:${theme.sectionId}`}))`);
    const rows = await tx
      .select({ id: themes.id })
      .from(themes)
      .where(and(theme.sectionId ? eq(themes.sectionId, theme.sectionId) : sql`${themes.sectionId} is null`, ne(themes.status, 'ARCHIVED')))
      .orderBy(asc(themes.sortOrder), asc(themes.createdAt));
    const ids = rows.map((r) => r.id);
    const next = moveInList(ids, themeId, direction);
    for (const [i, id] of next.entries()) await tx.update(themes).set({ sortOrder: i }).where(eq(themes.id, id));
    await recordAudit(tx, { ...auditActor(actor), action: 'theme.reordered', objectType: 'theme', objectId: themeId, before: ids, after: next });
  });
}

export async function getThemeDetail(db: DbOrTx, themeId: string) {
  const [row] = await db
    .select({ theme: themes, section: sections, cover: assets, music: musicTracks })
    .from(themes)
    .leftJoin(sections, eq(sections.id, themes.sectionId))
    .leftJoin(assets, eq(assets.id, themes.coverAssetId))
    .leftJoin(musicTracks, eq(musicTracks.id, themes.musicTrackId))
    .where(eq(themes.id, themeId));
  if (!row) throw new CatalogError('notFound');
  const versions = await db.select().from(themeVersions).where(eq(themeVersions.themeId, themeId)).orderBy(asc(themeVersions.version));
  const fieldRows = await db
    .select({ tf: themeFields, def: fieldDefinitions, sectionLabel: sectionDefaultFields.label })
    .from(themeFields)
    .innerJoin(fieldDefinitions, eq(fieldDefinitions.key, themeFields.fieldKey))
    .leftJoin(
      sectionDefaultFields,
      and(eq(sectionDefaultFields.fieldKey, themeFields.fieldKey), eq(sectionDefaultFields.sectionId, sql`${row.theme.sectionId}`)),
    )
    .where(eq(themeFields.themeId, themeId))
    .orderBy(asc(themeFields.sortOrder));
  const current = versions.find((v) => v.id === row.theme.currentVersionId);
  return {
    ...row,
    versions,
    currentManifest: (current?.manifest as ThemeManifest | undefined) ?? null,
    fields: fieldRows.map((f) => ({
      fieldKey: f.tf.fieldKey,
      type: f.def.type,
      themeLabel: f.tf.label,
      /** What customers see: theme override → section default → field library. */
      effectiveLabel: f.tf.label ?? f.sectionLabel ?? f.def.label,
      maxLength: f.def.maxLength,
    })),
    packages: await packagesWithShape(db, themeId),
    readiness: await themeReadiness(db, themeId),
  };
}
