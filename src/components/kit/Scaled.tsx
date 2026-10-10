'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import styles from './kit.module.css';

/** Shows a fixed-size unit scaled down to fit (at most `maxWidth` px, never wider than its column). */
export function Scaled({
  width,
  height,
  maxWidth,
  round,
  overlay,
  children,
}: {
  width: number;
  height: number;
  maxWidth: number;
  round?: boolean;
  /** Drawn over the scaled unit (e.g. the platform's preview watermark). */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(Math.min(1, maxWidth / width));
  useLayoutEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const update = () => setScale(Math.min(1, maxWidth / width, el.clientWidth / width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, maxWidth]);
  return (
    <div ref={ref} className={`${styles.scaled} ${styles.shadow}`} style={{ width: width * scale, height: height * scale, borderRadius: round ? '50%' : undefined }}>
      <div className={styles.scaledInner} style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
      {overlay}
    </div>
  );
}
