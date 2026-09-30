import { beforeAll, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, packages, sections, themeVersions, themes } from '@/server/db/schema';
import { seedCatalog } from '@/server/catalog/seed';
import { createSection, moveSection, listSections, setSectionStatus, updateSection } from '@/server/catalog/sections';
import { updateField, listFields } from '@/server/catalog/fields';
import {
  getThemeDetail,
  setCurrentVersion,
  syncThemesFromRegistry,
  themeReadiness,
  transitionTheme,
  updateThemeSettings,
  setThemeFields,
} from '@/server/catalog/themes';
import { createPackage, setPackageStatus, updatePackage, type PackageInput } from '@/server/catalog/packages';
import { createMusicTrack, setMusicStatus } from '@/server/catalog/music';
import { storeAudio, storeImage } from '@/server/media/assets';
import type { ThemeManifest } from '@/theme-sdk/manifest';
import sharp from 'sharp';
import { ensureSeeded, makeAdmin, makeMp3, uniqueKey } from '../helpers';

let actor: { adminId: string; ipHash: null };

const FULL_FIELDS = ['person_1_name', 'person_2_name', 'event_date', 'venue_name', 'venue_map_url'] as const;
const BASIC_FIELDS = ['person_1_name', 'person_2_name', 'event_date', 'venue_name'] as const;

function manifest(key: string, version = 1, overrides: Partial<ThemeManifest> = {}): ThemeManifest {
  return {
    key,
    version,
    title: { ar: 'تجربة', en: 'Test theme' },
    experience: 'INVITATION',
    sections: ['wedding'],
    fields: [...FULL_FIELDS],
    features: ['music', 'map', 'rsvp', 'print_card'],
    validStates: [
      { features: ['music', 'print_card'], fields: [...BASIC_FIELDS] },
      { features: ['music', 'map', 'rsvp', 'print_card'], fields: [...FULL_FIELDS] },
    ],
    print: { card: { size: 'A5', bleedMm: 3, qr: true } },
    ...overrides,
  };
}

const basic = (priceIqd = 25000, name = 'Normal'): PackageInput => ({
  name: { ar: 'عادي', en: name },
  priceIqd,
  fieldKeys: [...BASIC_FIELDS],
  featureKeys: ['music', 'print_card'],
});
const full = (priceIqd = 50000): PackageInput => ({
  name: { ar: 'في آي بي', en: 'VIP' },
  priceIqd,
  fieldKeys: [...FULL_FIELDS],
  featureKeys: ['music', 'map', 'rsvp', 'print_card'],
});

async function registeredTheme(overrides: Partial<ThemeManifest> = {}) {
  const key = uniqueKey('theme');
  await syncThemesFromRegistry(db(), [manifest(key, 1, overrides)], actor);
  const [t] = await db().select().from(themes).where(eq(themes.key, key));
  return t!;
}

async function cover() {
  const png = await sharp({ create: { width: 400 + Math.floor(Math.random() * 500), height: 600, channels: 3, background: '#c9a' } }).png().toBuffer();
  return storeImage(db(), png, { uploadedBy: null });
}

async function track() {
  const asset = await storeAudio(db(), makeMp3(1 + Math.random() * 5), { uploadedBy: null });
  return createMusicTrack(db(), { title: uniqueKey('song'), assetId: asset.id }, actor);
}

/** A theme that passes every readiness check. */
async function readyTheme() {
  const t = await registeredTheme();
  const [c, m] = await Promise.all([cover(), track()]);
  await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: c.id, musicTrackId: m.id }, actor);
  await createPackage(db(), t.id, basic(), actor);
  return t;
}

beforeAll(async () => {
  await ensureSeeded();
  await seedCatalog(db());
  const admin = await makeAdmin();
  actor = { adminId: admin.id, ipHash: null };
});

