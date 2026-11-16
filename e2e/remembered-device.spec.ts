import { expect, test } from '@playwright/test';
import { signInAsNewOwner, totp } from './helpers';

/**
 * Remembered devices (owner, 2026-11-16): ticking «don't ask for a code on this device» at the code step lets the same
 * browser sign in with the password alone; removing the device in Account brings the code back.
 * `DEVICE_SHOTS=<folder>` also saves pictures of the screens.
 */
test('a remembered device signs in without a code until it is removed', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  const shots = process.env.DEVICE_SHOTS;
  const shot = async (name: string) => {
    if (shots) await page.screenshot({ path: `${shots}/${name}.png` });
  };
  const owner = await signInAsNewOwner(page);
  const signOut = () => page.getByRole('button', { name: 'تسجيل الخروج' }).first().click();
  const password = async () => {
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.getByLabel('البريد الإلكتروني').fill(owner.email);
    await page.getByLabel('كلمة المرور').fill(owner.password);
    await page.getByRole('button', { name: 'دخول' }).click();
  };

  // Not remembered yet: the code is asked for.
  await signOut();
  await password();
  await expect(page).toHaveURL(/login\/verify/);
  const remember = page.getByRole('checkbox', { name: /لا تطلب الرمز على هذا الجهاز/ });
  await expect(remember).not.toBeChecked();
  await shot('1-code-step');
  await remember.check();
  await shot('2-code-step-ticked');
  // The step after the one used at enrollment (a code is never accepted twice).
  await page.getByLabel('رمز التحقق').fill(totp(owner.secret, 1));
  await page.getByRole('button', { name: 'تحقق' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // Remembered: the password alone.
  await signOut();
  await password();
  await expect(page).toHaveURL(/\/admin$/);

  // It is listed in Account, and can be removed.
  await page.goto('/admin/account/devices');
  await expect(page.getByText('هذا الجهاز', { exact: true })).toBeVisible();
  await shot('3-devices');
  await page.getByRole('button', { name: 'حذف', exact: true }).click();
  await expect(page.getByText(/لا توجد أجهزة محفوظة/)).toBeVisible();
  await shot('4-devices-empty');

  // Removed: the code again.
  await page.goto('/admin');
  await signOut();
  await password();
  await expect(page).toHaveURL(/login\/verify/);
});
