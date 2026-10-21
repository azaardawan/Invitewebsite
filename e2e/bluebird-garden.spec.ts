import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL, openOrderForm } from './helpers';

type Made = { previewToken: string; receiptToken: string | null; invitationId: string; path: string };

function order(env: Record<string, string>): Made {
  const out = execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-files-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, THEME: 'bluebird-garden', ...env },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('Bluebird Garden: birth-order choice, father on the extras by choice, every file downloads', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(240_000);

  // The chosen birth order is printed; the father is off the stickers unless the customer ticks it.
  const draft = order({ NAME: 'فارس', FATHER: 'عبدالله', W_ORDER: 'opt:1' });
  await page.goto(`/p/${draft.previewToken}`);
  await expect(page.getByText('فارس')).toBeVisible();
  await expect(page.getByText(/الله ثالث أفراح/)).toBeVisible();
  await expect(page.getByText('تُزال هذه العلامة بعد الشراء')).toBeVisible();
  expect((await request.get(`/i/${draft.path.slice(3)}`)).status()).toBe(404);

  const paid = order({ NAME: 'Faris', FATHER: 'Abdullah', INV_LANG: 'en', SHAPE: 'both', FATHER_ON_EXTRAS: '1', PAID: '1' });
  for (const item of ['story.png', 'sticker.png', 'sticker-square.pdf', 'bottle.pdf'] as const) {
    expect((await request.get(`/r/${paid.receiptToken}/extra/${item}`)).status(), item).toBe(200);
  }
  expect((await request.get(`/r/${paid.receiptToken}/card`)).status()).toBe(200);

  // The order form: four fixed birth-order choices (no own text) and the father tick box, off by default.
  await openOrderForm(page, 'bluebird-garden');
  const birthOrder = page.getByRole('radiogroup', { name: 'ترتيب المولود' });
  await expect(birthOrder.getByRole('radio')).toHaveCount(4);
  await expect(birthOrder.getByRole('radio').first()).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /إظهار اسم الأب/ })).not.toBeChecked();
});
