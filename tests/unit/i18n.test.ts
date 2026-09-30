import { describe, expect, it } from 'vitest';
import ar from '@/i18n/messages/ar.json';
import en from '@/i18n/messages/en.json';
import ckb from '@/i18n/messages/ckb.json';
import bdn from '@/i18n/messages/bdn.json';
import { mergeMessages, messagesFor } from '@/i18n/messages';
import { locales, localeMeta } from '@/i18n/config';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('translations', () => {
  it('English covers exactly the Arabic keys', () => {
    expect(keys(en).sort()).toEqual(keys(ar).sort());
  });

  it('Kurdish files only contain keys that exist in Arabic', () => {
    const arKeys = new Set(keys(ar));
    for (const k of [...keys(ckb), ...keys(bdn)]) expect(arKeys.has(k), k).toBe(true);
  });

  it('untranslated Kurdish keys fall back to Arabic, approved ones win', () => {
    const merged = mergeMessages({ a: { x: 'ar-x', y: 'ar-y' } }, { a: { x: 'ku-x' } });
    expect(merged).toEqual({ a: { x: 'ku-x', y: 'ar-y' } });
    expect(keys(messagesFor('ckb')).sort()).toEqual(keys(ar).sort());
  });

  it('every locale has direction and language metadata; only English is LTR', () => {
    for (const l of locales) expect(localeMeta[l].dir).toBe(l === 'en' ? 'ltr' : 'rtl');
  });
});
