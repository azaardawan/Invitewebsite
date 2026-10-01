import { expect, test } from '@playwright/test';
import { signInAsNewOwner } from './helpers';

test('owner publishes a legal policy and sets contact details; the website shows them', async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'stateful flow runs once');
  test.setTimeout(90_000);

  // Before publishing, the page says the policy is being prepared.
  const visitor = await browser.newPage();
  await visitor.goto('/en/legal/privacy');
  await expect(visitor.getByRole('heading', { name: 'Privacy policy' })).toBeVisible();
  await expect(visitor.getByText('This policy is being prepared')).toBeVisible();

  await signInAsNewOwner(page);
  await page.goto('/admin/legal/privacy');
  // The seeded draft is there to review; replace the English text and publish.
  await page.getByLabel('الإنجليزية').fill('We respect your privacy.\n\n## Cookies\n- Only essential cookies.');
  await page.getByRole('button', { name: 'حفظ المسودة' }).click();
  await expect(page.getByText('تم حفظ المسودة.')).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'نشر هذا الإصدار' }).click();
  await expect(page.getByText(/المنشور: الإصدار 1/)).toBeVisible();

  await visitor.reload();
  await expect(visitor.getByRole('heading', { name: 'Cookies' })).toBeVisible();
  await expect(visitor.getByRole('listitem').filter({ hasText: 'Only essential cookies.' })).toBeVisible();
  await expect(visitor.getByText(/Version 1/)).toBeVisible();

  // Contact details appear in the footer and on the contact page.
  await page.goto('/admin/settings');
  const contact = page.locator('form', { has: page.getByLabel('اسم المستخدم في إنستغرام') });
  await contact.getByLabel('البريد الإلكتروني (اختياري)').fill('hello@bahja.test');
  await contact.getByLabel('اسم المستخدم في إنستغرام').fill('@bahja.iq');
  await contact.getByRole('button', { name: 'حفظ' }).click();
  await expect(contact.getByText('تم الحفظ.')).toBeVisible();

  await visitor.goto('/en/contact');
  await expect(visitor.getByRole('heading', { name: 'Contact us' })).toBeVisible();
  await expect(visitor.getByRole('main').getByRole('link', { name: /hello@bahja\.test/ })).toHaveAttribute('href', 'mailto:hello@bahja.test');
  await expect(visitor.getByRole('main').getByRole('link', { name: /bahja\.iq/ })).toHaveAttribute('href', 'https://www.instagram.com/bahja.iq');
  await expect(visitor.getByRole('contentinfo').getByRole('link', { name: 'Privacy policy' })).toBeVisible();
});
