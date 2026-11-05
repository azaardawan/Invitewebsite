import { ThemeBorder, type PrintCardProps } from '@/theme-sdk';
import { KILIM_BORDER } from '../border';
import { byOccasion, copyFor, coupleNames } from '../copy';
import fonts from '../fonts.module.css';
import garland from '../assets/garland.webp';
import ornament from '../assets/ornament.webp';
import kilimBand from '../assets/kilim-band.webp';
import p from './print.module.css';

/** Printable invitation, A5 portrait: the kilim garland on the gateway's cream wall, the details, the QR and the kilim band. */
export default function Card({ locale, dir, lang, fields, event, labels, qrDataUrl, extraLine, border, occasion }: PrintCardProps) {
  const t = copyFor(locale);
  const names = coupleNames(fields.person_1_name, fields.person_2_name, labels.and);
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <ThemeBorder border={border} fallback={KILIM_BORDER} medium="print" />
      {/* eslint-disable @next/next/no-img-element -- print artwork */}
      <img className={p.garland} src={garland.src} alt="" />
      <img className={p.band} src={kilimBand.src} alt="" />
      <div className={p.safe}>
        <img className={p.ornament} src={ornament.src} alt="" />
        {/* eslint-enable @next/next/no-img-element */}
        <p className={p.blessing}>{t.blessing}</p>
        {names ? (
          <h1 className={p.names} data-long={names.length > 26 ? '' : undefined}>
            {names}
          </h1>
        ) : null}
        <p className={p.line}>{byOccasion(occasion, t.cardWedding, t.cardEngagement)}</p>
        {event.date ? <p className={p.when}>{event.date.full}</p> : null}
        {event.time ? <p className={p.time}>{event.time}</p> : null}
        {fields.venue_name ? <p className={p.venue}>{fields.venue_name}</p> : null}
        {fields.invitation_message ? (
          <p className={p.message} data-long={fields.invitation_message.length > 140 ? '' : undefined}>
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
