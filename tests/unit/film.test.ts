import { describe, expect, it } from 'vitest';
import { filmInputs, filmKey } from '@/server/film/film';

describe("the couple's film texts", () => {
  it('stitches both names, their initials and the date (dd.mm.yyyy)', () => {
    expect(filmInputs({ person_1_name: 'Aza', person_2_name: 'raghad', event_date: '2026-07-17' })).toEqual({
      names: 'Aza & raghad',
      initials: 'A | R',
      date: '17.07.2026',
    });
  });

  it('keeps Arabic and Kurdish names as written (the renderer shapes them), first letter as the initial', () => {
    expect(filmInputs({ person_1_name: ' عبدالرحمن ', person_2_name: 'شێرین', event_date: '2027-01-09' })).toEqual({
      names: 'عبدالرحمن & شێرین',
      initials: 'ع | ش',
      date: '09.01.2027',
    });
  });

  it("never passes the renderer's separators from a name, and needs a name and a date", () => {
    expect(filmInputs({ person_1_name: 'Ali & Co', person_2_name: 'Nour|X', event_date: '2026-07-17' })?.names).toBe('Ali Co & Nour X');
    expect(filmInputs({ person_1_name: 'Ali', event_date: '2026-07-17' })).toEqual({ names: 'Ali', initials: 'A', date: '17.07.2026' });
    expect(filmInputs({ person_1_name: 'Ali', person_2_name: 'Nour' })).toBeNull();
    expect(filmInputs({ event_date: '2026-07-17' })).toBeNull();
  });

  it('is made again when the names or the date change', () => {
    const a = filmKey(filmInputs({ person_1_name: 'Ali', person_2_name: 'Nour', event_date: '2026-07-17' })!);
    expect(filmKey(filmInputs({ person_1_name: 'Ali', person_2_name: 'Nour', event_date: '2026-07-17' })!)).toBe(a);
    expect(filmKey(filmInputs({ person_1_name: 'Ali', person_2_name: 'Noor', event_date: '2026-07-17' })!)).not.toBe(a);
    expect(filmKey(filmInputs({ person_1_name: 'Ali', person_2_name: 'Nour', event_date: '2026-07-18' })!)).not.toBe(a);
  });
});
