import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { generatedManifests } from '../src/theme-registry/generated';
import ar from '../src/i18n/messages/ar.json' with { type: 'json' };
import en from '../src/i18n/messages/en.json' with { type: 'json' };
import { signInAsNewOwner } from './helpers';
import { issues } from './clash';
import allowed from './theme-clashes.allow.json' with { type: 'json' };

/**
 * No text may clash with the decoration (owner, 2026-11-11: Golden Arch's venue ran over the gold arch's border on the
 * first screen): for the newest version of every design on sale, with the long example names, in Arabic and English on
 * a phone, the closed cover and the whole opened invitation are searched for texts that are cut off, wider than the
 * screen, on top of another text, on a small picture, or on the lines of the artwork (`clash.ts`).
 *
 * A new design must come out clean. Where the design means a text to sit on its artwork (a name on a ribbon, a title
 * on a patterned band), look at it, and list it in `theme-clashes.allow.json` under `<key>@<version>`; never list a
 * real clash to get green: fix the design (a version on sale is frozen, so in a new version).
 *
 * A new or changed design: run it with `CLASH_STRICT=1 CLASH_SHOTS=1 CLASH_THEMES=<key>` and look at every picture.
 * `CLASH_SHOTS=1`: also saves a picture of each clash found to `test-results/theme-clashes/`, for looking at them.
 */
const LANGS = ['ar', 'en'] as const;
const OUT = process.env.CLASH_OUT ?? 'test-results/theme-clashes';

const only = process.env.CLASH_THEMES?.split(',').filter(Boolean);
const latest = new Map<string, (typeof generatedManifests)[number]>();
for (const m of generatedManifests) if (!m.internal && m.onlineInvitation !== false && (latest.get(m.key)?.version ?? 0) < m.version) latest.set(m.key, m);
const manifests = [...latest.values()].filter((m) => !only || only.includes(m.key));

/** A picture of where a clash is: around the first element its path names. */
async function shoot(page: Page, issue: string, file: string) {
  const path = issue.replace(/^cover\//, '').replace(/^[a-z-]+:/, '').split('|')[0]!;
  const selector =
    'body > ' +
    path
      .split('>')
      .map((x) => {
        const m = /^([a-z0-9]+?)(\d+)$/.exec(x)!;
        return `${m[1]}:nth-of-type(${m[2]})`;
      })
      .join(' > ');
  const el = page.locator(selector).first();
  if (!(await el.count())) return;
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();
  if (!box) return;
  const view = page.viewportSize()!;
  const y = Math.max(0, Math.min(view.height - 10, box.y - 140));
  await page.screenshot({ path: file, clip: { x: 0, y, width: view.width, height: Math.min(view.height - y, box.height + 280) } });
}

test.describe.configure({ mode: 'parallel' });

for (const m of manifests) {
  test(`no text clashes with the decoration: ${m.key}@${m.version}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'runs once');
    test.setTimeout(5 * 60_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signInAsNewOwner(page);
    // A still clock: the countdown must not differ between runs.
    await page.clock.setFixedTime(new Date('2026-11-01T09:00:00Z'));
    await page.setViewportSize({ width: 390, height: 844 });
    const ref = `${m.key}@${m.version}`;
    const found: string[] = [];
    const note = async (lang: string, stage: string) => {
      // Only what shows on two looks a moment apart (nothing that is still moving).
      const first = await issues(page);
      await page.waitForTimeout(300);
      const again = new Set(await issues(page));
      for (const issue of first.filter((x) => again.has(x))) {
        const id = `${lang}: ${stage}${issue}`;
        found.push(id);
        if (process.env.CLASH_SHOTS) {
          mkdirSync(`${OUT}/${m.key}`, { recursive: true });
          await shoot(page, issue, `${OUT}/${m.key}/${found.length}-${lang}-${stage ? 'cover' : 'open'}.png`);
        }
      }
    };
    for (const lang of LANGS) {
      const res = await page.goto(`/admin/preview/${lang}/theme/${m.key}?v=${m.version}&names=long`, { waitUntil: 'networkidle' });
      expect(res?.status(), ref).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await note(lang, 'cover/');
      const open = page.getByRole('button', { name: (lang === 'ar' ? ar : en).invitation.openInvitation });
      if (await open.count()) {
        await open.first().click();
        await page.waitForTimeout(1200);
      }
      const settled = () =>
        page
          .waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity), null, { timeout: 5_000 })
          .catch(() => {});
      await settled();
      // Everything that shows as the guest scrolls.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(400);
      await settled();
      await note(lang, '');
    }
    mkdirSync(OUT, { recursive: true });
    writeFileSync(`${OUT}/${m.key}.json`, JSON.stringify(found, null, 2));
    const ok = new Set((allowed as Record<string, string[]>)[ref] ?? []);
    // «on-drawing» is read from the pixels and can differ a little between machines: it is reported, and only fails
    // the check when asked to (`CLASH_STRICT=1`, when adding or changing a design). The other kinds are exact.
    const advisory = found.filter((x) => !ok.has(x) && /: (cover\/)?on-drawing:/.test(x));
    for (const x of advisory) testInfo.annotations.push({ type: 'text on the artwork (look at it)', description: `${ref} ${x}` });
    expect(
      found.filter((x) => !ok.has(x) && (process.env.CLASH_STRICT || !advisory.includes(x))),
      `${ref}: texts clashing with the decoration (see e2e/theme-clashes.spec.ts)`,
    ).toEqual([]);
  });
}