describe('sections', () => {
  it('starter sections exist; wedding requires the printable card in every package', async () => {
    const [wedding] = await db().select().from(sections).where(eq(sections.key, 'wedding'));
    expect(wedding?.requiredFeatures).toEqual(['print_card']);
  });

  it('creates, orders, archives and restores sections without deleting anything', async () => {
    const a = await createSection(db(), { key: uniqueKey('sec'), name: { ar: 'أ', en: 'A' } }, actor);
    const b = await createSection(db(), { key: uniqueKey('sec'), name: { ar: 'ب', en: 'B' } }, actor);
    const order = async () => (await listSections(db())).map((r) => r.section.id);
    expect((await order()).indexOf(b.id)).toBe((await order()).indexOf(a.id) + 1);
    await moveSection(db(), b.id, 'up', actor);
    expect((await order()).indexOf(b.id)).toBe((await order()).indexOf(a.id) - 1);

    await setSectionStatus(db(), a.id, 'ARCHIVED', actor, 'season over');
    expect(await order()).not.toContain(a.id);
    expect((await listSections(db(), { includeArchived: true })).map((r) => r.section.id)).toContain(a.id);
    await setSectionStatus(db(), a.id, 'ACTIVE', actor);
    expect(await order()).toContain(a.id);
  });

  it('rejects duplicate or malformed keys and non-image assets', async () => {
    const key = uniqueKey('sec');
    await createSection(db(), { key, name: { ar: 'س', en: 'S' } }, actor);
    await expect(createSection(db(), { key, name: { ar: 'س', en: 'S' } }, actor)).rejects.toMatchObject({ code: 'keyTaken' });
    await expect(createSection(db(), { key: 'Bad Key!', name: { ar: 'س', en: 'S' } }, actor)).rejects.toThrow();
    const audio = await storeAudio(db(), makeMp3(2), { uploadedBy: null });
    const [s] = await db().select().from(sections).where(eq(sections.key, key));
    await expect(
      updateSection(db(), s!.id, { name: s!.name, imageAssetId: audio.id, requiredFeatures: [] }, actor),
    ).rejects.toMatchObject({ code: 'invalidAsset' });
  });
});

describe('field library', () => {
  it('lets the owner edit labels (including Kurdish) and text limits, but not types', async () => {
    await updateField(db(), 'venue_name', { label: { ar: 'اسم القاعة', en: 'Hall', ckb: 'ناوی هۆڵ', bdn: '' }, maxLength: 60 }, actor);
    const f = (await listFields(db())).find((x) => x.key === 'venue_name')!;
    expect(f.label).toEqual({ ar: 'اسم القاعة', en: 'Hall', ckb: 'ناوی هۆڵ', bdn: null });
    expect(f.maxLength).toBe(60);
    await updateField(db(), 'event_date', { label: { ar: 'التاريخ', en: 'Date' }, maxLength: 50 }, actor);
    expect((await listFields(db())).find((x) => x.key === 'event_date')!.maxLength).toBeNull();
  });
});

describe('theme registry sync', () => {
  it('registers new themes in DEVELOPMENT under their section, with fields in section order', async () => {
    const t = await registeredTheme();
    expect(t.status).toBe('DEVELOPMENT');
    const detail = await getThemeDetail(db(), t.id);
    expect(detail.section?.key).toBe('wedding');
    expect(detail.fields.map((f) => f.fieldKey)).toEqual(['person_1_name', 'person_2_name', 'event_date', 'venue_name', 'venue_map_url']);
    expect(detail.fields[0]!.effectiveLabel.en).toBe("Groom's name");
  });

  it('never changes an activated version: a changed manifest is reported as a conflict', async () => {
    const t = await readyTheme();
    await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
    await transitionTheme(db(), t.id, 'ACTIVE', actor);
    const changed = manifest(t.key, 1, { title: { ar: 'تغيير', en: 'Changed' } });
    const report = await syncThemesFromRegistry(db(), [changed], actor);
    expect(report.conflicts).toEqual([`${t.key}@1`]);
    const [v] = await db().select().from(themeVersions).where(eq(themeVersions.codeRef, `${t.key}@1`));
    expect((v!.manifest as ThemeManifest).title.en).toBe('Test theme');
    expect(v!.frozenAt).not.toBeNull();
  });

  it('adds new versions without switching existing customers, and flags code removed from the build', async () => {
    const t = await registeredTheme();
    await syncThemesFromRegistry(db(), [manifest(t.key, 1), manifest(t.key, 2)], actor);
    const [after] = await db().select().from(themes).where(eq(themes.id, t.id));
    const [v1] = await db().select().from(themeVersions).where(eq(themeVersions.codeRef, `${t.key}@1`));
    expect(after!.currentVersionId).toBe(v1!.id);
    const report = await syncThemesFromRegistry(db(), [manifest(t.key, 2)], actor);
    expect(report.missing).toContain(`${t.key}@1`);
  });
});

