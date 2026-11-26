import { describe, expect, it } from 'vitest';
import { cleanEventName, eventWords, isEventKind, showsEventWording, EVENT_NAME_MAX } from '@/catalog/occasion-wording';

describe('occasion wording (owner, 2026-11-26)', () => {
  it('names a Nishani and a henna night in each language, with the English name for lettered artwork', () => {
    expect(eventWords('henna', null, 'ar')?.details).toBe('تفاصيل ليلة الحنّة');
    expect(eventWords('henna', null, 'en')?.ofThe).toBe('The henna night of');
    expect(eventWords('nishani', null, 'ckb')?.latin).toBe('Nishani');
    expect(eventWords('nishani', null, 'bdn')?.name).toBe('ئاهەنگا نیشانیێ');
  });
  it('puts the customer’s own words in every phrase', () => {
    const w = eventWords('custom', '  Our   Nikah\nceremony ', 'en')!;
    expect(w.name).toBe('Our Nikah ceremony');
    expect(w.invitedTo).toContain('Our Nikah ceremony');
    expect(w.latin).toBe('Our Nikah ceremony');
  });
  it('is null for the section’s own event, an unknown kind or empty own words', () => {
    expect(eventWords(null, null, 'ar')).toBeNull();
    expect(eventWords('birthday', null, 'ar')).toBeNull();
    expect(eventWords('custom', '   ', 'ar')).toBeNull();
    expect(isEventKind('henna')).toBe(true);
    expect(isEventKind('wedding')).toBe(false);
  });
  it('keeps own words to one short line without markup', () => {
    expect(cleanEventName('<b>x</b>')).toBe('bx/b');
    expect(cleanEventName('a'.repeat(60))!.length).toBe(EVENT_NAME_MAX);
  });
  it('is only offered on design versions that show it', () => {
    expect(showsEventWording('espresso-ivory', 4)).toBe(true);
    expect(showsEventWording('espresso-ivory', 5)).toBe(true);
    expect(showsEventWording('espresso-ivory', 3)).toBe(false);
    expect(showsEventWording('royal-olive-crest', 9)).toBe(false);
    expect(showsEventWording(null, 4)).toBe(false);
  });
});
