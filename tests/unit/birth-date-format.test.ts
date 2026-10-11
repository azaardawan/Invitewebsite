import { describe, expect, it } from 'vitest';
import { formatBirthDate } from '@/lib/birth-date-format';
import { BOTTLE_SIZE_KEYS, bottlesPerSheet, isBottleSize } from '@/catalog/products';

const names = { months: { m10: 'تشرینا ئێکێ' }, weekdays: {}, am: '', pm: '' };
const ar = { locale: 'ar', intlLocale: 'ar-IQ' } as const;
const en = { locale: 'en', intlLocale: 'en-GB' } as const;

describe('the date of birth in the customer’s chosen style', () => {
  it('writes the Gregorian date with Arabic-Indic or Western digits', () => {
    expect(formatBirthDate('2026-10-05', 'long', 'arab', ar, names)).toEqual(['٥ تشرين الأول ٢٠٢٦']);
    expect(formatBirthDate('2026-10-05', 'long', 'latn', ar, names)).toEqual(['5 تشرين الأول 2026']);
    expect(formatBirthDate('2026-10-05', 'numeric', 'arab', ar, names)).toEqual(['٥ / ١٠ / ٢٠٢٦']);
  });

  it('adds the Hijri date, alone or as a second line', () => {
    const [hijri] = formatBirthDate('2026-10-05', 'hijri', 'arab', ar, names)!;
    expect(hijri).toMatch(/١٤٤٨/);
    const both = formatBirthDate('2026-10-05', 'both', 'arab', ar, names)!;
    expect(both).toHaveLength(2);
    expect(both[1]).toBe(hijri);
  });

  it('always uses Western digits in English, and the approved month names in Badini', () => {
    expect(formatBirthDate('2026-10-05', 'numeric', 'arab', en, names)).toEqual(['5 / 10 / 2026']);
    expect(formatBirthDate('2026-10-05', 'long', 'latn', { locale: 'bdn', intlLocale: 'ckb' }, names)).toEqual(['5 تشرینا ئێکێ 2026']);
  });

  it('gives nothing for a missing or invalid date', () => {
    expect(formatBirthDate(undefined, 'long', 'arab', ar, names)).toBeNull();
    expect(formatBirthDate('05/10/2026', 'long', 'arab', ar, names)).toBeNull();
  });
});

describe('bottle labels', () => {
  it('fits at least one label of every size on an A4 sheet', () => {
    expect(BOTTLE_SIZE_KEYS.map(bottlesPerSheet)).toEqual([3, 3, 3, 3]);
    expect(isBottleSize('500')).toBe(true);
    expect(isBottleSize('1000')).toBe(false);
  });
});
