import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, openOrderForm, openPreview } from './helpers';

type Made = { previewToken: string; receiptToken: string | null; invitationId: string; path: string };

function order(env: Record<string, string>): Made {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-files-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, THEME: 'rosebird-garden', ...env },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test("Rosebird Garden: the girl's wording, «بنت» and a feminine birth order; files download", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(240_000);

  const draft = order({ NAME: 'ريم', FATHER: 'عبدالله', W_ORDER: 'opt:0' });
  // Since its online invitation: the preview opens like the guests' invitation (cover, then the design).
  await openPreview(page, draft.previewToken);
  await expect(page.getByText('بنت عبدالله')).toBeVisible();
  await expect(page.getByText(/الثانية$/)).toBeVisible();
  await expect(page.getByText(/حلّـــت/)).toBeVisible();

  const paid = order({ NAME: 'Reem', FATHER: 'Abdullah', INV_LANG: 'en', PAID: '1' });
  expect((await request.get(`/r/${paid.receiptToken}/extra/story.png`)).status()).toBe(200);
  expect((await request.get(`/r/${paid.receiptToken}/card`)).status()).toBe(200);

  await openOrderForm(page, 'rosebird-garden');
  await expect(page.getByRole('radiogroup', { name: 'ترتيب المولودة' }).getByRole('radio')).toHaveCount(4);
});
