import { describe, expect, it } from 'vitest';
import { eventStartIso, formatEventDate, formatEventTime, safeMapUrl } from '@/lib/invitation-format';
import { buildThemeProps, invitationMessages, sampleValues } from '@/server/invitation/theme-props';

describe('map links', () => {
  it('accepts https links from known map providers only', () => {
    expect(safeMapUrl('https://maps.google.com/?q=Baghdad')).toBe('https://maps.google.com/?q=Baghdad');
    expect(safeMapUrl('https://maps.app.goo.gl/abc123')).toContain('maps.app.goo.gl');
    expect(safeMapUrl('https://www.google.com/maps/place/x')).toContain('/maps/');
    expect(safeMapUrl('https://www.google.com/search?q=x')).toBeNull();
    expect(safeMapUrl('http://maps.google.com/?q=x')).toBeNull();
    expect(safeMapUrl('javascript:alert(1)')).toBeNull();
    expect(safeMapUrl('https://evil.example/maps')).toBeNull();
    expect(safeMapUrl('https://user:pw@maps.google.com/')).toBeNull();
  });
});

describe('event dates', () => {
  const names = invitationMessages('bdn');
  it('uses Baghdad time for the countdown target', () => {
    expect(eventStartIso('2026-11-12', '19:30')).toBe('2026-11-12T19:30:00+03:00');
    expect(eventStartIso('2026-11-12', undefined)).toBe('2026-11-12T00:00:00+03:00');
    expect(eventStartIso('12/11/2026', '19:30')).toBeNull();
  });

  it('formats Arabic, Sorani and English with calendar data', () => {
    expect(formatEventDate('2026-11-12', 'ar-IQ', names)?.month).toBe('تشرين الثاني');
    expect(formatEventDate('2026-11-12', 'en-GB', names)?.weekday).toBe('Thursday');
    expect(formatEventDate('2026-11-12', 'ckb-IQ', names)?.weekday).toBe('پێنجشەممە');
    expect(formatEventTime('19:30', 'en-GB', names)).toBe('19:30');
  });

  it('formats Badini from translated names with Arabic-Indic digits', () => {
    const d = formatEventDate('2026-11-12', null, names)!;
    expect(d.day).toBe('١٢');
    expect(d.year).toBe('٢٠٢٦');
    expect(d.month).toBe(names.months.m11);
    expect(formatEventTime('19:30', null, names)).toBe(`٧:٣٠ ${names.pm}`);
  });
});

describe('theme props (the Theme Contract)', () => {
  const values = { ...sampleValues('ar', 'short'), invitation_message: 'hello', venue_map_url: 'https://maps.google.com/?q=x' };

  it('passes only package-enabled fields and features', () => {
    const p = buildThemeProps({
      mode: 'sample',
      locale: 'ar',
      fieldKeys: ['person_1_name', 'event_date'],
      features: ['countdown'],
      values,
      musicSrc: '/media/audio/x.mp3',
    });
    expect(Object.keys(p.fields).sort()).toEqual(['event_date', 'person_1_name']);
    expect(p.fields.invitation_message).toBeUndefined();
    expect(p.music).toBeNull(); // package has no music feature
    expect(p.mapUrl).toBeNull(); // no map feature
    expect(p.event.startsAt).toMatch(/\+03:00$/);
    expect(p.dir).toBe('rtl');
  });

  it('includes music and a validated map link when the package has them', () => {
    const p = buildThemeProps({
      mode: 'live',
      locale: 'en',
      fieldKeys: ['person_1_name', 'venue_map_url'],
      features: ['music', 'map'],
      values,
      musicSrc: '/media/audio/x.mp3',
    });
    expect(p.music).toEqual({ src: '/media/audio/x.mp3' });
    expect(p.mapUrl).toBe('https://maps.google.com/?q=x');
    expect(p.labels.openInvitation).toBe('Open invitation');
    expect(p.dir).toBe('ltr');
  });

  it('drops unsafe map links even when the feature is on', () => {
    const p = buildThemeProps({
      mode: 'live',
      locale: 'ar',
      fieldKeys: ['venue_map_url'],
      features: ['map'],
      values: { venue_map_url: 'javascript:alert(1)' },
      musicSrc: null,
    });
    expect(p.mapUrl).toBeNull();
  });
});
