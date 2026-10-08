import { expect, test, type Page } from '@playwright/test';
import { generatedManifests } from '../src/theme-registry/generated';
import { FEATURES } from '../src/catalog/features';
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
      if (!m.internal) {
        // Owner rule: every invitation starts closed and opens with an animation on the guest's tap.
        await expect(open, `${ref} state ${i + 1}: opening screen with the Open button`).toBeVisible();
        await page.evaluate(() => {
          const w = window as unknown as { __bahjaAnimated: number };
          w.__bahjaAnimated = 0;
          for (const type of ['animationstart', 'transitionstart']) document.addEventListener(type, () => w.__bahjaAnimated++, true);
        });
      }
      if (await open.count()) await open.click();
      if (!m.internal) {
        const animated = await page
          .waitForFunction(() => (window as unknown as { __bahjaAnimated: number }).__bahjaAnimated > 0 || document.getAnimations().length > 0, null, { timeout: 1500 })
          .then(() => true, () => false);
        expect(animated, `${ref} state ${i + 1}: an opening animation plays after tapping Open`).toBe(true);
      }
      // The opening (every non-looping animation) is over within 4 s; then screenshots show the final state.
      await page.waitForFunction(
        () => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity),
        null,
        { timeout: m.internal ? 30_000 : 4_000 },
      );
      await expect(page.getByText(ar.invitationSamples.short.person_1_name).first()).toBeVisible();
      if (!m.internal) {
        // Owner rule: one border per theme, drawn with <ThemeBorder> on the invitation, the card and the keepsake.
        await expect(page.locator('[data-bahja-border]'), `${ref}: theme border`).toHaveCount(1);
      }
      const has = (f: string) => (state.features as string[]).includes(f);
      await expect(page.getByRole('link', { name: ar.invitation.openMap }), `${ref} state ${i + 1}: map`).toHaveCount(has('map') ? 1 : 0);
      await expect(page.getByRole('button', { name: ar.invitation.submit }), `${ref} state ${i + 1}: guest form`).toHaveCount(has('rsvp') ? 1 : 0);
      // A theme with the signature feature shows the (sample) signature with <Signature>, and only then.
      await expect(page.locator('[data-bahja-signature]'), `${ref} state ${i + 1}: signature`).toHaveCount(has('signature') ? 1 : 0);
      if (has('rsvp')) {
        // Empty submit shows validation; nothing is saved in sample mode.
        await page.getByRole('button', { name: ar.invitation.submit }).click();
        await expect(page.getByText(ar.invitation.errorRequired).first()).toBeVisible();
      }
      await page.screenshot({ path: testInfo.outputPath(`theme-screenshots/${ref}/state-${i + 1}/ar-opened.png`), fullPage: true });
    }
  }
});

test('every sellable theme looks right with any single feature switched off', async ({ page }, testInfo) => {
  // Packages are built feature by feature in Admin, so a theme must handle any subset, not only its designed states.
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  test.setTimeout(5 * 60_000);
  await signInAsNewOwner(page);
  for (const m of generatedManifests.filter((x) => !x.internal)) {
    for (const off of m.features) {
      // Switching a feature off also switches off what depends on it (no messages without the guest form…).
      const dropped = new Set<string>([off]);
      for (let grew = true; grew; ) {
        grew = false;
        for (const f of m.features) {
          if (!dropped.has(f) && (FEATURES[f].requires as readonly string[]).some((r) => dropped.has(r))) {
            dropped.add(f);
            grew = true;
          }
        }
      }
      const features = m.features.filter((f) => !dropped.has(f));
      const fields = m.fields.filter((k) => k !== 'venue_map_url' || features.includes('map'));
      const url = `/admin/preview/ar/theme/${m.key}?v=${m.version}&names=long&features=${features.join(',')}&fields=${fields.join(',')}`;
      await renderAndCheck(page, url, 390, testInfo.outputPath(`theme-screenshots/${m.key}@${m.version}/without-${off}.png`));
      await page.getByRole('button', { name: ar.invitation.openInvitation }).click();
      await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity), null, { timeout: 4_000 });
      await expect(page.getByText(ar.invitationSamples.long.person_1_name).first()).toBeVisible();
      await expect(page.getByRole('link', { name: ar.invitation.openMap }), `${m.key} without ${off}: map`).toHaveCount(features.includes('map') ? 1 : 0);
      await expect(page.getByRole('button', { name: ar.invitation.submit }), `${m.key} without ${off}: guest form`).toHaveCount(features.includes('rsvp') ? 1 : 0);
      await expect(page.getByRole('timer'), `${m.key} without ${off}: countdown`).toHaveCount(features.includes('countdown') ? 1 : 0);
      await expect(page.locator('[data-bahja-signature]'), `${m.key} without ${off}: signature`).toHaveCount(features.includes('signature') ? 1 : 0);
      await page.screenshot({ path: testInfo.outputPath(`theme-screenshots/${m.key}@${m.version}/without-${off}-opened.png`), fullPage: true });
    }
  }
});

test('with reduced motion the opening is skipped and the invitation shows at once', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  await signInAsNewOwner(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const m of generatedManifests.filter((x) => !x.internal)) {
    await page.goto(`/admin/preview/ar/theme/${m.key}?v=${m.version}&names=short`);
    await page.getByRole('button', { name: ar.invitation.openInvitation }).click();
    await expect(page.getByText(ar.invitationSamples.short.person_1_name).first(), `${m.key}@${m.version}`).toBeVisible({ timeout: 1_000 });
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
