import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { signInAsNewOwner } from './helpers';

/**
 * The tours' editor (owner, 2026-11-23): every piece of furniture has a code; the owner goes to one (#7), nudges it and
 * turns it, saves, and the change is still there when the editor opens again.
 */
test('the owner moves and turns an item of the café by its code, and saves it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(300_000);
  const slug = `edit-${Date.now().toString(36)}`;
  await signInAsNewOwner(page);
  await page.goto('/admin/tours');
  await page.getByLabel('اسم المقهى').fill('KOUP test');
  await page.getByLabel(/^اسم الرابط/).fill(slug);
  await page.getByRole('button', { name: 'إضافة جولة' }).click();
  await page.waitForURL(/\/admin\/tours\/[0-9a-f-]{36}$/);
  await page.locator('label', { hasText: 'رفع نموذج' }).locator('input[type=file]').setInputFiles({
    name: 'koup.glb',
    mimeType: 'model/gltf-binary',
    buffer: readFileSync('tours/koupup/koupup.glb'),
  });
  await expect(page.getByText('تم حفظ النموذج.')).toBeVisible({ timeout: 90_000 });
  await page.reload();
  await page.getByTestId('open-editor').click();
  await page.waitForURL(/\/admin\/tour-editor\/[0-9a-f-]{36}$/);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await expect(page.locator('[data-testid="tour-editor-canvas"][data-state="ready"]')).toBeVisible({ timeout: 150_000 });

  await page.getByLabel("إظهار أرقام القطع").check();
  await page.getByLabel('اذهب إلى القطعة').fill('#7');
  await page.getByRole('button', { name: 'اذهب إلى القطعة' }).click();
  const panel = page.getByTestId('tour-editor-panel');
  // The first pick loads the move/turn handles (a separate download), slow on a busy CI machine.
  await expect(panel.getByText('#7')).toBeVisible({ timeout: 30_000 });
  // 10 cm along, 15° round
  await panel.getByRole('button', { name: '+10', exact: true }).first().click();
  await panel.getByRole('button', { name: '+15°' }).click();
  await expect(page.getByText('تغييرات غير محفوظة')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('tour-editor.png') });
  await page.getByTestId('tour-editor-save').click();
  await expect(page.getByText('تم الحفظ', { exact: false })).toBeVisible();

  // still there when it opens again
  await page.reload();
  await expect(page.locator('[data-testid="tour-editor-canvas"][data-state="ready"]')).toBeVisible({ timeout: 150_000 });
  await expect(panel.getByRole('button', { name: '#7' })).toBeVisible();
  expect(errors).toEqual([]);
});
