import cornerTop from './assets/corner-top.webp';
import cornerBottom from './assets/corner-bottom.webp';
import f from './frame.module.css';

/**
 * The owner's page frame: a double bronze line with notched (concave) corners, and an olive sprig in each corner.
 * `skip` leaves out the sprigs the theme border already draws on that page (top-right and bottom-left).
 */
export function Frame({ skipBorderCorners = false }: { skipBorderCorners?: boolean }) {
  return (
    <div className={f.frame} aria-hidden="true">
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
        <svg key={c} className={`${f.corner} ${f[c]}`} viewBox="0 0 30 30" width="30" height="30">
          {/* outer line: a quarter circle cut into the corner; inner line: a wider arc 3 px further in */}
          <path d="M30 0.5 H22 A21.5 21.5 0 0 1 0.5 22 V30" />
          <path d="M30 3.5 H25.6 A22.1 22.1 0 0 1 3.5 25.6 V30" />
        </svg>
      ))}
      {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
        <span key={side} className={`${f.line} ${f[side]}`} />
      ))}
      {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
        <span key={`${side}-in`} className={`${f.line} ${f.inner} ${f[side]}`} />
      ))}
      {/* eslint-disable @next/next/no-img-element -- decorative artwork */}
      <img className={`${f.sprig} ${f.sprigTl}`} src={cornerTop.src} alt="" />
      {skipBorderCorners ? null : <img className={`${f.sprig} ${f.sprigTr}`} src={cornerTop.src} alt="" />}
      {skipBorderCorners ? null : <img className={`${f.sprig} ${f.sprigBl}`} src={cornerBottom.src} alt="" />}
      <img className={`${f.sprig} ${f.sprigBr}`} src={cornerBottom.src} alt="" />
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}
