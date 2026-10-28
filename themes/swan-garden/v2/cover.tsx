import Image from 'next/image';
import linen from './assets/linen.webp';
import water from './assets/water.webp';
import swanBow from './assets/swan-bow.webp';
import flowersLeft from './assets/flowers-left.webp';
import flowersRight from './assets/flowers-right.webp';
import bellsA from './assets/bells-a.webp';
import bellsB from './assets/bells-b.webp';
import s from './invitation.module.css';

/** The cover: the design's own artwork around the baby's name; each piece parts its own way when the invitation opens. */
export function CoverArt() {
  return (
    <>
      <Image src={linen} alt="" aria-hidden fill unoptimized priority sizes="100vw" className={s.coverPaper} />
      <Image src={water} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.sink} ${s.water}`} />
      <Image src={flowersLeft} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.partL} ${s.sway} ${s.flowersL}`} />
      <Image src={flowersRight} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.partR} ${s.sway} ${s.flowersR}`} />
      <Image src={swanBow} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.sink} ${s.bob} ${s.swan}`} />
      <Image src={bellsA} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.flyL} ${s.sway} ${s.bellsA}`} />
      <Image src={bellsB} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.flyR} ${s.sway} ${s.bellsB}`} />
    </>
  );
}
