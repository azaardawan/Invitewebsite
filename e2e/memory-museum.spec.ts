import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { E2E_DATABASE_URL, openPreview, signInAsNewOwner } from './helpers';

/**
 * Memory Museum (Couples): the couple's photos hang in a 3D museum their guests walk through. Rooms are photo sets, so
 * a package sells some of the rooms; the couple fills the rooms flat in the template editor; a device without 3D gets
 * the flat museum.
 */

function draft(): { previewToken: string; packageId: string } {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-museum-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

test('the museum opens in 3D, and the guide walks to a photo', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'widths are set explicitly');
  test.setTimeout(180_000);
  await signInAsNewOwner(page);
  const errors = watchErrors(page);
  // Walks jump straight to the photo (the test browser draws 3D slowly).
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: width >= 1000 ? 800 : 844 });
    await page.goto('/admin/preview/en/theme/memory-museum?v=1&names=short');
    await page.getByRole('button', { name: 'Open the museum' }).click();
    await expect(page.locator('[data-museum-3d="ready"]')).toBeVisible({ timeout: 60_000 });
    await page.mouse.move(5, 5);
    await expect(page.locator('canvas')).toHaveCount(1);
    // Nothing but the museum on the screen: a welcome card with the names, gone once the guest moves.
    await expect(page.getByText('Ammar').first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`hall-${width}.png`) });
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('[data-museum-3d] [class*="welcomeGone"]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Next photo' })).toHaveCount(0);
    // For screen readers, a list of every sample photo (six rooms of eight) walks straight to one.
    await expect(page.getByRole('list', { name: 'Photos in the museum' }).getByRole('listitem')).toHaveCount(48);
    await page.locator('[data-place="9"]').dispatchEvent('click');
    // Standing in front of it, in the front wing's second room.
    await expect(page.locator('[data-museum-viewing="9"][data-museum-room-now="room2"]')).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: testInfo.outputPath(`photo-${width}.png`) });
  }
  expect(errors).toEqual([]);
});

test('on a phone the museum is walked sideways: held upright, it asks to turn the phone', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  test.setTimeout(120_000);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await signInAsNewOwner(page);
  const errors = watchErrors(page);
  await page.goto('/admin/preview/en/theme/memory-museum?v=1&names=short');
  await page.getByRole('button', { name: 'Open the museum' }).click();
  await expect(page.locator('[data-museum-turn]')).toContainText('Turn your phone sideways');
  await page.screenshot({ path: testInfo.outputPath('phone-upright.png') });
  // Tapping Open asked for full screen (to lock the phone sideways where the browser allows it).
  expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.evaluate(() => document.exitFullscreen());
  // Turned sideways: the museum, with only the touch pad over it.
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('[data-museum-turn]')).toHaveCount(0);
  await expect(page.locator('[data-museum-3d="ready"]')).toBeVisible({ timeout: 60_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: testInfo.outputPath('phone-sideways.png') });
  expect(errors).toEqual([]);
  await context.close();
});

test('without 3D the museum is shown flat, room by room', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  await signInAsNewOwner(page);
  // A browser that can't draw WebGL.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest);
    } as typeof original;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/preview/ar/theme/memory-museum?v=1&names=short');
  await page.getByRole('button', { name: 'افتح المتحف' }).click();
  await expect(page.locator('[data-museum-flat]')).toBeVisible();
  await expect(page.locator('[data-museum-room]')).toHaveCount(6);
  await expect(page.locator('[data-museum-flat] [data-bahja-photo]')).toHaveCount(48);
  await expect(page.locator('[data-bahja-border]')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('flat.png'), fullPage: true });
});

test('v2: for friends the museum speaks of friends; a colour set changes the walls', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/museum-friends.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  const sets = JSON.parse(out.trim().split('\n').at(-1)!) as { id: string; name: string }[];
  expect(sets.map((x) => x.name)).toEqual(['Deep Burgundy', 'Olive Green', 'Dusty Blue', 'Soft Rose', 'Warm Taupe']);
  await signInAsNewOwner(page);
  // The flat museum (no WebGL) shows the rooms' names as text.
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest);
    } as typeof original;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const burgundy = sets.find((x) => x.name === 'Deep Burgundy')!.id;
  await page.goto(`/admin/preview/en/theme/memory-museum?v=2&names=short&occasion=friends&palette=${burgundy}`);
  await page.getByRole('button', { name: 'Open the museum' }).click();
  await expect(page.locator('[data-museum-room="1"]')).toContainText('How we met');
  await expect(page.locator('[data-museum-room="1"]')).toContainText('The day our friendship began.');
  await expect(page.getByText('Graduation day').first()).toBeVisible();
  const wall = await page.locator('[data-bahja-theme]').evaluate((el) => getComputedStyle(el).getPropertyValue('--bahja-color-walls').trim());
  expect(wall.toLowerCase()).toBe('#6e2a35');
  // For a couple: the couple's words.
  await page.goto('/admin/preview/en/theme/memory-museum?v=2&names=short');
  await page.getByRole('button', { name: 'Open the museum' }).click();
  await expect(page.locator('[data-museum-room="1"]')).toContainText('The beginning');
});

