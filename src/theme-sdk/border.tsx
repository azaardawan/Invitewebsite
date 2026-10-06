/**
 * One border per theme, shared by the invitation, the printable card and every
 * keepsake page so all three look like one set. The theme passes its own
 * artwork as `fallback`; the owner can replace it in Admin (then `border` is
 * set). No hooks: usable in client themes and server print companions.
 */

/**
 * - `strips`: the image repeats down the left and right edges (heritage bands, lace…).
 * - `corners`: the image is the top-right corner ornament; it is also placed, turned
 *   180°, in the bottom-left corner (branches, flourishes…).
 * Artwork is physical left/right: it never mirrors between Arabic and English.
 */
export type BorderKind = 'strips' | 'corners';

export type ThemeBorderSpec = {
  kind: BorderKind;
  src: string;
  /** Strip width, or corner ornament width, in px on a 390 px phone screen. Print uses 0.25 mm per px. */
  size: number;
  /** Gap between the page edge and the border, in the same units (default: a sixth of `size`). */
  inset?: number;
};

const MM_PER_PX = 0.25;

export function ThemeBorder({ border, fallback, medium }: { border: ThemeBorderSpec | null; fallback: ThemeBorderSpec; medium: 'screen' | 'print' }) {
  const b = border ?? fallback;
  const unit = (px: number) => (medium === 'print' ? `${px * MM_PER_PX}mm` : `${px}px`);
  const size = unit(b.size);
  const inset = unit(b.inset ?? Math.round(b.size / 6));
  // Print: `fixed` repeats the border on every printed page (card, keepsake cover and message pages).
  const frame = { position: medium === 'print' ? 'fixed' : 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 } as const;
  return (
    <div data-bahja-border={b.kind} aria-hidden="true" style={frame}>
      {b.kind === 'strips' ? (
        (['left', 'right'] as const).map((side) => (
          <span
            key={side}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              [side]: inset,
              width: size,
              backgroundImage: `url("${b.src}")`,
              backgroundSize: '100% auto',
              backgroundRepeat: 'repeat-y',
              backgroundPosition: 'top center',
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact',
            }}
          />
        ))
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork, also used in print */}
          <img src={b.src} alt="" style={{ position: 'absolute', top: inset, right: inset, width: size, height: 'auto' }} />
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork, also used in print */}
          <img src={b.src} alt="" style={{ position: 'absolute', bottom: inset, left: inset, width: size, height: 'auto', transform: 'rotate(180deg)' }} />
        </>
      )}
    </div>
  );
}
