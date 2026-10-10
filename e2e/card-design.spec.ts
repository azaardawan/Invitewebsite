import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { signInAsNewOwner } from './helpers';

/** A text-free artwork: a coloured paper with a frame, like the owner would export from Canva. */
async function artwork(width: number, height: number, paper: string) {
  const frame = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${paper}"/><rect x="${width * 0.05}" y="${height * 0.05}" width="${width * 0.9}" height="${height * 0.9}" fill="none" stroke="#8a6a3b" stroke-width="${width * 0.012}"/></svg>`,
  );
  return sharp(frame).png().toBuffer();
}

test('the owner finds a theme by its number and gives its printable card their own front and back', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(120_000);
  await signInAsNewOwner(page);

  // Theme number 4 is the minimal demo, which has no printable card of its own.
  await page.goto('/admin/themes?q=%234');
  await expect(page.locator('main li')).toHaveCount(1);
  await expect(page.locator('main li').getByText('#4')).toBeVisible();
  await page.getByRole('link', { name: 'تصميم بسيط تجريبي' }).click();
  await expect(page.getByRole('heading', { name: 'تصميم البطاقة المطبوعة' })).toBeVisible();
  await expect(page.getByText('هذا القالب ليس له وجه بطاقة خاص به')).toBeVisible();

  for (const [side, w, h, paper] of [
    ['front', 600, 840, '#f4ead8'],
    ['back', 840, 600, '#e9f0e6'],
  ] as const) {
    const box = page.locator(`details[data-card-side=${side}]`);
    await box.locator('summary').click();
    await box.locator('input[type=file]').setInputFiles({ name: `${side}.png`, mimeType: 'image/png', buffer: await artwork(w, h, paper) });
    await expect(box.locator('img').first()).toBeVisible();
    await box.locator('input[name=accent]').fill('#7a1f3d');
    await box.getByRole('button', { name: 'حفظ هذا الوجه' }).click();
    await expect(page.locator(`details[data-card-side=${side}] summary`)).toContainText('تصميمك');
  }

  // Both sides are previewed with sample names, on the owner's artwork.
  const front = page.frameLocator('iframe[title="الوجه"]');
  await expect(front.locator('h1')).toBeVisible();
  await expect(front.locator('img[src*="images/"]')).toHaveCount(1);
  const back = page.frameLocator('iframe[title="الظهر"]');
  await expect(back.locator('h1')).toHaveText('بكل الحب');
  await page.locator('details[data-card-side=back]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('card-design.png'), fullPage: true });

  // Removing the artwork goes back to the theme's own design (here: no printable front).
  for (const side of ['front', 'back'] as const) {
    const box = page.locator(`details[data-card-side=${side}]`);
    if (!(await box.evaluate((el) => (el as HTMLDetailsElement).open))) await box.locator('summary').click();
    page.once('dialog', (d) => d.accept());
    await box.getByRole('button', { name: /إزالة تصميمي/ }).click();
    await expect(page.locator(`details[data-card-side=${side}] summary`)).not.toContainText('تصميمك');
  }
  await expect(page.getByText('هذا القالب ليس له وجه بطاقة خاص به')).toBeVisible();
});
