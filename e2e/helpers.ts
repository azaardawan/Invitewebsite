import { execFileSync } from 'node:child_process';
import { expect, type Page } from '@playwright/test';
import { authenticator } from 'otplib';

export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgres://bahja:bahja@localhost:5432/bahja_e2e_test';

export function totp(secret: string, offsetSteps = 0) {
  return authenticator.clone({ ...authenticator.options, epoch: Date.now() + offsetSteps * 30_000 }).generate(secret);
}

/** Creates a fresh OWNER via the real CLI and completes first sign-in (2FA + password change) in the browser. */
export async function signInAsNewOwner(page: Page) {
  const email = `owner.${Date.now()}@bahja.test`;
  const out = execFileSync('pnpm', ['-s', 'admin:create', '--email', email, '--name', 'Owner'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  const temp = out.match(/shown once\): (\S+)/)![1]!;
  await page.goto('/admin/login');
  await page.getByLabel('البريد الإلكتروني').fill(email);
  await page.getByLabel('كلمة المرور').fill(temp);
  await page.getByRole('button', { name: 'دخول' }).click();
  await expect(page).toHaveURL(/two-factor/);
  const secret = (await page.locator('code').first().innerText()).trim();
  await page.getByLabel('الرمز من التطبيق').fill(totp(secret));
  await page.getByRole('button', { name: 'تفعيل' }).click();
  await page.getByRole('link', { name: 'حفظت الرموز، متابعة' }).click();
  await page.getByLabel('كلمة المرور الحالية').fill(temp);
  await page.getByLabel('كلمة المرور الجديدة', { exact: true }).fill('Jasmine river gate 2026');
  await page.getByLabel('تأكيد كلمة المرور الجديدة').fill('Jasmine river gate 2026');
  await page.getByRole('button', { name: 'حفظ' }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** Valid silent MP3 (MPEG-1 Layer III frames). */
export function makeMp3(seconds = 3): Buffer {
  const header = Buffer.from([0xff, 0xfb, 0x90, 0x64]);
  const frame = Buffer.concat([header, Buffer.alloc(417 - 4)]);
  return Buffer.concat(Array.from({ length: Math.ceil((seconds * 44100) / 1152) }, () => frame));
}
