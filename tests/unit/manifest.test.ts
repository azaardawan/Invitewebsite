import { describe, expect, it } from 'vitest';
import { manifestSchema, matchesValidState, type ThemeManifest } from '@/theme-sdk/manifest';
import { featureDependencyProblems } from '@/catalog/features';

const base: ThemeManifest = {
  key: 'rose-garden',
  version: 1,
  title: { ar: 'حديقة الورد', en: 'Rose garden' },
  experience: 'INVITATION',
  sections: ['wedding'],
  fields: ['person_1_name', 'person_2_name', 'event_date', 'venue_map_url'],
  features: ['music', 'map', 'rsvp', 'congratulations'],
  validStates: [
    { features: ['music'], fields: ['person_1_name', 'person_2_name', 'event_date'] },
    { features: ['music', 'map', 'rsvp', 'congratulations'], fields: ['person_1_name', 'person_2_name', 'event_date', 'venue_map_url'] },
  ],
};

const problems = (m: unknown) => {
  const r = manifestSchema.safeParse(m);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe('theme manifest validation', () => {
  it('accepts a well-formed manifest', () => {
    expect(problems(base)).toEqual([]);
  });

  it('requires the complete theme to be one of the designed states (the top package)', () => {
    expect(problems({ ...base, validStates: [base.validStates[0]] })).toContain(
      'validStates must include the complete theme (all features and fields) as the top package',
    );
  });

  it('rejects states that use undeclared features/fields or break feature dependencies', () => {
    const bad = {
      ...base,
      validStates: [...base.validStates, { features: ['congratulations'], fields: ['person_1_name', 'event_date'] }],
    };
    expect(problems(bad)).toContain('validStates[2]: congratulations requires feature rsvp');
    expect(problems({ ...base, validStates: [...base.validStates, { features: ['countdown'], fields: ['person_1_name'] }] })).toContain(
      'validStates[2] uses undeclared feature countdown',
    );
  });

  it('requires print companions for print features and rejects bad keys', () => {
    expect(problems({ ...base, features: [...base.features, 'print_card'], validStates: [{ features: [...base.features, 'print_card'], fields: base.fields }] })).toContain(
      'print_card requires print.card',
    );
    expect(problems({ ...base, key: 'Rose Garden' }).length).toBeGreaterThan(0);
    expect(problems({ ...base, fields: [...base.fields, 'not_a_field'] }).length).toBeGreaterThan(0);
  });

  it('matches package shapes exactly, ignoring order', () => {
    expect(matchesValidState(base, ['music'], ['event_date', 'person_2_name', 'person_1_name'])).toBe(true);
    expect(matchesValidState(base, ['music', 'map'], ['person_1_name', 'person_2_name', 'event_date'])).toBe(false);
    expect(matchesValidState(base, ['music'], ['person_1_name', 'event_date'])).toBe(false);
  });

  it('reports feature dependencies', () => {
    expect(featureDependencyProblems(['keepsake_pdf'], [])).toEqual(['keepsake_pdf requires feature congratulations']);
    expect(featureDependencyProblems(['map'], [])).toEqual(['map requires field venue_map_url']);
  });
});
