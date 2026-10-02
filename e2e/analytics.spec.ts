import { expect, test } from '@playwright/test';
import { signInAsNewOwner } from './helpers';

test('visits are counted anonymously and shown in Admin → Analytics', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  const visitor = await browser.newPage({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1' });
  let beacons = 0;
  visitor.on('request', (r) => {
    if (r.url().endsWith('/api/e')) beacons++;
  });
  await visitor.goto('/');
  await visitor.goto('/themes');
  await visitor.waitForLoadState('networkidle');
  await expect.poll(() => beacons, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);

  await signInAsNewOwner(page);
  await page.goto('/admin/analytics?days=7');
  await expect(page.getByRole('heading', { name: 'الإحصاءات', level: 1 })).toBeVisible();
  const visitors = page.locator('div', { has: page.getByText('الزوار', { exact: true }) }).locator('p.text-2xl').first();
  await expect.poll(async () => Number((await visitors.textContent())?.replace(/[^\d٠-٩]/g, '').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))) || 0)).toBeGreaterThanOrEqual(1);
  await expect(page.getByRole('img', { name: 'الزوار يومياً' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('analytics.png'), fullPage: true });
});
