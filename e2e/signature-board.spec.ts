import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { E2E_DATABASE_URL, signInAsNewOwner } from './helpers';

/**
 * The signature board (owner, 2026-11-27): the add-on on the order form (only on a design with board artwork), guests
 * signing under their message, the couple's board on their receipt (two boards, moving, turning, moving a message to
 * the other board, saved), and the printed files. `BOARD_SHOTS=<folder>` saves pictures of the screens.
 */
const script = (file: string, env: Record<string, string> = {}) =>
  JSON.parse(
    execFileSync('pnpm', ['-s', 'exec', 'tsx', '--conditions=react-server', '--env-file-if-exists=.env', file], { env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, ...env } })
      .toString()
      .trim()
      .split('\n')
      .at(-1)!,
  );
const shots = process.env.BOARD_SHOTS;
const shot = async (page: Page, name: string, el?: ReturnType<Page['locator']>) => {
  if (!shots) return;
  mkdirSync(shots, { recursive: true });
  if (el) await el.screenshot({ path: `${shots}/${name}.png` });
  else await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
};

test('signature board: bought on the order form, arranged on the receipt, printed', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  test.setTimeout(300_000);
  await signInAsNewOwner(page);
  const made = script('e2e/scripts/make-board-order.ts') as { receiptToken: string; path: string; amountIqd: number; previewToken: string };
  // 40,000 (package) + 25,000 (the board).
  expect(made.amountIqd).toBe(65000);

  // The order form offers it (the design has board artwork), with its price.
  await page.setViewportSize({ width: 430, height: 900 });
  await page.goto(`/en/order/${made.previewToken}/edit`);
  const addOn = page.locator('[data-signature-board-addon]');
  await expect(addOn).toContainText('Signature board');
  await expect(addOn).toContainText('25,000');
  await addOn.scrollIntoViewIfNeeded();
  await shot(page, '1-order-form', addOn);

  // The receipt: nine messages, six on a board, so two boards.
  await page.setViewportSize({ width: 1100, height: 1000 });
  await page.goto(`/r/${made.receiptToken}`);
  const section = page.locator('[data-signature-board]');
  await expect(section.getByRole('tab')).toHaveCount(2);
  const board1 = section.locator('[data-board="0"]');
  await expect(board1.locator('[data-note]')).toHaveCount(6);
  await expect(board1).toContainText('Dara & Ava');
  // Signed messages carry their signature.
  await expect(board1.locator('[data-note] svg').first()).toBeVisible();
  // No message is cut: every note's text fits inside it, and every note is on the board.
  const fits = await board1.evaluate((b) => {
    const field = b.querySelector('[data-note]')!.parentElement!.getBoundingClientRect();
    return [...b.querySelectorAll<HTMLElement>('[data-note]')].every((n) => {
      const p = n.querySelector('p')!;
      return p.scrollWidth <= p.clientWidth + 1 && n.offsetTop + n.offsetHeight <= field.height + 2;
    });
  });
  expect(fits).toBe(true);
  // Neighbours never share an ink.
  const sameInk = await board1.evaluate((b) => {
    const notes = [...b.querySelectorAll<HTMLElement>('[data-note]')].map((n) => ({ r: n.getBoundingClientRect(), c: n.style.getPropertyValue('--c') }));
    let bad = 0;
    for (let i = 0; i < notes.length; i++)
      for (let j = i + 1; j < notes.length; j++) {
        const a = notes[i]!.r;
        const c = notes[j]!.r;
        if (notes[i]!.c === notes[j]!.c && a.left - 8 < c.right && c.left - 8 < a.right && a.top - 8 < c.bottom && c.top - 8 < a.bottom) bad++;
      }
    return bad;
  });
  expect(sameInk).toBe(0);
  await shot(page, '2-receipt-board', section);

  // Move a message: drag it down and to the side; it is saved.
  const note = board1.locator('[data-note]').first();
  const id = await note.getAttribute('data-note');
  const before = (await note.boundingBox())!;
  const saved = page.waitForResponse((r) => r.url().endsWith('/board') && r.request().method() === 'PUT' && r.ok());
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 60, before.y + before.height / 2 + 120, { steps: 8 });
  await page.mouse.up();
  await saved;
  const after = (await board1.locator(`[data-note="${id}"]`).boundingBox())!;
  expect(after.y - before.y).toBeGreaterThan(80);
  // Turn it with the button, then move it to board 2.
  await section.getByRole('button', { name: 'Turn ⟳' }).click();
  await expect(board1.locator(`[data-note="${id}"]`)).toHaveAttribute('style', /rotate\(/);
  const moved = page.waitForResponse((r) => r.url().endsWith('/board') && r.request().method() === 'PUT' && r.ok());
  await section.getByRole('button', { name: 'Move to board 2' }).click();
  await moved;
  await expect(section.locator('[data-board="1"]').locator(`[data-note="${id}"]`)).toBeVisible();
  await expect(board1.locator('[data-note]')).toHaveCount(5);
  await shot(page, '3-board-2', section);

  // After a reload it is still there.
  await page.reload();
  await expect(section.locator('[data-board="1"]').locator(`[data-note="${id}"]`)).toHaveCount(1);
  await expect(section.locator('[data-board="0"]').locator('[data-note]')).toHaveCount(5);

  // The files: a PDF with a page per board, and one board as a picture.
  const pdf = await page.request.get(`/r/${made.receiptToken}/board?format=pdf`, { timeout: 120_000 });
  expect(pdf.headers()['content-type']).toBe('application/pdf');
  const doc = await PDFDocument.load(await pdf.body());
  expect(doc.getPageCount()).toBe(2);
  const { width, height } = doc.getPage(0).getSize();
  // 600 × 900 mm in points.
  expect(Math.round((width / 72) * 25.4)).toBe(600);
  expect(Math.round((height / 72) * 25.4)).toBe(900);
  const png = await page.request.get(`/r/${made.receiptToken}/board?format=png&n=1`, { timeout: 120_000 });
  expect(png.headers()['content-type']).toBe('image/png');
  if (shots) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(`${shots}/4-board-2.png`, await png.body());
  }
});

