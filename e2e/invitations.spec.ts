import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

type Fixture = { path: string };
function paidInvitation(): Fixture {
  const out = execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('public invitation: canonical URL, redirects, OG, noindex, and admin take-down/extend', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'stateful flow runs once');
  const { path } = paidInvitation();
  const publicId = path.slice(-10);

  const res = await request.get(path);
  expect(res.status()).toBe(200);
  expect(res.headers()['x-robots-tag']).toContain('noindex');
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'Layan' })).toBeVisible();
  await expect(page.getByRole('note')).toHaveCount(0); // no PREVIEW/SAMPLE ribbon on live invitations
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Layan');

  // A guest replies on the live invitation; the reply is stored (not just shown as sent).
  await page.getByRole('textbox', { name: 'Your name' }).fill('Omar Guest');
  await page.getByRole('button', { name: "I'll attend" }).click();
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('status')).toHaveText('Thank you, your response was sent.');

  // Any other slug (or none) redirects permanently to the canonical link.
  for (const wrong of [`/i/old-name-${publicId}`, `/i/${publicId}`]) {
    const r = await request.get(wrong, { maxRedirects: 0 });
    expect(r.status()).toBe(308);
    expect(r.headers().location).toBe(path);
  }
  expect((await request.get('/i/nope-0000000000')).status()).toBe(404);

  // Admin: take it down → guests see the ended page; extend; put it back.
  await signInAsNewOwner(page);
  await page.goto(`/admin/invitations?q=${publicId}`);
  await page.getByRole('link', { name: 'إدارة' }).click();
  await expect(page.getByText(path).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ردود الضيوف' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Omar Guest' })).toBeVisible();
  await expect(page.getByText('1 سيحضرون · 0 لن يحضروا')).toBeVisible();

  const unpublish = page.locator('form', { has: page.getByRole('button', { name: 'إيقاف الدعوة' }) });
  await unpublish.getByLabel('السبب (يظهر في سجل التدقيق)').fill('Requested by the customer');
  page.once('dialog', (d) => d.accept());
  await unpublish.getByRole('button', { name: 'إيقاف الدعوة' }).click();
  await expect(page.getByRole('button', { name: 'إعادة نشر الدعوة' })).toBeVisible();
  const guest = await page.context().newPage();
  await guest.goto(path);
  await expect(guest.getByRole('heading', { name: 'This invitation has ended' })).toBeVisible();

  await page.reload();
  const extend = page.locator('form', { has: page.getByRole('button', { name: 'تمديد' }) });
  await extend.getByLabel('السبب (يظهر في سجل التدقيق)').fill('Wedding moved a week');
  await extend.getByRole('button', { name: 'تمديد' }).click();
  await expect(extend.getByText('تم الحفظ.')).toBeVisible();
  await page.reload();

  const republish = page.locator('form', { has: page.getByRole('button', { name: 'إعادة نشر الدعوة' }) });
  await republish.getByLabel('السبب (يظهر في سجل التدقيق)').fill('Back online after fix');
  await republish.getByRole('button', { name: 'إعادة نشر الدعوة' }).click();
  await expect(page.getByRole('button', { name: 'إيقاف الدعوة' })).toBeVisible();
  await guest.reload();
  await expect(guest.getByRole('heading', { name: 'Layan' })).toBeVisible();
});
