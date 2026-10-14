/**
 * The letters pressed into the wax seal. The customer's own `seal_initials` win; otherwise the first
 * letter of each name, the first name (the groom) first, joined by the symbol they chose. Letters keep
 * the script the names were typed in (Arabic names give Arabic letters).
 */
export type SealText = { first: string; join: string | null; second: string | null } | { custom: string };

function firstLetter(name: string | undefined): string | null {
  const letter = Array.from((name ?? '').trim())[0];
  return letter ? letter.toLocaleUpperCase() : null;
}

export function sealText(fields: Partial<Record<string, string>>, join: string): SealText | null {
  const custom = fields.seal_initials?.trim();
  if (custom) return { custom };
  const first = firstLetter(fields.person_1_name);
  const second = firstLetter(fields.person_2_name);
  if (!first) return second ? { first: second, join: null, second: null } : null;
  return { first, join: second ? join : null, second };
}

/** Letters on the seal, counted for sizing (the joining symbol counts as one). */
export function sealLength(t: SealText): number {
  return 'custom' in t ? Array.from(t.custom).length : 1 + (t.second ? 2 : 0);
}
