import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

/**
 * The storefront buying flow: catalog → theme page → details form (with
 * server-side validation) → personal preview → edit → contact + terms →
 * private receipt. Payment itself is M6.
 */
test('a customer orders an invitation from the storefront', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390' && testInfo.project.name !== 'desktop', 'stateful flow runs on one phone and desktop');
  // Puts the demo theme on sale (same fixture as the orders spec).
  execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  });

  await page.goto('/themes');
  await page.getByRole('link', { name: /تصميم بسيط تجريبي/ }).first().click();
  await expect(page).toHaveURL(/\/themes\/demo-minimal$/);
  await expect(page.frameLocator('iframe').getByRole('note')).toBeVisible();

  await page.getByRole('link', { name: 'اختر هذه الباقة' }).first().click();
  await expect(page).toHaveURL(/\/themes\/demo-minimal\/order\?pkg=/);

  // Empty submit: the server rejects it and says which fields.
  await page.getByRole('button', { name: 'اعرض المعاينة' }).click();
  await expect(page.locator('main').getByRole('alert')).toHaveText('يرجى مراجعة الحقول المحددة.');
  await expect(page.locator('#f-person_1_name')).toHaveAttribute('aria-invalid', 'true');

  const date = new Date(Date.now() + 40 * 86400_000).toISOString().slice(0, 10);
  await page.locator('#f-person_1_name').fill('سارة');
  await page.locator('#f-event_date').fill(date);
  await page.locator('#f-event_time').fill('19:30');
  await page.locator('#f-venue_name').fill('قاعة الرافدين');
  await page.getByRole('button', { name: 'اعرض المعاينة' }).click();
  await expect(page).toHaveURL(/\/order\/[\w-]+$/);
  const reviewUrl = page.url();
  expect((await request.get(reviewUrl)).headers()['x-robots-tag']).toContain('noindex');
  await expect(page.frameLocator('iframe').getByRole('heading', { name: 'سارة' })).toBeVisible();

  // Edit keeps the same preview link.
  await page.getByRole('link', { name: 'تعديل التفاصيل' }).click();
  await expect(page.locator('#f-person_1_name')).toHaveValue('سارة');
  await page.locator('#f-person_1_name').fill('سارة أحمد');
  await page.getByRole('button', { name: 'حفظ وعرض المعاينة' }).click();
  await expect(page).toHaveURL(reviewUrl);
  await expect(page.frameLocator('iframe').getByRole('heading', { name: 'سارة أحمد' })).toBeVisible();

  await page.locator('#c-name').fill('زبون المتجر');
  await page.locator('#c-phone').fill('07701234567');
  await page.locator('#c-email').fill('store@bahja.test');
  await page.locator('input[name=terms]').check();
  await page.getByRole('button', { name: 'تأكيد الطلب' }).click();

  // Straight to WAYL's payment page (the e2e mock). Backing out leaves the order unpaid.
  await expect(page).toHaveURL(/localhost:3101\/pay\//);
  await page.getByRole('button', { name: 'Cancel (mock)' }).click();
  await expect(page).toHaveURL(/\/r\/[\w-]+/);
  await expect(page.getByRole('heading', { name: 'بانتظار الدفع' })).toBeVisible();
  await expect(page.getByText('زبون المتجر')).toBeVisible();

  // "Pay" from the receipt reuses the same WAYL link; paying publishes the invitation.
  await page.getByRole('button', { name: /^ادفع/ }).click();
  await expect(page).toHaveURL(/localhost:3101\/pay\//);
  await page.getByRole('button', { name: 'Pay (mock)' }).click();
  await expect(page).toHaveURL(/\/r\/[\w-]+\?paid=1/);
  await expect(page.getByRole('heading', { name: 'تم الدفع بنجاح' })).toBeVisible();
  await expect(page.getByText(/INV-\d{4}-\d{5}/)).toBeVisible();
  await expect(page.getByText(/\/i\/sara-/)).toBeVisible();

  // Once published, the private preview/edit link stops working.
  await page.goto(`${reviewUrl}/edit`);
  await expect(page.getByText('انتهت صلاحية هذه المعاينة')).toBeVisible();
});

test('payment endpoints refuse junk and unauthenticated calls', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'API check runs once');
  expect((await request.post('/api/webhooks/wayl', { data: '' })).status()).toBe(400);
  // A forged "paid" webhook is recorded but never marks anything paid.
  const forged = await request.post('/api/webhooks/wayl', { data: { referenceId: 'ORD-FAKE0000-1', status: 'Complete' }, headers: { 'x-wayl-signature-256': 'deadbeef' } });
  expect(forged.status()).toBe(200);
  expect((await forged.json()).outcome).toBe('ignored');
  expect((await request.post('/api/cron/reconcile-payments')).status()).toBe(401);
});
