import { PIECE_INK } from './motion';

const ARABIC = /[؀-ۿ]/;
export const SVG_X = 148.875;

/** One line of the poster's lettering: centred, shrunk to fit its width, in the design's script or serif (Arabic and Kurdish:
 * Aref Ruqaa for the script lines, Noto Naskh for the others; never spaced out, which would break the letters apart). */
export function PosterLine({
  text,
  y,
  size,
  max,
  kind,
  track = 0,
}: {
  text: string;
  y: number;
  size: number;
  max: number;
  kind: 'script' | 'serif';
  track?: number;
}) {
  const arabic = ARABIC.test(text);
  const n = Math.max(1, Array.from(text).length);
  const em = arabic ? (kind === 'script' ? 0.48 : 0.5) : kind === 'script' ? 0.44 : 0.66 + track / size;
  const fitted = Math.min(arabic ? size * (kind === 'script' ? 0.9 : 1.25) : size, max / (n * em));
  return (
    <text
      x={SVG_X}
      y={y}
      textAnchor="middle"
      fill={PIECE_INK}
      fontSize={fitted}
      fontFamily={
        arabic ? (kind === 'script' ? "'PR Ruqaa', serif" : "'PR Arabic', serif") : kind === 'script' ? "'PR Script', serif" : "'PR Serif', Georgia, serif"
      }
      fontWeight={arabic && kind === 'serif' ? 600 : undefined}
      letterSpacing={arabic ? 0 : track}
      direction={arabic ? 'rtl' : 'ltr'}
    >
      {kind === 'serif' && !arabic ? text.toUpperCase() : text}
    </text>
  );
}

/** The poster's date line, as the designer's «SUN | 07 | 7 PM» (or «Save the date» without a day). */
export function posterDetails(date: { weekday: string; day: string; month: string } | null, time: string | null, soon: string) {
  return date ? [date.weekday, `${date.day} ${date.month}`, time].filter(Boolean).join('  |  ') : soon;
}
