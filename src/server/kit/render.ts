import 'server-only';
import { chromium, type Browser } from 'playwright-core';
import sharp from 'sharp';
import { pngSpec, pngTarget, sheetLayout, unitGeometry } from '@/catalog/kit';
import { env } from '@/server/env';
import { renderToken, type KitJob } from './token';

/**
 * Turns one kit job into a file with headless Chromium (correct Arabic and
 * Kurdish shaping, the same rendering as the preview). The browser opens the
 * app's own `/k/<signed token>` page, waits until fonts and images are ready,
 * then prints a PDF or takes a PNG screenshot.
 */

let browser: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browser) {
    const e = env();
    browser = chromium
      .launch({ executablePath: e.KIT_CHROMIUM_PATH, args: ['--font-render-hinting=none'] })
      .then((b) => {
        b.on('disconnected', () => {
          browser = null;
        });
        return b;
      })
      .catch((err) => {
        browser = null;
        throw err;
      });
  }
  return browser;
}

// Chromium is memory-hungry: at most two files are drawn at once; the rest wait their turn.
const MAX_PARALLEL = 2;
let running = 0;
const waiting: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= MAX_PARALLEL) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
  try {
    return await fn();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

export function renderOrigin() {
  const e = env();
  return (e.KIT_RENDER_ORIGIN ?? `http://127.0.0.1:${e.PORT}`).replace(/\/$/, '');
}

export async function renderKitFile(job: KitJob): Promise<Buffer> {
  return slot(async () => {
    const b = await getBrowser();
    const g = unitGeometry(job.unit, job.options.bottle);
    const png = job.format === 'png' ? pngSpec(job.unit) : null;
    const context = await b.newContext({
      viewport: png ? { width: Math.ceil(g.width), height: Math.ceil(g.height) } : { width: 800, height: 1100 },
      deviceScaleFactor: png?.scale ?? 1,
    });
    try {
      const page = await context.newPage();
      const res = await page.goto(`${renderOrigin()}/k/${renderToken(job)}`, { waitUntil: 'load', timeout: 30_000 });
      if (!res?.ok()) throw new Error(`kit render page returned ${res?.status()}`);
      await page.waitForSelector('body[data-kit-ready="1"]', { state: 'attached', timeout: 30_000 });
      if (job.format === 'pdf') {
        if (job.unit === 'story') throw new Error('the story is PNG only');
        const sheet = sheetLayout(job.unit, job.options.bottle);
        return await page.pdf({ width: `${sheet.pageW}mm`, height: `${sheet.pageH}mm`, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
      }
      const inset = png!.trimOnly ? g.bleed : 0;
      const shot = await page.screenshot({
        type: 'png',
        omitBackground: g.shape === 'circle',
        clip: { x: inset, y: inset, width: g.width - 2 * inset, height: g.height - 2 * inset },
      });
      // Screenshots snap to whole CSS pixels; settle on the exact print size and record its DPI.
      const target = pngTarget(job.unit, job.options.bottle);
      return await sharp(shot).resize(target.width, target.height, { fit: 'fill' }).withMetadata({ density: target.dpi }).png({ compressionLevel: 9 }).toBuffer();
    } finally {
      await context.close();
    }
  });
}
