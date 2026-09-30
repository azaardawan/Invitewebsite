/**
 * Renders the olive-ring-box artwork layers.
 *
 *   pnpm exec tsx docs/themes/olive-ring-box/assets-src/render-layers.ts
 *
 * - Writes every layer's source SVG to `assets-src/svg/`.
 * - Rasterizes textured layers in Chromium at 2× and saves transparent WebP
 *   (quality 80) to `themes/olive-ring-box/v1/assets/`.
 * - Copies simple ornaments (branches, glow, particle, shimmer) there as SVG.
 * - Fails if an image exceeds its size budget (150 KB, background 250 KB).
 *
 * Only run this while v1 is still in DEVELOPMENT: an activated version is frozen.
 */
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { LAYERS } from './layers';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '../../../..');
const srcDir = path.join(here, 'svg');
const outDir = path.join(root, 'themes/olive-ring-box/v1/assets');
mkdirSync(srcDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ deviceScaleFactor: 2 });
const problems: string[] = [];

for (const layer of LAYERS) {
  writeFileSync(path.join(srcDir, `${layer.name}.svg`), layer.svg);
  let out: string;
  if (layer.format === 'svg') {
    out = path.join(outDir, `${layer.name}.svg`);
    writeFileSync(out, layer.svg);
  } else {
    await page.setViewportSize({ width: layer.width, height: layer.height });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:transparent">${layer.svg}</body></html>`,
    );
    const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: layer.width, height: layer.height } });
    out = path.join(outDir, `${layer.name}.webp`);
    await sharp(png).webp({ quality: 80, alphaQuality: 90, effort: 6 }).toFile(out);
  }
  const kb = statSync(out).size / 1024;
  const budget = layer.name === 'background' ? 250 : 150;
  if (kb > budget) problems.push(`${path.basename(out)} is ${kb.toFixed(0)} KB (budget ${budget} KB)`);
  console.log(`${path.basename(out).padEnd(26)} ${layer.width * 2}×${layer.height * 2}  ${kb.toFixed(1)} KB`);
}

await browser.close();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
