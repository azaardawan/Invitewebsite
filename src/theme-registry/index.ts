import { manifestSchema, codeRef, type ThemeManifest } from '@/theme-sdk/manifest';
import { generatedManifests, themeNumbers } from './generated';

/** All theme versions present in this build, validated. */
export function themeManifests(): ThemeManifest[] {
  return generatedManifests.map((m) => manifestSchema.parse(m) as ThemeManifest);
}

export function manifestByCodeRef(ref: string): ThemeManifest | undefined {
  return themeManifests().find((m) => codeRef(m) === ref);
}

/** The theme's permanent number ("theme 7"), shown in Admin; undefined only for a theme without code. */
export function themeNumber(key: string): number | undefined {
  return themeNumbers[key];
}

/** The theme key for a number, e.g. from an Admin search for "7" or "#7". */
export function themeKeyByNumber(n: number): string | undefined {
  return Object.entries(themeNumbers).find(([, num]) => num === n)?.[0];
}
