import type { Copy } from './copy';
import type { LineBox, LineKey } from './motion';

const ARABIC = /[؀-ۿ]/;
export const SVG_X = 148.875;

/** One line of the poster: the designer's serif, in capitals (or italic lower case), tracked. */
export type LineSpec = {
  text: string;
  y: number;
  size: number;
  max: number;
  fill: string;
  track: number;
  italic?: boolean;
  opacity?: number;
  script?: boolean;
};

/** How large a line is drawn: shrunk to fit its width (an estimate per script, as the poster is drawn before fonts load). */
export function fit({ text, size, max, track, italic, script }: LineSpec) {
  const arabic = ARABIC.test(text);
  const n = Math.max(1, Array.from(text).length);
  const em = arabic ? (script ? 0.48 : 0.5) : (italic ? 0.46 : 0.72) + track / size;
  return { arabic, size: Math.min(arabic ? size * (script ? 1 : 1.2) : size, max / (n * em)) };
}

/**
 * One of the invitation's lines on the poster, behind the wipe that writes it (motion.ts moves `wipe-<key>`). Arabic and
 * Kurdish: Aref Ruqaa for the greeting and the name, Noto Naskh for the others; never spaced out (it would break the
 * letters apart). `still`: the printed card's, written already (no wipe).
 */
export function PosterLine({ p, k, spec, still }: { p: string; k: LineKey; spec: LineSpec; still?: boolean }) {
  const { arabic, size } = fit(spec);
  return (
    <>
      {still ? null : (
        <defs>
          <clipPath id={`${p}clip-${k}`} clipPathUnits="userSpaceOnUse">
            <rect id={`${p}wipe-${k}`} x={0} y={0} width={0} height={0} />
          </clipPath>
        </defs>
      )}
      <text
        x={SVG_X}
        y={spec.y}
        textAnchor="middle"
        fill={spec.fill}
        fillOpacity={spec.opacity}
        fontSize={size}
        fontFamily={arabic ? (spec.script ? "'BF Ruqaa', serif" : "'BF Arabic', serif") : "'BF Serif', Georgia, serif"}
        fontWeight={arabic && !spec.script ? 600 : undefined}
        fontStyle={spec.italic && !arabic ? 'italic' : undefined}
        letterSpacing={arabic ? 0 : spec.track}
        direction={arabic ? 'rtl' : 'ltr'}
        clipPath={still ? undefined : `url(#${p}clip-${k})`}
      >
        {spec.italic || arabic ? spec.text : spec.text.toUpperCase()}
      </text>
    </>
  );
}

/** The wipe's box for a line: around its baseline, as wide as the line may be, in its reading direction. */
export const lineBox = (spec: LineSpec): LineBox => {
  const { arabic, size } = fit(spec);
  return { y: spec.y, height: size * 1.2, max: spec.max, rtl: arabic };
};

/**
 * The poster's lettering (positions from the designer's artwork, in poster units). English: «You are invited to /
 * ROSIE’S / Birthday (drawn) / PARTY». Arabic and Kurdish read as one sentence: «يسعدنا دعوتكم إلى / حفلة عيد ميلاد /
 * {name}», the greeting in place of the drawn «Birthday» and the name under it.
 */
export function posterLines(t: Copy, name: string, details: string, venue: string, local: boolean): Record<LineKey, LineSpec> {
  return {
    eyebrow: { text: t.posterEyebrow, y: 21, size: 8.4, max: 170, fill: '#bc7630', track: 3, italic: true },
    name: { text: name ? t.posterName.replace('{name}', name) : '', y: 35.7, size: 9.4, max: 160, fill: '#bc7630', track: 1.6, opacity: 0.8 },
    title: { text: local ? t.posterTitle : '', y: 329, size: 46, max: 240, fill: '#bc7630', track: 0, script: true },
    party: local
      ? { text: t.posterParty.replace('{name}', name), y: 361, size: 18, max: 200, fill: '#bc7630', track: 1.2, script: true }
      : { text: t.posterParty, y: 345.4, size: 12, max: 140, fill: '#bc7630', track: 4.5, opacity: 0.8 },
    // Arabic and Kurdish lines are taller: the date and the place go a little lower, under the name.
    details: { text: details, y: local ? 384 : 377.6, size: 12.5, max: 220, fill: '#be2026', track: 1.4 },
    address: { text: venue, y: local ? 399 : 385.6, size: 6.6, max: 180, fill: '#be2026', track: 1.6, italic: true },
  };
}

/** The poster's date line, as the designer's «SUN | 07 | 7 PM» (or «Save the date» without a day). */
export function posterDetails(date: { weekday: string; day: string } | null, time: string | null, soon: string) {
  return date ? [date.weekday, date.day, time].filter(Boolean).join('  |  ') : soon;
}
