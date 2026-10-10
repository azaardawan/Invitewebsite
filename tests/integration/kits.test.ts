import { beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { db } from '@/server/db/client';
import { generatedDocuments, invitations, sectionDefaultFields, sections, themes, themeVersions } from '@/server/db/schema';
import { seedCatalog } from '@/server/catalog/seed';
import { syncThemesFromRegistry, themeReadiness, transitionTheme, updateThemeSettings } from '@/server/catalog/themes';
import { createPackage } from '@/server/catalog/packages';
import { storeImage } from '@/server/media/assets';
import { createDraft } from '@/server/orders/drafts';
import { OrderError } from '@/server/orders/common';
import { KitFileError, getKitFile, kitSourceHash } from '@/server/kit/documents';
import { readRenderToken, renderToken } from '@/server/kit/token';
import { buildKitProps, kitDateExamples } from '@/server/kit/props';
import { storage } from '@/server/storage';
import { DEFAULT_KIT_OPTIONS } from '@/catalog/kit';
import { kitStates } from '@/theme-sdk/manifest';
import { randomToken } from '@/lib/crypto';
import { testManifest } from '../fixtures';
import { ctx, makeAdmin, uniqueKey } from '../helpers';

const FEATURES = ['kit_story', 'kit_card', 'kit_sticker', 'kit_bottle'] as const;
const FIELDS = ['baby_name', 'father_name', 'birth_date'] as const;
const values = { baby_name: 'عمر', father_name: 'عبدالعزيز', birth_date: new Date(Date.now() - 3 * 86400_000).toISOString().slice(0, 10) };

let shop: { themeKey: string; storyOnly: string; complete: string; actor: { adminId: string; ipHash: null } };
beforeAll(async () => {
  await seedCatalog(db());
  const admin = await makeAdmin();
  const actor = { adminId: admin.id, ipHash: null };
  const key = uniqueKey('kit');
  const manifest = testManifest(key, 1, {
    experience: 'DESIGN_KIT',
    sections: ['baby'],
    fields: [...FIELDS],
    features: [...FEATURES],
    validStates: kitStates(FEATURES, FIELDS),
    print: undefined,
  });
  await syncThemesFromRegistry(db(), [manifest], actor, { complete: false });
  const [t] = await db().select().from(themes).where(eq(themes.key, key));
  const cover = await storeImage(db(), await sharp({ create: { width: 320 + Math.floor(Math.random() * 500), height: 500, channels: 3, background: '#e4e0d4' } }).png().toBuffer(), { uploadedBy: null });
  await updateThemeSettings(db(), t!.id, { name: t!.name, sectionId: t!.sectionId, coverAssetId: cover.id }, actor);
  const storyOnly = await createPackage(db(), t!.id, { name: { ar: 'ستوري', en: 'Story' }, priceIqd: 5000, fieldKeys: [...FIELDS], featureKeys: ['kit_story'] }, actor);
  const complete = await createPackage(db(), t!.id, { name: { ar: 'كاملة', en: 'Complete' }, priceIqd: 25000, fieldKeys: [...FIELDS], featureKeys: [...FEATURES] }, actor);
  await transitionTheme(db(), t!.id, 'READY_FOR_REVIEW', actor);
  await transitionTheme(db(), t!.id, 'ACTIVE', actor);
  shop = { themeKey: key, storyOnly: storyOnly.id, complete: complete.id, actor };
});

async function draftFor(packageId: string) {
  const d = await createDraft(db(), { themeKey: shop.themeKey, packageId, locale: 'ar', values }, { ...ctx, ipHash: randomToken(8) });
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  return inv!;
}

describe('design kits: catalog', () => {
  it('seeds the Baby welcoming section as a design-kit section with its three fields', async () => {
    const [s] = await db().select().from(sections).where(eq(sections.key, 'baby'));
    expect(s!.experienceType).toBe('DESIGN_KIT');
    const fields = await db().select().from(sectionDefaultFields).where(eq(sectionDefaultFields.sectionId, s!.id));
    expect(fields.map((f) => f.fieldKey).sort()).toEqual(['baby_name', 'birth_date', 'father_name']);
  });

  it('flags a kit placed in an invitation section', async () => {
    const [t] = await db().select().from(themes).where(eq(themes.key, shop.themeKey));
    const [wedding] = await db().select().from(sections).where(eq(sections.key, 'wedding'));
    await db().update(themes).set({ sectionId: wedding!.id }).where(eq(themes.id, t!.id));
    try {
      expect((await themeReadiness(db(), t!.id)).map((p) => p.code)).toContain('experienceMismatch');
    } finally {
      await db().update(themes).set({ sectionId: t!.sectionId }).where(eq(themes.id, t!.id));
    }
  });

  it('only accepts a birth date that already happened', async () => {
    const future = new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10);
    const err = await createDraft(db(), { themeKey: shop.themeKey, packageId: shop.complete, locale: 'ar', values: { ...values, birth_date: future } }, { ...ctx, ipHash: randomToken(8) }).catch((e) => e);
    expect(err).toBeInstanceOf(OrderError);
    expect((err as OrderError).fieldErrors).toEqual({ birth_date: 'futureDate' });
  });
});

