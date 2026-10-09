import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

test('one design in wedding and engagement: shown in both, once in combined lists, the customer picks the occasion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(180_000);
  execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-card-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, THEME_KEY: 'zaxo-watercolor' },
  });
  await signInAsNewOwner(page);
  await page.goto('/admin/themes?q=%232');
  await page.getByRole('link', { name: 'زاخو بالألوان المائية' }).click();
  const also = page.getByRole('group', { name: 'يُعرض أيضاً في' });
  await also.getByLabel('خطوبة').check();
  await also.locator('xpath=ancestor::form').getByRole('button', { name: 'حفظ' }).click();
  await expect(also.getByLabel('خطوبة')).toBeChecked();

  // The engagement page lists it; the combined list shows it once, with both occasions.
  await page.goto('/occasions/engagement');
  const card = page.locator('main li', { hasText: 'زاخو بالألوان المائية' });
  await expect(card).toHaveCount(1);
  await page.goto('/themes');
  const listed = page.locator('main li', { hasText: 'زاخو بالألوان المائية' });
  await expect(listed).toHaveCount(1);
  await expect(listed).toContainText('زفاف · خطوبة');

  // Coming from the engagement page, the order is for an engagement without asking.
  await page.goto('/occasions/engagement');
  await page.locator('main li', { hasText: 'زاخو بالألوان المائية' }).getByRole('link').first().click();
  await expect(page).toHaveURL(/occasion=engagement/);
  await page.goto('/themes/zaxo-watercolor/order?occasion=engagement');
  await expect(page.getByText('خطوبة').first()).toBeVisible();
  await expect(page.getByRole('group', { name: 'لأي مناسبة هذه الدعوة؟' })).toHaveCount(0);

  // Without an occasion the form asks, and won't continue until one is chosen.
  await page.goto('/themes/zaxo-watercolor/order');
  const question = page.getByRole('group', { name: 'لأي مناسبة هذه الدعوة؟' });
  await expect(question).toBeVisible();
  await expect(question.getByText('زفاف')).toBeVisible();
  await expect(question.getByText('خطوبة')).toBeVisible();

  // Back to one occasion: no question.
  await page.goto('/admin/themes?q=%232');
  await page.getByRole('link', { name: 'زاخو بالألوان المائية' }).click();
  await also.getByLabel('خطوبة').uncheck();
  await also.locator('xpath=ancestor::form').getByRole('button', { name: 'حفظ' }).click();
  await expect(also.getByLabel('خطوبة')).not.toBeChecked();
  await page.goto('/themes/zaxo-watercolor/order');
  await expect(page.getByRole('group', { name: 'لأي مناسبة هذه الدعوة؟' })).toHaveCount(0);
});
