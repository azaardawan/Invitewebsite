/**
 * Regenerates the hand-off screens, motion recording and print proofs for
 * olive-ring-box v1 from the development theme lab.
 *
 *   pnpm build && pnpm exec next start -p 3300 &
 *   BASE_URL=http://localhost:3300 pnpm exec tsx docs/themes/olive-ring-box/capture.ts
 *
 * Output: design/screens/*.png, motion/opening-390.webm, print/card/*.pdf,
 * print/keepsake/*.pdf (all relative to this folder).
 */
import { mkdirSync, renameSync, rmSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { chromium, type Browser, type Page } from '@playwright/test';
import sharp from 'sharp';

const base = process.env.BASE_URL ?? 'http://localhost:3300';
const here = path.dirname(new URL(import.meta.url).pathname);
const out = (...p: string[]) => {
  const file = path.join(here, ...p);
  mkdirSync(path.dirname(file), { recursive: true });
  return file;
};
const lab = (sub: string, query: string) => `${base}/dev/themes/olive-ring-box@1${sub}?${query}`;

const browser: Browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);

async function page(width: number, height = 844, opts: { reducedMotion?: boolean } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const p = await context.newPage();
  if (opts.reducedMotion) await p.emulateMedia({ reducedMotion: 'reduce' });
  return p;
}

async function png(file: string, buf: Buffer) {
  await sharp(buf).png({ compressionLevel: 9, palette: true, quality: 92 }).toFile(out('design/screens', file));
  console.log(`screens/${file}`);
}

async function openInvitation(p: Page) {
  await p.getByRole('button', { name: /افتح الدعوة|Open invitation/ }).click();
  await p.waitForSelector('[data-stage="done"]', { timeout: 8000 });
  // Scroll through so every section has revealed, then back to the top.
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 300) {
    await p.evaluate((top) => window.scrollTo(0, top), y);
    await p.waitForTimeout(90);
  }
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(700);
}

// 01–02: the opening, closed and mid-sequence ------------------------------------------------
for (const locale of ['ar', 'en'] as const) {
  const p = await page(390);
  await p.goto(lab('', `locale=${locale}`), { waitUntil: 'networkidle' });
  await png(`01-closed-${locale}.png`, await p.screenshot());
  if (locale === 'ar') {
    await p.getByRole('button', { name: 'افتح الدعوة' }).click();
    const t0 = Date.now();
    for (const [ms, label] of [[600, 'a-lid-lifting'], [1500, 'b-open-glow'], [2350, 'c-light-wash']] as const) {
      await p.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
      await png(`02-opening-${label}.png`, await p.screenshot());
    }
  }
  await p.context().close();
}

// 03: the invitation per package, short and long content, Arabic and English --------------------
const packages = [
  ['normal', 0],
  ['vip', 1],
  ['vvip', 2],
] as const;
for (const [name, state] of packages) {
  for (const sample of ['short', 'long'] as const) {
    for (const locale of name === 'vvip' ? (['ar', 'en'] as const) : (['ar'] as const)) {
      const p = await page(390);
      await p.goto(lab('', `state=${state}&sample=${sample}&locale=${locale}`), { waitUntil: 'networkidle' });
      await openInvitation(p);
      await png(`03-invitation-${name}-${sample}-${locale}.png`, await p.screenshot({ fullPage: true }));
      await p.context().close();
    }
  }
}

// 04: other widths and desktop ---------------------------------------------------------------------
for (const [width, height] of [[360, 780], [430, 932], [1280, 800]] as const) {
  const p = await page(width, height);
  await p.goto(lab('', 'state=2&sample=long&music=1'), { waitUntil: 'networkidle' });
  await openInvitation(p);
  await png(`04-width-${width}-vvip-long-ar.png`, await p.screenshot({ fullPage: width !== 1280 }));
  await p.context().close();
}

// 05: guest form states (VVIP) ---------------------------------------------------------------------
{
  const p = await page(390);
  await p.goto(lab('', 'state=2'), { waitUntil: 'networkidle' });
  await openInvitation(p);
  const form = p.locator('form');
  await form.scrollIntoViewIfNeeded();
  await png('05-form-empty.png', await form.screenshot());
  await p.getByRole('button', { name: 'إرسال الرد' }).click();
  await png('05-form-error.png', await form.screenshot());
  await p.getByLabel('اسمك').fill('خالد الجبوري');
  await p.getByRole('radio', { name: 'سأحضر بإذن الله' }).check();
  await p.getByRole('textbox', { name: /رسالتك/ }).fill('ألف مبروك! بارك الله لكما وبارك عليكما وجمع بينكما في خير.');
  await p.getByRole('button', { name: 'إرسال الرد' }).click();
  await png('05-form-sending.png', await form.screenshot());
  const success = p.getByRole('status');
  await success.waitFor();
  await png('05-form-success.png', await success.screenshot());
  await p.context().close();
}
{
  const p = await page(390);
  await p.goto(lab('', 'state=1&locale=en'), { waitUntil: 'networkidle' });
  await openInvitation(p);
  await p.getByRole('button', { name: 'Send reply' }).click();
  await png('05-form-error-vip-en.png', await p.locator('form').screenshot());
  await p.context().close();
}

// 06: audio toggle on / off (top-left in Arabic, top-right in English) ---------------------------
for (const locale of ['ar', 'en'] as const) {
  const p = await page(390);
  await p.goto(lab('', `locale=${locale}&music=1`), { waitUntil: 'networkidle' });
  await openInvitation(p);
  await png(`06-audio-on-${locale}.png`, await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 200 } }));
  if (locale === 'ar') {
    await p.getByRole('button', { name: /الموسيقى/ }).click();
    await png('06-audio-off-ar.png', await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 200 } }));
  }
  await p.context().close();
}

// 07: reduced motion: the invitation appears directly ------------------------------------------------
{
  const p = await page(390, 844, { reducedMotion: true });
  await p.goto(lab('', 'state=2'), { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'افتح الدعوة' }).click();
  await p.waitForTimeout(400);
  await png('07-reduced-motion-after-tap.png', await p.screenshot());
  await p.context().close();
}

// Motion reference: the full opening at 390 px --------------------------------------------------------
{
  const videoDir = out('motion/.tmp');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: videoDir, size: { width: 390, height: 844 } } });
  const p = await context.newPage();
  await p.goto(lab('', 'state=2'), { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: 'افتح الدعوة' }).click();
  await p.waitForTimeout(4500);
  await context.close();
  const [file] = readdirSync(videoDir);
  renameSync(path.join(videoDir, file!), out('motion/opening-390.webm'));
  rmSync(videoDir, { recursive: true });
  console.log('motion/opening-390.webm');
}

// Print proofs ----------------------------------------------------------------------------------------
async function pdf(url: string, file: string) {
  const p = await page(900, 1200);
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: out(file), preferCSSPageSize: true, printBackground: true });
  await p.context().close();
  console.log(file);
}
for (const locale of ['ar', 'en'] as const) {
  for (const sample of ['short', 'long'] as const) {
    await pdf(lab('/card', `locale=${locale}&sample=${sample}`), `print/card/card-a5-${sample}-${locale}.pdf`);
  }
}
await pdf(lab('/keepsake', 'count=3&sample=short'), 'print/keepsake/keepsake-a4-3-messages-ar.pdf');
await pdf(lab('/keepsake', 'count=200&sample=long'), 'print/keepsake/keepsake-a4-200-messages-ar.pdf');
await pdf(lab('/keepsake', 'count=3&locale=en&sample=long'), 'print/keepsake/keepsake-a4-3-messages-en.pdf');

await browser.close();
