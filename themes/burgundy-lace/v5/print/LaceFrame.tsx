import { ThemeBorder, type ThemeBorderSpec } from '@/theme-sdk';
import { LACE_BORDER } from '../border';
import corner from '../assets/lace-corner.webp';
import p from './print.module.css';

/**
 * The lace frame on paper: the platform's border (top-right and bottom-left corners) plus, with the theme's own
 * artwork, the other two corners and the thin double rails that join them, as on the envelope screen.
 */
export function LaceFrame({ border }: { border: ThemeBorderSpec | null }) {
  return (
    <>
      <ThemeBorder border={border} fallback={LACE_BORDER} medium="print" />
      {border ? null : (
        <div className={p.frame} aria-hidden="true">
          <span className={p.rails} />
          <span className={p.railsInner} />
          {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
          <img className={p.cornerTl} src={corner.src} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
          <img className={p.cornerBr} src={corner.src} alt="" />
        </div>
      )}
    </>
  );
}
