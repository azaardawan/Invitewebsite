import type { FeatureKey } from './features';

/**
 * Photo collages, each sold by its own feature so a package can include none, some or all of them: the cheaper
 * packages the smaller ones, the dearer ones the collages with more photos. The customer's photos (the same ones the
 * design shows, when it does) fill every collage of their package, so the order form asks for as many photos as the
 * package's largest collage holds. The designs are drawn by `<Collage>` (src/theme-sdk/collage.tsx).
 */
export const COLLAGE_KINDS = {
  /** A3 poster: three polaroids, «Happy Birthday» and the message. */
  polaroids: { feature: 'collage_polaroids', photos: 3 },
  /** Instagram story: four photos and their name. */
  story: { feature: 'collage_story', photos: 4 },
  /** Photo wall (4 × 6 print): nine photos. */
  wall: { feature: 'collage_wall', photos: 9 },
} as const satisfies Record<string, { feature: FeatureKey; photos: number }>;

export type CollageKey = keyof typeof COLLAGE_KINDS;
export const COLLAGE_KEYS = Object.keys(COLLAGE_KINDS) as CollageKey[];

/** The collages a package includes, smallest first. */
export function includedCollages(featureKeys: readonly string[]): CollageKey[] {
  return COLLAGE_KEYS.filter((k) => featureKeys.includes(COLLAGE_KINDS[k].feature));
}

/** How many photos the package's collages need (the largest one's), or 0 without collages. */
export function collagePhotoCount(featureKeys: readonly string[]): number {
  return Math.max(0, ...includedCollages(featureKeys).map((k) => COLLAGE_KINDS[k].photos));
}
