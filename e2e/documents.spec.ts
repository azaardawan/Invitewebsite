import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

function paidCardOrder(): { receiptToken: string } {
  const out = execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-card-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('the customer downloads a real printable card PDF from their receipt', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'stateful flow runs once');
  test.setTimeout(120_000);
  const { receiptToken } = paidCardOrder();

  await page.goto(`/r/${receiptToken}`);
  const link = page.getByRole('link', { name: 'تحميل بطاقة الطباعة (PDF)' });
  await expect(link).toBeVisible();

  const res = await request.get(`/r/${receiptToken}/card`);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('application/pdf');
  const pdf = await res.body();
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  // Exactly A5 = 148 × 210 mm ≈ 419.5 × 595.3 pt (Chromium rounds to whole pixels).
  const box = /\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/.exec(pdf.toString('latin1'));
  expect(Math.abs(Number(box?.[1]) - 419.5)).toBeLessThan(1);
  expect(Math.abs(Number(box?.[2]) - 595.3)).toBeLessThan(1);
  await testInfo.attach('card.pdf', { body: pdf, contentType: 'application/pdf' });
  // Two sides: the front and the back, both A5.
  const doc = await PDFDocument.load(pdf);
  expect(doc.getPageCount()).toBe(2);
  for (const p of doc.getPages()) expect(Math.abs(p.getWidth() - 419.5)).toBeLessThan(1);

  // The print page itself is not reachable without a valid signed token.
  expect((await request.get('/print/card.00000000-0000-0000-0000-000000000000.9999999999.bad')).status()).toBe(404);
  expect((await request.get('/r/not-a-real-token/card')).status()).toBe(404);
  // This package has no keepsake.
  expect((await request.get(`/r/${receiptToken}/keepsake`)).status()).toBe(404);
  expect((await request.get(`/r/${receiptToken}/preview/keepsake`)).status()).toBe(404);
  // The receipt shows a picture of the card's first page.
  const preview = await request.get(`/r/${receiptToken}/preview/card`);
  expect(preview.status()).toBe(200);
  expect(preview.headers()['content-type']).toBe('image/jpeg');
  expect((await request.get(`/r/${receiptToken}/card?inline=1`)).headers()['content-disposition']).toMatch(/^inline;/);

  // Admin: the print-shop version keeps the 3 mm bleed (154 × 216 mm ≈ 436.5 × 612.3 pt).
  await signInAsNewOwner(page);
  await page.goto('/admin/invitations');
  await page.getByRole('link', { name: 'إدارة' }).first().click();
  const href = await page.getByRole('link', { name: 'نسخة المطبعة (هامش قص ٣ مم)' }).getAttribute('href');
  const shop = await page.request.get(href!);
  expect(shop.status()).toBe(200);
  const shopBox = /\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/.exec((await shop.body()).toString('latin1'));
  expect(Math.abs(Number(shopBox?.[1]) - 436.5)).toBeLessThan(1);
  expect(Math.abs(Number(shopBox?.[2]) - 612.3)).toBeLessThan(1);
});
