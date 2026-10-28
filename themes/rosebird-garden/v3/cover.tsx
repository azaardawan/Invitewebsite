import Image from 'next/image';
import paper from './assets/paper.webp';
import flowersLeft from './assets/flowers-left.webp';
import flowersRight from './assets/flowers-right.webp';
import birdLeft from './assets/bird-left.webp';
import birdRight from './assets/bird-right.webp';
import s from './invitation.module.css';

/** The cover: the design's own artwork around the baby's name; each piece parts its own way when the invitation opens. */
export function CoverArt() {
  return (
    <>
      <Image src={paper} alt="" aria-hidden fill unoptimized priority sizes="100vw" className={s.coverPaper} />
      <Image src={flowersLeft} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.partL} ${s.sway} ${s.flowersL}`} />
      <Image src={flowersRight} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.partR} ${s.sway} ${s.flowersR}`} />
      <Image src={birdLeft} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.flyL} ${s.bob} ${s.birdL}`} />
      <Image src={birdRight} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.flyR} ${s.bob} ${s.birdR}`} />
    </>
  );
}
