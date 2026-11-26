import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { signInAsNewOwner } from './helpers';

/**
 * Cafés' virtual tours (owner, 2026-11-21): the owner adds a café in Admin, uploads its 3D model and turns it on; the
 * link (for the café's Instagram bio) opens a full-screen walk with the café's name and buttons.
 */
/** The model: a stand-in (the museum), or another `.glb` to try (`TOUR_MODEL=<path>`). */
const MODEL = process.env.TOUR_MODEL ?? 'themes/memory-museum/v2/assets/museum.glb';

test('the owner publishes a café tour with a private link, and visitors walk through it', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(/koupup/.test(MODEL) ? 600_000 : 180_000);
  const slug = `cafe-${Date.now().toString(36)}`;

  await signInAsNewOwner(page);
  await page.goto('/admin/tours');
  await page.getByLabel('اسم المقهى').fill('Café Roma');
  await page.getByLabel(/^اسم الرابط/).fill(slug);
  await page.getByRole('checkbox', { name: /^رابط خاص/ }).check();
  await page.getByRole('button', { name: 'إضافة جولة' }).click();
  await page.waitForURL(/\/admin\/tours\/[0-9a-f-]{36}$/);
  // The private link: the link name and a random code; the bare name opens nothing.
  const link = new URL((await page.locator('a[href*="/tour/"]').first().getAttribute('href'))!).pathname;
  expect(link).toMatch(new RegExp(`^/tour/${slug}-[a-z0-9]{16}$`));

  // Not shown before it has a model and is turned on.
  const visitor = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 800 } });
  const v = await visitor.newPage();
  expect((await v.goto(`/tour/${slug}`))!.status()).toBe(404);
  await v.goto(link);
  await expect(v.getByText("This virtual tour isn't open right now.", { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'تفعيل' }).click();
  await expect(page.getByText('ارفع النموذج ثلاثي الأبعاد قبل تفعيل الجولة.')).toBeVisible();
  // A stand-in model (any .glb in metres will do).
  await page.locator('label', { hasText: 'رفع نموذج' }).locator('input[type=file]').setInputFiles({
    name: 'roma.glb',
    mimeType: 'model/gltf-binary',
    buffer: readFileSync(MODEL),
  });
  await expect(page.getByText('تم حفظ النموذج.')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/roma\.glb/)).toBeVisible();
  await page.getByLabel('رابط انستغرام').fill('https://instagram.com/cafe.roma');
  await page.getByLabel(/^رقم واتساب/).fill('+964 770 123 4567');
  await page.getByRole('button', { name: 'حفظ' }).first().click();
  await expect(page.getByText('تم الحفظ', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'تفعيل' }).click();
  await expect(page.getByRole('button', { name: 'إيقاف' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('tour-admin.png'), fullPage: true });

  const errors: string[] = [];
  v.on('pageerror', (e) => errors.push(e.message));
  await v.goto(link);
  await expect(v.locator('[data-testid="tour-canvas"][data-state="ready"]')).toBeVisible({ timeout: 60_000 });
  await expect(v.getByRole('heading', { name: 'Café Roma' })).toBeVisible();
  await expect(v.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://instagram.com/cafe.roma');
  await expect(v.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/9647701234567');
  await expect(v.getByRole('link', { name: 'Location' })).toHaveCount(0);
  await expect(v.getByText('Virtual tour by Bahjaaa.iq')).toBeVisible();
  await v.screenshot({ path: testInfo.outputPath('tour-start.png') });
  // Walking forward.
  await v.mouse.click(640, 400);
  await v.keyboard.down('ArrowUp');
  await v.waitForTimeout(4000);
  await v.keyboard.up('ArrowUp');
  await v.screenshot({ path: testInfo.outputPath('tour-walked.png') });
  // Turning round.
  await v.keyboard.down('ArrowLeft');
  await v.waitForTimeout(1700);
  await v.keyboard.up('ArrowLeft');
  await v.screenshot({ path: testInfo.outputPath('tour-turned.png') });
  expect(errors).toEqual([]);

  // KOUP's model (TOUR_MODEL=tours/koupup/koupup.glb): its menu at the counter, the barista making an order, the paper
  // menu on a table (owner, 2026-11-24). The debug view puts the visitor at the counter and by a table.
  if (/koupup/.test(MODEL)) {
    await v.goto(`${link}?debug=1`);
    await expect(v.locator('[data-testid="tour-canvas"][data-state="ready"]')).toBeVisible({ timeout: 60_000 });
    const go = (x: number, z: number, yaw: number) => v.evaluate(([x, z, yaw]) => (window as unknown as { tourEngine: { debugGo: (x: number, z: number, y: number) => void } }).tourEngine.debugGo(x!, z!, yaw!), [x, z, yaw]);
    await go(0.75, 4.75, Math.PI);
    await v.getByTestId('tour-openMenu').click();
    const sheet = v.getByTestId('tour-menu-sheet');
    await expect(sheet).toHaveAttribute('data-variant', 'counter');
    await expect(sheet.getByRole('button', { name: 'Iced Coffee' })).toBeVisible();
    await v.screenshot({ path: testInfo.outputPath('tour-menu-counter.png') });
    await sheet.getByTestId('tour-menu-item-26').click();
    await expect(v.getByTestId('tour-menu-order')).toHaveText(/4,500 IQD/);
    await v.screenshot({ path: testInfo.outputPath('tour-menu-chosen.png') });
    await v.getByTestId('tour-menu-order').click();
    await expect(v.getByTestId('tour-order-status')).toContainText('Caramel Latte');
    // the barista makes it, takes the money, hands it over
    await expect(v.getByTestId('tour-sip')).toBeVisible({ timeout: 150_000 });
    await v.screenshot({ path: testInfo.outputPath('tour-menu-served.png') });
    // a table's paper menu: read standing, ordered from seated
    await go(-0.45, 1.25, 0);
    await v.getByTestId('tour-openMenu').click();
    await expect(v.getByTestId('tour-menu-sheet')).toHaveAttribute('data-variant', 'table');
    await expect(v.getByTestId('tour-menu-order')).toBeDisabled();
    await v.screenshot({ path: testInfo.outputPath('tour-menu-paper.png') });
    await v.getByTestId('tour-menu-close').click();
    expect(errors).toEqual([]);
  }

  // On a phone, in Arabic: held upright it asks to be turned sideways; sideways, the pad to walk.
  const phone = await browser.newContext({ locale: 'ar-IQ', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await phone.newPage();
  await p.goto(link);
  await expect(p.locator('[data-testid="tour-canvas"][data-state="ready"]')).toBeVisible({ timeout: 60_000 });
  await expect(p.getByTestId('tour-rotate')).toBeVisible();
  await p.screenshot({ path: testInfo.outputPath('tour-phone-upright.png') });
  await p.setViewportSize({ width: 844, height: 390 });
  await expect(p.getByTestId('tour-rotate')).toHaveCount(0);
  await expect(p.getByRole('link', { name: 'انستغرام' })).toBeVisible();
  await expect(p.locator('html')).toHaveAttribute('dir', 'rtl');
  await p.screenshot({ path: testInfo.outputPath('tour-phone.png') });
  // The walking pad on the left (owner, 2026-11-26); its little button moves it to the right (left-handed), remembered
  const side = p.getByTestId('pad-side');
  expect((await side.boundingBox())!.x).toBeLessThan(844 / 2);
  await side.click();
  await expect.poll(async () => (await side.boundingBox())!.x).toBeGreaterThan(844 / 2);
  await p.screenshot({ path: testInfo.outputPath('tour-phone-pad-right.png') });
  await p.reload();
  await expect(p.locator('[data-testid="tour-canvas"][data-state="ready"]')).toBeVisible({ timeout: 60_000 });
  await expect.poll(async () => (await p.getByTestId('pad-side').boundingBox())!.x).toBeGreaterThan(844 / 2);

  // The Admin list shows it with its visits.
  await page.goto('/admin/tours');
  await expect(page.getByRole('link', { name: 'Café Roma' })).toBeVisible();
  await expect(page.getByText(/ظاهرة/).first()).toBeVisible();
  await expect(page.getByText('رابط خاص').first()).toBeVisible();
  await visitor.close();
  await phone.close();
});
