import type { PrintCardProps } from '@/theme-sdk';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import p from './print.module.css';

/**
 * Printable invitation, A5 portrait. The component fills the trim size plus
 * bleed (the platform sets the page to 154 × 216 mm); background and branches
 * run into the 3 mm bleed, all text stays inside the safe area.
 */
export default function Card({ locale, dir, lang, fields, event, labels, qrDataUrl, extraLine }: PrintCardProps) {
  const t = copyFor(locale);
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang}>
      <span className={p.cardBranchTop} aria-hidden="true" />
      <span className={p.cardBranchBottom} aria-hidden="true" />
      <div className={p.cardSafe}>
        <p className={p.cardBasmala} lang="ar" dir="rtl">
          {copyFor('ar').basmala}
        </p>
        <Rule />
        <h1 className={p.cardNames}>
          <span>{fields.person_1_name}</span>
          {fields.person_2_name ? (
            <>
              <span className={p.cardAnd}>{t.and}</span>
              <span>{fields.person_2_name}</span>
            </>
          ) : null}
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
            <img src={qrDataUrl} alt="" width={96} height={96} />
            <figcaption>{labels.scanToOpen}</figcaption>
          </figure>
        ) : null}
      </div>
    </div>
  );
}

export function Rule() {
  return (
    <svg className={p.rule} viewBox="0 0 160 12" aria-hidden="true">
      <path d="M4 6H68M92 6H156" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M80 1.5L84.5 6L80 10.5L75.5 6Z" fill="currentColor" />
    </svg>
  );
}
