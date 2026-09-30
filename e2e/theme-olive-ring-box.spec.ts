import { expect, test, type Page } from '@playwright/test';

/**
 * Olive Ring Box theme, rendered through the development theme lab with sample
 * data. Runs at 360, 390, 430 and 1280 px (the Playwright projects).
 * States: 0 = Normal, 1 = VIP, 2 = VVIP.
 */
const lab = (query = '') => `/dev/themes/olive-ring-box@1${query ? `?${query}` : ''}`;

async function openInvitation(page: Page, name: RegExp = /افتح الدعوة|Open invitation/) {
  await page.getByRole('button', { name }).click();
  // The whole sequence is ~3.2 s; the failsafe opens it by 4.5 s at the latest.
  await expect(page.locator('main')).not.toHaveAttribute('inert', { timeout: 6000 });
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.describe('olive-ring-box: opening', () => {
  test('shows the closed box with an Open button, then reveals the invitation', async ({ page }) => {
    await page.goto(lab());
    const open = page.getByRole('button', { name: 'افتح الدعوة' });
    await expect(open).toBeVisible();
    const box = await open.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('main')).toHaveAttribute('inert', '');

    await openInvitation(page);
    await expect(open).toHaveCount(0, { timeout: 6000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('نور');
    await expect(page.getByText('بسم الله الرحمن الرحيم')).toBeVisible();
  });

  test('reduced motion skips the box animation and shows the invitation directly', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(lab());
    await page.getByRole('button', { name: 'افتح الدعوة' }).click();
    await expect(page.locator('main')).not.toHaveAttribute('inert', { timeout: 500 });
    await expect(page.getByRole('button', { name: 'افتح الدعوة' })).toHaveCount(0, { timeout: 1500 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('without JavaScript the invitation is still readable', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(lab());
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'افتح الدعوة' })).toBeHidden();
    await context.close();
  });
});

test.describe('olive-ring-box: audio toggle', () => {
  test('appears after opening at the top-left in Arabic, with a 44 px touch area and two states', async ({ page }) => {
    await page.goto(lab('music=1'));
    await expect(page.getByRole('button', { name: /الموسيقى/ })).toHaveCount(0);
    await openInvitation(page);
    const toggle = page.getByRole('button', { name: /الموسيقى/ });
    const box = (await toggle.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width / 2).toBeLessThan(page.viewportSize()!.width / 2);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('sits at the top-right in the English layout', async ({ page }) => {
    await page.goto(lab('music=1&locale=en'));
    await openInvitation(page);
    const box = (await page.getByRole('button', { name: /music/i }).boundingBox())!;
    expect(box.x + box.width / 2).toBeGreaterThan(page.viewportSize()!.width / 2);
  });

  test('is absent when no song is configured', async ({ page }) => {
    await page.goto(lab());
    await openInvitation(page);
    await expect(page.getByRole('button', { name: /الموسيقى/ })).toHaveCount(0);
  });
});

test.describe('olive-ring-box: package states', () => {
  test('Normal ends with the closing greeting after the venue', async ({ page }) => {
    await page.goto(lab('state=0'));
    await openInvitation(page);
    await expect(page.getByText('قاعة الزيتون، بغداد')).toBeVisible();
    await expect(page.getByRole('timer')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /الخريطة/ })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'تأكيد الحضور' })).toHaveCount(0);
    await expect(page.locator('main > *').last()).toContainText('شكرًا لمشاركتكم فرحتنا');
  });

  test('VIP adds countdown, map and the guest form without a message field', async ({ page }) => {
    await page.goto(lab('state=1'));
    await openInvitation(page);
    await expect(page.getByRole('timer')).toBeVisible();
    const map = page.getByRole('link', { name: /الخريطة/ });
    await expect(map).toHaveAttribute('href', /^https:\/\/maps\.google\.com\//);
    await expect(map).toHaveAttribute('target', '_blank');
    await expect(page.getByLabel('اسمك')).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(2);
    await expect(page.getByRole('textbox', { name: /رسالتك/ })).toHaveCount(0);
  });

  test('VVIP adds the message to the couple', async ({ page }) => {
    await page.goto(lab('state=2'));
    await openInvitation(page);
    await expect(page.getByRole('textbox', { name: /رسالتك للعروسين/ })).toBeVisible();
  });
});

test.describe('olive-ring-box: guest form', () => {
  test('shows errors beside the fields, then sending, then success', async ({ page }) => {
    await page.goto(lab('state=2'));
    await openInvitation(page);
    const send = page.getByRole('button', { name: 'إرسال الرد' });
    await send.click();
    await expect(page.getByText('يرجى كتابة اسمك.')).toBeVisible();
    await expect(page.getByText('يرجى اختيار الحضور أو الاعتذار.')).toBeVisible();
    await expect(page.getByLabel('اسمك')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('اسمك').fill('خالد');
    await expect(page.getByText('يرجى كتابة اسمك.')).toHaveCount(0);
    await page.getByRole('radio', { name: 'سأحضر بإذن الله' }).check();
    await page.getByRole('textbox', { name: /رسالتك/ }).fill('م'.repeat(501));
    await send.click();
    await expect(page.getByText('الرسالة أطول من ٥٠٠ حرف.')).toBeVisible();

    await page.getByRole('textbox', { name: /رسالتك/ }).fill('ألف مبروك!');
    await send.click();
    await expect(page.getByRole('button', { name: 'جارٍ الإرسال…' })).toBeDisabled();
    await expect(page.getByText('تم إرسال ردك إلى العروسين.')).toBeVisible();
  });
});

test.describe('olive-ring-box: layout', () => {
  for (const query of ['sample=short', 'sample=long', 'sample=long&locale=en', 'state=0&sample=long']) {
    test(`no horizontal scrolling and names never clip (${query})`, async ({ page }) => {
      await page.goto(lab(query));
      expect(await horizontalOverflow(page)).toBe(0);
      await openInvitation(page, /افتح الدعوة|Open invitation/);
      expect(await horizontalOverflow(page)).toBe(0);
      for (const name of await page.locator('h1 > span').all()) {
        const clipped = await name.evaluate((el) => el.clientWidth > 1 && el.scrollWidth > el.clientWidth + 1);
        expect(clipped).toBe(false);
      }
    });
  }

  test('English mirrors the layout', async ({ page }) => {
    await page.goto(lab('locale=en'));
    await openInvitation(page, /Open invitation/);
    await expect(page.locator('[data-stage]')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Noor');
    // The basmala stays in Arabic, with a translation beneath.
    await expect(page.getByText('بسم الله الرحمن الرحيم')).toBeVisible();
  });
});

test.describe('olive-ring-box: print companions', () => {
  test('the A5 card and the keepsake render', async ({ page }) => {
    await page.goto(lab('sample=long').replace('?', '/card?'));
    await expect(page.getByRole('heading', { level: 1 })).toContainText('فاطمة الزهراء');
    await expect(page.getByAltText('')).toHaveCount(1); // QR code
    await page.goto(lab('count=200').replace('?', '/keepsake?'));
    await expect(page.getByRole('article')).toHaveCount(200);
  });
});
