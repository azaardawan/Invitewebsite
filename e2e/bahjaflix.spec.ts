import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

/** BAHJAFLIX (Couples): the streaming-app title page, on a computer and a phone, and its template editor. */

function draft(): { previewToken: string; packageId: string } {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-couples-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

const photo = async (color: string, width = 1600, height = 2000) => ({
  name: `${color.slice(1)}.jpg`,
  mimeType: 'image/jpeg',
  buffer: await sharp({ create: { width, height, channels: 3, background: color } }).jpeg().toBuffer(),
});

/** A three-second test video (a colour pattern with a tone), made with ffmpeg. */
function testVideo() {
  const dir = mkdtempSync(path.join(tmpdir(), 'bf-video-'));
  const file = path.join(dir, 'clip.mp4');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=size=640x360:rate=25:duration=3', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-shortest', '-pix_fmt', 'yuv420p', '-y', file]);
  const buffer = readFileSync(file);
  rmSync(dir, { recursive: true, force: true });
  return { name: 'clip.mp4', mimeType: 'video/mp4', buffer };
}

async function openSample(page: Page, width: number) {
  await page.setViewportSize({ width, height: width >= 1000 ? 800 : 844 });
  await page.goto('/admin/preview/ar/theme/bahjaflix?state=1&names=short');
  await page.getByRole('button', { name: 'افتح الدعوة' }).click();
  await expect(page.locator('[data-phase="open"]')).toBeVisible({ timeout: 4000 });
}

