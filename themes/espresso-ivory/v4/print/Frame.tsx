import { ThemeBorder, type ThemeBorderSpec } from '@/theme-sdk';
import { GOLD_BORDER } from '../border';
import p from './print.module.css';

/**
 * The fine double gold frame on paper: the platform's border draws the side rules; with the theme's own border the
 * theme adds the matching top and bottom rules, as on the envelope screen.
 */
export function GoldFrame({ border }: { border: ThemeBorderSpec | null }) {
  return (
    <>
      <ThemeBorder border={border} fallback={GOLD_BORDER} medium="print" />
      {border ? null : (
        <div className={p.frame} aria-hidden="true">
          <span className={p.rules} />
          <span className={p.rulesInner} />
        </div>
      )}
    </>
  );
}
