import { describe, expect, it } from 'vitest';
import { STANDARD_FIELDS } from '@/catalog/fields';
import { manifestSchema, matchesValidState } from '@/theme-sdk/manifest';
import { eventInstant, formatEventDate, formatEventTime } from '@/theme-sdk/format';
import manifest from '../../themes/olive-ring-box/v1/manifest';
import { SAMPLES } from '../../src/app/dev/themes/samples';

describe('olive-ring-box theme manifest', () => {
  it('is valid and declares the Normal, VIP and VVIP package states', () => {
    expect(manifestSchema.safeParse(manifest).success).toBe(true);
    const fields = ['person_1_name', 'person_2_name', 'event_date', 'event_time', 'venue_name', 'invitation_message'];
    expect(matchesValidState(manifest, ['music', 'print_card'], fields)).toBe(true);
    expect(matchesValidState(manifest, ['music', 'countdown', 'map', 'rsvp', 'print_card'], [...fields, 'venue_map_url'])).toBe(true);
    expect(manifest.validStates.at(-1)?.features).toContain('keepsake_pdf');
  });

  it('every package includes the printable card (wedding section rule)', () => {
    for (const state of manifest.validStates) expect(state.features).toContain('print_card');
  });
});

describe('design-review samples', () => {
  it('the long samples use the maximum lengths from the brief', () => {
    for (const locale of ['ar', 'en'] as const) {
      const long = SAMPLES[locale].long;
      expect(long.invitation_message).toHaveLength(200);
      expect(long.venue_name!.length).toBeGreaterThanOrEqual(75);
      expect(long.venue_name!.length).toBeLessThanOrEqual(STANDARD_FIELDS.venue_name.maxLength);
      expect(long.person_1_name!.length).toBeLessThanOrEqual(STANDARD_FIELDS.person_1_name.maxLength);
    }
  });
});

describe('theme SDK date formatting', () => {
  it('reads event date and time as Baghdad time', () => {
    expect(eventInstant('2026-12-17', '19:30')?.toISOString()).toBe('2026-12-17T16:30:00.000Z');
    expect(eventInstant('2026-12-17', undefined)?.toISOString()).toBe('2026-12-16T21:00:00.000Z');
    expect(eventInstant('17/12/2026', '19:30')).toBeNull();
  });

  it('formats Arabic with Arabic-Indic digits and Iraqi month names', () => {
    expect(formatEventDate('2026-12-17', 'ar')).toBe('الخميس، ١٧ كانون الأول ٢٠٢٦');
    expect(formatEventTime('2026-12-17', '19:30', 'ar')).toBe('٧:٣٠ م');
  });

  it('formats English', () => {
    expect(formatEventDate('2026-12-17', 'en')).toBe('Thursday, 17 December 2026');
    expect(formatEventTime('2026-12-17', '19:30', 'en')).toBe('7:30 pm');
  });

  it('falls back to the raw value when it cannot parse', () => {
    expect(formatEventDate('soon', 'ar')).toBe('soon');
    expect(formatEventTime('2026-12-17', undefined, 'ar')).toBe('');
  });
});