test('BAHJAFLIX: the title page on a computer and a phone; a photo opens on its own', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'widths are set explicitly');
  test.setTimeout(120_000);
  await signInAsNewOwner(page);

  // Computer: the side rail, the split hero, three rows; a photo opens with its title, words and the couple.
  await openSample(page, 1280);
  await expect(page.getByRole('img', { name: 'BAHJAFLIX' }).first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('معاً إلى الأبد');
  await expect(page.locator('section[id^="bf-row"]')).toHaveCount(3);
  await expect(page.locator('[data-bahja-photo]')).toHaveCount(18);
  await page.screenshot({ path: testInfo.outputPath('desktop.png') });
  await page.locator('#bf-row1 [role="button"]').first().hover();
  await page.waitForTimeout(800);
  await page.screenshot({ path: testInfo.outputPath('desktop-hover.png') });
  // The wide row pages with its arrow.
  await page.locator('#bf-row2').hover();
  await page.locator('#bf-row2').getByRole('button', { name: 'التالي' }).click();
  await expect(page.locator('#bf-row2')).toHaveAttribute('data-page', '1');
  await page.locator('#bf-row1 [role="button"]').nth(1).click();
  const view = page.getByRole('dialog');
  await expect(view).toBeVisible();
  await expect(view.getByRole('heading', { level: 3 })).toHaveText('ليلة على الميناء');
  await expect(view).toContainText('البطولة:');
  await page.waitForTimeout(500);
  await page.screenshot({ path: testInfo.outputPath('desktop-photo.png') });
  await page.keyboard.press('Escape');
  await expect(view).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('desktop-full.png'), fullPage: true });

  // Phone: the video card, rows to swipe, the bottom bar; the photo takes the whole screen.
  await openSample(page, 390);
  await page.screenshot({ path: testInfo.outputPath('mobile.png') });
  await page.screenshot({ path: testInfo.outputPath('mobile-full.png'), fullPage: true });
  await page.locator('#bf-row2 [role="button"]').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: testInfo.outputPath('mobile-photo.png') });
  await page.getByRole('dialog').getByRole('button', { name: 'إغلاق' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('BAHJAFLIX: the customer fills the design in place (texts, a framed photo with its words, the video)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(240_000);
  const { previewToken } = draft();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/en/order/${previewToken}`);
  const editor = page.locator('[data-template-editor]');
  await expect(editor).toBeVisible();
  const design = page.frameLocator('iframe[data-template-design]');
  // The package sells nine places: the first is ready for a photo, the next eight wait their turn.
  await expect(design.locator('[data-bahja-photo-slot]')).toHaveCount(9);
  await expect(page.locator('[data-template-photos]')).toHaveAttribute('data-template-photos', '0');
  await expect(page.locator('[data-template-missing]')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('editor-empty.png'), fullPage: true });

  // A text: tap it in the design, type, done; the design shows it at once and it is saved.
  await design.locator('[data-bahja-edit="wording:title"]').click();
  const sheet = page.locator('[data-template-sheet]');
  await expect(sheet).toHaveAttribute('data-template-sheet', 'text');
  await sheet.locator('[data-template-text-input]').fill('Our Story');
  await sheet.locator('[data-template-text-save]').click();
  await expect(sheet).toBeHidden();
  await expect(design.locator('[data-bahja-edit="wording:title"]')).toHaveText('Our Story');
  for (const [key, value] of [
    ['field:person_1_name', 'Dara'],
    ['field:person_2_name', 'Ava'],
  ] as const) {
    await design.locator(`[data-bahja-edit="${key}"]`).first().click();
    await sheet.locator('[data-template-text-input]').fill(value);
    await sheet.locator('[data-template-text-save]').click();
    await expect(sheet).toBeHidden();
  }
  await design.locator('[data-bahja-edit="field:invitation_message"]').last().click();
  await sheet.locator('[data-template-text-input]').fill('Two hearts, one story.');
  await sheet.locator('[data-template-text-save]').click();
  await expect(page.locator('[data-template-missing]')).toHaveCount(0);

  // A photo: tap the empty frame, choose it, frame it in exactly that frame's shape, then its title and words.
  await design.locator('[data-bahja-photo-slot="0"]').click();
  await expect(sheet).toHaveAttribute('data-template-sheet', 'photo-add');
  await sheet.locator('[data-template-photo-input]').setInputFiles(await photo('#b04050', 2000, 1500));
  await expect(sheet).toHaveAttribute('data-template-sheet', 'photo-frame', { timeout: 30_000 });
  const frame = sheet.locator('[data-photo-frame]');
  const box = await frame.boundingBox();
  expect(box!.width / box!.height).toBeCloseTo(2 / 3, 1);
  await sheet.getByRole('slider').fill('1.6');
  await expect(design.locator('[data-bahja-photo="0"] img')).toHaveAttribute('style', /scale\(1\.6\)/);
  await sheet.getByRole('slider').dispatchEvent('pointerup');
  await page.screenshot({ path: testInfo.outputPath('editor-frame.png') });
  await sheet.getByRole('button', { name: 'Next' }).click();
  await expect(sheet).toHaveAttribute('data-template-sheet', 'photo-words');
  await sheet.locator('[data-template-photo-title]').fill('First trip');
  await sheet.locator('[data-template-photo-caption]').fill('Sea, sun and us.');
  await sheet.locator('[data-template-photo-save]').click();
  await expect(sheet).toBeHidden();
  await expect(page.locator('[data-template-photos]')).toHaveAttribute('data-template-photos', '1');
  await expect(design.locator('[data-bahja-photo-slot="1"]')).toBeVisible();

  // The video: tap its place, choose it; it is converted and plays at the top.
  await design.locator('[data-bahja-video-slot]').first().click();
  await expect(sheet).toHaveAttribute('data-template-sheet', 'video');
  await sheet.locator('[data-template-video-input]').setInputFiles(testVideo());
  await expect(sheet.locator('[data-template-video-player]')).toBeVisible({ timeout: 120_000 });
  await sheet.getByRole('button', { name: 'Done' }).click();
  await expect(design.locator('video').first()).toHaveAttribute('src', /videos\//);
  await page.screenshot({ path: testInfo.outputPath('editor-filled.png'), fullPage: true });

  // All saved: the preview shows it, and the photo opens with its words.
  await page.goto(`/p/${previewToken}`);
  await page.getByRole('button', { name: 'Open invitation' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Our Story');
  await expect(page.locator('[data-bahja-photo]')).toHaveCount(1);
  await page.locator('#bf-row1 [role="button"]').first().click();
  await expect(page.getByRole('dialog')).toContainText('First trip');
  await expect(page.getByRole('dialog')).toContainText('Sea, sun and us.');
  await expect(page.getByRole('dialog')).toContainText('Dara & Ava');
  await page.screenshot({ path: testInfo.outputPath('preview-photo.png') });

  // The posters (landscape and portrait): watermarked pictures before payment, never the files themselves.
  for (const o of ['landscape', 'portrait'] as const) {
    const res = await page.request.get(`/p/${previewToken}/extra/poster-${o}.preview`);
    expect(res.status(), `poster-${o}`).toBe(200);
    expect(res.headers()['content-type']).toBe('image/jpeg');
    writeFileSync(testInfo.outputPath(`poster-${o}.jpg`), await res.body());
  }
  expect((await page.request.get(`/p/${previewToken}/extra/poster-landscape.jpg`)).status()).toBe(404);
});
