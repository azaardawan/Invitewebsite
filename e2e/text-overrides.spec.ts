import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

/** The owner changes any text on one invitation from Admin (owner, 2026-11-26); the invitation shows the new text. */
test('Admin: change any text on one invitation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(180_000);
  await signInAsNewOwner(page);
  const made = JSON.parse(
    execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-card-order.ts'], {
      env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    })
      .toString()
      .trim()
      .split('\n')
      .at(-1)!,
  ) as { invitationId: string; path: string };

  await page.goto(`/admin/invitations/${made.invitationId}`);
  const card = page.locator('form', { has: page.locator('[data-text-override]') });
  await card.locator('textarea[name="from"]').first().fill('قاعة الياسمين');
  await card.locator('textarea[name="to"]').first().fill('قاعة الورد');
  await card.locator('input[name="reason"]').fill('طلب الزبون تغيير اسم القاعة');
  await card.getByRole('button', { name: 'حفظ النصوص' }).click();
  await expect(card.getByRole('status')).toBeVisible();

  await page.goto(made.path);
  const open = page.getByRole('button', { name: /افتح الدعوة|Open invitation/ });
  if (await open.count()) await open.first().click();
  await expect(page.getByText('قاعة الورد').first()).toBeAttached({ timeout: 15_000 });
  await expect(page.getByText('قاعة الياسمين')).toHaveCount(0);
});
