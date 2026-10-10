import { manifestSchema, codeRef, type ThemeManifest } from '@/theme-sdk/manifest';
import { generatedManifests, themeContentHashes } from './generated';

/** All theme versions present in this build, validated. */
export function themeManifests(): ThemeManifest[] {
  return generatedManifests.map((m) => manifestSchema.parse(m) as ThemeManifest);
}

export function manifestByCodeRef(ref: string): ThemeManifest | undefined {
  return themeManifests().find((m) => codeRef(m) === ref);
}

/** Design kits make downloadable files instead of an online invitation page. */
export function isDesignKit(ref: string): boolean {
  return manifestByCodeRef(ref)?.experience === 'DESIGN_KIT';
}

/** Changes whenever anything in the version's folder changes (empty if the version isn't in this build). */
export function themeContentHash(ref: string): string {
  return themeContentHashes[ref] ?? '';
}
