/**
 * Example names for theme previews and samples. Each design takes its own names from these lists by its
 * permanent number (themes/numbers.json), so the storefront doesn't show the same name on every design.
 * The lists live in the messages (`invitationSamples.names`, names separated by `|`), in the same order in every language.
 */
export type SampleNameLists = Record<'boy' | 'boyLong' | 'girl' | 'girlLong' | 'man' | 'manLong' | 'woman' | 'womanLong', string>;

export function sampleNames(lists: SampleNameLists, opts: { seed?: number; variant: 'short' | 'long'; babyGender: 'boy' | 'girl' }) {
  const n = Math.max(0, opts.seed ?? 0);
  const pick = (list: 'boy' | 'girl' | 'man' | 'woman', offset = 0) => {
    const names = lists[opts.variant === 'long' ? (`${list}Long` as const) : list].split('|');
    return names[(n + offset) % names.length]!;
  };
  return {
    baby_name: pick(opts.babyGender),
    person_1_name: pick('man'),
    person_2_name: pick('woman'),
    // The parents are not the couple's names, so a design never shows the same name twice.
    father_name: pick('man', 7),
    mother_name: pick('woman', 7),
  };
}
