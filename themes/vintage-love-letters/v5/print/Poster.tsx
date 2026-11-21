import type { ReactNode } from 'react';
import envelope from '../assets/envelope.webp';
import seal from '../assets/wax-seal.webp';
import p from './print.module.css';

/**
 * The poster's sealed envelope and the couple's names on its red strips (children: anything else on the poster).
 * `band`: a word lettered over the poster's «WEDDING» band (an engagement), or null.
 */
export function PosterLayers({ n1, n2, band, children }: { n1?: string; n2?: string; band?: string | null; children?: ReactNode }) {
  return (
    <>
      {band ? <p className={p.band}>{band}</p> : null}
      <div className={p.envelope} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
        <img src={envelope.src} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
        <img className={p.seal} src={seal.src} alt="" />
      </div>
      {n1 ? <p className={`${p.strip} ${p.stripOne}`}>{n1}</p> : null}
      {n2 ? <p className={`${p.strip} ${p.stripTwo}`}>{n2}</p> : null}
      {children}
    </>
  );
}
