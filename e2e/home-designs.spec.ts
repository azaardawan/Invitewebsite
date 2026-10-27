import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

/** Puts the demo wedding design on sale (with a cover), like the order-extras test. */
function designOnSale() {
  execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-extras-theme.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  });
}

// A phone, but run with the desktop project: it puts the demo design on sale, which the desktop catalog test
// (run before this file) needs still unconfigured; the phone projects all run before the desktop one.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const offset = (page: Page) =>
  page.locator('[data-design-row] > div').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);

test('the homepage designs drift on their own in an endless row, pause while swiped and open on a tap', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  test.setTimeout(90_000);
  designOnSale();
  await page.goto('/');
  const row = page.locator('[data-design-row]');
  await row.scrollIntoViewIfNeeded();
  await expect(row.locator('[data-carousel-card]').first()).toBeVisible();
  await expect(page.getByText('اسحبوا لتتصفحوا التصاميم')).toBeVisible();
  // The cards fill the row on screen.
  const onScreen = () =>
    row.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return [...el.querySelectorAll('a')].filter((a) => {
        const r = a.getBoundingClientRect();
        return r.right > box.left && r.left < box.right;
      }).length;
    });
  expect(await onScreen()).toBeGreaterThanOrEqual(2);

  // It moves by itself, to the right in Arabic (new designs come in from the left).
  const a = await offset(page);
  await page.waitForTimeout(1500);
  const b = await offset(page);
  expect(b).not.toBe(a);
  await testInfo.attach('designs-row.png', { body: await row.screenshot(), contentType: 'image/png' });

  // A swipe moves it and pauses the drift…
  const box = (await row.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.7, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + box.width * 0.7 - i * 15, y);
  await page.waitForTimeout(150); // a pause before letting go: no fling
  await page.mouse.up();
  const held = await offset(page);
  await page.waitForTimeout(1200);
  expect(Math.abs((await offset(page)) - held)).toBeLessThan(1);
  // …and it drifts again a moment later.
  await page.waitForTimeout(2500);
  expect(Math.abs((await offset(page)) - held)).toBeGreaterThan(1);

  // A tap on a card opens its design.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.4);
  await expect(page).toHaveURL(/\/themes\/[\w-]+$/);
});

test('no drift for visitors who asked for less motion', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await page.locator('[data-design-row]').scrollIntoViewIfNeeded();
  const a = await offset(page);
  await page.waitForTimeout(1200);
  expect(await offset(page)).toBe(a);
  await context.close();
});
