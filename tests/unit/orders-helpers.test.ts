import { describe, expect, it } from 'vitest';
import { invitationPath, invitationPublicId, orderNumber, PUBLIC_ID_PATTERN, publicIdFromSlugPath, slugFromNames } from '@/lib/ids';
import { normalizePhone } from '@/lib/phone';
import { baghdadToday, validateFieldValues, type FieldDef } from '@/server/orders/validation';

describe('ids and URLs', () => {
  it('public ids are 10 unambiguous characters', () => {
    const ids = new Set(Array.from({ length: 500 }, invitationPublicId));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(id).toMatch(PUBLIC_ID_PATTERN);
    expect(orderNumber()).toMatch(/^ORD-[0-9A-Z]{8}$/);
  });

  it('turns Arabic, Kurdish and English names into ASCII slugs', () => {
    expect(slugFromNames(['علي', 'نور'])).toBe('ali-nor');
    expect(slugFromNames(['فاطمة'])).toBe('fatma');
    expect(slugFromNames(['ژیان', 'ئازاد'])).toMatch(/^[a-z-]+$/);
    expect(slugFromNames(['Sara Ahmed', 'Yusuf'])).toBe('sara-ahmed-yusuf');
    expect(slugFromNames(['😀', '!!'])).toBe('');
    expect(slugFromNames(['a'.repeat(80)]).length).toBeLessThanOrEqual(40);
  });

  it('builds and parses invitation paths; the id is authoritative', () => {
    const id = invitationPublicId();
    expect(invitationPath('ali-nor', id)).toBe(`/i/ali-nor-${id}`);
    expect(invitationPath('', id)).toBe(`/i/${id}`);
    expect(publicIdFromSlugPath(`ali-nor-${id}`)).toBe(id);
    expect(publicIdFromSlugPath(`totally-wrong-name-${id}`)).toBe(id);
    expect(publicIdFromSlugPath(id)).toBe(id);
    expect(publicIdFromSlugPath('ali-nor')).toBeNull();
    expect(publicIdFromSlugPath(`x${id}`)).toBeNull();
  });
});

describe('phone numbers', () => {
  it('normalizes Iraqi numbers in any common form, including Arabic digits', () => {
    for (const v of ['07701234567', '0770 123 4567', '+9647701234567', '009647701234567', '٠٧٧٠١٢٣٤٥٦٧', '7701234567']) {
      expect(normalizePhone(v), v).toBe('+9647701234567');
    }
  });
  it('accepts international numbers and rejects junk', () => {
    expect(normalizePhone('+44 7700 900123')).toBe('+447700900123');
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('+964123')).toBeNull();
    expect(normalizePhone('call me')).toBeNull();
  });
});

describe('invitation field validation', () => {
  const defs = new Map<string, FieldDef>([
    ['person_1_name', { type: 'text', maxLength: 20 }],
    ['invitation_message', { type: 'longtext', maxLength: 50 }],
    ['event_date', { type: 'date', maxLength: null }],
    ['event_time', { type: 'time', maxLength: null }],
    ['venue_map_url', { type: 'url', maxLength: null }],
  ]);
  const keys = [...defs.keys()];
  const now = new Date('2026-10-01T10:00:00Z');
  const good = {
    person_1_name: '  علي  ',
    invitation_message: 'أهلاً\n\n\n\nوسهلاً',
    event_date: '2026-11-12',
    event_time: '19:30',
    venue_map_url: 'https://maps.google.com/?q=x',
    injected: 'ignored',
  };

  it('accepts, trims and cleans valid values; drops fields outside the package', () => {
    const r = validateFieldValues(good, keys, defs, now);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.values.person_1_name).toBe('علي');
    expect(r.values.invitation_message).toBe('أهلاً\n\nوسهلاً');
    expect(r.values).not.toHaveProperty('injected');
  });

  it('every package field is required', () => {
    const r = validateFieldValues({ ...good, person_1_name: '   ' }, keys, defs, now);
    expect(r.ok || r.errors).toEqual({ person_1_name: 'required' });
  });

  it('rejects past dates, far-future dates, bad times, long text and non-map links', () => {
    const r = validateFieldValues(
      { ...good, event_date: '2026-09-30', event_time: '25:00', person_1_name: 'x'.repeat(21), venue_map_url: 'https://evil.example' },
      keys,
      defs,
      now,
    );
    expect(r.ok || r.errors).toEqual({
      event_date: 'pastDate',
      event_time: 'invalidTime',
      person_1_name: 'tooLong',
      venue_map_url: 'invalidMapUrl',
    });
    const far = validateFieldValues({ ...good, event_date: '2029-01-01' }, keys, defs, now);
    expect(far.ok || far.errors).toEqual({ event_date: 'tooFar' });
    const bad = validateFieldValues({ ...good, event_date: '2026-02-30' }, keys, defs, now);
    expect(bad.ok || bad.errors).toEqual({ event_date: 'invalidDate' });
  });

  it('uses Baghdad time for "today"', () => {
    expect(baghdadToday(new Date('2026-10-01T22:30:00Z'))).toBe('2026-10-02');
  });
});
