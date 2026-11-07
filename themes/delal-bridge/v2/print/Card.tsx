import { ThemeBorder, type PrintCardProps } from '@/theme-sdk';
import { KILIM_BORDER } from '../border';
import { byOccasion, copyFor } from '../copy';
import fonts from '../fonts.module.css';
import art from '../assets/print-a5-front.webp';
import p from './cards.module.css';

/**
 * Printable invitation, A5 portrait (owner's artwork, 2026-11-07): the kilim gateway on cream paper, the star and the
 * pomegranates under the arch. The celebration, the two names and the date, time and venue are written into the
 * artwork's open places. The QR code is on the back. An owner's replacement border is drawn over it; the design's own
 * frame is in the artwork.
 */
export default function Card({ locale, dir, lang, fields, event, labels, extraLine, border, occasion }: PrintCardProps) {
  const t = copyFor(locale);
  const p1 = fields.person_1_name;
  const p2 = fields.person_2_name;
  const long = Math.max(p1?.length ?? 0, p2?.length ?? 0) > 14;
  return (
    <div className={`${fonts.fonts} ${p.a5}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {border ? <ThemeBorder border={border} fallback={KILIM_BORDER} medium="print" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.a5Art} src={art.src} alt="" />
      <p className={p.a5Title}>{byOccasion(occasion, t.eventWedding, t.eventEngagement)}</p>
      {p1 || p2 ? (
        <div className={p.a5Names} data-long={long ? '' : undefined}>
          {p1 ? <p className={p.a5Name}>{p1}</p> : null}
          {p1 && p2 ? <p className={p.a5And}>{labels.and}</p> : null}
          {p2 ? <p className={p.a5Name}>{p2}</p> : null}
        </div>
      ) : null}
      <div className={p.a5Details}>
        {event.date ? <p>{event.date.full}</p> : null}
        {event.time ? <p>{event.time}</p> : null}
        {fields.venue_name ? <p>{fields.venue_name}</p> : null}
        {extraLine ? <p className={p.a5Extra}>{extraLine}</p> : null}
      </div>
    </div>
  );
}
