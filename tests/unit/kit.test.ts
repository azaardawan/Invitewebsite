import { describe, expect, it } from 'vitest';
import { BOTTLE_SIZE_KEYS, MM, kitUnits, pngTarget, sheetLayout, unitGeometry } from '@/catalog/kit';
import { formatBirthDate } from '@/lib/kit-format';
import { kitStates, manifestSchema, type ThemeManifest } from '@/theme-sdk/manifest';
import { validateFieldValues, type FieldDef } from '@/server/orders/validation';
import ar from '@/i18n/messages/ar.json';
import bdn from '@/i18n/messages/bdn.json';

const arNames = ar.invitation;
const bdnNames = { ...ar.invitation, ...(bdn as { invitation?: object }).invitation } as typeof ar.invitation;
const AR = { locale: 'ar', intlLocale: 'ar-IQ' } as const;
const EN = { locale: 'en', intlLocale: 'en-GB' } as const;

describe('birth date wording', () => {
  it('writes the date in every style the customer can choose', () => {
    expect(formatBirthDate('2026-10-05', 'long', 'arab', AR, arNames)).toEqual(['٥ تشرين الأول ٢٠٢٦']);
    expect(formatBirthDate('2026-10-05', 'long', 'latn', AR, arNames)).toEqual(['5 تشرين الأول 2026']);
    expect(formatBirthDate('2026-10-05', 'numeric', 'arab', AR, arNames)).toEqual(['٥ / ١٠ / ٢٠٢٦']);
    expect(formatBirthDate('2026-10-05', 'hijri', 'arab', AR, arNames)![0]).toMatch(/^٢٤ ربيع الآخر ١٤٤٨ هـ$/);
    expect(formatBirthDate('2026-10-05', 'both', 'arab', AR, arNames)).toHaveLength(2);
  });

  it('English always uses Western digits; Badini uses the approved month names', () => {
    expect(formatBirthDate('2026-10-05', 'long', 'arab', EN, arNames)).toEqual(['5 October 2026']);
    expect(formatBirthDate('2026-10-05', 'hijri', 'arab', EN, arNames)![0]).toContain('1448');
    expect(formatBirthDate('2026-10-05', 'long', 'arab', { locale: 'bdn', intlLocale: 'ar-IQ' }, bdnNames)).toEqual([
      `٥ ${bdnNames.months.m10} ٢٠٢٦`,
    ]);
  });

  it('rejects missing or impossible dates', () => {
    expect(formatBirthDate(undefined, 'long', 'arab', AR, arNames)).toBeNull();
    expect(formatBirthDate('2026-13-40', 'long', 'arab', AR, arNames)).toBeNull();
  });
});

describe('kit geometry and print sheets', () => {
  it('sizes units in CSS pixels with bleed', () => {
    expect(unitGeometry('story')).toMatchObject({ width: 360, height: 640, bleed: 0 });
    const card = unitGeometry('card');
    expect(card.width).toBeCloseTo(154 * MM);
    expect(card.trimMm).toEqual({ w: 148, h: 210 });
    expect(unitGeometry('sticker-round').shape).toBe('circle');
    expect(unitGeometry('bottle', '500').trimMm).toEqual({ w: 215, h: 55 });
  });

  it('exports exact PNG sizes (A5 at 300 dpi, 1080×1920 story, 2000 px stickers)', () => {
    expect(pngTarget('story')).toEqual({ width: 1080, height: 1920, dpi: 72 });
    expect(pngTarget('card')).toEqual({ width: 1748, height: 2480, dpi: 300 });
    expect(pngTarget('sticker-square')).toMatchObject({ width: 2000, height: 2000 });
    expect(pngTarget('bottle', '500')).toEqual({ width: 2539, height: 650, dpi: 300 });
  });

  it('fills an A4 with 15 stickers and keeps every copy on the page', () => {
    for (const unit of ['sticker-round', 'sticker-square'] as const) {
      const s = sheetLayout(unit);
      expect(s.items).toHaveLength(15);
      expect(s.cutGuide).toBe(true);
      for (const it of s.items) {
        expect(it.x).toBeGreaterThanOrEqual(4);
        expect(it.y).toBeGreaterThanOrEqual(4);
        expect(it.x + 54).toBeLessThanOrEqual(s.pageW - 4);
        expect(it.y + 54).toBeLessThanOrEqual(s.pageH - 4);
      }
    }
  });

  it('puts every bottle size on A4 landscape with crop marks, and the card alone with marks', () => {
    for (const b of BOTTLE_SIZE_KEYS) {
      const s = sheetLayout('bottle', b);
      expect([s.pageW, s.pageH]).toEqual([297, 210]);
      expect(s.items.length).toBeGreaterThanOrEqual(3);
      expect(s.cropMarks).toBe(true);
    }
    expect(sheetLayout('card')).toMatchObject({ pageW: 154 + 24, pageH: 216 + 24, items: [{ x: 12, y: 12 }], cropMarks: true });
  });

  it('maps package features to units', () => {
    expect(kitUnits(['kit_story', 'kit_sticker'])).toEqual(['story', 'sticker-round', 'sticker-square']);
    expect(kitUnits(['music'])).toEqual([]);
  });
});

describe('design-kit manifests', () => {
  const features = ['kit_story', 'kit_card', 'kit_sticker', 'kit_bottle'] as const;
  const fields = ['baby_name', 'father_name', 'birth_date'] as const;
  const kit: ThemeManifest = {
    key: 'baby-kit',
    version: 1,
    title: { ar: 'مولود', en: 'Baby' },
    experience: 'DESIGN_KIT',
    sections: ['baby'],
    fields: [...fields],
    features: [...features],
    validStates: kitStates(features, fields),
  };
  const problems = (m: unknown) => {
    const r = manifestSchema.safeParse(m);
    return r.success ? [] : r.error.issues.map((i) => i.message);
  };

  it('every non-empty mix of files is a designed state, complete kit last', () => {
    expect(kit.validStates).toHaveLength(15);
    expect(kit.validStates.at(-1)!.features).toEqual([...features]);
    expect(problems(kit)).toEqual([]);
  });

  it('keeps kit features and invitation features apart', () => {
    expect(problems({ ...kit, features: [...features, 'music'] })).toContain('design kits can only use kit_* features (not music)');
    expect(
      problems({
        ...kit,
        experience: 'INVITATION',
        validStates: [{ features: [...features], fields: [...fields] }],
      }),
    ).toContain('kit_story is only for design kits (experience DESIGN_KIT)');
  });
});

describe('birth date validation', () => {
  const defs = new Map<string, FieldDef>([['birth_date', { type: 'past_date', maxLength: null }]]);
  const now = new Date('2026-10-10T09:00:00Z');
  const check = (v: string) => validateFieldValues({ birth_date: v }, ['birth_date'], defs, now);

  it('accepts today and recent dates (Arabic-Indic digits too)', () => {
    expect(check('2026-10-10')).toEqual({ ok: true, values: { birth_date: '2026-10-10' } });
    expect(check('٢٠٢٦-٠٩-٠١')).toEqual({ ok: true, values: { birth_date: '2026-09-01' } });
  });

  it('refuses future, very old and impossible dates', () => {
    expect(check('2026-10-11')).toEqual({ ok: false, errors: { birth_date: 'futureDate' } });
    expect(check('2019-01-01')).toEqual({ ok: false, errors: { birth_date: 'tooOld' } });
    expect(check('2026-02-30')).toEqual({ ok: false, errors: { birth_date: 'invalidDate' } });
  });
});
