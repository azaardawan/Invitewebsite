import { splitInitials } from '@/theme-sdk';

// Copied from Royal Olive Crest (the same two boxes, the same fallback to the names), plus the Arabic initial form.

/**
 * The letters pressed into the wax seal: the groom's and the bride's, joined by the symbol the customer chose.
 * Each comes from the customer's own box (`seal_initials`, two boxes) or, when that box is empty, the first letter of
 * that person's name, in the script it was typed in (Arabic names give Arabic letters). A value typed before the
 * field had two boxes is printed as it was typed.
 */
export type SealText = { first: string; join: string | null; second: string | null } | { custom: string };

/** Arabic-script letters that never join the next letter (their initial form is the isolated one). */
const NON_JOINING = 'اأإآٱدذرزژڕوؤۆۇۈۋەة';
const ARABIC = /[\u0620-\u064A\u066E-\u06D3\u06D5\u06EE-\u06FF]/;

/**
 * A single Arabic-script letter is pressed in its initial form («هـ», «عـ»), as monograms are written: alone, «ه»
 * would read as the digit «٥». A zero-width joiner asks the font for that form; letters that never join stay as they are.
 */
function monogramForm(letter: string): string {
  return Array.from(letter).length === 1 && ARABIC.test(letter) && !NON_JOINING.includes(letter) ? `${letter}\u200D` : letter;
}

function firstLetter(name: string | undefined): string | null {
  const letter = Array.from((name ?? '').trim())[0];
  return letter ? letter.toLocaleUpperCase() : null;
}

export function sealText(fields: Partial<Record<string, string>>, join: string): SealText | null {
  const own = splitInitials(fields.seal_initials?.trim());
  if (own.whole) return { custom: own.first };
  const first = monogramForm(own.first.trim() || firstLetter(fields.person_1_name) || '');
  const second = monogramForm(own.second.trim() || firstLetter(fields.person_2_name) || '');
  if (!first) return second ? { first: second, join: null, second: null } : null;
  return { first, join: second ? join : null, second: second || null };
}

