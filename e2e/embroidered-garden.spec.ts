import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

type Made = { previewToken: string; receiptToken: string | null; invitationId: string; path: string };

function order(env: Record<string, string>): Made {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-embroidered-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, ...env },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

/** Every text box of the design stays inside the artwork (no name or line spills out). */
async function textInside(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const box = document.querySelector('[class*=root]')!.getBoundingClientRect();
    return [...document.querySelectorAll('[class*=root] p')].every((el) => {
      const r = el.getBoundingClientRect();
      return r.left >= box.left - 1 && r.right <= box.right + 1 && r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
    });
  });
}

test('Embroidered Garden is files only: story, card, stickers and bottle label, no online invitation', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(240_000);

  // Unpaid: the review shows the design as files, with watermarked previews and nothing to download.
  const draft = order({ NAME: 'عبد الرحمن', FATHER: 'محمد عبد الكريم', DATE_STYLE: 'both', SHAPE: 'square', BOTTLE: '500' });
  await page.goto(`/order/${draft.previewToken}`);
  await expect(page.getByText('وليس دعوة إلكترونية')).toBeVisible();
  await expect(page.getByRole('link', { name: /فتح المعاينة/ })).toHaveCount(0);
  await page.goto(`/p/${draft.previewToken}`);
  await expect(page.getByText('عبد الرحمن')).toBeVisible();
  expect(await textInside(page)).toBe(true);
  expect((await request.get(`/p/${draft.previewToken}/extra/sticker.preview`)).status()).toBe(200);
  expect((await request.get(`/i/${draft.path.slice(3)}`)).status()).toBe(404);

  // Paid: every file downloads, and the receipt has no invitation link.
  const paid = order({ NAME: 'Omar', FATHER: 'Abdulaziz', INV_LANG: 'en', SHAPE: 'round', BOTTLE: '330', PAID: '1' });
  await page.goto(`/r/${paid.receiptToken}`);
  await expect(page.locator(`a[href*="/i/"]`)).toHaveCount(0);
  for (const [item, type] of [
    ['story.png', 'image/png'],
    ['sticker.png', 'image/png'],
    ['sticker.pdf', 'application/pdf'],
    ['bottle.png', 'image/png'],
    ['bottle.pdf', 'application/pdf'],
  ] as const) {
    const res = await request.get(`/r/${paid.receiptToken}/extra/${item}`);
    expect(res.status(), item).toBe(200);
    expect(res.headers()['content-type']).toContain(type);
  }
  expect((await request.get(`/r/${paid.receiptToken}/card`)).status()).toBe(200);
  expect((await request.get(paid.path)).status()).toBe(404);

  // The theme page sells it as files, not as a phone invitation.
  await page.goto('/themes/embroidered-garden');
  await expect(page.getByText('وليس دعوة إلكترونية')).toBeVisible();
  await expect(page.getByRole('link', { name: 'فتح بملء الشاشة' })).toHaveCount(0);
});
