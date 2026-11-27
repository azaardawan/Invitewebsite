import type { CSSProperties } from 'react';
import { ThemeBorder, formatNumber, type InvitationLocale, type ThemeBorderSpec } from '@/theme-sdk';
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

/**
 * The QR codes at the bottom of a card's back: the invitation's, and the guests' photo QR beside it when the customer
 * bought guest photo sharing (one or two codes).
 */
export function QrCodes({
  qr,
  photoQr,
  labels,
  className = '',
}: {
  qr: string | null;
  photoQr: string | null;
  labels: { scanToOpen: string; scanToSharePhotos: string };
  className?: string;
}) {
  const codes = [
    qr ? { src: qr, caption: labels.scanToOpen } : null,
    photoQr ? { src: photoQr, caption: labels.scanToSharePhotos } : null,
  ].filter((c) => c !== null);
  if (!codes.length) return null;
  return (
    <div className={`${p.qrs} ${className}`} data-count={codes.length}>
      {codes.map((c) => (
        <figure key={c.caption} className={p.qr}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
          <img src={c.src} alt="" width={64} height={64} />
          <figcaption>{c.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/** The wedding date as on the owner's card, "17.07.2026" (in the invitation's digits), or null. */
export function numericDate(value: string | undefined, locale: InvitationLocale): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!m) return null;
  const two = (n: string) => formatNumber(Number(n), locale).padStart(2, formatNumber(0, locale));
  return [two(m[3]!), two(m[2]!), formatNumber(Number(m[1]), locale).replace(/[٬,.\s]/g, '')].join('.');
}
