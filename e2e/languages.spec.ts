import { expect, test, type Page } from '@playwright/test';
import ar from '../src/i18n/messages/ar.json' with { type: 'json' };
import ckb from '../src/i18n/messages/ckb.json' with { type: 'json' };
import bdn from '../src/i18n/messages/bdn.json' with { type: 'json' };

/**
 * Owner rule: after switching language, no text stays in the previous one.
 * English pages contain no Arabic script (except the language names in the
 * switcher), and Kurdish pages contain none of the Arabic site texts.
 */
const PAGES = ['', '/themes', '/contact', '/access', '/legal/terms', '/legal/privacy'];
const AUTONYMS = ['العربية', 'کوردی - سۆرانی', 'کوردی - بادینی'];

function flatten(obj: object, prefix = ''): [string, string][] {
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, String(v)] as [string, string]]));
}
/**
 * Customer-facing Arabic texts whose Kurdish is approved, split around {placeholders}; short pieces are
 * skipped (they can occur inside Kurdish words). Texts still awaiting the owner's Kurdish wording show in
 * Arabic by design and are listed by `pnpm i18n:check` instead.
 */
function arabicTextsFor(kurdish: object) {
  const approved = new Set(flatten(kurdish).map(([k]) => k));
  return [
    ...new Set(
      flatten(ar)
        .filter(([k]) => !k.startsWith('admin.') && approved.has(k))
        .flatMap(([, v]) => v.split(/\{[^}]*\}|<[^>]*>/))
        .map((s) => s.trim())
        .filter((s) => s.length >= 8),
    ),
  ];
}
const arabicTexts = { ckb: arabicTextsFor(ckb), bdn: arabicTextsFor(bdn) };

async function visibleText(page: Page) {
  // The language menu lists every language by its own name; that's intended.
  return page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('details ul, script, style, noscript').forEach((n) => n.remove());
    return clone.innerText;
  });
}

async function expectOnlyLanguage(page: Page, locale: 'en' | 'ckb' | 'bdn') {
  const text = await visibleText(page);
  const url = page.url();
  if (locale === 'en') {
    const leftovers = AUTONYMS.reduce((t, a) => t.replaceAll(a, ''), text).match(/[؀-ۿ][؀-ۿ\s]*/g) ?? [];
    // The brand monogram (ب) is part of the logo artwork.
    expect(leftovers.map((s) => s.trim()).filter((s) => s !== 'ب'), url).toEqual([]);
  } else {
    expect(arabicTexts[locale].filter((a) => text.includes(a)), url).toEqual([]);
    // No English words either, apart from names that stay as they are (PDF, QR, WhatsApp…) and web addresses.
    const english = text
      .replace(/\S*\/\S*/g, '')
      .match(/[A-Za-z]{3,}/g)
      ?.filter((w) => !['PDF', 'QR', 'WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Google', 'Apple', 'IQD'].includes(w));
    expect(english ?? [], url).toEqual([]);
  }
  await expect(page.locator('html')).toHaveAttribute('lang', locale === 'en' ? 'en' : locale === 'ckb' ? 'ckb-IQ' : 'kmr-Arab-IQ');
}

test('every storefront page is fully in the chosen language', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'content check runs once');
  for (const locale of ['en', 'ckb', 'bdn'] as const) {
    for (const path of PAGES) {
      await page.goto(`/${locale}${path}`);
      await expectOnlyLanguage(page, locale);
    }
  }
});

test('switching language with the menu leaves nothing in the previous language', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'content check runs once');
  await page.goto('/themes');
  for (const [locale, autonym] of [
    ['ckb', 'کوردی - سۆرانی'],
    ['en', 'English'],
    ['bdn', 'کوردی - بادینی'],
  ] as const) {
    await page.locator('header details summary').first().click();
    await page.getByRole('link', { name: autonym }).first().click();
    await page.waitForURL(new RegExp(`/${locale}/themes`));
    await page.waitForLoadState('networkidle');
    await expectOnlyLanguage(page, locale);
  }
});
