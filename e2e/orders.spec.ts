import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

type Fixture = { previewToken: string; paidReceiptToken: string; orderNumber: string; invoiceNumber: string; path: string };

function makeOrder(): Fixture {
  const out = execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('personalized preview, private receipt and admin order list', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'stateful flow runs once');
  const f = makeOrder();

  // Pre-payment preview: the customer's own content, PREVIEW label, not indexable.
  const res = await request.get(`/p/${f.previewToken}`);
  expect(res.headers()['x-robots-tag']).toContain('noindex');
  await page.goto(`/p/${f.previewToken}`);
  await expect(page.getByRole('heading', { name: 'ليان' })).toBeVisible();
  await expect(page.getByRole('note')).toHaveText('معاينة');
  await page.goto('/p/not-a-real-token');
  await expect(page.getByText('انتهت صلاحية رابط المعاينة')).toBeVisible();

  // Paid order receipt (English order): invoice, dates, link, WhatsApp share.
  await page.goto(`/r/${f.paidReceiptToken}`);
  await expect(page.getByRole('heading', { name: 'Payment received' })).toBeVisible();
  await expect(page.getByText(f.invoiceNumber)).toBeVisible();
  await expect(page.getByText(f.orderNumber)).toBeVisible();
  await expect(page.getByText(f.path)).toBeVisible();
  const wa = page.getByRole('link', { name: 'Share the invitation on WhatsApp' });
  expect(await wa.getAttribute('href')).toContain(encodeURIComponent(f.path));
  // The order number alone opens nothing.
  await page.goto(`/r/${f.orderNumber}`);
  await expect(page.getByText('This link is not valid.')).toHaveCount(0);
  await expect(page.getByText('هذا الرابط غير صالح.')).toBeVisible();

  // Admin sees the order; contact details visible to the owner.
  await signInAsNewOwner(page);
  await page.goto(`/admin/orders?q=${f.orderNumber}`);
  await expect(page.getByText(f.orderNumber)).toBeVisible();
  await expect(page.getByText(f.invoiceNumber)).toBeVisible();
  await expect(page.getByText('+9647701234567').first()).toBeVisible();
});
