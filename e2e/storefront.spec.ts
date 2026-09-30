import { expect, test } from '@playwright/test';

test.describe('storefront languages', () => {
  test('Arabic is the default at / and is right-to-left', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar-IQ');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('الموقع قيد التجهيز');
  });

  test('English is left-to-right under /en', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The website is being prepared');
  });

  test('Kurdish routes are right-to-left and fall back to Arabic until translations are approved', async ({ page }) => {
    const cases: [string, string][] = [
      ['/ckb', 'ckb-IQ'],
      ['/bdn', 'kmr-Arab-IQ'],
    ];
    for (const [path, lang] of cases) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('الموقع قيد التجهيز');
    }
  });

  test('the language switcher keeps the visitor on the same site', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en$/);
    await page.getByRole('link', { name: 'العربية' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('no horizontal scrolling on the home page', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('unknown pages show the localized not-found page', async ({ page }) => {
    const res = await page.goto('/en/does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  });

  test('robots.txt blocks indexing outside production', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body).toContain('Disallow: /');
  });
});
