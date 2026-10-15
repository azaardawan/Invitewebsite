import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

function onSale(): { packageId: string } {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/royal-olive-crest-on-sale.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('Royal Olive Crest: the seal initials are two boxes, joined by the chosen symbol', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(180_000);
  const { packageId } = onSale();

  await page.goto(`/themes/royal-olive-crest/order?pkg=${packageId}`);
  await page.getByLabel('اسم العريس').fill('Dara');
  await page.getByLabel('اسم العروس').fill('Ava');
  // One box per person: no separator to type.
  await page.getByLabel('العريس', { exact: true }).fill('D');
  await page.getByLabel('العروس', { exact: true }).fill('A');
  await page.locator('input[type=date]').first().fill(new Date(Date.now() + 40 * 86400_000).toISOString().slice(0, 10));
  await page.locator('input[type=time]').first().fill('19:30');
  await page.getByLabel('اسم القاعة').fill('Grand Hall');
  await page.locator('textarea').first().fill('With joy we invite you to our wedding.');
  // The symbol between the two letters: the heart.
  await page.getByRole('radiogroup', { name: 'الرمز بين الحرفين على الختم' }).getByText('♥').click();
  await page.getByRole('button', { name: 'اعرض المعاينة' }).click();
  await expect(page).toHaveURL(/\/order\//);
  const token = new URL(page.url()).pathname.split('/').filter(Boolean).at(-1)!;

  // The invitation's envelope carries D ♥ A on its seal (drawn on a canvas; pictured for review).
  await page.goto(`/p/${token}`);
  const seal = page.locator('[class*="seal"]').first();
  await expect(seal.locator('canvas')).toBeVisible();
  await page.waitForTimeout(800);
  await seal.screenshot({ path: testInfo.outputPath('seal.png') });
  await page.goto(`/order/${token}`);

  // The form keeps both boxes and the heart when going back to change something.
  await page.getByRole('link', { name: /تعديل/ }).first().click();
  await expect(page.getByLabel('العريس', { exact: true })).toHaveValue('D');
  await expect(page.getByLabel('العروس', { exact: true })).toHaveValue('A');
  await expect(page.getByRole('radiogroup', { name: 'الرمز بين الحرفين على الختم' }).getByRole('radio', { name: '♥' })).toBeChecked();
  await page.screenshot({ path: testInfo.outputPath('order-form.png'), fullPage: true });
});

test('the package checklist lists the link and the details, not only the paid features', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  const { packageId } = onSale();
  await page.goto('/themes/royal-olive-crest');
  const card = page.locator('li', { has: page.locator(`a[href*="pkg=${packageId}"]`) });
  for (const line of ['رابط خاص بدعوتكم ترسلونه على واتساب', 'اسم العريس واسم العروس', 'التاريخ والوقت', 'اسم القاعة', 'بطاقة دعوة قابلة للطباعة']) {
    await expect(card.getByText(line, { exact: true })).toBeVisible();
  }
  await card.screenshot({ path: testInfo.outputPath('package.png') });
});
