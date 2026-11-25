import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

/**
 * Guest photo sharing (owner, 2026-11-21): the add-on on the order form (price from the total only), the guests'
 * upload page (name, photos, their own share, removing their own), and the couple's receipt (photos by guest, the
 * ZIP of ZIPs, the photo QR code). `GUEST_PHOTO_SHOTS=<folder>` saves pictures of the screens.
 */
const script = (file: string) =>
  JSON.parse(
    execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', file], { env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL } })
      .toString()
      .trim()
      .split('\n')
      .at(-1)!,
  );
const shots = process.env.GUEST_PHOTO_SHOTS;
const shot = async (page: Page, name: string) => {
  if (!shots) return;
  mkdirSync(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
};
const jpeg = (r: number) => sharp({ create: { width: 64, height: 48, channels: 3, background: { r, g: 120, b: 90 } } }).jpeg().toBuffer();

test('guest photo sharing: bought on the order form, guests upload, the couple downloads', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  test.setTimeout(240_000);
  await signInAsNewOwner(page);
  script('e2e/scripts/make-order.ts');
  const made = script('e2e/scripts/make-guest-photos-order.ts') as { receiptToken: string; uploadToken: string; amountIqd: number };
  // 35,000 (package) + 15,000 (750 photos) + 5,000 (50 more).
  expect(made.amountIqd).toBe(55000);

  // The order form: the add-on at the end, priced only by the total.
  await page.setViewportSize({ width: 430, height: 900 });
  await page.goto('/en/themes/demo-minimal#packages');
  await page.locator('#packages a[href*="/themes/demo-minimal/order?pkg="]').first().click();
  const addOn = page.locator('[data-guest-photos]');
  await addOn.getByRole('checkbox').check();
  await addOn.getByRole('button', { name: '10', exact: true }).click();
  await expect(addOn).toContainText('15,000');
  await addOn.getByRole('button', { name: 'More photos' }).click();
  await addOn.getByRole('button', { name: 'More photos' }).click();
  await expect(addOn.locator('output')).toHaveText('850');
  await expect(addOn).toContainText('25,000');
  await addOn.scrollIntoViewIfNeeded();
  await shot(page, '1-order-form');

  // A guest's phone: name, two photos, one removed.
  await page.goto(`/g/${made.uploadToken}`);
  await expect(page.getByRole('heading', { name: 'Layan' })).toBeVisible();
  await page.getByLabel('Your name').fill('Sara Ahmed');
  await page.locator('input[type=file][multiple]').setInputFiles([
    { name: 'a.jpg', mimeType: 'image/jpeg', buffer: await jpeg(10) },
    { name: 'b.jpg', mimeType: 'image/jpeg', buffer: await jpeg(200) },
  ]);
  await expect(page.locator('[data-guest-count]')).toHaveText('2 of 5');
  // The same photo again is refused.
  await page.locator('input[type=file][multiple]').setInputFiles([{ name: 'a.jpg', mimeType: 'image/jpeg', buffer: await jpeg(10) }]);
  await expect(page.locator('main section').getByRole('alert')).toContainText('already sent');
  await shot(page, '2-guest-page');
  await page.getByRole('button', { name: 'Remove this photo' }).first().click();
  await expect(page.locator('[data-guest-count]')).toHaveText('1 of 5');
  // The phone is remembered: after a reload it still sees its photo.
  await page.reload();
  await expect(page.locator('[data-guest-count]')).toHaveText('1 of 5');

  // The couple's receipt: the photo under the guest's name, the ZIP and the QR code.
  await page.goto(`/r/${made.receiptToken}`);
  const section = page.locator('[data-guest-photos]');
  await expect(section).toContainText('Sara Ahmed');
  await expect(section).toContainText('1 photo from 1 guest');
  await section.scrollIntoViewIfNeeded();
  await shot(page, '3-receipt');
  const zip = await page.request.get(`/r/${made.receiptToken}/guest-photos/zip`);
  expect(zip.headers()['content-type']).toBe('application/zip');
  const body = await zip.body();
  expect(body.subarray(0, 4).toString('hex')).toBe('504b0304');
  expect(body.toString('latin1')).toContain('Sara Ahmed.zip');
  const qr = await page.request.get(`/r/${made.receiptToken}/guest-photos/qr`);
  expect(qr.headers()['content-type']).toBe('image/png');
  // Nobody else sees the photos: another phone has none, and a wrong receipt link finds nothing.
  await page.context().clearCookies({ name: /^bahja_gp_/ });
  await page.goto(`/g/${made.uploadToken}`);
  await expect(page.locator('[data-guest-count]')).toHaveText('0 of 5');
  expect((await page.request.get(`/r/not-a-real-receipt/guest-photos/zip`)).status()).toBe(404);
});
