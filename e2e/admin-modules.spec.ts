import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

test('the owner edits a website text and finds a customer', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(120_000);
  execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-card-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  });
  await signInAsNewOwner(page);

  // Translations: change the Arabic subtitle of "My invitation"; the website shows it right away.
  await page.goto('/admin/translations?q=access.subtitle');
  const original = 'اكتب رقم دعوتك لتصل إلى دعوتك وإيصالك وبطاقة الطباعة وملف الذكرى.';
  const arabic = page.getByRole('textbox', { name: 'العربية' }).first();
  await expect(arabic).toHaveValue(original);
  await arabic.fill('نص تجريبي من الإدارة');
  await page.getByRole('button', { name: 'حفظ' }).first().click();
  await expect(page.getByText('تم الحفظ. سيظهر في الموقع خلال دقيقة.')).toBeVisible();
  await page.goto('/access');
  await expect(page.getByText('نص تجريبي من الإدارة')).toBeVisible();

  // A broken placeholder is refused.
  await page.goto('/admin/translations?q=receipt.accessCodeLine');
  await page.getByRole('textbox', { name: 'العربية' }).first().fill('رقم الدعوة: {phone}');
  await page.getByRole('button', { name: 'حفظ' }).first().click();
  await expect(page.getByText('هذا النص يستخدم')).toBeVisible();

  // Emptying the box restores the original text.
  await page.goto('/admin/translations?filter=edited');
  await page.getByRole('textbox', { name: 'العربية' }).first().fill('');
  await page.getByRole('button', { name: 'حفظ' }).first().click();
  // Nothing is changed any more, so the "changed" list empties.
  await expect(page.getByText('لا توجد نصوص مطابقة.')).toBeVisible();
  await page.goto('/access');
  await expect(page.getByText(original)).toBeVisible();

  // Customers: search by phone, open, see the orders.
  await page.goto('/admin/customers?q=7701234567');
  await page.getByRole('link', { name: 'فتح' }).first().click();
  await expect(page.getByRole('heading', { name: 'الطلبات' })).toBeVisible();
  await expect(page.getByText('رقم الدعوة').first()).toBeVisible();
});
