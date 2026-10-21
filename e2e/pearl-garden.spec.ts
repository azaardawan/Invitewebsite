import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, openOrderForm } from './helpers';

type Made = { previewToken: string; receiptToken: string | null; invitationId: string; path: string };

function order(env: Record<string, string>): Made {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-files-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, THEME: 'pearl-garden', ...env },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test("Pearl Garden: the fixed wording (corrected), «بنت» and the date; files download", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(240_000);

  const draft = order({ NAME: 'ريم', FATHER: 'عبدالله' });
  await page.goto(`/p/${draft.previewToken}`);
  await expect(page.getByText('بنت عبدالله')).toBeVisible();
  await expect(page.getByText(/بأجملِ العطايا/)).toBeVisible();
  await expect(page.getByText(/قرّةَ عينٍ لنا/)).toBeVisible();

  const paid = order({ NAME: 'Reem', FATHER: 'Abdullah', INV_LANG: 'en', SHAPE: 'both', FATHER_ON_EXTRAS: '1', PAID: '1' });
  for (const item of ['story.png', 'sticker.png', 'sticker-square.pdf', 'bottle.pdf'] as const) {
    expect((await request.get(`/r/${paid.receiptToken}/extra/${item}`)).status(), item).toBe(200);
  }
  expect((await request.get(`/r/${paid.receiptToken}/card`)).status()).toBe(200);

  // No birth-order choice on this design; the father tick box is there, off by default.
  await openOrderForm(page, 'pearl-garden');
  await expect(page.getByRole('radiogroup', { name: /ترتيب/ })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: /إظهار اسم الأب/ })).not.toBeChecked();
});
