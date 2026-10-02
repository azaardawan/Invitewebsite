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
