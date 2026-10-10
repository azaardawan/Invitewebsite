import type { CSSProperties } from 'react';
import type { KitProps } from '@/theme-sdk/types';
import { KitHost } from '@/theme-registry/kits.generated';
import styles from './kit.module.css';

/**
 * One kit unit at its exact size (CSS px, bleed included). The frame is a
 * size container, so the theme lays out in `cqw`/`cqh` and looks the same in
 * the preview, the PDF and the PNG.
 */
export function KitUnit({ codeRef, props, clip }: { codeRef: string; props: KitProps; clip: 'bleed' | 'trim' }) {
  const g = props.size;
  const style = {
    width: g.width,
    height: g.height,
    '--kit-bleed': `${g.bleed}px`,
    '--kit-safe': `${g.safe}px`,
    '--kit-overlap': `${g.overlap}px`,
  } as CSSProperties;
  const circle = g.shape === 'circle' ? (clip === 'trim' ? styles.circleTrim : styles.circleBleed) : '';
  return (
    <div className={`${styles.unit} ${circle}`} style={style} data-kit-unit={props.unit} data-bahja-theme={codeRef} lang={props.lang} dir={props.dir}>
      <KitHost codeRef={codeRef} {...props} />
    </div>
  );
}
