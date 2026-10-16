import type { PrintCardProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { isLong } from '../names';
import { copyFor } from '../copy';
import { LaceFrame } from './LaceFrame';
import p from './print.module.css';

/** Printable invitation, A5 portrait: the design's print card (wine ground, lace frame, names on the lace square). */
export default function Card({ locale, dir, lang, fields, event, labels, qrDataUrl, extraLine, border }: PrintCardProps) {
  const t = copyFor(locale);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const date = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <LaceFrame border={border} />
      <div className={p.cardSafe}>
        <p className={p.kicker}>{t.invitation}</p>
        <div className={p.lace}>
          <h1 className={p.laceNames} data-long={isLong(n1, n2) ? '' : undefined}>
            {n1 ? <span>{n1}</span> : null}
            {n1 && n2 ? <em>{labels.and}</em> : null}
            {n2 ? <span>{n2}</span> : null}
          </h1>
        </div>
        {fields.invitation_message ? (
          <p className={p.cardMessage} data-long={fields.invitation_message.length > 160 ? '' : undefined}>
            {fields.invitation_message}
          </p>
        ) : null}
        <div className={p.rule} aria-hidden="true">
          <span />
        </div>
        {date ? <p className={p.cardDate}>{date}</p> : null}
        {event.time ? <p className={p.cardTime}>{event.time}</p> : null}
        {fields.venue_name ? <p className={p.cardVenue}>{fields.venue_name}</p> : null}
        {extraLine ? <p className={p.cardExtra}>{extraLine}</p> : null}
        {qrDataUrl ? (
          <figure className={p.cardQr}>
            {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
            <img src={qrDataUrl} alt="" />
            <figcaption>{labels.scanToOpen}</figcaption>
          </figure>
        ) : null}
      </div>
    </div>
  );
}