describe('design kits: files', () => {
  it('signs render links that cannot be altered or reused later', () => {
    const job = { invitationId: randomUUID(), unit: 'card' as const, format: 'pdf' as const, options: DEFAULT_KIT_OPTIONS };
    const token = renderToken(job);
    expect(readRenderToken(token)).toEqual(job);
    const [payload, mac] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload!, 'base64url').toString()), unit: 'story' })).toString('base64url');
    expect(readRenderToken(`${forged}.${mac}`)).toBeNull();
    expect(readRenderToken(token, new Date(Date.now() + 10 * 60_000))).toBeNull();
  });

  it('gives a file only if the package includes it', async () => {
    const inv = await draftFor(shop.storyOnly);
    await expect(getKitFile(db(), inv, 'card', 'pdf', DEFAULT_KIT_OPTIONS)).rejects.toThrow(KitFileError);
    await expect(getKitFile(db(), inv, 'story', 'pdf', DEFAULT_KIT_OPTIONS)).rejects.toThrow(KitFileError);
  });

  it('serves a stored file again without making it twice; options that change the file change its key', async () => {
    const inv = await draftFor(shop.complete);
    const [v] = await db().select({ codeRef: themeVersions.codeRef }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
    const hash = kitSourceHash(inv, v!.codeRef, 'story', 'png', DEFAULT_KIT_OPTIONS);
    // The bottle size only matters for bottle wraps; the date style matters for everything.
    expect(kitSourceHash(inv, v!.codeRef, 'story', 'png', { ...DEFAULT_KIT_OPTIONS, bottle: '600' })).toBe(hash);
    expect(kitSourceHash(inv, v!.codeRef, 'story', 'png', { ...DEFAULT_KIT_OPTIONS, dateStyle: 'hijri' })).not.toBe(hash);
    expect(kitSourceHash(inv, v!.codeRef, 'bottle', 'png', { ...DEFAULT_KIT_OPTIONS, bottle: '600' })).not.toBe(
      kitSourceHash(inv, v!.codeRef, 'bottle', 'png', DEFAULT_KIT_OPTIONS),
    );

    const body = Buffer.from('stored-story-png');
    const storageKey = `documents/${randomUUID()}.png`;
    await storage().put(storageKey, body, 'image/png');
    await db().insert(generatedDocuments).values({ invitationId: inv.id, themeVersionId: inv.themeVersionId, variant: 'kit:story:png', sourceHash: hash, storageKey, contentType: 'image/png', bytes: body.byteLength });
    const file = await getKitFile(db(), inv, 'story', 'png', DEFAULT_KIT_OPTIONS);
    expect(file.body.equals(body)).toBe(true);
    expect(file.contentType).toBe('image/png');
    expect(file.fileName).toMatch(/-story\.png$/);
    const rows = await db().select().from(generatedDocuments).where(and(eq(generatedDocuments.invitationId, inv.id)));
    expect(rows).toHaveLength(1);
  });

  it('passes themes only the package fields, the formatted date and the wording', () => {
    const props = buildKitProps({
      mode: 'live',
      locale: 'ar',
      themeKey: 'embroidered-garden',
      unit: 'sticker-round',
      fieldKeys: [...FIELDS],
      values: { ...values, birth_date: '2026-10-05', secret: 'x' },
      options: { ...DEFAULT_KIT_OPTIONS, dateStyle: 'both' },
    });
    expect(Object.keys(props.fields).sort()).toEqual(['baby_name', 'birth_date', 'father_name']);
    expect(props.birthDate).toHaveLength(2);
    expect(props.copy.sonOf).toBe('بن');
    expect(props.size.shape).toBe('circle');
    expect(kitDateExamples('2026-10-05', 'ar')['numeric:latn']).toBe('5 / 10 / 2026');
  });
});
