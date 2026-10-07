import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

test('the owner makes a 100% coupon and orders an invitation for free', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(120_000);
  // Puts the demo theme on sale (same fixture as the order flow).
  execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  });
  const code = `FREE-${Date.now().toString(36).toUpperCase()}`;

  await signInAsNewOwner(page);
  await page.goto('/admin/coupons');
  await page.getByLabel(/^الرمز/).fill(code.toLowerCase());
  await page.getByLabel('القيمة', { exact: false }).fill('100');
  await page.getByLabel(/^أقصى عدد/).fill('1');
  await page.getByRole('button', { name: 'إنشاء الرمز' }).click();
  await expect(page.getByText(code, { exact: true })).toBeVisible();
  await expect(page.getByText(/^خصم (١٠٠|100)٪$/)).toBeVisible();

  const customer = await browser.newPage();
  await customer.goto('/themes/demo-minimal');
  await customer.getByRole('link', { name: 'اختر هذه الباقة' }).first().click();
  const date = new Date(Date.now() + 40 * 86400_000).toISOString().slice(0, 10);
  await customer.locator('#f-person_1_name').fill('ليلى');
  await customer.locator('#f-event_date').fill(date);
  await customer.locator('#f-event_time').fill('19:30');
  await customer.locator('#f-venue_name').fill('قاعة الرافدين');
  await customer.getByRole('button', { name: 'اعرض المعاينة' }).click();
  await expect(customer).toHaveURL(/\/order\/[\w-]+$/);

  await customer.locator('#c-name').fill('صاحب الموقع');
  await customer.locator('#c-phone').fill('07701234567');
  await customer.locator('#c-email').fill('owner@bahja.test');
  // A wrong code is refused and nothing is ordered.
  await customer.locator('#c-coupon').fill('NOT-A-CODE');
  await customer.locator('input[name=terms]').check();
  await customer.getByRole('button', { name: 'تأكيد الطلب' }).click();
  await expect(customer.locator('main').getByRole('alert')).toHaveText('رمز الخصم هذا غير صالح أو انتهت صلاحيته أو استُخدم بالكامل.');

  // The real code: no payment page, the invitation is published straight away.
  await customer.locator('#c-coupon').fill(code.toLowerCase());
  await customer.locator('input[name=terms]').check();
  await customer.getByRole('button', { name: 'تأكيد الطلب' }).click();
  await expect(customer).toHaveURL(/\/r\/[\w-]+$/);
  await expect(customer.getByRole('heading', { name: 'تم الدفع بنجاح' })).toBeVisible();
  await expect(customer.getByText(`الخصم (${code})`)).toBeVisible();
  await expect(customer.getByText(/\/i\/layla-|\/i\/[\w-]+/).first()).toBeVisible();

  // The coupon shows it was used once (of one).
  await page.reload();
  await expect(page.getByText('استُخدم بالكامل')).toBeVisible();
});
