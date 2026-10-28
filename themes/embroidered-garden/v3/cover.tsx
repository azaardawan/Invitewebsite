import Image from 'next/image';
import backPaper from './assets/back-paper.webp';
import cornerTl from './assets/back-corner-tl.webp';
import cornerTr from './assets/back-corner-tr.webp';
import cornerBl from './assets/back-corner-bl.webp';
import cornerBr from './assets/back-corner-br.webp';
import s from './invitation.module.css';

/** The cover: the design's own artwork around the baby's name; each piece parts its own way when the invitation opens. */
export function CoverArt() {
  return (
    <>
      <Image src={backPaper} alt="" aria-hidden fill unoptimized priority sizes="100vw" className={s.coverPaper} />
      <Image src={cornerTl} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.cTL} ${s.corner} ${s.tl}`} />
      <Image src={cornerTr} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.cTR} ${s.corner} ${s.tr}`} />
      <Image src={cornerBl} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.cBL} ${s.corner} ${s.bl}`} />
      <Image src={cornerBr} alt="" aria-hidden unoptimized priority className={`${s.piece} ${s.cBR} ${s.corner} ${s.br}`} />
    </>
  );
}
