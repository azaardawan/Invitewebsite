import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

/**
 * Pink Dreamhouse (owner, 2026-11-19): a 3D dollhouse walked through like the museum, sized by the package (Basic two
 * rooms, VVIP the whole house), with drawers holding the customer's messages and a secret suite that opens once every
 * memory is found. Packages offer their own colour sets and up to three videos.
 */

function draft(tier: 'basic' | 'vvip'): { previewToken: string; packageId: string } {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-house-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, HOUSE_TIER: tier },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

test('the house opens in 3D; drawers hold messages; finding every memory opens the secret suite', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'widths are set explicitly');
  test.setTimeout(180_000);
  await signInAsNewOwner(page);
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 800 });
  // The sample is the whole house (all 24 places).
  await page.goto('/admin/preview/en/theme/pink-dreamhouse?v=1&names=short');
  await page.evaluate(() => localStorage.clear());
  await page.getByRole('button', { name: 'Enter the house' }).click();
  await expect(page.locator('[data-house-3d="ready"][data-house-tier="vvip"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('living-room.png') });
  // Walking up to the coffee table: a button to open its drawer (the test browser draws slowly: walk a while).
  await page.mouse.click(5, 790);
  await page.keyboard.down('ArrowUp');
  await expect(page.locator('[data-house-near="drawer1"]')).toBeVisible({ timeout: 20_000 });
  await page.keyboard.up('ArrowUp');
  // Each thing nearby has its own button, named (no crouching to tap a low drawer).
  await expect(page.locator('[data-house-near="drawer1"]')).toHaveText('Open · Drawer 1');
  await expect(page.locator('[data-house-room-count="0/2"]')).toContainText('0 of 2 opened in this room');
  await page.locator('[data-house-near="drawer1"]').click();
  await expect(page.locator('[data-house-card]')).toBeVisible();
  // The room's counter counts it.
  await expect(page.locator('[data-house-room-count="1/2"]')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('near-open.png') });
  await page.locator('[data-house-card]').getByRole('button', { name: 'Close' }).click();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Enter the house' }).click();
  await expect(page.locator('[data-house-3d="ready"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-house-unlocked="no"]')).toBeVisible();
  // A drawer's message (the sample's words).
  await page.locator('[data-drawer="1"]').dispatchEvent('click');
  await expect(page.locator('[data-house-card]')).toContainText('I still smile every time I think of it.');
  await page.locator('[data-house-card]').getByRole('button', { name: 'Close' }).click();
  // The six drawers outside the suite open it.
  for (const n of [2, 3, 4, 5, 6]) {
    await page.locator(`[data-drawer="${n}"]`).dispatchEvent('click');
    await page.locator('[data-house-card]').getByRole('button', { name: 'Close' }).click();
  }
  await expect(page.locator('[data-house-unlocked="yes"]')).toBeVisible();
  await expect(page.locator('[data-house-found="6"]')).toContainText('6 of 6 memories found');
  // And it stays open on the next visit.
  await page.reload();
  await page.getByRole('button', { name: 'Enter the house' }).click();
  await expect(page.locator('[data-house-3d="ready"][data-house-unlocked="yes"]')).toBeVisible({ timeout: 60_000 });
  // The gift wishes a happy birthday.
  await page.locator('[data-thing="gift"]').dispatchEvent('click');
  await expect(page.locator('[data-house-card]')).toContainText('Happy birthday');
  await page.locator('[data-house-card]').getByRole('button', { name: 'Close' }).click();
  // The stairs (a tap instead of a climb) take the visitor upstairs.
  await page.locator('[data-thing="stairsUp"]').dispatchEvent('click');
  await page.waitForTimeout(800);
  await page.screenshot({ path: testInfo.outputPath('upstairs.png') });
  expect(errors).toEqual([]);
});

