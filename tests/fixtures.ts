import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { themes } from '@/server/db/schema';
import { seedCatalog } from '@/server/catalog/seed';
import { syncThemesFromRegistry, transitionTheme, updateThemeSettings } from '@/server/catalog/themes';
import { createPackage } from '@/server/catalog/packages';
import { createMusicTrack } from '@/server/catalog/music';
import { storeAudio, storeImage } from '@/server/media/assets';
import type { ThemeManifest } from '@/theme-sdk/manifest';
import { ensureSeeded, makeAdmin, makeMp3, uniqueKey } from './helpers';

export const FULL_FIELDS = ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'venue_map_url'] as const;
export const BASIC_FIELDS = ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name'] as const;

export function testManifest(key: string, version = 1, overrides: Partial<ThemeManifest> = {}): ThemeManifest {
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

/** A theme on sale in the Wedding section with one basic (25,000 IQD) and one full (60,000 IQD) package. */
export async function activeTheme() {
  await ensureSeeded();
  await seedCatalog(db());
  const admin = await makeAdmin();
  const actor = { adminId: admin.id, ipHash: null };
  const key = uniqueKey('shop');
  await syncThemesFromRegistry(db(), [testManifest(key)], actor, { complete: false });
  const [t] = await db().select().from(themes).where(eq(themes.key, key));
  const png = await sharp({ create: { width: 300 + Math.floor(Math.random() * 900), height: 400, channels: 3, background: '#a67' } }).png().toBuffer();
  const cover = await storeImage(db(), png, { uploadedBy: null });
  const audio = await storeAudio(db(), makeMp3(1 + Math.random() * 8), { uploadedBy: null });
  const song = await createMusicTrack(db(), { title: uniqueKey('song'), assetId: audio.id }, actor);
  await updateThemeSettings(db(), t!.id, { name: t!.name, sectionId: t!.sectionId, coverAssetId: cover.id, musicTrackId: song.id }, actor);
  const basic = await createPackage(
    db(),
    t!.id,
    { name: { ar: 'عادي', en: 'Normal' }, priceIqd: 25000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['music', 'print_card'] },
    actor,
  );
  const full = await createPackage(
    db(),
    t!.id,
    { name: { ar: 'مميز', en: 'VIP' }, priceIqd: 60000, fieldKeys: [...FULL_FIELDS], featureKeys: ['music', 'map', 'rsvp', 'print_card'] },
    actor,
  );
  await transitionTheme(db(), t!.id, 'READY_FOR_REVIEW', actor);
  await transitionTheme(db(), t!.id, 'ACTIVE', actor);
  return { theme: t!, basic, full, actor, admin, song };
}

export function futureDate(days = 40) {
  return new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
}

export function weddingValues(overrides: Record<string, string> = {}) {
  return {
    person_1_name: 'علي',
    person_2_name: 'نور',
    event_date: futureDate(),
    event_time: '19:30',
    venue_name: 'قاعة الياسمين',
    venue_map_url: 'https://maps.google.com/?q=Baghdad',
    ...overrides,
  };
}
