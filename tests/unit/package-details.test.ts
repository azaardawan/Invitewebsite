import { describe, expect, it } from 'vitest';
import { packageDetailLines } from '@/lib/package-details';

const words = { pair: (a: string, b: string) => `${a} & ${b}`, when: 'Date and time' };
const fields = [
  { key: 'person_1_name', label: "Groom's name" },
  { key: 'person_2_name', label: "Bride's name" },
  { key: 'seal_initials', label: 'Initials on the seal' },
  { key: 'event_date', label: 'Event date' },
  { key: 'event_time', label: 'Event time' },
  { key: 'venue_name', label: 'Venue name' },
  { key: 'invitation_message', label: 'Invitation message' },
];

describe('packageDetailLines', () => {
  it('lists the package fields in order, the two names and the date and time as one line each', () => {
    expect(packageDetailLines(fields, ['invitation_message', 'event_time', 'event_date', 'person_2_name', 'person_1_name', 'venue_name'], words)).toEqual([
      "Groom's name & Bride's name",
      'Date and time',
      'Venue name',
      'Invitation message',
    ]);
  });

  it('keeps a lone half of a pair as its own line', () => {
    expect(packageDetailLines(fields, ['person_1_name', 'event_date', 'seal_initials'], words)).toEqual(["Groom's name", 'Initials on the seal', 'Event date']);
  });

  it('is empty for a package without fields', () => {
    expect(packageDetailLines(fields, [], words)).toEqual([]);
  });
});