describe('packages', () => {
  it('accept only designed states and enforce section-required features', async () => {
    const t = await registeredTheme();
    await expect(
      createPackage(db(), t.id, { ...basic(), featureKeys: ['music', 'map', 'print_card'] }, actor),
    ).rejects.toMatchObject({ code: 'notValidState' });

    // A theme designed without the printable card can't have wedding packages at all.
    const noPrint = await registeredTheme({
      features: ['music'],
      validStates: [{ features: ['music'], fields: [...FULL_FIELDS] }],
      print: undefined,
    });
    await expect(
      createPackage(db(), noPrint.id, { ...full(), featureKeys: ['music'] }, actor),
    ).rejects.toMatchObject({ code: 'missingRequiredFeature', details: ['print_card'] });
  });

  it('allow at most 3 active packages per theme (service and database)', async () => {
    const t = await registeredTheme();
    const created = [];
    for (const [i, p] of [basic(20000, 'A'), full(40000), basic(30000, 'C')].entries()) {
      created.push(await createPackage(db(), t.id, { ...p, name: { ar: `${i}`, en: `P${i}` } }, actor));
    }
    await expect(createPackage(db(), t.id, basic(10000, 'D'), actor)).rejects.toMatchObject({ code: 'tooManyPackages' });
    await expect(
      db().insert(packages).values({ themeId: t.id, name: { ar: 'x', en: 'x' }, priceIqd: 5000 }),
    ).rejects.toMatchObject({ cause: expect.objectContaining({ message: expect.stringMatching(/at most 3/) }) });

    await setPackageStatus(db(), created[0]!.id, 'ARCHIVED', actor);
    await createPackage(db(), t.id, basic(10000, 'D'), actor);
    await expect(setPackageStatus(db(), created[0]!.id, 'ACTIVE', actor)).rejects.toMatchObject({ code: 'tooManyPackages' });
  });

  it('validates prices and audits price changes with before/after', async () => {
    const t = await registeredTheme();
    await expect(createPackage(db(), t.id, basic(0), actor)).rejects.toThrow();
    await expect(createPackage(db(), t.id, basic(12.5), actor)).rejects.toThrow();
    const p = await createPackage(db(), t.id, basic(30000), actor);
    await updatePackage(db(), p.id, basic(40000), actor);
    const [log] = await db()
      .select()
      .from(auditLogs)
      .where(sql`${auditLogs.objectId} = ${p.id} and ${auditLogs.action} = 'package.price_changed'`);
    expect(log).toMatchObject({ before: { priceIqd: 30000 }, after: { priceIqd: 40000 } });
  });
});

describe('dual-currency prices (owner sets both)', () => {
  it('stores an optional USD price in cents and audits USD changes', async () => {
    const t = await registeredTheme();
    const noUsd = await createPackage(db(), t.id, basic(25000), actor);
    expect(noUsd.priceUsdCents).toBeNull();

    const p = await createPackage(db(), t.id, { ...full(60000), priceUsd: '49.99' }, actor);
    expect(p.priceUsdCents).toBe(4999);

    await updatePackage(db(), p.id, { ...full(60000), priceUsd: '55' }, actor);
    const [log] = await db()
      .select()
      .from(auditLogs)
      .where(sql`${auditLogs.objectId} = ${p.id} and ${auditLogs.action} = 'package.price_changed'`);
    expect(log).toMatchObject({ before: { priceIqd: 60000, priceUsdCents: 4999 }, after: { priceIqd: 60000, priceUsdCents: 5500 } });
  });

  it('rejects malformed or out-of-range USD prices', async () => {
    const t = await registeredTheme();
    for (const bad of ['12.345', '-5', 'abc', '0', '200000']) {
      await expect(createPackage(db(), t.id, { ...basic(), priceUsd: bad }, actor)).rejects.toThrow();
    }
  });
});

describe('music reuse', () => {
  it('lets one song be used by several themes', async () => {
    const song = await track();
    const [a, b] = [await registeredTheme(), await registeredTheme()];
    for (const t of [a, b]) {
      await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, musicTrackId: song.id }, actor);
    }
    const using = await db().select().from(themes).where(eq(themes.musicTrackId, song.id));
    expect(using.map((r) => r.id).sort()).toEqual([a.id, b.id].sort());
  });
});