test('colour choice: the customer picks the walls’ colour above the design, and it stays', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(120_000);
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-museum-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, MUSEUM_COLOURS: '1' },
  }).toString();
  const { previewToken } = JSON.parse(out.trim().split('\n').at(-1)!) as { previewToken: string };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/en/order/${previewToken}`);
  const picker = page.locator('[data-template-colors]');
  await expect(picker).toContainText('The museum’s wall colour');
  await expect(picker.getByRole('button')).toHaveCount(6);
  await expect(picker.getByRole('button', { name: 'Original colour' })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: testInfo.outputPath('colours.png') });
  await picker.getByRole('button', { name: 'Deep Burgundy' }).click();
  await expect(picker.getByRole('button', { name: 'Deep Burgundy' })).toHaveAttribute('aria-pressed', 'true');
  // The design is drawn again in that colour, and the choice is kept.
  const design = page.frameLocator('iframe[data-template-design]');
  await expect
    .poll(async () => (await design.locator('[data-bahja-theme]').evaluate((el) => getComputedStyle(el).getPropertyValue('--bahja-color-walls').trim())).toLowerCase(), { timeout: 15_000 })
    .toBe('#6e2a35');
  await page.reload();
  await expect(page.locator('[data-template-colors]').getByRole('button', { name: 'Deep Burgundy' })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: testInfo.outputPath('colours-burgundy.png'), fullPage: true });
  // Background music, or none (owner, 2026-11-14): two buttons; the choice is kept.
  const music = page.locator('[data-template-music]');
  await expect(music.getByRole('button', { name: 'With music' })).toHaveAttribute('aria-pressed', 'true');
  await music.getByRole('button', { name: 'No music' }).click();
  await expect(music.getByRole('button', { name: 'No music' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('[data-template-music]').getByRole('button', { name: 'No music' })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-template-music]').screenshot({ path: testInfo.outputPath('music.png') });
});

test('a two-room package: the couple fills two rooms; guests see only the rooms with photos', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(240_000);
  const { previewToken } = draft();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/en/order/${previewToken}`);
  await expect(page.locator('[data-template-editor]')).toBeVisible();
  const design = page.frameLocator('iframe[data-template-design]');
  // The editor shows the museum's plan and the package's two rooms (the front wing), each laid out as its walls: eight
  // places, each room's first place ready for a photo.
  await expect(design.locator('[data-museum-room]')).toHaveCount(2);
  await expect(design.locator('[data-bahja-photo-slot]')).toHaveCount(16);
  await expect(design.getByRole('img', { name: 'Your museum’s plan' }).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('editor-empty.png'), fullPage: true });

  // A room's name, then a photo in the second room.
  const sheet = page.locator('[data-template-sheet]');
  await design.locator('[data-bahja-edit="wording:room2"]').click();
  await sheet.locator('[data-template-text-input]').fill('Paris');
  await sheet.locator('[data-template-text-save]').click();
  await expect(design.locator('[data-bahja-edit="wording:room2"]')).toHaveText('Paris');
  await design.locator('[data-bahja-edit="wording:room2Text"]').click();
  await sheet.locator('[data-template-text-input]').fill('Our honeymoon in France.');
  await sheet.locator('[data-template-text-save]').click();
  await expect(design.locator('[data-bahja-edit="wording:room2Text"]')).toHaveText('Our honeymoon in France.');
  await design.locator('[data-bahja-photo-slot="8"]').click();
  await expect(sheet).toHaveAttribute('data-template-sheet', 'photo-add');
  const jpeg = await sharp({ create: { width: 1500, height: 2000, channels: 3, background: '#b04050' } }).jpeg().toBuffer();
  await sheet.locator('[data-template-photo-input]').setInputFiles({ name: 'p.jpg', mimeType: 'image/jpeg', buffer: jpeg });
  await expect(sheet).toHaveAttribute('data-template-sheet', 'photo-frame', { timeout: 30_000 });
  const box = await sheet.locator('[data-photo-frame]').boundingBox();
  expect(box!.width / box!.height).toBeCloseTo(2.04 / 2.74, 1);
  await sheet.getByRole('button', { name: 'Next' }).click();
  await sheet.locator('[data-template-photo-title]').fill('Eiffel Tower');
  await sheet.locator('[data-template-photo-caption]').fill('Our first evening in Paris.');
  await sheet.locator('[data-template-photo-save]').click();
  await expect(sheet).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('editor-filled.png'), fullPage: true });

  // The guests' museum: one photo, in the second room; the walk takes them there.
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPreview(page, previewToken);
  await expect(page.locator('[data-museum-3d="ready"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-bahja-photo]')).toHaveCount(1);
  // Its title (and words) hang under it; the room's name and words are on the room's sign and plaque.
  await page.locator('[data-place="8"]').dispatchEvent('click');
  await expect(page.locator('[data-museum-viewing="8"][data-museum-room-now="room2"]')).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: testInfo.outputPath('guest-photo.png') });
  // Turning round to the room's plaque on the wall ahead of the doorway.
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(900);
  await page.keyboard.up('ArrowLeft');
  await page.screenshot({ path: testInfo.outputPath('guest-room.png') });
  expect(errors).toEqual([]);
});
