import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

function vvipOrder(): { receiptToken: string; path: string } {
  const out = execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-card-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, WITH_MESSAGES: '1' },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('guest messages stay private until the customer shows them under the invitation; card and keepsake previews on the receipt', async ({ page, browser }, testInfo) => {
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

  // The customer makes messages public from their private receipt: one tap saves it, no button to miss.
  await page.goto(`/r/${receiptToken}`);
  await page.getByLabel('كل من لديه رابط الدعوة (تظهر تحت الدعوة)').check();
  await expect(page.locator('#guestbook').getByText('✓ تم الحفظ.')).toBeVisible();
  // The choice survives a reload.
  await page.reload();
  await expect(page.getByLabel('كل من لديه رابط الدعوة (تظهر تحت الدعوة)')).toBeChecked();

  // The keepsake is on the receipt from publication (before the celebration), side by side with the card.
  const files = page.locator('#files');
  for (const name of ['بطاقة الدعوة للطباعة', 'ذكرى التهاني']) {
    const img = files.getByRole('img', { name });
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth), { timeout: 60_000 }).toBeGreaterThan(0);
  }
  const keepsake = await page.request.get(`/r/${receiptToken}/keepsake?inline=1`);
  expect(keepsake.status()).toBe(200);
  expect(keepsake.headers()['content-disposition']).toMatch(/^inline;/);
  // The card turns over to its landscape back.
  await files.getByRole('button', { name: 'اقلب البطاقة' }).click();
  const back = files.getByRole('img', { name: 'ظهر بطاقتكم المطبوعة' });
  await expect.poll(() => back.evaluate((el: HTMLImageElement) => el.naturalWidth > el.naturalHeight), { timeout: 60_000 }).toBe(true);
  await testInfo.attach('receipt-files.png', { body: await files.screenshot(), contentType: 'image/png' });

  // Sharing the link shows the invitation's own cover (WhatsApp preview).
  const html = await (await page.request.get(path)).text();
  const og = /property="og:image" content="([^"]+)"/.exec(html)?.[1];
  expect(og).toMatch(/\/og$/);
  const ogImage = await page.request.get(new URL(og!).pathname);
  expect(ogImage.status()).toBe(200);
  expect(ogImage.headers()['content-type']).toBe('image/jpeg');

  // The reply count is on the receipt; the customer shows it to everyone too.
  await expect(page.locator('#attendance').getByText('سيحضر: ١')).toBeVisible();
  await expect(page.locator('#attendance').getByText('لن يحضر: ٠')).toBeVisible();
  await page.getByLabel('كل من لديه رابط الدعوة (يظهر فوق نموذج الرد)').check();
  await expect(page.locator('#attendance').getByText('✓ تم الحفظ.')).toBeVisible();

  // The next person who opens the link sees the message under the invitation, and how many are coming.
  const next = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await openInvitation(next);
  const replies = next.getByRole('region', { name: 'ردود الضيوف' });
  await expect(replies).toContainText('١');
  await expect(replies).toContainText('سيحضرون');
  await expect(replies).toContainText('لن يحضروا');
  await expect(next.getByRole('heading', { name: 'رسائل الضيوف' })).toBeVisible();
  await expect(next.getByText('ألف مبروك يا أحلى عروسين')).toBeVisible();
  await expect(next.getByText('— سارة')).toBeVisible();
});
