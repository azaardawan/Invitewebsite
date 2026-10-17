import { ThemeBorder, formatNumber, type PrintCardProps } from '@/theme-sdk';
import { BOTANICAL_BORDER } from '../border';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import { classYear, isLong } from '../names';
import cap from '../assets/graduation-cap.webp';
import roses from '../assets/ivory-roses.webp';
import p from './print.module.css';

/** Printable invitation, A5 portrait: the design's print card (grey paper, botanical corners, the cap and the details). */
export default function Card({ locale, dir, lang, fields, event, labels, qrDataUrl, extraLine, border }: PrintCardProps) {
  const t = copyFor(locale);
  const name = fields.person_1_name;
  const typed = fields.class_year?.trim();
  const year = classYear(typed && /^\d+$/.test(typed) ? formatNumber(Number(typed), locale) : typed, event.date?.year);
  const date = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <ThemeBorder border={border} fallback={BOTANICAL_BORDER} medium="print" />
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.flowers} src={roses.src} alt="" />
      <div className={p.safe}>
        <p className={p.eyebrow}>{t.invited}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
        <img className={p.cap} src={cap.src} alt="" />
        <h1 className={p.title}>
          <span>{t.graduation}</span>
          <em>{t.celebration}</em>
        </h1>
        {year ? (
          <p className={p.class}>
            {t.classOf} {year}
          </p>
        ) : null}
        {name ? (
          <p className={p.graduate} data-long={isLong(name) ? '' : undefined}>
            {name}
          </p>
        ) : null}
        {fields.achievement ? <p className={p.degree}>{fields.achievement}</p> : null}
        <div className={p.rule} aria-hidden="true" />
        {date ? <p className={p.date}>{date}</p> : null}
        {event.time ? <p className={p.line}>{event.time}</p> : null}
        {fields.venue_name ? <p className={p.line}>{fields.venue_name}</p> : null}
        {fields.invitation_message ? (
          <p className={p.message} data-long={fields.invitation_message.length > 160 ? '' : undefined}>
            {fields.invitation_message}
          </p>
        ) : null}
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
