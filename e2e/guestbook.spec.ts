import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

function vvipOrder(): { receiptToken: string; path: string } {
  const out = execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-card-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, WITH_MESSAGES: '1' },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('guest messages stay private until the customer shows them under the invitation', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'stateful flow runs once');
  test.setTimeout(120_000);
  const { receiptToken, path } = vvipOrder();
  const openInvitation = async (p: typeof page) => {
    await p.goto(path);
    await p.getByRole('button', { name: 'افتح الدعوة' }).click();
  };

  // A guest writes a message: by default nobody else sees it.
  const guest = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await openInvitation(guest);
  // Checking the radio waits for the opening animation to finish (and the page to hydrate).
  await guest.getByRole('radio', { name: 'سأحضر' }).check();
  await guest.getByLabel('الاسم', { exact: true }).fill('سارة');
  await guest.getByLabel('رسالة تهنئة').fill('ألف مبروك يا أحلى عروسين');
  await guest.getByRole('button', { name: 'إرسال' }).click();
  await expect(guest.getByRole('status')).toBeVisible();
  await expect(guest.getByRole('heading', { name: 'رسائل الضيوف' })).toHaveCount(0);

  // The customer makes messages public from their private receipt.
  await page.goto(`/r/${receiptToken}`);
  await page.getByLabel('كل من لديه رابط الدعوة (تظهر تحت الدعوة)').check();
  await page.getByRole('button', { name: 'حفظ الاختيار' }).click();
  await expect(page.getByText('تم الحفظ.')).toBeVisible();

  // The next person who opens the link sees the message under the invitation.
  const next = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await openInvitation(next);
  await expect(next.getByRole('heading', { name: 'رسائل الضيوف' })).toBeVisible();
  await expect(next.getByText('ألف مبروك يا أحلى عروسين')).toBeVisible();
  await expect(next.getByText('— سارة')).toBeVisible();
});