test('guests sign under their message; the signature reaches the board', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'runs once, on a phone');
  test.setTimeout(240_000);
  const made = script('e2e/scripts/make-board-order.ts', { MESSAGES: '2' }) as { receiptToken: string; path: string };
  await page.goto(made.path);
  const open = page.getByRole('button', { name: /open/i });
  if (await open.count()) await open.first().click();
  const pad = page.locator('[data-bahja-signature-pad] canvas');
  await pad.scrollIntoViewIfNeeded();
  await expect(pad).toBeVisible();
  // Draw a signature with a finger.
  const box = (await pad.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 80);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + 30 + i * 18, box.y + 80 + Math.sin(i) * 25);
  await page.mouse.up();
  await shot(page, '5-guest-form', page.locator('[data-bahja-signature-pad]'));
  await page.locator('input[name="name"]').fill('Signed Guest');
  await page.locator('input[name="attendance"]').first().check();
  await page.locator('textarea[name="message"]').fill('Congratulations from a signed guest!');
  await page.locator('textarea[name="message"]').evaluate((el) => el.closest('form')!.requestSubmit());
  await expect(page.locator('[data-bahja-signature-pad]')).toHaveCount(0, { timeout: 15_000 });

  // The couple's board shows the new message with its signature.
  await page.goto(`/r/${made.receiptToken}`);
  const note = page.locator('[data-signature-board] [data-note]', { hasText: 'Signed Guest' });
  await expect(note).toBeVisible();
  await expect(note.locator('svg path')).toHaveCount(1);
});

test('a newborn\'s guests reply without "how many of you"; every guest form has the signature pad', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'runs once, on a phone');
  test.setTimeout(120_000);
  await signInAsNewOwner(page);
  const open = async () => {
    const button = page.getByRole('button', { name: /open/i });
    if (await button.count()) await button.first().click();
  };
  // A newborn design: the form has the signature pad and no party size.
  await page.goto('/admin/preview/en/theme/rosebird-garden?features=music,rsvp,congratulations');
  await open();
  await page.locator('textarea[name="message"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-bahja-signature-pad]')).toBeVisible();
  await expect(page.locator('[data-bahja-party-size]')).toHaveCount(0);
  // A wedding keeps "how many of you".
  await page.goto('/admin/preview/en/theme/demo-wedding?features=music,rsvp,congratulations');
  await open();
  await page.locator('textarea[name="message"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-bahja-party-size]')).toHaveCount(1);
  await expect(page.locator('[data-bahja-signature-pad]')).toBeVisible();
});

test("Admin: the board's artwork on the design, its price and people per board in Settings", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'runs once');
  test.setTimeout(240_000);
  await signInAsNewOwner(page);
  const made = script('e2e/scripts/make-board-order.ts', { MESSAGES: '1' }) as { themeId: string };
  await page.goto(`/admin/themes/${made.themeId}`);
  await expect(page.locator('[data-board-status="on"]')).toBeVisible();
  // The preview: sample messages on the artwork.
  const preview = page.frameLocator('iframe[title="معاينة اللوحة"]');
  await expect(preview.locator('[data-note]').first()).toBeVisible({ timeout: 30_000 });
  await shot(page, '6-admin-design', page.locator('[data-board-status]').locator('xpath=ancestor::section[1]'));
  await page.goto('/admin/settings');
  await expect(page.getByLabel('عدد الأشخاص في كل لوحة')).toHaveValue('6');
  await page.getByLabel('عدد الأشخاص في كل لوحة').fill('25');
  const form = page.locator('form', { has: page.getByLabel('عدد الأشخاص في كل لوحة') });
  await form.getByRole('button', { name: 'حفظ' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'تم الحفظ.' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('عدد الأشخاص في كل لوحة')).toHaveValue('25');
});
