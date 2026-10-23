/**
 * A name on one of the poster's red strips (or both names on the envelope letter) stays on one line: past `fits`
 * letters it shrinks in proportion.
 * Returns a factor (in em) for the name's font size.
 */
export function stripScale(name: string | undefined, fits = 12): number {
  const n = Array.from(name?.trim() ?? '').length;
  return n <= fits ? 1 : Math.max(0.45, fits / n);
}
