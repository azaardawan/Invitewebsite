/**
 * The details a package asks for, as lines for the package checklist on the theme page ("The groom's name and the
 * bride's name", "Date and time", "Venue name"…), so every package shows what the customer gets to put on it, not
 * only its paid features.
 *
 * Fields come in the theme's order with their resolved labels. Two names that belong together read as one line,
 * and the date and time as one line.
 */
const PAIRS: readonly (readonly [string, string])[] = [
  ['person_1_name', 'person_2_name'],
  ['person_1_family', 'person_2_family'],
  ['mother_name', 'father_name'],
];
const WHEN = ['event_date', 'event_time'] as const;

export function packageDetailLines(
  fields: readonly { key: string; label: string }[],
  fieldKeys: readonly string[],
  words: { pair: (a: string, b: string) => string; when: string },
): string[] {
  const own = fields.filter((f) => fieldKeys.includes(f.key));
  const label = new Map(own.map((f) => [f.key, f.label]));
  const done = new Set<string>();
  const lines: string[] = [];
  for (const f of own) {
    if (done.has(f.key)) continue;
    const pair = PAIRS.find((p) => p.includes(f.key) && p.every((k) => label.has(k)));
    if (pair) {
      lines.push(words.pair(label.get(pair[0])!, label.get(pair[1])!));
      pair.forEach((k) => done.add(k));
    } else if ((WHEN as readonly string[]).includes(f.key) && WHEN.every((k) => label.has(k))) {
      lines.push(words.when);
      WHEN.forEach((k) => done.add(k));
    } else {
      lines.push(f.label);
      done.add(f.key);
    }
  }
  return lines;
}
