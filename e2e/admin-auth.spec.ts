import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { authenticator } from 'otplib';

const owner = () => JSON.parse(readFileSync('e2e/.owner.json', 'utf8')) as { email: string; password: string };
const NEW_PASSWORD = 'Jasmine river gate 2026';

function codeFor(secret: string, offsetSteps = 0) {
  return authenticator.clone({ ...authenticator.options, epoch: Date.now() + offsetSteps * 30_000 }).generate(secret);
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel('البريد الإلكتروني').fill(email);
  await page.getByLabel('كلمة المرور').fill(password);
  await page.getByRole('button', { name: 'دخول' }).click();
}

// One full owner journey; runs once (on the 390px project) because it changes server state.
test('owner first sign-in: password → 2FA setup → forced password change → admin → sign out → 2FA sign-in', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'stateful flow runs once');
  const { email, password } = owner();

  const res = await page.request.get('/admin/login');
  expect(res.headers()['x-robots-tag']).toContain('noindex');
  expect(res.headers()['x-frame-options']).toBe('DENY');

  await signIn(page, email, 'wrong password here');
  await expect(page.getByRole('alert').filter({ hasText: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' })).toBeVisible();

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/admin\/account\/two-factor$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const secret = (await page.locator('code').first().innerText()).trim();

  // Cannot skip ahead to the panel before 2FA.
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/admin\/account\/two-factor$/);

  await page.getByLabel('الرمز من التطبيق').fill(codeFor(secret));
  await page.getByRole('button', { name: 'تفعيل' }).click();
  await expect(page.getByRole('heading', { name: 'رموز الاسترداد' })).toBeVisible();
  await expect(page.locator('ul[dir="ltr"] li')).toHaveCount(10);
  await page.getByRole('link', { name: 'حفظت الرموز، متابعة' }).click();

  await expect(page).toHaveURL(/\/admin\/account\/password$/);
  await page.getByLabel('كلمة المرور الحالية').fill(password);
  await page.getByLabel('كلمة المرور الجديدة', { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel('تأكيد كلمة المرور الجديدة').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'حفظ' }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('أهلاً مالك بهجه');

  // Create an employee.
  await page.goto('/admin/users');
  await page.getByLabel('الاسم').fill('سارة');
  await page.getByLabel('البريد الإلكتروني').fill('sara@bahja.test');
  await page.getByRole('checkbox', { name: 'دعم العملاء' }).last().check();
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'تم إنشاء الحساب' })).toBeVisible();

  // Audit history shows what happened.
  await page.goto('/admin/audit');
  await expect(page.getByText('admin_user.created').first()).toBeVisible();
  await expect(page.getByText('auth.2fa_enabled')).toBeVisible();

  // Switch admin language.
  await page.getByRole('button', { name: 'English' }).first().click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Audit history');
  await page.getByRole('button', { name: 'العربية' }).first().click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  await page.getByRole('button', { name: 'تسجيل الخروج' }).last().click();
  await expect(page).toHaveURL(/\/admin\/login$/);

  // Second sign-in now requires the authenticator code.
  await signIn(page, email, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/admin\/login\/verify$/);
  await page.getByLabel('رمز التحقق').fill(codeFor(secret, 1));
  await page.getByRole('button', { name: 'تحقق' }).click();
  await expect(page).toHaveURL(/\/admin$/);
});
