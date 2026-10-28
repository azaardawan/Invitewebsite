import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

type Made = { previewToken: string; receiptToken: string | null; invitationId: string; path: string };

function order(env: Record<string, string>): Made {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-collage-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, ...env },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('photo collages: the order asks for the largest collage’s photos, shows each collage watermarked, downloads them once paid', async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(240_000);

  const draft = order({ INV_LANG: 'en', NAME: 'Mustafa', PHOTOS: '4' });
  await page.goto(`/en/order/${draft.previewToken}`);
  // The photo wall holds nine: nine places, four filled.
  await expect(page.getByText('4 of 9 photos added')).toBeVisible();
  await expect(page.getByText('They also fill your photo collages, in the same order.')).toBeVisible();
  for (const kind of ['polaroids', 'story', 'wall']) {
    const picture = page.locator(`[data-extra="collage-${kind}"] img`);
    await picture.scrollIntoViewIfNeeded();
    await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 90_000 }).toBe(true);
  }
  // The clean pictures only come with the receipt.
  expect((await request.get(`/p/${draft.previewToken}/extra/collage-wall.jpg`)).status()).toBe(404);

  const paid = order({ INV_LANG: 'ar', PAID: '1' });
  for (const kind of ['polaroids', 'story', 'wall']) {
    const res = await request.get(`/r/${paid.receiptToken}/extra/collage-${kind}.jpg`);
    expect(res.status(), kind).toBe(200);
    expect(res.headers()['content-type']).toBe('image/jpeg');
    expect(res.headers()['content-disposition']).toContain(`collage-${kind}-`);
  }
});
