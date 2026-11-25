import type { PrintCardProps } from '@/theme-sdk';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import laurelLeft from '../assets/card-laurel-left.webp';
import laurelRight from '../assets/card-laurel-right.webp';
import sprig from '../assets/card-sprig.webp';
import { PrintDivider, PrintFrame, StackedNames } from './Ornaments';
import p from './print.module.css';

/**
 * Printable card, A5 portrait (154 × 216 mm with bleed), as the owner drew it: the bronze frame and sprigs, a star,
 * two laurel arcs around "The Wedding of", the names stacked, the divider, the date and a sprig. The QR code is on
 * the back (the front has no room for it). The invitation's paragraph is never printed on a card (owner rule).
 */
export default function Card({ locale, dir, lang, fields, event, labels, extraLine, border }: PrintCardProps) {
  const t = copyFor(locale);
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang}>
      <PrintFrame unitMm={0.4} insetMm={6.6} border={border} />
      <div className={p.cardSafe}>
        <PrintDivider star className={p.cardStar} />
        <div className={p.laurels}>
          {/* eslint-disable @next/next/no-img-element -- print document */}
          <img className={p.laurelLeft} src={laurelLeft.src} alt="" />
          <img className={p.laurelRight} src={laurelRight.src} alt="" />
          {/* eslint-enable @next/next/no-img-element */}
          <p className={p.weddingOf}>{t.weddingOf}</p>
        </div>
        <StackedNames one={fields.person_1_name} two={fields.person_2_name} and={labels.and} className={p.names} />
        <PrintDivider className={p.cardDivider} />
        {event.date ? <p className={p.date}>{event.date.full}</p> : null}
        {event.time || fields.venue_name ? (
          <p className={p.cardLine}>{[event.time, fields.venue_name].filter(Boolean).join(' · ')}</p>
        ) : null}
        {extraLine ? <p className={p.cardLine}>{extraLine}</p> : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
        <img className={p.cardSprig} src={sprig.src} alt="" />
      </div>
    </div>
  );
}
