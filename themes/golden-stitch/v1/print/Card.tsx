import type { PrintCardProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import flower from '../assets/card-flower-front.webp';
import lotus from '../assets/card-lotus.webp';
import { numericDate } from './Ornaments';
import p from './print.module.css';

/**
 * Printable card, A5 portrait (154 × 216 mm with bleed), as the owner drew it (2026-11-26): a fine gold arch on warm
 * paper, a sketched flower, the names in large italics ("Aza &" over "Raghad"), the date between two rules and a small
 * lotus ornament. The QR code(s) are on the back. The invitation's paragraph is never printed on a card (owner rule).
 */
export default function Card({ locale, dir, lang, fields, labels, extraLine }: PrintCardProps) {
  const one = fields.person_1_name;
  const two = fields.person_2_name;
  const date = numericDate(fields.event_date, locale);
  const first = one ? (two ? `${one} ${labels.and}` : one) : null;
  return (
    <div className={`${fonts.fonts} ${p.card} ${p.cardPaper}`} dir={dir} lang={lang}>
      <span className={p.cardArch} aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
      <img className={p.cardFlower} src={flower.src} alt="" />
      <h1 className={p.cardNames}>
        {first ? <span style={{ fontSize: `${lineScale(first)}em` }}>{first}</span> : null}
        {two ? <span style={{ fontSize: `${lineScale(two)}em` }}>{two}</span> : null}
      </h1>
      {date ? (
        <p className={p.cardDate}>
          <span className={p.cardRule} aria-hidden="true" />
          <span dir="ltr">{date}</span>
          <span className={p.cardRule} aria-hidden="true" />
        </p>
      ) : null}
      {extraLine ? <p className={p.cardExtraLine}>{extraLine}</p> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
      <img className={p.cardLotus} src={lotus.src} alt="" />
    </div>
  );
}

/** Each name line is written smaller as it gets longer, so it stays on one line inside the arch (up to 30 letters). */
function lineScale(line: string): number {
  return Math.min(1, 9.5 / Math.max(1, Array.from(line).length));
}
