import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

function draft(): { previewToken: string } {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-song-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

/** A 3-minute "video of a song": a picture track and a tone (WebM, which the test browser can play). */
function songVideo() {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'bahja-e2e-song-')), 'wedding-song.webm');
  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=520:duration=180', '-f', 'lavfi', '-i', 'color=c=pink:s=320x240:d=180',
    '-shortest', '-c:v', 'libvpx', '-deadline', 'realtime', '-b:v', '100k', '-c:a', 'libopus', file,
  ]);
  return { name: 'wedding-song.webm', mimeType: 'video/webm', buffer: readFileSync(file) };
}

test('the customer adds their own song from a video; it replaces the design’s song and can be removed', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(120_000);
  const { previewToken } = draft();
  await page.goto(`/en/order/${previewToken}`);
  const box = page.locator('[data-song-upload]');
  await expect(box).toHaveAttribute('data-has-song', 'false');
  await expect(box).toContainText("The design's own song plays for now.");
  // The song the invitation plays is in its page (the player is made by script, not in the page's HTML).
  const plays = async (src: string) => expect.poll(async () => (await (await page.request.get(`/p/${previewToken}`)).text()).includes(src)).toBe(true);

  await box.locator('[data-song-input]').setInputFiles(songVideo());
  // The browser reads the video: the customer picks where the 2 minutes start.
  const start = box.locator('[data-song-start]');
  await expect(start).toBeVisible();
  await start.fill('30');
  await expect(box.locator('[data-song-range]')).toHaveText('Plays from 0:30 to 2:30');

  // Saving needs the rights confirmation.
  await box.locator('[data-song-save]').click();
  await expect(box.getByRole('alert')).toContainText('tick the box');
  await box.locator('[data-song-confirm]').check();
  await box.locator('[data-song-save]').click();
  await expect(box).toHaveAttribute('data-has-song', 'true', { timeout: 60_000 });
  await expect(box.locator('[data-song-saved]')).toHaveAttribute('src', /\/songs\/.+\.mp3$/);
  await box.screenshot({ path: testInfo.outputPath('song.png') });

  // The preview now plays the customer's song…
  const saved = new URL((await box.locator('[data-song-saved]').getAttribute('src'))!, page.url()).pathname;
  await plays(saved);

  // …until they remove it.
  await box.getByRole('button', { name: "Remove it and use the design's song" }).click();
  await expect(box).toHaveAttribute('data-has-song', 'false');
  await expect.poll(async () => (await (await page.request.get(`/p/${previewToken}`)).text()).includes(saved)).toBe(false);
});
