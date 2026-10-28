import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, openPreview } from './helpers';

function onSale(): { packageId: string } {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/birthday-on-sale.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test("a birthday's place is the customer's choice: off to start with, shown when ticked, left out of the invitation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(180_000);
  const { packageId } = onSale();

  await page.goto(`/themes/blush-floral/order?pkg=${packageId}`);
  const toggle = page.getByRole('checkbox', { name: 'إضافة مكان الحفل' });
  await expect(toggle).not.toBeChecked();
  await expect(page.locator('input[name="f.venue_name"]')).toHaveCount(0);
  await expect(page.locator('input[name="f.venue_map_url"]')).toHaveCount(0);
  await page.locator('input[name="f.person_1_name"]').fill('Rosie');
  await page.locator('input[type=date]').first().fill(new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10));
  await page.locator('input[type=time]').first().fill('17:00');
  await page.locator('textarea').first().fill('Come celebrate with me!');

  // Ticked: the place shows, to be filled in.
  await toggle.check();
  await expect(page.locator('input[name="f.venue_name"]')).toBeVisible();

  // Left off: the order goes through, and the invitation has no place at all.
  await toggle.uncheck();
  await expect(page.locator('input[name="f.venue_name"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'اعرض المعاينة' }).click();
  await expect(page).toHaveURL(/\/order\/[^/]+$/);
  const token = /\/order\/([^/?#]+)/.exec(page.url())![1]!;
  await openPreview(page, token);
  await expect(page.getByText('Rosie').first()).toBeAttached();
  await expect(page.getByText('المكان', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'الموقع على الخريطة' })).toHaveCount(0);
});
