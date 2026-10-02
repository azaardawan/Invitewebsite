import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import { E2E_DATABASE_URL } from './helpers';

/**
 * Page weight and Largest Contentful Paint on a slow 4G phone connection (Lighthouse's
 * "slow 4G": 1.6 Mbps down, 750 kbps up, 150 ms latency). Budgets fail the build if a change
 * makes the key pages heavy; numbers are attached to the report for review.
 */
// Measured on 2026-10-01: home 406 KB / 163 KB JS / LCP 2.0 s; theme 534 / 308 / 1.9 s;
// invitation (demo theme) 157 / 147 / 0.4 s. Budgets leave ~50 % headroom.
const BUDGETS = {
  home: { kb: 650, js: 260, lcpMs: 3000 },
  theme: { kb: 800, js: 460, lcpMs: 3000 },
  invitation: { kb: 600, js: 260, lcpMs: 2500 },
} as const;

async function measure(page: Page, url: string) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  let total = 0;
  let js = 0;
  const types = new Map<string, string>();
  cdp.on('Network.responseReceived', (e) => types.set(e.requestId, e.type));
  cdp.on('Network.loadingFinished', (e) => {
    total += e.encodedDataLength;
    if (types.get(e.requestId) === 'Script') js += e.encodedDataLength;
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');
  const lcp = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries.at(-1)?.startTime ?? 0);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve(0), 3000);
      }),
  );
  return { kb: Math.round(total / 1024), js: Math.round(js / 1024), lcpMs: Math.round(lcp) };
}

test('key pages stay light and fast on slow 4G', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'phone only');
  test.setTimeout(180_000);
  const out = execFileSync('pnpm', ['exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', 'e2e/scripts/make-order.ts'], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
  }).toString();
  const { path } = JSON.parse(out.trim().split('\n').at(-1)!) as { path: string };

  const results = {
    home: await measure(page, '/'),
    theme: await measure(page, '/themes/demo-minimal'),
    invitation: await measure(page, path),
  };
  await testInfo.attach('perf.json', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  console.log('PERF', JSON.stringify(results));
  for (const [name, r] of Object.entries(results) as [keyof typeof BUDGETS, (typeof results)['home']][]) {
    expect(r.kb, `${name} total KB`).toBeLessThanOrEqual(BUDGETS[name].kb);
    expect(r.js, `${name} JS KB`).toBeLessThanOrEqual(BUDGETS[name].js);
    expect(r.lcpMs, `${name} LCP ms`).toBeLessThanOrEqual(BUDGETS[name].lcpMs);
  }
});
