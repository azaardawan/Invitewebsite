import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, uiTranslations } from '@/server/db/schema';
import { checkTranslation, listTranslations, saveTranslation, TranslationError } from '@/server/i18n/translations';
import { messagesFor } from '@/i18n/messages';
import { makeAdmin } from '../helpers';

const KEY = 'receipt.keepsakeTitle';
const keepsakeTitle = (l: 'ar' | 'ckb' | 'bdn' | 'en') => (messagesFor(l) as { receipt: { keepsakeTitle: string } }).receipt.keepsakeTitle;
let actor: { adminId: string; ipHash: null };

beforeAll(async () => {
  const admin = await makeAdmin(['OWNER']);
  actor = { adminId: admin.id, ipHash: null };
  await db().delete(uiTranslations);
});
afterAll(async () => {
  await db().delete(uiTranslations);
});

describe('Admin translations', () => {
  it('changes a website text, records it, and restores the original when emptied', async () => {
    const original = keepsakeTitle('ar');
    expect(await saveTranslation(db(), KEY, { ar: 'دفتر التهاني', ckb: '' }, actor)).toBe(true);
    expect(keepsakeTitle('ar')).toBe('دفتر التهاني');
    // Kurdish keeps its own approved text.
    expect(keepsakeTitle('ckb')).not.toBe('دفتر التهاني');
    const logs = await db().select().from(auditLogs).where(eq(auditLogs.action, 'translation.update'));
    expect(logs.at(-1)?.after).toMatchObject({ key: KEY, ar: 'دفتر التهاني' });

    expect((await listTranslations(db(), { filter: 'edited' })).map((r) => r.key)).toEqual([KEY]);
    // Saving the same again changes nothing.
    expect(await saveTranslation(db(), KEY, { ar: 'دفتر التهاني' }, actor)).toBe(false);

    await saveTranslation(db(), KEY, { ar: '' }, actor);
    expect(keepsakeTitle('ar')).toBe(original);
    expect(await db().select().from(uiTranslations)).toHaveLength(0);
  });

  it('accepts placeholders from the original and refuses unknown ones or broken brackets', () => {
    expect(() => checkTranslation('receipt.accessCodeLine', 'الرقم: {code}')).not.toThrow();
    expect(() => checkTranslation('receipt.accessCodeLine', 'الرقم: {phone}')).toThrow(TranslationError);
    expect(() => checkTranslation('receipt.accessCodeLine', 'الرقم: {code')).toThrow(/invalidSyntax/);
    expect(() => checkTranslation('admin.nav.dashboard', 'x')).toThrow(/unknownKey/);
  });

  it('lists texts still missing Kurdish', async () => {
    const missing = await listTranslations(db(), { filter: 'missing' });
    // Every shipped key has approved Kurdish today; a Badini-only month name never counts for Sorani.
    expect(missing.every((r) => r.missingKurdish)).toBe(true);
  });
});
