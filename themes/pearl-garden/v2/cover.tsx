import Image from 'next/image';
import linen from './assets/linen.webp';
import garlandFlat from './assets/garland-flat.webp';
import branchLeft from './assets/branch-left.webp';
import branchRight from './assets/branch-right.webp';
import bird from './assets/bird.webp';
import s from './invitation.module.css';

/** The cover: the design's own artwork around the baby's name; each piece parts its own way when the invitation opens. */
export function CoverArt() {
  return (
    <>
      <Image src={linen} alt="" aria-hidden fill unoptimized priority sizes="100vw" className={s.coverPaper} />
      <Image src={garlandFlat} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.rise} ${s.flatTop}`} />
      <Image src={branchLeft} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.partL} ${s.sway} ${s.branchL}`} />
      <Image src={branchRight} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.partR} ${s.sway} ${s.branchR}`} />
      <Image src={bird} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.flyR} ${s.bob} ${s.bird}`} />
      <Image src={garlandFlat} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.sink} ${s.flatBottom}`} />
    </>
  );
}
