import { ThemeBorder, type PrintCardProps } from '@/theme-sdk';
import { CREST_BORDER } from '../border';
import fonts from '../fonts.module.css';
import p from './print.module.css';

/**
 * Printable invitation, A5 portrait, on the owner's crest card (#11). The artwork fills the trim size plus
 * bleed (the platform sets the page to 154 × 216 mm); the text sits between the crest and the bottom
 * ornament, inside the safe area.
 */
export default function Card({ dir, lang, fields, event, labels, qrDataUrl, extraLine, border }: PrintCardProps) {
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang}>
      <ThemeBorder border={border} fallback={CREST_BORDER} medium="print" />
      <div className={p.cardSafe}>
        <h1 className={p.names}>
          {fields.person_1_name ? <span>{fields.person_1_name}</span> : null}
          {fields.person_1_name && fields.person_2_name ? <span className={p.and}>{labels.and}</span> : null}
          {fields.person_2_name ? <span>{fields.person_2_name}</span> : null}
        </h1>
        {fields.invitation_message ? <p className={p.cardMessage}>{fields.invitation_message}</p> : null}
        <dl className={p.cardDetails}>
          {event.date ? (
            <div>
              <dt>{labels.date}</dt>
              <dd>{event.date.full}</dd>
            </div>
          ) : null}
          {event.time ? (
            <div>
              <dt>{labels.time}</dt>
              <dd>{event.time}</dd>
            </div>
          ) : null}
          {fields.venue_name ? (
            <div className={p.cardVenue}>
              <dt>{labels.venue}</dt>
              <dd>{fields.venue_name}</dd>
            </div>
          ) : null}
        </dl>
        {extraLine ? <p className={p.cardExtra}>{extraLine}</p> : null}
        {qrDataUrl ? (
          <figure className={p.cardQr}>
            {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
            <img src={qrDataUrl} alt="" width={80} height={80} />
            <figcaption>{labels.scanToOpen}</figcaption>
          </figure>
        ) : null}
      </div>
    </div>
  );
}
