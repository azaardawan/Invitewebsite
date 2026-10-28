import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import art from '../assets/poster-tall.webp';
import backArt from '../assets/poster-tall-back.webp';
import { Lettering } from './Lettering';
import { Words } from './Words';
import p from './print.module.css';

/** The poster in the printed posters' size (manifest `print.shapes`): the scene drawn taller (460.817 units), the lettering moved down with it. */
const W = 297.75;
const H = 460.817;
const DY = 20.784;

/**
 * The printed poster (feature `card_arch`), the same size as the other designs' posters. Front: the finished poster
 * with the customer's lines, as on the invitation. Back: the frame alone, and one centred column with the customer's
 * words and the QR code.
 */
export default function Shape(props: PrintShapeProps) {
  const { side, locale, dir, lang } = props;
  return (
    <div className={`${fonts.fonts} ${p.shape}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {side === 'front' ? (
        <svg className={p.fill} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <image href={art.src} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
          <g transform={`translate(0 ${DY})`}>
            <Lettering {...props} />
          </g>
        </svg>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
          <img className={p.fill} src={backArt.src} alt="" />
          <div className={p.posterColumn}>
            <Words {...props} />
          </div>
        </>
      )}
    </div>
  );
}
