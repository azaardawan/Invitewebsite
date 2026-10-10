import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

test('the owner styles the newborn set: one shared look, each item its own layout and details', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(180_000);
  execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-newborn-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  });
  await signInAsNewOwner(page);

  // Every layout of every item, as the owner can preview them (saved below for a look).
  for (const [view, layouts, size] of [
    ['story', ['classic', 'top', 'framed'], { width: 1080, height: 1920 }],
    ['sticker', ['classic', 'name', 'badge'], { width: 151, height: 151 }],
    ['bottle', ['classic', 'split', 'band'], { width: 813, height: 208 }],
  ] as const) {
    for (const layout of layouts) {
      for (const gender of ['boy', 'girl']) {
        await page.setViewportSize(size);
        await page.goto(`/admin/preview/ar/product/demo-newborn?view=${view}&layout=${layout}&gender=${gender}&shape=${gender === 'girl' ? 'round' : 'square'}`);
        await expect(page.locator(`[data-layout=${layout}]`)).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath(`${view}-${layout}-${gender}.png`) });
      }
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });

  // The shared look, then the sticker's own layout and details.
  await page.goto('/admin/themes?q=%235');
  await page.getByRole('link', { name: 'تصميم مولود تجريبي' }).click();
  await expect(page.getByRole('heading', { name: 'تصميم إضافات المولود' })).toBeVisible();
  const look = page.locator('details[data-extras-look]');
  await look.locator('input[name=accent]').fill('#2f6f5e');
  await look.getByRole('button', { name: 'حفظ المظهر المشترك' }).click();
  await expect(page.locator('details[data-extras-look] summary')).toContainText('ألوانك');

  const sticker = page.locator('details[data-card-side=sticker]');
  await sticker.locator('summary').click();
  await sticker.locator('select[name=layout]').selectOption('badge');
  await sticker.getByLabel('تاريخ الولادة').uncheck();
  await sticker.getByRole('button', { name: 'حفظ هذا الوجه' }).click();
  await expect(page.locator('details[data-card-side=sticker] summary')).toContainText('معدّل');
  const preview = page.frameLocator('iframe[title="الملصق (مربع)"]');
  await expect(preview.locator('[data-layout=badge]')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('admin-extras.png'), fullPage: true });

  // Reset both, so the other tests see the defaults.
  const again = page.locator('details[data-card-side=sticker]');
  if (!(await again.evaluate((el) => (el as HTMLDetailsElement).open))) await again.locator('summary').click();
  page.once('dialog', (d) => d.accept());
  await again.getByRole('button', { name: /إعادة ضبط هذا العنصر/ }).click();
  await expect(page.locator('details[data-card-side=sticker] summary')).not.toContainText('معدّل');
  const lookBox = page.locator('details[data-extras-look]');
  if (!(await lookBox.evaluate((el) => (el as HTMLDetailsElement).open))) await lookBox.locator('summary').click();
  await lookBox.getByRole('button', { name: 'العودة إلى ألوان التصميم' }).click();
  await expect(page.locator('details[data-extras-look] summary')).toContainText('من ألوان التصميم');
});
