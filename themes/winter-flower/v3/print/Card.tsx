import { ThemeBorder, type PrintCardProps } from '@/theme-sdk';
import { RULE_BORDER } from '../border';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import { nameScale } from '../names';
import flourish from '../assets/flourish.webp';
import { Flowers } from './Flowers';
import p from './print.module.css';

/** Printable invitation, A5 portrait, laid out like the source invitation's card, with the customer's details. */
export default function Card({ locale, dir, lang, fields, event, labels, qrDataUrl, extraLine, border, occasion }: PrintCardProps) {
  const t = copyFor(locale, occasion);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <ThemeBorder border={border} fallback={RULE_BORDER} medium="print" />
      <Flowers />
      <div className={p.cardSafe}>
        <p className={p.kicker}>{t.saveDate}</p>
        <p className={p.kicker}>{t.weddingOf}</p>
        <h1 className={p.names}>
          {n1 ? <span style={{ fontSize: `${nameScale(n1)}em` }}>{n1}</span> : null}
          {n1 && n2 ? <span className={p.and}>{labels.and}</span> : null}
          {n2 ? <span style={{ fontSize: `${nameScale(n2)}em` }}>{n2}</span> : null}
        </h1>
        {fields.invitation_message ? (
          <p className={p.message} data-long={fields.invitation_message.length > 160 ? '' : undefined}>
            {fields.invitation_message}
          </p>
        ) : null}
        {fields.person_1_family || fields.person_2_family ? (
          <p className={p.families}>
            {[fields.person_1_family, fields.person_2_family].filter(Boolean).map((f) => (
              <span key={f}>{f}</span>
            ))}
          </p>
        ) : null}
        {event.date || event.time ? (
          <>
            <p className={p.kicker} style={{ marginTop: '4mm' }}>
              {t.celebrationOn}
            </p>
            <div className={p.table} data-single={event.date && event.time ? undefined : ''}>
              {event.date ? (
                <div>
                  <p className={p.kicker}>{event.date.weekday}</p>
                  <p className={p.big}>
                    {event.date.day} {event.date.month} {event.date.year}
                  </p>
                </div>
              ) : null}
              {event.time ? (
                <div>
                  <p className={p.kicker}>{t.at}</p>
                  <p className={p.big}>{event.time}</p>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        {fields.venue_name ? <p className={p.venue}>{fields.venue_name}</p> : null}
        {extraLine ? <p className={p.extra}>{extraLine}</p> : null}
        {qrDataUrl ? (
          <figure className={p.qr}>
            {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
            <img src={qrDataUrl} alt="" />
            <figcaption>{labels.scanToOpen}</figcaption>
          </figure>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- print artwork
          <img className={p.flourish} src={flourish.src} alt="" />
        )}
      </div>
    </div>
  );
}
