import { Signature, type PrintShapeProps } from '@/theme-sdk';
import { byOccasion, copyFor, coupleNames } from '../copy';
import fonts from '../fonts.module.css';
import front from '../assets/print-bridge-front.webp';
import back from '../assets/print-bridge-back.webp';
import p from './cards.module.css';

/**
 * The bridge card (manifest `print.shapes`, `arch-bridge`, the owner's artwork, 2026-11-07): Delal Bridge's stone arches
 * with the kilim, pomegranates and two painted views, cut along its roofline. Front: the celebration, the names, the
 * invitation line and the date, time and venue under the artwork's icons. Back: the customer's title and message, the
 * couple's drawn signatures (feature `signature`; the names only until they are drawn), the tulip, and the QR code in the
 * right arch. Transparent outside the shape.
 */
export default function Shape({ side, widthMm: w, heightMm: h, outline, locale, dir, lang, fields, event, labels, title, message, signatures, qrDataUrl, extraLine, occasion, shape }: PrintShapeProps) {
  const t = copyFor(locale);
  const isFront = side === 'front';
  const id = `db-${shape}-${side}`;
  const names = coupleNames(fields.person_1_name, fields.person_2_name, labels.and);
  const words = message ?? fields.invitation_message ?? null;
  return (
    <div className={`${fonts.fonts} ${p.bridge}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <svg className={p.bridgeArt} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-clip`}>
            <path d={outline} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          <image href={isFront ? front.src : back.src} x="0" y="0" width={w} height={h} preserveAspectRatio="none" />
        </g>
      </svg>
      {isFront ? (
        <>
          <p className={p.bTitle}>{byOccasion(occasion, t.eventWedding, t.eventEngagement)}</p>
          {names ? (
            <p className={p.bNames} data-long={names.length > 26 ? '' : undefined}>
              {names}
            </p>
          ) : null}
          <p className={p.bLine}>{byOccasion(occasion, t.cardWedding, t.cardEngagement)}</p>
          {extraLine ? <p className={p.bExtra}>{extraLine}</p> : null}
          <p className={`${p.bCol} ${p.bDate}`} data-long={(event.date?.full.length ?? 0) > 26 ? '' : undefined}>
            {event.date?.full ?? ''}
          </p>
          <p className={`${p.bCol} ${p.bTime}`}>{event.time ?? ''}</p>
          <p className={`${p.bCol} ${p.bVenue}`} data-long={(fields.venue_name?.length ?? 0) > 26 ? '' : undefined}>
            {fields.venue_name ?? ''}
          </p>
        </>
      ) : (
        <>
          <p className={p.bTitle}>{title}</p>
          {words ? (
            <p className={p.bMessage} data-long={words.length > 170 ? '' : undefined}>
              {words}
            </p>
          ) : null}
          {/* The couple's drawn signatures, as in the artwork: two side by side with a fine line between (or one in the
              middle). Only before any is drawn: the names. */}
          {signatures.length > 1 ? (
            <div className={p.bSignPair}>
              <Signature signatures={signatures.slice(0, 1)} className={p.bSignature} />
              <span className={p.bSignBar} />
              <Signature signatures={signatures.slice(1, 2)} className={p.bSignature} />
            </div>
          ) : (
            <div className={p.bSign}>
              {signatures.length ? <Signature signatures={signatures} className={p.bSignature} /> : names ? <p className={p.bSignNames}>{names}</p> : null}
            </div>
          )}
          {qrDataUrl ? (
            <figure className={p.bQr}>
              {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
              <img src={qrDataUrl} alt="" />
              <figcaption>{labels.scanToOpen}</figcaption>
            </figure>
          ) : null}
        </>
      )}
    </div>
  );
}
