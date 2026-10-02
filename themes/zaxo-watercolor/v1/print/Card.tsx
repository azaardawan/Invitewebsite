import type { PrintCardProps } from '@/theme-sdk';
import { Diamond, Names } from './Ornament';
import p from './print.module.css';

/**
 * Printable invitation, A5 portrait (the platform sets the page to 154 × 216 mm
 * including 3 mm bleed). The ivory paper and heritage border strips run into
 * the bleed; the landmark painting sits at the foot; text stays in the safe area.
 */
export default function Card({ dir, lang, fields, event, labels, qrDataUrl, extraLine }: PrintCardProps) {
  return (
    <div className={p.card} dir={dir} lang={lang}>
      <span className={`${p.side} ${p.sideLeft}`} aria-hidden="true" />
      <span className={`${p.side} ${p.sideRight}`} aria-hidden="true" />
      <span className={p.cardScene} aria-hidden="true" />
      <div className={p.cardSafe}>
        <Diamond />
        <Names first={fields.person_1_name} second={fields.person_2_name} and={labels.and} className={p.cardNames} />
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
            <div>
              <dt>{labels.venue}</dt>
              <dd>{fields.venue_name}</dd>
            </div>
          ) : null}
        </dl>
        {extraLine ? <p className={p.cardExtra}>{extraLine}</p> : null}
        {qrDataUrl ? (
          <figure className={p.cardQr}>
            {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
            <img src={qrDataUrl} alt="" width={96} height={96} />
            <figcaption>{labels.scanToOpen}</figcaption>
          </figure>
        ) : null}
      </div>
    </div>
  );
}