describe('theme lifecycle', () => {
  it('lists exactly what is missing before review', async () => {
    const t = await registeredTheme();
    const codes = (await themeReadiness(db(), t.id)).map((p) => p.code);
    expect(codes).toEqual(expect.arrayContaining(['noCover', 'noPackages']));
    await expect(transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor)).rejects.toMatchObject({ code: 'notReady' });
  });

  it('requires a song when a package includes music', async () => {
    const t = await registeredTheme();
    const c = await cover();
    await updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: c.id }, actor);
    await createPackage(db(), t.id, basic(), actor);
    expect((await themeReadiness(db(), t.id)).map((p) => p.code)).toEqual(['noMusic']);
  });

  it('DEVELOPMENT → READY → ACTIVE → ARCHIVED → restored; no skipping steps', async () => {
    const t = await readyTheme();
    await expect(transitionTheme(db(), t.id, 'ACTIVE', actor)).rejects.toMatchObject({ code: 'invalidTransition' });
    await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
    await transitionTheme(db(), t.id, 'ACTIVE', actor);
    await transitionTheme(db(), t.id, 'ARCHIVED', actor, 'end of season');
    let [row] = await db().select().from(themes).where(eq(themes.id, t.id));
    expect(row!.status).toBe('ARCHIVED');
    expect(row!.archivedAt).not.toBeNull();
    await transitionTheme(db(), t.id, 'ACTIVE', actor, 'back by request');
    [row] = await db().select().from(themes).where(eq(themes.id, t.id));
    expect(row!.status).toBe('ACTIVE');
  });

  it('blocks edits that would break a live theme', async () => {
    const t = await readyTheme();
    await transitionTheme(db(), t.id, 'READY_FOR_REVIEW', actor);
    await transitionTheme(db(), t.id, 'ACTIVE', actor);
    const detail = await getThemeDetail(db(), t.id);
    await expect(
      updateThemeSettings(db(), t.id, { name: t.name, sectionId: t.sectionId, coverAssetId: null, musicTrackId: detail.theme.musicTrackId }, actor),
    ).rejects.toMatchObject({ code: 'wouldBreakTheme' });
    await expect(setPackageStatus(db(), detail.packages[0]!.id, 'ARCHIVED', actor)).rejects.toMatchObject({ code: 'wouldBreakTheme' });
    await expect(setMusicStatus(db(), detail.theme.musicTrackId!, 'ARCHIVED', actor)).rejects.toMatchObject({ code: 'musicInUse' });
  });

  it('switches versions only when every active package fits the new version', async () => {
    const t = await readyTheme();
    const v2 = manifest(t.key, 2, {
      fields: [...BASIC_FIELDS],
      features: ['music', 'print_card'],
      validStates: [{ features: ['music', 'print_card'], fields: [...BASIC_FIELDS] }],
    });
    const v3 = manifest(t.key, 3, { features: ['music', 'map', 'rsvp', 'print_card'], validStates: [manifest(t.key).validStates[1]!] });
    await syncThemesFromRegistry(db(), [manifest(t.key, 1), v2, v3], actor);
    const versions = await db().select().from(themeVersions).where(eq(themeVersions.themeId, t.id));
    const byNum = (n: number) => versions.find((v) => v.version === n)!.id;
    await setCurrentVersion(db(), t.id, byNum(2), actor);
    await expect(setCurrentVersion(db(), t.id, byNum(3), actor)).rejects.toMatchObject({ code: 'packagesInvalidForVersion' });
  });

  it('only allows reordering/relabelling theme fields, not changing which fields exist', async () => {
    const t = await registeredTheme();
    const d = await getThemeDetail(db(), t.id);
    const reversed = [...d.fields].reverse().map((f) => ({ fieldKey: f.fieldKey, label: null }));
    await setThemeFields(db(), t.id, reversed, actor);
    expect((await getThemeDetail(db(), t.id)).fields.map((f) => f.fieldKey)).toEqual(reversed.map((f) => f.fieldKey));
    await expect(setThemeFields(db(), t.id, reversed.slice(1), actor)).rejects.toMatchObject({ code: 'fieldSetMismatch' });
  });
});
