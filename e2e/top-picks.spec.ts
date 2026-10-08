import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

test('the owner picks a top 3; the homepage shows them with the best seller first', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(180_000);
  for (const theme of ['olive-ring-box', 'zaxo-watercolor']) {
    execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-card-order.ts'], {
      env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, THEME_KEY: theme },
    });
  }
  await signInAsNewOwner(page);
  await page.goto('/admin/themes');
  await page.getByLabel('الأول: الأكثر مبيعاً').selectOption({ label: '#2 زاخو بالألوان المائية' });
  await page.getByLabel('الثاني: اختيار مميز').selectOption({ label: '#1 علبة الخاتم الزيتونية' });
  await page.getByRole('button', { name: 'حفظ أفضل 3' }).click();
  await expect(page.getByText('الأكثر مبيعاً', { exact: true }).first()).toBeVisible();

  await page.goto('/');
  const top = page.locator('#top');
  await expect(top.getByRole('heading', { name: 'الأكثر تميزاً' })).toBeVisible();
  await expect(top.locator('[data-top-pick="1"]')).toContainText('زاخو');
  await expect(top.locator('[data-top-pick="1"] [data-rank="1"]')).toHaveText('الأكثر مبيعاً');
  await expect(top.locator('[data-top-pick="2"] [data-rank="2"]')).toHaveText('اختيار مميز');
  await top.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await top.screenshot({ path: testInfo.outputPath('top-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await top.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await top.screenshot({ path: testInfo.outputPath('top-phone.png') });

  // The catalog lists the best seller first, with its badge.
  await page.goto('/themes');
  await expect(page.locator('main li').first()).toContainText('زاخو');
  await expect(page.locator('main li').first().locator('[data-rank="1"]')).toBeVisible();

  // Clearing the top 3 removes the homepage section.
  await page.goto('/admin/themes');
  await page.getByLabel('الأول: الأكثر مبيعاً').selectOption('');
  await page.getByLabel('الثاني: اختيار مميز').selectOption('');
  await page.getByRole('button', { name: 'حفظ أفضل 3' }).click();
  await expect(page.getByLabel('الأول: الأكثر مبيعاً')).toHaveValue('');
  await page.goto('/');
  await expect(page.locator('#top')).toHaveCount(0);
});
