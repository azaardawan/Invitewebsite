import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

/**
 * The live preview beside the order form (owner, 2026-11-26): the invitation changes as the customer types, already
 * open; the field being edited glows on it; the printed card's sides; and a wedding held as a Henna night or in the
 * couple's own words says so on the invitation. `LIVE_PREVIEW_SHOTS=<folder>` saves pictures.
 */
const script = (file: string) =>
  JSON.parse(
    execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', file], { env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL } })
      .toString()
      .trim()
      .split('\n')
      .at(-1)!,
  );
const shots = process.env.LIVE_PREVIEW_SHOTS;
const shot = async (page: Page, name: string) => {
  if (!shots) return;
  mkdirSync(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/${name}.png` });
};
/** The frame on show (the other one draws the next picture). */
const shown = (page: Page): FrameLocator => page.locator('[data-live-preview] iframe[aria-hidden="false"]').contentFrame();

test('live preview: typing shows on the invitation, the field glows, the occasion wording changes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  test.setTimeout(180_000);
  await signInAsNewOwner(page);
  const { packageId } = script('e2e/scripts/espresso-on-sale.ts') as { packageId: string };

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/en/themes/espresso-ivory/order?pkg=${packageId}&occasion=wedding`);
  const preview = page.locator('[data-live-preview]');
  await expect(preview).toBeVisible();
  // Already open: no «Open invitation» to press.
  await expect(shown(page).getByRole('button', { name: 'Open invitation' })).toHaveCount(0, { timeout: 15_000 });

  // Typing a name: the invitation shows it, and it glows while the field is being edited.
  const name = page.locator('input[name="f.person_1_name"]');
  await name.fill('Zakariya');
  await expect(shown(page).getByText('Zakariya').first()).toBeVisible({ timeout: 15_000 });
  await name.focus();
  await expect(shown(page).locator('[data-bahja-glow]')).toContainText('Zakariya', { timeout: 10_000 });
  await expect(preview.getByRole('status')).toHaveText(/Glowing where it shows/);
  await shot(page, '1-desktop-typing');

  // A Henna night: every line that names the wedding says so.
  await page.getByText('Henna night', { exact: true }).click();
  await expect(shown(page).getByText(/henna night/i).first()).toBeAttached({ timeout: 15_000 });
  // Their own words.
  await page.getByText('Our own words…', { exact: true }).click();
  await page.getByLabel("Your occasion's name").fill('Our Nikah ceremony');
  await expect(shown(page).getByText(/Our Nikah ceremony/i).first()).toBeAttached({ timeout: 15_000 });

  // The printed card, front and back (the back's own title).
  await preview.getByRole('button', { name: 'Card front' }).click();
  await expect(shown(page).getByText('Zakariya').first()).toBeAttached({ timeout: 15_000 });
  await preview.getByRole('button', { name: 'Card back' }).click();
  await shot(page, '2-desktop-card');

  // Bigger, without leaving the page.
  await preview.getByRole('button', { name: /Enlarge/ }).click();
  await expect(preview).toHaveCSS('position', 'fixed');
  await shot(page, '3-enlarged');
  await preview.getByRole('button', { name: /Close/ }).click();

  // A phone: the preview pinned on top, made smaller and shown again.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(preview).toHaveCSS('position', 'sticky');
  await shot(page, '4-phone');
  await preview.getByRole('combobox').selectOption('front');
  await preview.getByRole('button', { name: /Smaller/ }).click();
  await preview.getByRole('button', { name: /Show preview/ }).click();
});
