import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { generatedManifests } from '../src/theme-registry/generated';
import ar from '../src/i18n/messages/ar.json' with { type: 'json' };
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

/**
 * Design kits (Theme Contract, kits): every kit theme draws every unit in all
 * languages with short and long names, at phone and desktop widths, with no
 * errors, no sideways scrolling and no text outside its unit. Then a paid
 * order downloads real files.
 */
const LANGS = ['ar', 'en', 'ckb', 'bdn'] as const;
const WIDTHS = [360, 390, 430, 1280] as const;

/** Every element with its own text must sit inside its unit's trim box (bleed excluded). */
async function textOutsideUnits(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    for (const unit of document.querySelectorAll<HTMLElement>('[data-kit-unit]')) {
      const u = unit.getBoundingClientRect();
      const scale = u.width / unit.offsetWidth;
      const bleed = parseFloat(getComputedStyle(unit).getPropertyValue('--kit-bleed')) * scale;
      const box = { left: u.left + bleed - 1, right: u.right - bleed + 1, top: u.top + bleed - 1, bottom: u.bottom - bleed + 1 };
      for (const el of unit.querySelectorAll<HTMLElement>('*')) {
        const ownText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
        if (!ownText) continue;
        const r = el.getBoundingClientRect();
        if (r.left < box.left || r.right > box.right || r.top < box.top || r.bottom > box.bottom) {
          problems.push(`${unit.dataset.kitUnit}: "${el.textContent!.trim().slice(0, 30)}"`);
        }
      }
    }
    return problems;
  });
}

test('every design kit renders every unit correctly', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once; widths are set explicitly');
  test.setTimeout(10 * 60_000);
  await signInAsNewOwner(page);

  for (const m of generatedManifests.filter((x) => x.experience === 'DESIGN_KIT')) {
    const ref = `${m.key}@${m.version}`;
    // Units are independent, so the complete kit (the last state) shows every unit any package can have.
    const state = m.validStates.length - 1;
    for (const lang of LANGS) {
      for (const names of ['short', 'long'] as const) {
        for (const width of lang === 'ar' ? WIDTHS : ([390] as const)) {
          const errors: string[] = [];
          const onError = (e: Error) => errors.push(e.message);
          page.on('pageerror', onError);
          await page.setViewportSize({ width, height: width >= 1000 ? 800 : 844 });
          const url = `/admin/preview/${lang}/theme/${m.key}?v=${m.version}&state=${state}&names=${names}`;
          expect((await page.goto(url))?.status(), url).toBe(200);
          await expect(page.locator('[data-kit-gallery]')).toBeVisible();
          await expect(page.getByRole('note')).toBeVisible(); // platform SAMPLE ribbon
          await page.evaluate(() => document.fonts.ready);
          await expect(page.locator('[data-kit-unit]')).toHaveCount(5);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, `horizontal overflow at ${width}px: ${url}`).toBeLessThanOrEqual(1);
          expect(await textOutsideUnits(page), url).toEqual([]);
          await page.screenshot({ path: testInfo.outputPath(`theme-screenshots/${ref}/${lang}-${names}-${width}.png`), fullPage: true });
          page.off('pageerror', onError);
          expect(errors, url).toEqual([]);
        }
      }
    }
  }
});

type KitFixture = { previewToken: string; unpaidReceiptToken: string; paidReceiptToken: string; path: string };
function kitOrders(): KitFixture {
  const out = execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-kit-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('a design kit: watermarked preview, files only after payment, real PNG and PDF downloads', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'stateful flow runs once');
  test.setTimeout(3 * 60_000);
  const f = kitOrders();

  // Preview before paying: every unit, watermarked, with the PREVIEW ribbon.
  await page.goto(`/p/${f.previewToken}`);
  await expect(page.locator('[data-kit-gallery]')).toBeVisible();
  await expect(page.getByRole('note')).toHaveText(ar.invitation.previewRibbon);
  await expect(page.getByText('عمر').first()).toBeVisible();

  // Unpaid: no files.
  await page.goto(`/r/${f.unpaidReceiptToken}`);
  await expect(page.getByText(ar.kit.downloads.afterPayment)).toBeVisible();
  expect((await request.get(`/r/${f.unpaidReceiptToken}/kit?unit=story&format=png`)).status()).toBe(404);

  // Paid: the download panel, no public link, and real files.
  await page.goto(`/r/${f.paidReceiptToken}`);
  await expect(page.getByRole('heading', { name: ar.kit.downloads.title })).toBeVisible();
  await expect(page.getByText(ar.receipt.invitationLink)).toHaveCount(0);

  const get = async (q: string) => {
    const res = await request.get(`/r/${f.paidReceiptToken}/kit?${q}`, { timeout: 60_000 });
    expect(res.status(), q).toBe(200);
    expect(res.headers()['content-disposition'], q).toContain('attachment');
    return { type: res.headers()['content-type'], body: await res.body() };
  };
  const story = await get('unit=story&format=png&date=both');
  expect(story.type).toBe('image/png');
  expect(await sharp(story.body).metadata()).toMatchObject({ width: 1080, height: 1920 });
  const sticker = await get('unit=sticker-round&format=png');
  expect(await sharp(sticker.body).metadata()).toMatchObject({ width: 2000, height: 2000, hasAlpha: true });
  const card = await get('unit=card&format=pdf');
  expect(card.type).toBe('application/pdf');
  expect(card.body.subarray(0, 5).toString()).toBe('%PDF-');
  const bottle = await get('unit=bottle&format=png&bottle=500');
  expect(await sharp(bottle.body).metadata()).toMatchObject({ width: 2539, height: 650 });
  // A second download of the same file comes from storage (same bytes).
  expect((await get('unit=bottle&format=png&bottle=500')).body.equals(bottle.body)).toBe(true);

  // Junk is refused; kits have no public invitation page.
  expect((await request.get(`/r/${f.paidReceiptToken}/kit?unit=story&format=pdf`)).status()).toBe(400);
  expect((await request.get(`/r/${f.paidReceiptToken}/kit?unit=nope&format=png`)).status()).toBe(400);
  expect((await request.get(`/r/not-a-token/kit?unit=story&format=png`)).status()).toBe(404);
  if (f.path) expect((await request.get(f.path)).status()).toBe(404);
});
