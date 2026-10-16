import type { ReactNode } from 'react';
import envelope from '../assets/envelope.webp';
import seal from '../assets/wax-seal.webp';
import p from './print.module.css';

/** The poster's sealed envelope and the couple's names on its red strips (children: anything else on the poster). */
export function PosterLayers({ n1, n2, children }: { n1?: string; n2?: string; children?: ReactNode }) {
  return (
    <>
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
