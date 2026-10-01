import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

function paidCardOrder(): { receiptToken: string } {
  const out = execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-card-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('the customer downloads a real printable card PDF from their receipt', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'stateful flow runs once');
  test.setTimeout(120_000);
  const { receiptToken } = paidCardOrder();

  await page.goto(`/r/${receiptToken}`);
  const link = page.getByRole('link', { name: 'تحميل بطاقة الطباعة (PDF)' });
  await expect(link).toBeVisible();

  const res = await request.get(`/r/${receiptToken}/card`);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('application/pdf');
  const pdf = await res.body();
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  // A5 plus 3 mm bleed on each side = 154 × 216 mm ≈ 436.5 × 612.3 pt (Chromium rounds to whole pixels).
  const box = /\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/.exec(pdf.toString('latin1'));
  expect(Math.abs(Number(box?.[1]) - 436.5)).toBeLessThan(1);
  expect(Math.abs(Number(box?.[2]) - 612.3)).toBeLessThan(1);
  await testInfo.attach('card.pdf', { body: pdf, contentType: 'application/pdf' });

  // The print page itself is not reachable without a valid signed token.
  expect((await request.get('/print/card.00000000-0000-0000-0000-000000000000.9999999999.bad')).status()).toBe(404);
  expect((await request.get('/r/not-a-real-token/card')).status()).toBe(404);
});
