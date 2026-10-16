import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { E2E_DATABASE_URL } from './helpers';

function draft(): { previewToken: string; packageId: string } {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-photos-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

const photo = async (color: string) => ({ name: `${color.slice(1)}.jpg`, mimeType: 'image/jpeg', buffer: await sharp({ create: { width: 2000, height: 1500, channels: 3, background: color } }).jpeg().toBuffer() });

test('the customer adds, places and removes their own photos; the design shows them', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(120_000);
  const { previewToken, packageId } = draft();

  // The package says how many photos the design holds.
  await page.goto('/en/themes/demo-photos');
  await expect(page.locator('li', { has: page.locator(`a[href*="pkg=${packageId}"]`) }).getByText('Up to 7 of your own photos')).toBeVisible();

  await page.goto(`/en/order/${previewToken}`);
  const slots = page.locator('[data-photo-slots]');
  await expect(slots).toHaveAttribute('data-photo-slots', '7');
  await expect(slots.locator('[data-photo-slot]')).toHaveCount(7);
  await expect(slots.locator('[data-photo-slot="0"]')).toContainText('Cover photo');
  await expect(slots.locator('[data-photo-count]')).toHaveText('0 of 7 photos added');
  // Each place has the collage's own shape: the second is wide.
  const ratio = async (n: number) => slots.locator(`[data-photo-slot="${n}"] > :nth-child(2)`).evaluate((el) => el.getBoundingClientRect().width / el.getBoundingClientRect().height);
  expect(await ratio(1)).toBeGreaterThan(1.4);
  expect(await ratio(0)).toBeLessThan(0.9);

  // One photo into the cover: the editor opens straight away, with the real design beside the frame.
  await slots.locator('[data-photo-slot="0"] input[type=file]').setInputFiles(await photo('#c08060'));
  const dialog = page.locator('[data-photo-editor-dialog]');
  await expect(dialog).toBeVisible();
  const design = page.frameLocator('iframe[data-photo-preview]');
  await expect(design.locator('[data-bahja-photo="0"] img')).toBeVisible();
  // Zooming redraws the design live (before anything is saved).
  await dialog.getByRole('slider', { name: 'Zoom' }).fill('2');
  await expect(design.locator('[data-bahja-photo="0"] img')).toHaveAttribute('style', /scale\(2\)/);
  await dialog.getByRole('slider', { name: 'Zoom' }).dispatchEvent('pointerup');
  await dialog.screenshot({ path: testInfo.outputPath('editor.png') });
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(dialog).toBeHidden();

  // Three at once fill the next places in order.
  await slots.locator('[data-photo-add-many]').setInputFiles([await photo('#6080c0'), await photo('#60c080'), await photo('#c0c060')]);
  await expect(slots.locator('[data-photo-count]')).toHaveText('4 of 7 photos added', { timeout: 30_000 });
  // Only the next free place takes a new photo.
  await expect(slots.locator('[data-photo-slot="4"] input[type=file]')).toHaveCount(1);
  await expect(slots.locator('[data-photo-slot="5"] input[type=file]')).toHaveCount(0);

  // Move the third photo earlier, then remove the second: the later ones move up.
  const srcOf = (n: number) => slots.locator(`[data-photo-slot="${n}"] img`).getAttribute('src');
  const third = await srcOf(2);
  await slots.locator('[data-photo-slot="2"]').getByRole('button', { name: /Move earlier/ }).click();
  await expect(slots.locator('[data-photo-slot="1"] img')).toHaveAttribute('src', third!);
  const last = await srcOf(3);
  await slots.locator('[data-photo-slot="1"]').getByRole('button', { name: 'Remove' }).click();
  await expect(slots.locator('[data-photo-count]')).toHaveText('3 of 7 photos added');
  await expect(slots.locator('[data-photo-slot="2"] img')).toHaveAttribute('src', last!);
  await slots.screenshot({ path: testInfo.outputPath('photo-slots.png') });

  // The invitation shows them in order: the cover (zoomed as placed) and two in the collage.
  await page.goto(`/p/${previewToken}`);
  await expect(page.locator('[data-bahja-photo]')).toHaveCount(3);
  await expect(page.locator('[data-demo-gallery]')).toHaveAttribute('data-demo-gallery', '2');
  await expect(page.locator('[data-bahja-photo="0"] img')).toHaveAttribute('style', /scale\(2\)/);
  await page.screenshot({ path: testInfo.outputPath('preview.png'), fullPage: true });

  // Coming back keeps them.
  await page.goto(`/en/order/${previewToken}`);
  await expect(page.locator('[data-photo-count]')).toHaveText('3 of 7 photos added');
});
