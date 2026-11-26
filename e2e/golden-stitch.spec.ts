import { expect, test } from '@playwright/test';
import { signInAsNewOwner } from './helpers';

/**
 * #32 Golden Stitch (owner, 2026-11-25/26): no Open button, the film plays by itself; a guest's tap turns the sound on
 * without stopping it; swipes during the film never scroll the invitation, which then starts at its first page.
 */
test('the film plays through and the invitation starts at the families page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'stateful flow runs once');
  test.setTimeout(120_000);
  await signInAsNewOwner(page);
  await page.goto('/admin/preview/en/theme/golden-stitch?v=1&state=2&names=short');
  await expect(page.getByRole('button', { name: 'Open invitation' })).toHaveCount(0);
  const video = page.locator('video');
  await expect(video).toHaveCount(1);
  await page.waitForTimeout(1000);
  // The guest taps for sound and swipes while the film plays.
  for (let i = 0; i < 4; i++) {
    await page.touchscreen.tap(200, 400);
    await page.mouse.wheel(0, 2000);
    await page.evaluate(() => window.scrollBy(0, 3000));
    await page.waitForTimeout(300);
  }
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  // Still playing (a refused tap for sound must not freeze it)…
  const t0 = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
  await page.waitForTimeout(1500);
  expect(await video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(t0);
  // …to the end, then the invitation from its first page.
  await expect(video).toHaveCount(0, { timeout: 25_000 });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByText('Together with their families')).toBeInViewport();
});
