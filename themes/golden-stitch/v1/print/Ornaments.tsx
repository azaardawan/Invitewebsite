import type { CSSProperties } from 'react';
import { ThemeBorder, type ThemeBorderSpec } from '@/theme-sdk';
import { STITCH_BORDER } from '../border';
import { Frame } from '../Frame';
import divider from '../assets/divider.svg';
import star from '../assets/star.svg';
import p from './print.module.css';

/** ThemeBorder's print scale (0.25 mm per screen px). */
const BORDER_MM_PER_PX = 0.25;

/**
 * The online pages' frame on paper: the double bronze line with notched corners and the four sprigs, scaled so one
 * screen px is `unitMm`. `insetMm` places the screen page's edge (the frame sits 11 units inside it). The theme border
 * (top-right and bottom-left sprigs) is drawn in a scaled box of its own, so it lines up with the frame and stays on
 * this page only.
 */
export function PrintFrame({ unitMm, insetMm, border }: { unitMm: number; insetMm: number; border: ThemeBorderSpec | null }) {
  const k = unitMm / BORDER_MM_PER_PX;
  const box = { inset: `${insetMm}mm`, ['--gs-u' as string]: `${unitMm}mm` } as CSSProperties;
  return (
    <div className={p.frameBox} style={box} aria-hidden="true">
      <Frame skipBorderCorners />
      <div className={p.borderBox} style={{ width: `${100 / k}%`, height: `${100 / k}%`, transform: `scale(${k})` }}>
        <ThemeBorder border={border} fallback={STITCH_BORDER} medium="print" />
      </div>
    </div>
  );
}

/** The starburst divider (`star`: only its middle star), in the design's bronze. */
export function PrintDivider({ star: onlyStar = false, className = '' }: { star?: boolean; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- print document
  return <img className={`${onlyStar ? p.star : p.divider} ${className}`} src={onlyStar ? star.src : divider.src} alt="" aria-hidden="true" />;
}

/** A long name steps down so it stays whole on the card (names can be up to 30 letters). */
export function nameScale(name: string | undefined): number {
  const n = Array.from(name?.trim() ?? '').length;
  return n <= 9 ? 1 : n <= 12 ? 0.86 : n <= 16 ? 0.74 : n <= 22 ? 0.62 : 0.52;
}

/** The couple's names stacked, with the "and" on its own line, as on the owner's cards. */
export function StackedNames({ one, two, and, className }: { one?: string; two?: string; and: string; className?: string }) {
  return (
    <h1 className={className}>
      {one ? <span style={{ fontSize: `${nameScale(one)}em` }}>{one}</span> : null}
      {one && two ? <span className={p.and}>{and}</span> : null}
      {two ? <span style={{ fontSize: `${nameScale(two)}em` }}>{two}</span> : null}
    </h1>
  );
}
