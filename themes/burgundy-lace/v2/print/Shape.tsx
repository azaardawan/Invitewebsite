import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { copyFor } from '../copy';
import { sealText } from '../initials';
import { isLong } from '../names';
import { PrintSeal } from './PrintSeal';
import p from './shape.module.css';

/**
 * The shaped cards (manifest `print.shapes`): a heart and a tall arch, drawn from their own cut lines. Front: wine
 * ground inside a double ivory rule that follows the cut line, the names and the date, and the wax seal with the
 * couple's initials (the arch also carries the lace square from the A5 card, with the names on it). Back: ivory,
 * the customer's title and message, the names and the QR code. Transparent outside the shape.
 */
export default function Shape({ shape, side, widthMm, heightMm, outline, locale, dir, lang, fields, event, labels, title, message, qrDataUrl, extraLine, wording, switches, occasion }: PrintShapeProps) {
  const t = copyFor(locale, occasion);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const date = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  const seal = switches.sealInitials === false ? null : sealText(fields, wording.sealJoin ?? '&');
  const front = side === 'front';
  const kind = shape === 'arch' ? 'arch' : 'heart';
  // the two rules follow the cut line, 4 mm and 6 mm inside it
  const inset = (mm: number) => `translate(${mm} ${mm}) scale(${(widthMm - 2 * mm) / widthMm} ${(heightMm - 2 * mm) / heightMm})`;
  return (
    <div className={`${fonts.fonts} ${p.shape} ${p[kind]} ${front ? p.front : p.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <svg className={p.art} viewBox={`0 0 ${widthMm} ${heightMm}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={outline} className={p.ground} />
        <path d={outline} transform={inset(4)} className={p.ruleOuter} vectorEffect="non-scaling-stroke" />
        <path d={outline} transform={inset(5.6)} className={p.ruleInner} vectorEffect="non-scaling-stroke" />
      </svg>
      {front ? (
        <div className={p.content}>
          {kind === 'arch' ? (
            <>
              <p className={p.kicker}>{t.invitation}</p>
              <div className={p.lace}>
                <h1 className={p.laceNames} data-long={isLong(n1, n2) ? '' : undefined}>
                  {n1 ? <span>{n1}</span> : null}
                  {n1 && n2 ? <em>{labels.and}</em> : null}
                  {n2 ? <span>{n2}</span> : null}
                </h1>
              </div>
              {date ? <p className={p.date}>{date}</p> : null}
              {event.time ? <p className={p.time}>{event.time}</p> : null}
              {fields.venue_name ? <p className={p.venue}>{fields.venue_name}</p> : null}
              {extraLine ? <p className={p.extra}>{extraLine}</p> : null}
              <PrintSeal seal={seal} id={`${shape}-front`} className={p.archSeal} />
            </>
          ) : (
            <>
              <p className={p.kicker}>{t.invitation}</p>
              <h1 className={p.names} data-long={isLong(n1, n2) ? '' : undefined}>
                {n1 ? <span>{n1}</span> : null}
                {n1 && n2 ? <em>{labels.and}</em> : null}
                {n2 ? <span>{n2}</span> : null}
              </h1>
              {date ? <p className={p.date}>{date}</p> : null}
              {extraLine ? <p className={p.extra}>{extraLine}</p> : null}
              <PrintSeal seal={seal} id={`${shape}-front`} className={p.heartSeal} />
            </>
          )}
        </div>
      ) : (
        <div className={p.content}>
          <h1 className={p.title}>{title}</h1>
          {message ? (
            <p className={p.message} data-long={message.length > 150 ? '' : undefined}>
              {message}
            </p>
          ) : null}
          <p className={p.backNames}>{[n1, n2].filter(Boolean).join(` ${labels.and} `)}</p>
          {qrDataUrl ? (
            <figure className={p.qr}>
              {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
              <img src={qrDataUrl} alt="" />
              <figcaption>{labels.scanToOpen}</figcaption>
            </figure>
          ) : null}
        </div>
      )}
    </div>
  );
}
