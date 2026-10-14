import { expect, test } from '@playwright/test';

test.describe('storefront languages', () => {
  test('Arabic is the default at / and is right-to-left', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar-IQ');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('دعوات صُممت');
  });

  test('English is left-to-right under /en', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Invitations designed');
  });

  test('Kurdish routes are right-to-left with the right language tags', async ({ page }) => {
    for (const [path, lang] of [
      ['/ckb', 'ckb-IQ'],
      ['/bdn', 'kmr-Arab-IQ'],
    ]) {
      await page.goto(path!);
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(page.locator('html')).toHaveAttribute('lang', lang!);
    }
  });

  test('the language switcher keeps the visitor on the same page', async ({ page }) => {
    await page.goto('/themes');
    await page.locator('header summary:visible').first().click();
    await page.locator('header a:visible', { hasText: 'English' }).click();
    await expect(page).toHaveURL(/\/en\/themes$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('home page sections link to the catalog', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#themes')).toBeAttached();
    await page.locator('main').getByRole('link', { name: 'تصفّح التصاميم' }).first().click();
    await expect(page).toHaveURL(/#themes$/);
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

  test('search engines and shared links get the logo, not a blank icon', async ({ page, request }) => {
    await page.goto('/');
    const icon = await page.locator('link[rel="icon"][type="image/png"]').getAttribute('href');
    expect(icon).toMatch(/^\/icon\.png/);
    for (const path of [icon!, '/favicon.ico', '/apple-icon.png', '/logo.png', '/og.png']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
      expect(res.headers()['content-type'], path).toMatch(/^image\//);
    }
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/);
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!) as { '@type': string; name: string; logo?: string }[];
    expect(data.find((d) => d['@type'] === 'WebSite')?.name).toBe('بهجه');
    expect(data.find((d) => d['@type'] === 'Organization')?.logo).toMatch(/\/logo\.png$/);
  });
});
