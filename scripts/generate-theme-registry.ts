/**
 * Scans `themes/<key>/v<N>/manifest.ts` and writes `src/theme-registry/generated.ts`.
 * Adding a theme = adding a folder; no hand-edited registration anywhere.
 * Fails (and so fails dev/build/CI) if any manifest is invalid.
 */
import { readdirSync, existsSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { manifestSchema, codeRef } from '../src/theme-sdk/manifest';

const root = path.resolve(import.meta.dirname, '..');
const themesDir = path.join(root, 'themes');
const outFile = path.join(root, 'src/theme-registry/generated.ts');
const loadersFile = path.join(root, 'src/theme-registry/loaders.generated.tsx');
const printFile = path.join(root, 'src/theme-registry/print.generated.ts');

const entries: { key: string; version: number; importPath: string; card: boolean; cardBack: boolean; keepsake: boolean }[] = [];

/**
 * Theme Contract rule 11: a theme must never style the rest of the site.
 * Theme CSS must be CSS Modules without global selectors.
 */
function cssProblems(dir: string): string[] {
  const problems: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const file = path.join(d, name);
      if (statSync(file).isDirectory()) walk(file);
      else if (name.endsWith('.css')) {
        const rel = path.relative(dir, file);
        if (!name.endsWith('.module.css')) problems.push(`${rel}: theme CSS must be a CSS Module (*.module.css)`);
        const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        if (/:global\b/.test(css)) problems.push(`${rel}: :global selectors are not allowed`);
        if (/:root\b/.test(css)) problems.push(`${rel}: :root is not allowed (put variables on the theme's root class)`);
        if (/(^|[\s,}>+~])(html|body)\s*([{,.:\[>+~]|$)/m.test(css)) problems.push(`${rel}: html/body selectors are not allowed`);
      }
    }
  };
  walk(dir);
  return problems;
}
const errors: string[] = [];

