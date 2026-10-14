import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { signInAsNewOwner } from './helpers';

const SHAPES = ['leaf', 'heart', 'oval', 'ogee-arch', 'butterfly', 'cloud'] as const;

test('a design offering several card shapes: each is previewed in its shape, with a cutting line for the print shop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'admin flow runs once');
  test.setTimeout(180_000);
  await signInAsNewOwner(page);

  // Theme #11 is the internal card-shapes demo: A5 plus every cut-out shape.
  await page.goto('/admin/themes?q=%2311');
  await page.getByRole('link', { name: 'تصميم أشكال البطاقة التجريبي' }).click();
  for (const shape of ['A5', ...SHAPES]) await expect(page.locator(`[data-card-shape="${shape}"] iframe`).first()).toBeVisible();
  // The print-shop file is previewed for cut-out shapes only.
  await expect(page.locator('[data-card-shape="A5"] iframe')).toHaveCount(2);
  await expect(page.locator('[data-card-shape="leaf"] iframe')).toHaveCount(3);

  for (const shape of SHAPES) {
    // The customer's file: cut to the shape (white outside it), the back mirrored.
    await page.goto(`/admin/preview/ar/card/demo-shapes?side=front&shape=${shape}`);
    await expect(page.locator('#bahja-cut-front path')).toHaveAttribute('d', /^M/);
    await expect(page.locator('[data-cut-line]')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`${shape}-front.png`), fullPage: true });
    await page.goto(`/admin/preview/ar/card/demo-shapes?side=back&shape=${shape}`);
    await expect(page.locator('#bahja-cut-back path')).toHaveAttribute('transform', 'translate(1 0) scale(-1 1)');
    await page.screenshot({ path: testInfo.outputPath(`${shape}-back.png`), fullPage: true });
    // The print-shop file: everything, with the bleed, and the magenta cutting line.
    await page.goto(`/admin/preview/ar/card/demo-shapes?side=front&shape=${shape}&shop=1`);
    await expect(page.locator('[data-cut-line] path')).toHaveAttribute('stroke', '#ec008c');
    await page.screenshot({ path: testInfo.outputPath(`${shape}-shop.png`), fullPage: true });
  }

  // A real PDF of the leaf: the page is the leaf's size (12.6 × 20 cm); the print-shop file adds 3 mm all round.
  for (const [shop, w, h] of [[false, 126, 200], [true, 132, 206]] as const) {
    await page.goto(`/admin/preview/ar/card/demo-shapes?side=front&shape=leaf${shop ? '&shop=1' : ''}`);
    await page.emulateMedia({ media: 'print' });
    const pdf = await PDFDocument.load(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
    const size = pdf.getPage(0).getSize();
    expect(Math.round((size.width / 72) * 25.4)).toBe(w);
    expect(Math.round((size.height / 72) * 25.4)).toBe(h);
    await page.emulateMedia({ media: 'screen' });
  }

  // A package includes the shapes the owner ticks.
  await page.goto('/admin/themes?q=%2311');
  await page.getByRole('link', { name: 'تصميم أشكال البطاقة التجريبي' }).click();
  const add = page.locator('details', { hasText: 'إضافة باقة' });
  await add.locator('summary').first().click();
  const shapes = add.locator('[data-package-card-shapes]');
  await expect(shapes.locator('input[type=checkbox]')).toHaveCount(1 + SHAPES.length);
  await expect(shapes.locator('input[value="A5"]')).toBeChecked();
  await expect(shapes.locator('input[value="leaf"]')).not.toBeChecked();
});
