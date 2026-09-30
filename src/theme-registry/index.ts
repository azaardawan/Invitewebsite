import { manifestSchema, codeRef, type ThemeManifest } from '@/theme-sdk/manifest';
import { generatedManifests } from './generated';

/** All theme versions present in this build, validated. */
export function themeManifests(): ThemeManifest[] {
  return generatedManifests.map((m) => manifestSchema.parse(m) as ThemeManifest);
}

export function manifestByCodeRef(ref: string): ThemeManifest | undefined {
  return themeManifests().find((m) => codeRef(m) === ref);
}
