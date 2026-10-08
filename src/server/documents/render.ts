import 'server-only';
import { chromium } from 'playwright-core';
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
 * it is a real browser.
 */
export const renderPdf: PdfRenderer = async (kind, invitationId) => {
  const browser = await chromium.launch({
    executablePath: env().CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  try {
    const page = await browser.newPage();
    const res = await page.goto(`${printOrigin()}/print/${printToken(kind, invitationId)}`, { waitUntil: 'networkidle', timeout: 60_000 });
    if (!res?.ok()) throw new Error(`Print page answered ${res?.status() ?? 'nothing'}`);
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true });
  } finally {
    await browser.close();
  }
};

export type PreviewRenderer = (kind: 'card' | 'keepsake', invitationId: string) => Promise<Buffer>;

/** Page sizes in mm of what the customer gets: the A5 card (bleed cropped) and the keepsake's A4 cover. */
const PREVIEW_PAGE_MM = { card: [148, 210], keepsake: [210, 297] } as const;
const PX_PER_MM = 96 / 25.4;

/**
 * A picture of the document's first page (the card, or the keepsake cover) for the customer's receipt:
 * the same print page rendered in the same browser, captured as a JPEG instead of a PDF.
 */
export const renderPreview: PreviewRenderer = async (kind, invitationId) => {
  const browser = await chromium.launch({
    executablePath: env().CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  try {
    const [w, h] = PREVIEW_PAGE_MM[kind];
    const page = await browser.newPage({ viewport: { width: Math.round(w * PX_PER_MM), height: Math.round(h * PX_PER_MM) }, deviceScaleFactor: kind === 'card' ? 1.2 : 1 });
    await page.emulateMedia({ media: 'print' });
    const res = await page.goto(`${printOrigin()}/print/${printToken(kind, invitationId)}`, { waitUntil: 'networkidle', timeout: 60_000 });
    if (!res?.ok()) throw new Error(`Print page answered ${res?.status() ?? 'nothing'}`);
    await page.evaluate(() => document.fonts.ready);
    return await page.screenshot({ type: 'jpeg', quality: 82 });
  } finally {
    await browser.close();
  }
};
