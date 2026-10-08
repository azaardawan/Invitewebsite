import 'server-only';
import { chromium, type Browser } from 'playwright-core';
import { PDFDocument } from 'pdf-lib';
import { env } from '@/server/env';
import { printToken, type RenderKind } from './tokens';

export type PdfRenderer = (kind: RenderKind, invitationId: string) => Promise<Buffer>;

function printOrigin() {
  return (env().PRINT_ORIGIN ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`).replace(/\/$/, '');
}

/**
 * Opens this app's internal print page in headless Chromium and saves it as
 * a PDF at the page size the print page declares (`@page`). Arabic and
 * Kurdish shaping, RTL and the theme's embedded fonts come out right because
 * it is a real browser. Cards are printed one side at a time (portrait front, landscape back) and joined,
 * so each side's border is laid out for its own page shape.
 */
export const renderPdf: PdfRenderer = async (kind, invitationId) => {
  const browser = await chromium.launch({
    executablePath: env().CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  try {
    const url = `/print/${printToken(kind, invitationId)}`;
    if (kind !== 'card' && kind !== 'cardBleed') return await pdfOf(browser, url);
    const merged = await PDFDocument.create();
    for (const side of ['front', 'back']) {
      const part = await PDFDocument.load(await pdfOf(browser, `${url}?view=${side}`));
      for (const p of await merged.copyPages(part, part.getPageIndices())) merged.addPage(p);
    }
    return Buffer.from(await merged.save());
  } finally {
    await browser.close();
  }
};

async function pdfOf(browser: Browser, path: string) {
  const page = await browser.newPage();
  const res = await page.goto(`${printOrigin()}${path}`, { waitUntil: 'networkidle', timeout: 60_000 });
  if (!res?.ok()) throw new Error(`Print page answered ${res?.status() ?? 'nothing'}`);
  await page.evaluate(() => document.fonts.ready);
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true });
  await page.close();
  return pdf;
}

export type PreviewKind = 'card' | 'cardBack' | 'keepsake' | 'og';
export type PreviewRenderer = (kind: PreviewKind, invitationId: string) => Promise<Buffer>;

const PX_PER_MM = 96 / 25.4;
/** Viewport in px: page sizes of what the customer gets (A5 card portrait, back landscape, A4 cover), and 1200 × 630 for link previews. */
const PREVIEW_VIEWPORT: Record<PreviewKind, { width: number; height: number; scale: number }> = {
  card: { width: Math.round(148 * PX_PER_MM), height: Math.round(210 * PX_PER_MM), scale: 1.2 },
  cardBack: { width: Math.round(210 * PX_PER_MM), height: Math.round(148 * PX_PER_MM), scale: 1.2 },
  keepsake: { width: Math.round(210 * PX_PER_MM), height: Math.round(297 * PX_PER_MM), scale: 1 },
  og: { width: 1200, height: 630, scale: 1 },
};

/**
 * A picture rendered in the same browser as the PDFs: a document page (print page, captured as a JPEG
 * instead of a PDF) or, for `og`, the invitation's cover as a guest first sees it.
 */
export const renderPreview: PreviewRenderer = async (kind, invitationId) => {
  const browser = await chromium.launch({
    executablePath: env().CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  try {
    const v = PREVIEW_VIEWPORT[kind];
    const page = await browser.newPage({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.scale, reducedMotion: 'reduce' });
    if (kind !== 'og') await page.emulateMedia({ media: 'print' });
    const url =
      kind === 'og'
        ? `/print/${printToken('og', invitationId)}`
        : kind === 'cardBack'
          ? `/print/${printToken('card', invitationId)}?view=back`
          : `/print/${printToken(kind, invitationId)}`;
    const res = await page.goto(`${printOrigin()}${url}`, { waitUntil: 'networkidle', timeout: 60_000 });
    if (!res?.ok()) throw new Error(`Print page answered ${res?.status() ?? 'nothing'}`);
    await page.evaluate(() => document.fonts.ready);
    // The cover's images and entrance settle.
    if (kind === 'og') await page.waitForTimeout(800);
    return await page.screenshot({ type: 'jpeg', quality: 82 });
  } finally {
    await browser.close();
  }
};
