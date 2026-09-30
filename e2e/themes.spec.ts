import { expect, test, type Page } from '@playwright/test';
import { generatedManifests } from '../src/theme-registry/generated';
import ar from '../src/i18n/messages/ar.json' with { type: 'json' };
import { signInAsNewOwner } from './helpers';

/**
 * Automated theme validation (Theme Contract §63): every theme version in the
 * code, every designed package state, every language, short and long names,
 * phone and desktop widths. Screenshots go to test-results/ for human review.
 */
const LANGS = ['ar', 'en', 'ckb', 'bdn'] as const;
const WIDTHS = [360, 390, 430, 1280] as const;

async function renderAndCheck(page: Page, url: string, width: number, shot: string) {
  const errors: string[] = [];
  const onError = (e: Error) => errors.push(e.message);
  const onConsole = (m: { type(): string; text(): string }) => {
    if (m.type() === 'error') errors.push(m.text());
  };
  page.on('pageerror', onError);
  page.on('console', onConsole);
  await page.setViewportSize({ width, height: width >= 1000 ? 800 : 844 });
  const res = await page.goto(url);
  expect(res?.status(), url).toBe(200);
  await expect(page.locator('[data-bahja-theme]')).toBeVisible();
  await expect(page.getByRole('note')).toBeVisible(); // platform SAMPLE ribbon
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `horizontal overflow at ${width}px: ${url}`).toBeLessThanOrEqual(1);
  await page.screenshot({ path: shot, fullPage: true });
  page.off('pageerror', onError);
  page.off('console', onConsole);
  expect(errors, url).toEqual([]);
}

test('every theme renders every designed state correctly', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once; widths are set explicitly');
  test.setTimeout(10 * 60_000);
  await signInAsNewOwner(page);

  for (const m of generatedManifests) {
    const ref = `${m.key}@${m.version}`;
    for (const [i, state] of m.validStates.entries()) {
      for (const lang of LANGS) {
        for (const names of ['short', 'long'] as const) {
          // Full width matrix in Arabic (primary); 390px for the other languages.
          for (const width of lang === 'ar' ? WIDTHS : ([390] as const)) {
            const url = `/admin/preview/${lang}/theme/${m.key}?v=${m.version}&state=${i}&names=${names}`;
            await renderAndCheck(page, url, width, testInfo.outputPath(`theme-screenshots/${ref}/state-${i + 1}/${lang}-${names}-${width}.png`));
          }
        }
      }

      // Behaviour check (Arabic, 390px): open, content, and removed features really absent.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/admin/preview/ar/theme/${m.key}?v=${m.version}&state=${i}&names=short`);
      const open = page.getByRole('button', { name: ar.invitation.openInvitation });
      if (await open.count()) await open.click();
      // Let entrance animations finish so screenshots show the final state.
      await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
      await expect(page.getByText(ar.invitationSamples.short.person_1_name).first()).toBeVisible();
      const has = (f: string) => (state.features as string[]).includes(f);
      await expect(page.getByRole('link', { name: ar.invitation.openMap }), `${ref} state ${i + 1}: map`).toHaveCount(has('map') ? 1 : 0);
      await expect(page.getByRole('button', { name: ar.invitation.submit }), `${ref} state ${i + 1}: guest form`).toHaveCount(has('rsvp') ? 1 : 0);
      if (has('rsvp')) {
        // Empty submit shows validation; nothing is saved in sample mode.
        await page.getByRole('button', { name: ar.invitation.submit }).click();
        await expect(page.getByText(ar.invitation.errorRequired).first()).toBeVisible();
      }
      await page.screenshot({ path: testInfo.outputPath(`theme-screenshots/${ref}/state-${i + 1}/ar-opened.png`), fullPage: true });
    }
  }
});

test('invitation pages load no platform styles and no other theme', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  await signInAsNewOwner(page);
  const css: string[] = [];
  page.on('response', async (r) => {
    if (r.url().endsWith('.css')) css.push(await r.text());
  });
  await page.goto('/admin/preview/ar/theme/demo-wedding');
  await page.waitForLoadState('networkidle');
  const all = css.join('\n');
  expect(all).not.toContain('--color-canvas'); // platform (Tailwind) tokens
  expect(all).not.toContain('#fff6ee'); // demo-minimal's background
});
