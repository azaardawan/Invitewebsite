import 'server-only';
import { connection } from 'next/server';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { assets, fieldDefinitions, packages, sectionDefaultFields, sections, themeFields, themeVersions, themes, type I18nContent } from '@/server/db/schema';
import { packagesWithShape } from '@/server/catalog/themes';
import { publicMediaUrl } from '@/server/storage';
import type { ThemeManifest } from '@/theme-sdk/manifest';

/**
 * Read-only queries for the public storefront. Only ACTIVE themes in ACTIVE
 * sections are ever returned; nothing else (drafts, prices of archived
 * packages, customer data) can leak through here.
 */

export async function storefrontSections() {
  await connection();
  const rows = await db()
    .select({
      section: sections,
      imageKey: assets.storageKey,
      themeCount: sql<number>`(select count(*)::int from ${themes} where ${themes.sectionId} = ${sections.id} and ${themes.status} = 'ACTIVE')`,
    })
    .from(sections)
    .leftJoin(assets, eq(assets.id, sections.imageAssetId))
    .where(eq(sections.status, 'ACTIVE'))
    .orderBy(asc(sections.sortOrder), asc(sections.createdAt));
  return rows.map((r) => ({
    key: r.section.key,
    name: r.section.name,
    description: r.section.description,
    imageUrl: r.imageKey ? publicMediaUrl(r.imageKey) : null,
    themeCount: r.themeCount,
  }));
}

export type StorefrontTheme = Awaited<ReturnType<typeof storefrontThemes>>[number];

export async function storefrontThemes(opts: { sectionKey?: string; limit?: number } = {}) {
  await connection();
  const rows = await db()
    .select({
      theme: themes,
      section: sections,
      coverKey: assets.storageKey,
      minPrice: sql<number | null>`(select min(${packages.priceIqd})::bigint from ${packages} where ${packages.themeId} = ${themes.id} and ${packages.status} = 'ACTIVE')`,
    })
    .from(themes)
    .innerJoin(sections, eq(sections.id, themes.sectionId))
    .leftJoin(assets, eq(assets.id, themes.coverAssetId))
    .where(and(eq(themes.status, 'ACTIVE'), eq(sections.status, 'ACTIVE'), opts.sectionKey ? eq(sections.key, opts.sectionKey) : undefined))
    .orderBy(asc(sections.sortOrder), asc(themes.sortOrder), asc(themes.createdAt))
    .limit(opts.limit ?? 100);
  return rows.map((r) => ({
    key: r.theme.key,
    name: r.theme.name,
    description: r.theme.description,
    sectionKey: r.section.key,
    sectionName: r.section.name,
    coverUrl: r.coverKey ? publicMediaUrl(r.coverKey) : null,
    minPriceIqd: r.minPrice === null ? null : Number(r.minPrice),
  }));
}

export type StorefrontThemeDetail = NonNullable<Awaited<ReturnType<typeof storefrontTheme>>>;

/** A theme on sale with its packages and the order-form fields (labels resolved theme → section → library). */
export async function storefrontTheme(key: string) {
  await connection();
  const [row] = await db()
    .select({ theme: themes, section: sections, version: themeVersions, coverKey: assets.storageKey })
    .from(themes)
    .innerJoin(sections, eq(sections.id, themes.sectionId))
    .innerJoin(themeVersions, eq(themeVersions.id, themes.currentVersionId))
    .leftJoin(assets, eq(assets.id, themes.coverAssetId))
    .where(and(eq(themes.key, key), eq(themes.status, 'ACTIVE'), eq(sections.status, 'ACTIVE')));
  if (!row) return null;
  const manifest = row.version.manifest as ThemeManifest;
  const pkgs = (await packagesWithShape(db(), row.theme.id)).filter((p) => p.status === 'ACTIVE').sort((a, b) => a.sortOrder - b.sortOrder);
  const fields = await orderFields(row.theme.id, row.section.id, [...new Set(pkgs.flatMap((p) => p.fieldKeys))]);
  return {
    key: row.theme.key,
    name: row.theme.name,
    description: row.theme.description,
    section: { key: row.section.key, name: row.section.name },
    coverUrl: row.coverKey ? publicMediaUrl(row.coverKey) : null,
    codeRef: row.version.codeRef,
    version: row.version.version,
    manifest,
    packages: pkgs.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceIqd: p.priceIqd,
      fieldKeys: p.fieldKeys,
      featureKeys: p.featureKeys,
      /** Index of this package's designed state, for sample previews. */
      stateIndex: manifest.validStates.findIndex((s) => s.features.length === p.featureKeys.length && s.features.every((f) => p.featureKeys.includes(f)) && s.fields.length === p.fieldKeys.length && s.fields.every((k) => p.fieldKeys.includes(k))),
    })),
    fields,
  };
}

export type OrderField = Awaited<ReturnType<typeof orderFields>>[number];

/** Order-form fields for the given keys, labels resolved theme → section → library, in the theme's order. */
export async function orderFields(themeId: string, sectionId: string | null, keys: readonly string[]) {
  if (!keys.length) return [];
  const rows = await db()
    .select({ key: fieldDefinitions.key, type: fieldDefinitions.type, maxLength: fieldDefinitions.maxLength, label: fieldDefinitions.label, themeLabel: themeFields.label, sectionLabel: sectionDefaultFields.label, order: themeFields.sortOrder })
    .from(fieldDefinitions)
    .leftJoin(themeFields, and(eq(themeFields.fieldKey, fieldDefinitions.key), eq(themeFields.themeId, themeId)))
    .leftJoin(sectionDefaultFields, and(eq(sectionDefaultFields.fieldKey, fieldDefinitions.key), sectionId ? eq(sectionDefaultFields.sectionId, sectionId) : sql`false`))
    .where(inArray(fieldDefinitions.key, [...keys]));
  return rows
    .map((f) => ({ key: f.key, type: f.type, maxLength: f.maxLength, label: (f.themeLabel ?? f.sectionLabel ?? f.label) as I18nContent, order: f.order ?? 999 }))
    .sort((a, b) => a.order - b.order);
}
