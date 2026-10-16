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


  // One photo into the cover place, then three at once into the next empty places.
  await slots.locator('[data-photo-slot="0"] input[type=file]').setInputFiles(await photo('#c08060'));
  await expect(slots.locator('[data-photo-slot="0"]')).toHaveAttribute('data-filled', 'true');
  await slots.locator('[data-photo-add-many]').setInputFiles([await photo('#6080c0'), await photo('#60c080'), await photo('#c0c060')]);
  await expect(slots.locator('[data-photo-count]')).toHaveText('4 of 7 photos added', { timeout: 30_000 });

  // Move the cover photo inside its frame and zoom it.
  await slots.locator('[data-photo-slot="0"]').getByRole('button', { name: 'Adjust' }).click();
  const editor = slots.locator('[data-photo-editor]');
  await editor.getByRole('slider', { name: 'Zoom' }).fill('2');
  await editor.getByRole('slider', { name: 'Zoom' }).dispatchEvent('pointerup');
  await expect(editor.locator('img')).toHaveAttribute('style', /scale\(2\)/);
  await slots.locator('[data-photo-slot="0"]').getByRole('button', { name: 'Done' }).click();

  // Remove one.
  await slots.locator('[data-photo-slot="3"]').getByRole('button', { name: 'Remove' }).click();
  await expect(slots.locator('[data-photo-count]')).toHaveText('3 of 7 photos added');
  await slots.screenshot({ path: testInfo.outputPath('photo-slots.png') });

  // The invitation preview shows them: the cover (zoomed as placed) and two in the gallery.
  await page.goto(`/p/${previewToken}`);
  await expect(page.locator('[data-bahja-photo]')).toHaveCount(3);
  await expect(page.locator('[data-demo-gallery]')).toHaveAttribute('data-demo-gallery', '2');
  await expect(page.locator('[data-bahja-photo] img').first()).toHaveAttribute('style', /scale\(2\)/);
  await page.screenshot({ path: testInfo.outputPath('preview.png'), fullPage: true });

  // Coming back keeps them.
  await page.goto(`/en/order/${previewToken}`);
  await expect(page.locator('[data-photo-count]')).toHaveText('3 of 7 photos added');
});
