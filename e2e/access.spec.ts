import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

function order(): { receiptToken: string; path: string; accessCode: string } {
  const out = execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-card-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, WITH_SELF_EDIT: '1' },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('the customer gets back to everything with their invitation number, and edits the invitation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'stateful flow runs once');
  test.setTimeout(120_000);
  const { path, accessCode } = order();

  // A wrong number explains itself; the right one (typed in Arabic-Indic digits) opens the receipt.
  await page.goto('/access');
  await page.getByLabel('رقم الدعوة').fill('0000000001');
  await page.getByRole('button', { name: 'فتح' }).click();
  await expect(page).toHaveURL(/e=notFound/);
  await expect(page.getByText('لم نجد هذا الرقم.', { exact: false })).toBeVisible();
  const arabicDigits = accessCode.replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
  await page.getByLabel('رقم الدعوة').fill(arabicDigits);
  await page.getByRole('button', { name: 'فتح' }).click();
  await expect(page).toHaveURL(/\/r\//);
  await expect(page.getByText(accessCode, { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'تحميل بطاقة الطباعة (PDF)' })).toBeVisible();

  // Edit after publishing (package with self_edit): change the venue; guests see it straight away.
  await page.getByRole('link', { name: 'تعديل دعوتي' }).click();
  await page.getByLabel('اسم القاعة').fill('قاعة النخيل');
  await page.getByRole('button', { name: 'حفظ التعديلات' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'تم تحديث دعوتك' })).toBeVisible();
  await expect(page.getByText('متبقٍ لك 2 من 3 تعديلات')).toBeVisible();

  await page.goto(path);
  await page.getByRole('button', { name: 'افتح الدعوة' }).click();
  await expect(page.getByText('قاعة النخيل')).toBeVisible();
});
