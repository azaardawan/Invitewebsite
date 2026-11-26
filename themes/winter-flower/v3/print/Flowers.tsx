import left from '../assets/flowers-left.webp';
import right from '../assets/flowers-right.webp';
import p from './print.module.css';

/** The two flower stems of the source invitation: upper left and lower right. */
export function Flowers() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.flowerTop} src={left.src} alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.flowerBottom} src={right.src} alt="" />
    </>
  );
}
