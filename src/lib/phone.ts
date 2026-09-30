/** Converts Arabic-Indic / Persian digits to ASCII. */
export function toAsciiDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/**
 * Normalizes a mobile/WhatsApp number to E.164. Accepts Iraqi local forms
 * (07XX…, 7XX…, 00964…, +964…) and international numbers (diaspora customers).
 * Returns null if it can't be a valid number.
 */
export function normalizePhone(input: string): string | null {
  let s = toAsciiDigits(input).replace(/[\s\-().]/g, '');
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (/^07\d{9}$/.test(s)) s = `+964${s.slice(1)}`;
  else if (/^7\d{9}$/.test(s)) s = `+964${s}`;
  else if (/^9647\d{9}$/.test(s)) s = `+${s}`;
  if (!/^\+[1-9]\d{7,14}$/.test(s)) return null;
  if (s.startsWith('+964') && !/^\+9647\d{9}$/.test(s)) return null; // Iraqi mobiles only
  return s;
}
