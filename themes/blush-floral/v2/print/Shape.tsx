import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import artEn from '../assets/poster-en.webp';
import artLocal from '../assets/poster-local.webp';
import paper from '../assets/paper.svg';
import rosette from '../assets/rosette.svg';
import { Lettering } from './Lettering';
import { Words } from './Words';
import p from './print.module.css';

/** The poster in the printed posters' size (manifest `print.shapes`): the scene drawn taller (460.817 units), the lettering moved down with it. */
const W = 297.75;
const H = 460.817;
const DY = 20.784;

/**
 * The printed poster (feature `card_arch`), the same size as the other designs' posters. Front: the finished poster
 * with the customer's lines, as on the invitation. Back: the paper with the rosettes, and one centred column with the customer's
 * words and the QR code.
 */
export default function Shape(props: PrintShapeProps) {
  const { side, locale, dir, lang } = props;
  return (
    <div className={`${fonts.fonts} ${p.shape}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {side === 'front' ? (
        <svg className={p.fill} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <image href={paper.src} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
          <image href={(locale === 'en' ? artEn : artLocal).src} y={DY} width={W} height={419.25} />
          <g transform={`translate(0 ${DY})`}>
            <Lettering {...props} />
          </g>
        </svg>
      ) : (
        <>
          {/* eslint-disable @next/next/no-img-element -- print artwork */}
          {(['tl', 'tr', 'bl', 'br'] as const).map((at) => (
            <img key={at} className={`${p.corner} ${p[at]}`} src={rosette.src} alt="" />
          ))}
          {/* eslint-enable @next/next/no-img-element */}
          <div className={p.posterColumn}>
            <Words {...props} />
          </div>
        </>
      )}
    </div>
  );
}
