import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

function extrasTheme(): { packageId: string; paletteId: string } {
  const out = execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-extras-theme.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('the customer signs, picks colours and writes the back of the card when ordering', async ({ page }, testInfo) => {
  // Desktop, after e2e/catalog.spec.ts has set up the demo theme from scratch (it puts the same theme on sale).
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(120_000);
  const { packageId } = extrasTheme();
  await page.goto(`/themes/demo-wedding/order?pkg=${packageId}`);

  const date = new Date(Date.now() + 40 * 86400_000).toISOString().slice(0, 10);
  await page.locator('#f-person_1_name').fill('علي');
  await page.locator('#f-person_2_name').fill('نور');
  await page.locator('#f-event_date').fill(date);
  await page.locator('#f-event_time').fill('19:30');
  await page.locator('#f-venue_name').fill('قاعة الياسمين');

  // Colours: the owner's set instead of the original colours.
  await page.getByText('وردي').click();

  // Signature: a first try, cleared, then signed again.
  const pad = page.getByRole('img', { name: 'مكان التوقيع' });
  await pad.scrollIntoViewIfNeeded();
  const box = (await pad.boundingBox())!;
  const sign = async () => {
    await page.mouse.move(box.x + 30, box.y + box.height * 0.7);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + 30 + i * 20, box.y + box.height * (0.7 - 0.4 * Math.sin(i / 2)));
    await page.mouse.up();
  };
  await sign();
  await page.getByRole('button', { name: 'مسح والمحاولة من جديد' }).click();
  await sign();

  // Back of the printed card.
  await page.getByLabel('العنوان الكبير').fill('شكراً لكم');
  await page.getByLabel('رسالتكم').fill('سعدنا بمشاركتكم فرحتنا');

  await page.getByRole('button', { name: 'اعرض المعاينة' }).click();
  await expect(page).toHaveURL(/\/order\/[\w-]+$/);

  // The preview shows the signature and the chosen colours.
  const frame = page.frameLocator('iframe');
  await frame.getByRole('button', { name: 'افتح الدعوة' }).click().catch(() => {});
  await expect(frame.locator('[data-bahja-signature]')).toBeVisible();
  const bg = await frame.locator('[data-bahja-theme]').evaluate((el) => getComputedStyle(el).getPropertyValue('--bahja-color-background').trim());
  expect(bg).toBe('#6e1f33');

  // Editing keeps everything: current signature, colour set and card back.
  await page.getByRole('link', { name: 'تعديل التفاصيل' }).click();
  await expect(page.getByRole('img', { name: 'توقيعكم' })).toBeVisible();
  await expect(page.getByLabel('العنوان الكبير')).toHaveValue('شكراً لكم');
  await expect(page.locator('input[name=palette]:checked')).not.toHaveValue('');
  await testInfo.attach('order-form.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
