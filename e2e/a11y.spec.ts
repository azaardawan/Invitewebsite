import { execFileSync } from 'node:child_process';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

/** Accessibility (WCAG 2.1 A/AA rules via axe) on the pages customers and guests use. */
async function audit(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const problems = result.violations.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`);
  expect(problems, url).toEqual([]);
}

function paidOrder(): { paidReceiptToken: string; path: string } {
  const out = execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  return JSON.parse(out.trim().split('\n').at(-1)!);
}

test('storefront, legal, contact and admin sign-in pages have no accessibility violations', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390' && testInfo.project.name !== 'desktop', 'phone and desktop layouts');
  for (const url of ['/', '/en', '/themes', '/en/contact', '/legal/terms', '/admin/login']) await audit(page, url);
});

test('a live invitation and its receipt have no accessibility violations', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'runs once');
  const { paidReceiptToken, path } = paidOrder();
  await audit(page, `/r/${paidReceiptToken}`);
  await audit(page, path);
});