for (const key of existsSync(themesDir) ? readdirSync(themesDir).sort() : []) {
  const themeDir = path.join(themesDir, key);
  if (key.startsWith('.') || !statSync(themeDir).isDirectory() || !readdirSync(themeDir, { withFileTypes: true }).length) continue;
  for (const dirent of readdirSync(themeDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const match = /^v(\d+)$/.exec(dirent.name);
    if (!match) {
      errors.push(`themes/${key}/${dirent.name}: version folders must be named v1, v2, …`);
      continue;
    }
    const manifestPath = path.join(themeDir, dirent.name, 'manifest.ts');
    if (!existsSync(manifestPath)) {
      errors.push(`themes/${key}/${dirent.name}: missing manifest.ts`);
      continue;
    }
    if (!existsSync(path.join(themeDir, dirent.name, 'Theme.tsx'))) {
      errors.push(`themes/${key}/${dirent.name}: missing Theme.tsx (the theme component)`);
      continue;
    }
    const mod = await import(pathToFileURL(manifestPath).href);
    const parsed = manifestSchema.safeParse(mod.default);
    if (!parsed.success) {
      errors.push(`themes/${key}/${dirent.name}/manifest.ts:\n  ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('\n  ')}`);
      continue;
    }
    if (parsed.data.key !== key || parsed.data.version !== Number(match[1])) {
      errors.push(`themes/${key}/${dirent.name}: manifest says ${codeRef(parsed.data)}; it must match its folder`);
      continue;
    }
    for (const problem of cssProblems(path.join(themeDir, dirent.name))) errors.push(`themes/${key}/${dirent.name}/${problem}`);
    const card = existsSync(path.join(themeDir, dirent.name, 'print/Card.tsx'));
    const keepsake = existsSync(path.join(themeDir, dirent.name, 'print/Keepsake.tsx'));
    // Optional: the back of the printable card. Without it the platform prints a simple back.
    const cardBack = card && existsSync(path.join(themeDir, dirent.name, 'print/CardBack.tsx'));
    if (parsed.data.print?.card && !card) errors.push(`themes/${key}/${dirent.name}: manifest declares print.card but print/Card.tsx is missing`);
    if (parsed.data.print?.keepsake && !keepsake) errors.push(`themes/${key}/${dirent.name}: manifest declares print.keepsake but print/Keepsake.tsx is missing`);
    entries.push({ key, version: parsed.data.version, importPath: `../../themes/${key}/${dirent.name}/manifest`, card, cardBack, keepsake });
  }
}

if (errors.length) {
  console.error(`Theme registry errors:\n${errors.join('\n')}`);
  process.exit(1);
}

entries.sort((a, b) => a.key.localeCompare(b.key) || a.version - b.version);

// Every theme has a permanent number ("theme 7"), kept in themes/numbers.json. A new theme folder gets the next
// free number here; commit the file with the theme. Numbers are never reused, even after a theme is removed.
const numbersFile = path.join(themesDir, 'numbers.json');
const numbers: Record<string, number> = existsSync(numbersFile) ? JSON.parse(readFileSync(numbersFile, 'utf8')) : {};
const seen = new Map<number, string>();
for (const [key, n] of Object.entries(numbers)) {
  if (!Number.isInteger(n) || n < 1) errors.push(`themes/numbers.json: "${key}" must have a whole number from 1`);
  else if (seen.has(n)) errors.push(`themes/numbers.json: ${n} is used by both "${seen.get(n)}" and "${key}"`);
  seen.set(n, key);
}
const unnumbered = [...new Set(entries.map((e) => e.key))].filter((k) => !(k in numbers));
if (unnumbered.length && process.env.CI) errors.push(`themes/numbers.json has no number for: ${unnumbered.join(', ')} (run pnpm themes:registry and commit the file)`);
if (errors.length) {
  console.error(`Theme registry errors:\n${errors.join('\n')}`);
  process.exit(1);
}
if (unnumbered.length) {
  let next = Math.max(0, ...Object.values(numbers)) + 1;
  for (const key of unnumbered) numbers[key] = next++;
  writeFileSync(numbersFile, `${JSON.stringify(numbers, null, 2)}\n`);
  console.log(`Theme numbers added: ${unnumbered.map((k) => `${k} = ${numbers[k]}`).join(', ')}. Commit themes/numbers.json.`);
}
const source = `// GENERATED by scripts/generate-theme-registry.ts — do not edit. Regenerated on dev/build/test.
import type { ThemeManifest } from '@/theme-sdk/manifest';
${entries.map((e, i) => `import m${i} from '${e.importPath}';`).join('\n')}

export const generatedManifests: ThemeManifest[] = [${entries.map((_, i) => `m${i}`).join(', ')}];

/** Each theme's permanent number (themes/numbers.json). */
export const themeNumbers: Record<string, number> = ${JSON.stringify(numbers)};
`;
if (!existsSync(outFile) || readFileSync(outFile, 'utf8') !== source) writeFileSync(outFile, source);

// Each theme version is a separate lazy chunk (JS *and* CSS): a page downloads only the theme it shows.
const loaders = `// GENERATED by scripts/generate-theme-registry.ts — do not edit.
'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { ThemeProps } from '@/theme-sdk/types';

const themes: Record<string, ComponentType<ThemeProps>> = {
${entries.map((e) => `  '${e.key}@${e.version}': dynamic(() => import('${e.importPath.replace(/manifest$/, 'Theme')}')),`).join('\n')}
};

/** Renders the theme for \`codeRef\`; only that theme's code and styles are loaded. */
export function ThemeHost({ codeRef, ...props }: ThemeProps & { codeRef: string }) {
  const Theme = themes[codeRef];
  return Theme ? <Theme {...props} /> : null;
}
`;
if (!existsSync(loadersFile) || readFileSync(loadersFile, 'utf8') !== loaders) writeFileSync(loadersFile, loaders);
// Print companions (server-only): loaded by the print route that Chromium turns into PDFs.
const printSource = `// GENERATED by scripts/generate-theme-registry.ts — do not edit.
import 'server-only';
import type { ComponentType } from 'react';
import type { KeepsakeProps, PrintCardBackProps, PrintCardProps } from '@/theme-sdk/print';

type Loader<P> = () => Promise<{ default: ComponentType<P> }>;
export type PrintLoaders = { card?: Loader<PrintCardProps>; cardBack?: Loader<PrintCardBackProps>; keepsake?: Loader<KeepsakeProps> };

export const printComponents: Record<string, PrintLoaders> = {
${entries
  .map((e) => {
    const dir = e.importPath.replace(/\/manifest$/, '');
    const parts = [e.card ? `card: () => import('${dir}/print/Card')` : '', e.cardBack ? `cardBack: () => import('${dir}/print/CardBack')` : '', e.keepsake ? `keepsake: () => import('${dir}/print/Keepsake')` : ''].filter(Boolean);
    return `  '${e.key}@${e.version}': { ${parts.join(', ')} },`;
  })
  .join('\n')}
};
`;
if (!existsSync(printFile) || readFileSync(printFile, 'utf8') !== printSource) writeFileSync(printFile, printSource);
console.log(`Theme registry: ${entries.length} theme version(s).`);
