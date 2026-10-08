import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

test('the owner groups an occasion into subsections and the website follows', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(120_000);
  // The Olive Ring Box theme on sale in the Wedding section.
  execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-card-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  });
  const key = `classic-${Date.now().toString(36)}`;
  await signInAsNewOwner(page);

  // Admin → Sections → Wedding: add a subsection.
  await page.goto('/admin/sections');
  await page.getByRole('link', { name: /زفاف/ }).first().click();
  await page.getByText('إضافة قسم فرعي').first().click();
  const form = page.locator('form').filter({ has: page.locator('input[name=key]') });
  await form.locator('input[name=key]').fill(key);
  await form.locator('input[name="name.ar"]').fill('كلاسيكي');
  await form.locator('input[name="name.en"]').fill('Classic');
  await form.locator('input[name="name.ckb"]').fill('کلاسیکی');
  await form.locator('input[name="name.bdn"]').fill('کلاسیکی');
  await form.getByRole('button', { name: 'إضافة قسم فرعي' }).click();
  await expect(page.getByText(key)).toBeVisible();

  // Admin → Themes → Olive Ring Box: put it in the subsection.
  await page.goto('/admin/themes');
  await page.getByRole('link', { name: 'علبة الخاتم الزيتونية' }).first().click();
  await page.locator('select[name=subsectionId]').selectOption({ label: 'كلاسيكي' });
  await page.locator('form').filter({ has: page.locator('select[name=subsectionId]') }).getByRole('button', { name: 'حفظ' }).click();
  await expect(page.getByText('تم الحفظ.').first()).toBeVisible();

  // The occasion page groups designs under the subsection, with a filter chip.
  await page.goto('/occasions/wedding');
  await expect(page.getByRole('heading', { name: 'كلاسيكي', level: 2 })).toBeVisible();
  await page.getByRole('navigation', { name: 'زفاف' }).getByRole('link', { name: 'كلاسيكي' }).click();
  await expect(page).toHaveURL(new RegExp(`sub=${key}`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('كلاسيكي');
  await expect(page.getByRole('link', { name: /علبة الخاتم الزيتونية/ })).toBeVisible();

  // The catalog shows a second row of chips for the chosen occasion.
  await page.goto('/themes?occasion=wedding');
  await page.getByRole('link', { name: 'كلاسيكي', exact: true }).click();
  await expect(page.getByRole('link', { name: /علبة الخاتم الزيتونية/ })).toBeVisible();
});
