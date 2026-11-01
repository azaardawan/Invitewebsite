/**
 * Couple posters (owner, 2026-11-01): the landscape and the portrait poster are sold separately, each its own feature.
 * `couple_poster` (the first packages, before the split) still means both.
 */
export type PosterOrientation = 'landscape' | 'portrait';

export const POSTER_FEATURES = { landscape: 'couple_poster_landscape', portrait: 'couple_poster_portrait' } as const satisfies Record<PosterOrientation, string>;
/** Every feature that sells a poster. */
export const ANY_POSTER_FEATURES = ['couple_poster', POSTER_FEATURES.landscape, POSTER_FEATURES.portrait] as const;

/** The posters a package (or invitation) includes, landscape first. */
export function includedPosters(featureKeys: readonly string[]): PosterOrientation[] {
  const both = featureKeys.includes('couple_poster');
  return (['landscape', 'portrait'] as const).filter((o) => both || featureKeys.includes(POSTER_FEATURES[o]));
}

export function hasPosters(featureKeys: readonly string[]) {
  return includedPosters(featureKeys).length > 0;
}
