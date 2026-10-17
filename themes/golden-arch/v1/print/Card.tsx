import { ThemeBorder, type PrintCardProps } from '@/theme-sdk';
import { GOLD_BORDER } from '../border';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import { isLong } from '../names';
import rosesTop from '../assets/roses-top.webp';
import rosesBottom from '../assets/roses-bottom.webp';
import hands from '../assets/hands.webp';
import laurel from '../assets/laurel-cap.webp';
import { numericDate, yearOf } from './shared';
import p from './print.module.css';

/** Printable invitation, A5 portrait: the owner's poster itself (paper, roses, gold arch, laurel, hands) with the details. */
export default function Card({ locale, dir, lang, fields, event, labels, qrDataUrl, extraLine, border, wording }: PrintCardProps) {
  const t = copyFor(locale);
  const name = fields.person_1_name;
  const year = yearOf(fields.class_year, event.date?.year, locale);
  const date = numericDate(fields.event_date, locale);
  const standing = [fields.achievement, year ? `${t.classOf} ${year}` : null].filter(Boolean);
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {border ? <ThemeBorder border={border} fallback={GOLD_BORDER} medium="print" /> : null}
      {/* eslint-disable @next/next/no-img-element -- print artwork */}
      <img className={p.rosesTop} src={rosesTop.src} alt="" />
      <img className={p.rosesBottom} src={rosesBottom.src} alt="" />
      <img className={p.hands} src={hands.src} alt="" />
      <div className={p.arch}>
        <img className={p.laurel} src={laurel.src} alt="" />
        {/* eslint-enable @next/next/no-img-element */}
        {name ? (
          <h1 className={p.name} data-long={isLong(name) ? '' : undefined}>
            {name}
          </h1>
        ) : null}
        {standing.length ? <p className={p.standing}>{standing.join(' · ')}</p> : null}
        {fields.invitation_message ? (
          <p className={p.message} data-long={fields.invitation_message.length > 120 ? '' : undefined}>
            {fields.invitation_message}
          </p>
        ) : null}
        {date || event.time ? (
          <p className={p.when} dir="ltr">
            {date ? <span>{date}</span> : null}
            {date && event.time ? <span className={p.bar} /> : null}
            {event.time ? <span dir={dir}>{event.time}</span> : null}
          </p>
        ) : null}
        {fields.venue_name ? <p className={p.venue}>{fields.venue_name}</p> : null}
        {wording.followLine ? <p className={p.follow}>{wording.followLine}</p> : null}
        {extraLine ? <p className={p.extra}>{extraLine}</p> : null}
        {qrDataUrl ? (
          <figure className={p.qr}>
            {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
            <img src={qrDataUrl} alt="" />
            <figcaption>{labels.scanToOpen}</figcaption>
          </figure>
        ) : null}
      </div>
    </div>
  );
}
