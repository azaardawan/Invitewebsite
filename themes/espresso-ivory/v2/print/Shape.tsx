import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { copyFor } from '../copy';
import { isLong } from '../names';
import paper from '../assets/espresso-paper.webp';
import p from './shape.module.css';

/**
 * The shaped cards (manifest `print.shapes`). The cartouche (`arch`) is the ivory card from the envelope itself, cut on
 * its own edge, with a fine gold rule inside it: the names on the front, the customer's words on the back. The heart:
 * espresso paper inside a double gold rule with the names and the gold seal (front), ivory with the customer's words
 * and the QR code (back). Transparent outside the shape.
 */
export default function Shape({ shape, side, widthMm, heightMm, outline, locale, dir, lang, fields, event, labels, title, message, qrDataUrl, extraLine, occasion }: PrintShapeProps) {
  const t = copyFor(locale, occasion);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const date = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  const front = side === 'front';
  const kind = shape === 'arch' ? 'cartouche' : 'heart';
  const clip = `ei-${kind}-${side}`;
  // rules that follow the cut line, `mm` inside it
  const inset = (mm: number) => `translate(${mm} ${mm}) scale(${(widthMm - 2 * mm) / widthMm} ${(heightMm - 2 * mm) / heightMm})`;
  const names = (
    <h1 className={p.names} data-long={isLong(n1, n2) ? '' : undefined}>
      {n1 ? <span>{n1}</span> : null}
      {n1 && n2 ? <em>{labels.and}</em> : null}
      {n2 ? <span>{n2}</span> : null}
    </h1>
  );
  return (
    <div className={`${fonts.fonts} ${p.shape} ${p[kind]} ${front ? p.front : p.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <svg className={p.art} viewBox={`0 0 ${widthMm} ${heightMm}`} preserveAspectRatio="none" aria-hidden="true">
        {kind === 'heart' && front ? (
          <>
            <clipPath id={clip}>
              <path d={outline} />
            </clipPath>
            <image href={paper.src} x="0" y="0" width={widthMm} height={heightMm} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`} />
          </>
        ) : kind === 'heart' ? (
          <path d={outline} className={p.ground} />
        ) : null}
        <path d={outline} transform={inset(kind === 'heart' ? 4 : 7)} className={p.ruleOuter} vectorEffect="non-scaling-stroke" />
        {kind === 'heart' ? <path d={outline} transform={inset(5.6)} className={p.ruleInner} vectorEffect="non-scaling-stroke" /> : null}
      </svg>
      {front ? (
        <div className={p.content}>
          <p className={p.kicker}>{t.invitation}</p>
          {names}
          <div className={p.rule} aria-hidden="true">
            <span />
          </div>
          {date ? <p className={p.date}>{date}</p> : null}
          {kind === 'cartouche' && event.time ? <p className={p.time}>{event.time}</p> : null}
          {kind === 'cartouche' && fields.venue_name ? <p className={p.venue}>{fields.venue_name}</p> : null}
          {extraLine ? <p className={p.extra}>{extraLine}</p> : null}
          {kind === 'heart' ? <span className={p.seal} aria-hidden="true" /> : null}
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
