import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { E2E_DATABASE_URL } from './helpers';

const fixture = (paid: boolean) =>
  JSON.parse(
    execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-newborn-order.ts'], {
      env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, PAID: paid ? '1' : '0' },
    })
      .toString()
      .trim()
      .split('\n')
      .at(-1)!,
  ) as { previewToken: string; receiptToken: string | null };

test('newborn extras: watermarked previews before paying, clean files to download after', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(240_000);

  // Before paying: the review page shows every extra, watermarked, with the note.
  const draft = fixture(false);
  await page.goto(`/order/${draft.previewToken}`);
  const extras = page.locator('#extras');
  await expect(extras.getByRole('note')).toContainText('تُزال العلامة بعد الشراء');
  for (const key of ['card', 'story', 'sticker', 'bottle']) await expect(extras.locator(`[data-extra=${key}] img`)).toBeVisible();
  await expect.poll(() => extras.locator('[data-extra=story] img').evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 60_000 }).toBeGreaterThan(400);
  await extras.screenshot({ path: testInfo.outputPath('review-extras.png') });
  // The files themselves are not given out before payment.
  expect((await request.get(`/p/${draft.previewToken}/extra/story.png`)).status()).toBe(404);

  // The occasion lists its designs under Boy and Girl; one from the Girl group starts with "girl" chosen.
  await page.goto('/occasions/newborn');
  await expect(page.getByRole('heading', { name: 'بنت', exact: true })).toBeVisible();
  await page.goto('/themes/demo-newborn/order');
  await expect(page.getByRole('radiogroup', { name: 'ولد أم بنت' }).getByRole('radio', { name: 'بنت' })).toBeChecked();

  // The order form: the baby's details, boy or girl (changed to boy), and the sticker shape.
  await page.getByLabel('اسم المولود').fill('يوسف');
  await page.getByRole('radiogroup', { name: 'ولد أم بنت' }).getByText('ولد').click();
  await page.getByLabel('اسم الأم').fill('سارة');
  await page.getByLabel('اسم الأب').fill('أحمد');
  await page.getByLabel('تاريخ الولادة').fill(new Date(Date.now() - 2 * 86400_000).toISOString().slice(0, 10));
  await page.getByLabel('عبارة قصيرة').fill('أهلاً بك يا صغيري');
  await page.getByText('مربع', { exact: true }).click();
  await page.getByRole('button', { name: 'اعرض المعاينة' }).click();
  await expect(page).toHaveURL(/\/order\//);
  await expect(page.locator('#extras [data-extra=sticker] img')).toBeVisible();

  // After paying: clean pictures and the files on the receipt.
  const paid = fixture(true);
  const base = `/r/${paid.receiptToken}/extra`;
  const story = await request.get(`${base}/story.png`);
  expect(story.status(), await story.text().catch(() => '')).toBe(200);
  expect(story.headers()['content-type']).toBe('image/png');
  expect(await sharp(await story.body()).metadata()).toMatchObject({ width: 1080, height: 1920 });
  const sticker = await request.get(`${base}/sticker.png`);
  expect((await sharp(await sticker.body()).metadata()).width).toBeGreaterThan(1100);
  const sheet = await PDFDocument.load(await (await request.get(`${base}/sticker.pdf`)).body());
  const a4 = sheet.getPage(0).getSize();
  expect(Math.round(a4.width)).toBe(595);
  expect(Math.round(a4.height)).toBe(842);
  const labels = await PDFDocument.load(await (await request.get(`${base}/bottle.pdf`)).body());
  expect(Math.round(labels.getPage(0).getSize().width)).toBe(842);
  await page.goto(`/r/${paid.receiptToken}`);
  await expect(page.locator('#extras').getByRole('note')).toHaveCount(0);
  await expect(page.locator('#extras [data-extra=bottle]').getByRole('link', { name: 'ورقة طباعة (PDF)' })).toBeVisible();
  await expect.poll(() => page.locator('#extras [data-extra=story] img').evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 60_000 }).toBeGreaterThan(400);
  await page.locator('#extras').screenshot({ path: testInfo.outputPath('receipt-extras.png') });
  // Keep a full-size story and label to look at.
  await testInfo.attach('story', { body: await story.body(), contentType: 'image/png' });
});
