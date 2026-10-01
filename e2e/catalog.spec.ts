import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { makeMp3, signInAsNewOwner } from './helpers';

// Stateful owner journey; runs once, on desktop.
test('owner configures a theme end to end: music → cover → package → review → on sale', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'stateful flow runs once');
  test.setTimeout(90_000);
  await signInAsNewOwner(page);

  // Upload a song to the music library.
  await page.goto('/admin/music');
  await page.getByLabel('اسم الأغنية').fill('أغنية تجريبية');
  await page.getByLabel('ملف MP3').setInputFiles({ name: 'song.mp3', mimeType: 'audio/mpeg', buffer: makeMp3(4) });
  await page.getByRole('button', { name: 'إضافة أغنية' }).click();
  await expect(page.getByText('أغنية تجريبية').first()).toBeVisible();

  // A wrong file type is rejected with a clear message.
  await page.getByLabel('اسم الأغنية').fill('ملف خاطئ');
  await page.getByLabel('ملف MP3').setInputFiles({ name: 'fake.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('not really an mp3 file at all') });
  await page.getByRole('button', { name: 'إضافة أغنية' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'الملف ليس MP3 صالحاً.' })).toBeVisible();

  // The demo theme was registered from code at deploy (db:seed).
  await page.goto('/admin/themes');
  await page.getByRole('link', { name: 'تصميم تجريبي' }).click();
  await expect(page.getByText('لا توجد صورة غلاف.')).toBeVisible();

  // Live preview (isolated iframe) renders the theme with sample content.
  const frame = page.frameLocator('iframe[title="المعاينة"]');
  await expect(frame.getByRole('button', { name: 'افتح الدعوة' })).toBeVisible();
  await page.getByLabel('لغة الدعوة').selectOption('en');
  await expect(frame.getByRole('button', { name: 'Open invitation' })).toBeVisible();

  // Settings: cover image + song.
  const cover = await sharp({ create: { width: 600, height: 900, channels: 3, background: '#b08d57' } }).png().toBuffer();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: cover });
  await expect(page.locator('img[src*="/media/images/"]')).toBeVisible();
  await page.getByLabel('الأغنية').selectOption({ label: 'أغنية تجريبية' });
  await page.getByRole('button', { name: 'حفظ' }).first().click();
  await expect(page.getByRole('status').filter({ hasText: 'تم الحفظ.' }).first()).toBeVisible();

  // Add the top (complete) package.
  const add = page.locator('details', { hasText: 'إضافة باقة' });
  await add.getByLabel('العربية').first().fill('باقة ذهبية');
  await add.getByLabel('الإنجليزية').first().fill('Gold');
  await add.getByLabel('السعر (دينار عراقي)').fill('75000');
  await add.getByRole('radio').last().check();
  await add.getByRole('button', { name: 'إنشاء' }).click();
  await expect(page.getByText('التصميم مستوفٍ لكل الشروط.')).toBeVisible();

  // Lifecycle: review → on sale.
  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'إرسال للمراجعة' }).click();
  await expect(page.getByText('جاهز للمراجعة').first()).toBeVisible();
  await page.getByRole('button', { name: 'تفعيل وعرض للبيع' }).click();
  await expect(page.getByText('معروض للبيع').first()).toBeVisible();
  await expect(page.getByText('مُجمّد (لا يمكن تعديله)')).toBeVisible();

  // The song can't be archived while a live theme uses it.
  await page.goto('/admin/music');
  await page.getByText('تعديل').first().click();
  await page.getByRole('button', { name: 'أرشفة' }).first().click();
  await expect(page.getByRole('alert').filter({ hasText: 'الأغنية مستخدمة في تصاميم' })).toBeVisible();

  // Everything is in the audit history.
  await page.goto('/admin/audit');
  for (const action of ['music.created', 'theme.settings_updated', 'package.created', 'theme.status_changed']) {
    await expect(page.getByText(action).first()).toBeVisible();
  }

  // Exchange rate → visitors can switch prices to USD next to the language choice.
  await page.goto('/admin/settings');
  const rateForm = page.locator('form', { has: page.getByLabel('سعر الدولار (دينار لكل ١ دولار)') });
  await rateForm.getByLabel('سعر الدولار (دينار لكل ١ دولار)').fill('1310');
  await rateForm.getByRole('button', { name: 'حفظ' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'تم الحفظ.' })).toBeVisible();
  await expect(page.getByText('≈')).toBeVisible();
  const visitorContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  const visitor = await visitorContext.newPage();
  await visitor.goto('/');
  await visitor.getByRole('button', { name: 'دولار' }).click();
  await expect(visitor.getByRole('button', { name: 'دولار' })).toHaveAttribute('aria-pressed', 'true');
  await visitor.reload();
  await expect(visitor.getByRole('button', { name: 'دولار' })).toHaveAttribute('aria-pressed', 'true');
  await visitorContext.close();
});
