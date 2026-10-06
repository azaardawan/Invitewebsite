import 'server-only';
import { and, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets, musicTracks, themeVersions, themes } from '@/server/db/schema';
import { packagesWithShape } from '@/server/catalog/themes';
import type { Locale } from '@/i18n/config';
import type { ThemeManifest } from '@/theme-sdk/manifest';
import { publicMediaUrl } from '@/server/storage';
import { themeBorder } from '@/server/catalog/border';
import { buildThemeProps, sampleValues } from './theme-props';

export type SampleRequest = {
  themeKey: string;
  locale: Locale;
  version?: number;
  packageId?: string;
  stateIndex?: number;
  /** Any combination of the theme's features/fields (admin checks), instead of a package or designed state. */
  custom?: { features: string[]; fields: string[] };
  names?: 'short' | 'long';
};

/**
 * Everything needed to render a theme with sample content: which version,
 * which package state (a real package, or one of the designed states), and props.
 */
export async function resolveSample(db: DbOrTx, req: SampleRequest) {
  const [theme] = await db.select().from(themes).where(eq(themes.key, req.themeKey));
  if (!theme) return null;
  const [version] = await db
    .select()
    .from(themeVersions)
    .where(
      req.version
        ? and(eq(themeVersions.themeId, theme.id), eq(themeVersions.version, req.version))
        : eq(themeVersions.id, theme.currentVersionId ?? '00000000-0000-0000-0000-000000000000'),
    );
  if (!version) return null;
  const manifest = version.manifest as ThemeManifest;

  let features: string[];
  let fieldKeys: string[];
  const pkg = req.packageId ? (await packagesWithShape(db, theme.id)).find((p) => p.id === req.packageId) : undefined;
  if (pkg) {
    features = pkg.featureKeys;
    fieldKeys = pkg.fieldKeys;
  } else if (req.custom) {
    features = manifest.features.filter((f) => req.custom!.features.includes(f));
    fieldKeys = manifest.fields.filter((k) => req.custom!.fields.includes(k));
  } else {
    const complete = manifest.validStates.findIndex((s) => s.features.length === manifest.features.length && s.fields.length === manifest.fields.length);
    const state = manifest.validStates[req.stateIndex ?? complete] ?? manifest.validStates[complete]!;
    features = state.features;
    fieldKeys = state.fields;
  }

  const [music] = theme.musicTrackId
    ? await db
        .select({ key: assets.storageKey })
        .from(musicTracks)
        .innerJoin(assets, eq(assets.id, musicTracks.assetId))
        .where(eq(musicTracks.id, theme.musicTrackId))
    : [];

  const props = buildThemeProps({
    mode: 'sample',
    locale: req.locale,
    fieldKeys,
    features,
    values: sampleValues(req.locale, req.names ?? 'short'),
    musicSrc: music ? publicMediaUrl(music.key) : null,
    border: await themeBorder(db, theme.id),
  });
  return { theme, version, manifest, props };
}