test('on a phone the house is walked sideways; without 3D it is shown flat', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  test.setTimeout(120_000);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await signInAsNewOwner(page);
  await page.goto('/admin/preview/en/theme/pink-dreamhouse?v=1&names=short');
  await page.getByRole('button', { name: 'Enter the house' }).click();
  await expect(page.locator('[data-house-turn]')).toContainText('Turn your phone sideways');
  // (The tap asked for full screen; leave it so the test can turn the window.)
  await page.evaluate(() => document.fullscreenElement && document.exitFullscreen()).catch(() => {});
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('[data-house-turn]')).toHaveCount(0);
  await expect(page.locator('[data-house-3d="ready"]')).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: testInfo.outputPath('phone-landscape.png') });
  // the walking pad on the left; its little button moves it to the right (left-handed visitors), remembered
  const padSide = page.getByTestId('pad-side');
  expect((await padSide.boundingBox())!.x).toBeLessThan(844 / 2);
  await page.screenshot({ path: testInfo.outputPath('phone-pad-left.png') });
  await padSide.click();
  await expect.poll(async () => (await padSide.boundingBox())!.x).toBeGreaterThan(844 / 2);
  await page.screenshot({ path: testInfo.outputPath('phone-pad-right.png') });
  await context.close();

  const flat = await browser.newPage();
  await flat.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest);
    } as typeof original;
  });
  await signInAsNewOwner(flat);
  await flat.setViewportSize({ width: 390, height: 844 });
  await flat.goto('/admin/preview/en/theme/pink-dreamhouse?v=1&names=short');
  await flat.getByRole('button', { name: 'Enter the house' }).click();
  await expect(flat.locator('[data-house-flat] [data-house-room]')).toHaveCount(6);
  await expect(flat.locator('[data-house-room="living"]')).toContainText('Birthday Living Room');
  await flat.screenshot({ path: testInfo.outputPath('flat.png'), fullPage: true });
});

test('a Basic package fills two rooms, offers its own colour sets and no video; VVIP the whole house with three videos', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const basic = draft('basic');
  await page.goto(`/en/order/${basic.previewToken}`);
  const design = page.frameLocator('iframe[data-template-design]');
  await expect(design.locator('[data-house-tier="basic"] [data-house-room]')).toHaveCount(2);
  // Six photo places, and a photo for each of its two drawers (optional).
  await expect(design.locator('[data-bahja-photo-slot]')).toHaveCount(8);
  await expect(design.locator('[data-house-drawer-edit] [data-bahja-photo-slot]')).toHaveCount(2);
  await expect(design.locator('[data-bahja-video-slot]')).toHaveCount(0);
  // Only the package's colour set besides the house's own.
  const picker = page.locator('[data-template-colors]');
  await expect(picker.getByRole('button')).toHaveCount(2);
  await expect(picker.getByRole('button', { name: 'Rose Cream' })).toBeVisible();
  await expect(page.locator('[data-template-videos]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('basic-editor.png'), fullPage: true });

  const vvip = draft('vvip');
  await page.goto(`/en/order/${vvip.previewToken}`);
  await expect(design.locator('[data-house-tier="vvip"] [data-house-room]')).toHaveCount(6);
  await expect(design.locator('[data-bahja-photo-slot]')).toHaveCount(24 + 8);
  await expect(design.locator('[data-bahja-video-slot]')).toHaveCount(3);
  await expect(page.locator('[data-template-colors]').getByRole('button')).toHaveCount(7);
  await expect(page.locator('[data-template-videos]')).toContainText('0/3');
  // The cinema's screen opens the video sheet named for it.
  await design.locator('[data-bahja-video-slot="1"]').click();
  await expect(page.locator('[data-template-sheet="video"]')).toContainText('The cinema screen');
  await page.screenshot({ path: testInfo.outputPath('vvip-video-sheet.png') });
  await page.locator('[data-template-sheet="video"]').getByRole('button', { name: /Done/ }).click();
  // A drawer can hold a photo besides its message: its sheet opens for that drawer's own place.
  await design.locator('[data-house-drawer-edit="drawer1"] [data-bahja-photo-slot]').click();
  await expect(page.locator('[data-template-sheet="photo-add"]')).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.locator('[data-template-sheet]')).toHaveCount(0);
  // A drawer's message is written in place.
  await design.locator('[data-bahja-edit="wording:drawer1"]').click();
  await page.locator('[data-template-text-input]').fill('Our first trip together.');
  await page.locator('[data-template-text-save]').click();
  await expect(design.locator('[data-house-room="living"]')).toContainText('Our first trip together.');
});

test('Admin: a package of the house sells videos and chooses its colour sets', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  test.setTimeout(120_000);
  draft('vvip');
  await signInAsNewOwner(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/admin/themes');
  await page.getByRole('link', { name: /Pink Dreamhouse|بيت الأحلام الوردي/ }).first().click();
  const pkg = page.locator('details').filter({ has: page.locator('[data-package-video-limit]') }).first();
  await pkg.locator('summary').click();
  await expect(pkg.locator('[data-package-video-limit] input')).toHaveAttribute('max', '3');
  await expect(pkg.locator('[data-package-palettes] input[type="checkbox"]')).toHaveCount(6);
  await pkg.screenshot({ path: testInfo.outputPath('admin-package.png') });
});
