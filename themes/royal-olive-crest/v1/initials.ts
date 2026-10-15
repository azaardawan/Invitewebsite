import { splitInitials } from '@/theme-sdk';

/**
 * The letters pressed into the wax seal: the groom's and the bride's, joined by the symbol the customer chose.
 * Each comes from the customer's own box (`seal_initials`, two boxes) or, when that box is empty, the first letter of
 * that person's name, in the script it was typed in (Arabic names give Arabic letters). A value typed before the
 * field had two boxes is printed as it was typed.
 */
export type SealText = { first: string; join: string | null; second: string | null } | { custom: string };

function firstLetter(name: string | undefined): string | null {
  const letter = Array.from((name ?? '').trim())[0];
  return letter ? letter.toLocaleUpperCase() : null;
}

export function sealText(fields: Partial<Record<string, string>>, join: string): SealText | null {
  const own = splitInitials(fields.seal_initials?.trim());
  if (own.whole) return { custom: own.first };
  const first = own.first.trim() || firstLetter(fields.person_1_name);
  const second = own.second.trim() || firstLetter(fields.person_2_name);
  if (!first) return second ? { first: second, join: null, second: null } : null;
  return { first, join: second ? join : null, second };
}

