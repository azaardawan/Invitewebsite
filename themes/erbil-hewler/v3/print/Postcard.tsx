import { Signature, type PrintCardBackProps } from '@/theme-sdk';
import { sunPoints } from '../motion';
import cityMap from '../assets/city-map.webp';
import paper from '../assets/paper.png';
import { namesOf, wordsFor } from './words';
import p from './print.module.css';

type Back = Pick<PrintCardBackProps, 'locale' | 'dir' | 'lang' | 'fields' | 'title' | 'message' | 'signatures' | 'qrDataUrl' | 'labels'>;

/**
 * The Hewlêr postcard's reverse (the designer's postcard back), written by the customer: their title and message on
 * the left over the faint street map, the stamp (the QR code to the invitation) and the couple's names or signatures
 * on the address lines, the kilim diamonds and the map's credit along the bottom.
 */
export function PostcardBack({ locale, dir, lang, fields, title, message, signatures, qrDataUrl, labels }: Back) {
  const w = wordsFor(locale);
  const names = namesOf(fields);
  const long = (message?.length ?? 0) > 220;
  return (
    <div className={p.postcard} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'} style={{ backgroundImage: `url(${paper.src})` }}>
      <div className={p.pcWrite}>
        {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
        <img className={p.pcMap} src={cityMap.src} alt="" />
        <p className={p.pcHead}>{w.postcard}</p>
        <p className={p.pcFrom}>{w.from}</p>
        <h1 className={p.pcTitle}>{title}</h1>
        {message ? (
          <p className={p.pcMessage} data-long={long ? '' : undefined}>
            {message}
          </p>
        ) : null}
      </div>
      <span className={p.pcDivider} aria-hidden="true" />
      <div className={p.pcAddress}>
        <div className={p.pcStampRow}>
          <div className={p.pcPostmark}>
            <svg viewBox="0 0 60 60" aria-hidden="true">
              <polygon points={sunPoints(30, 30, 17, 28)} />
            </svg>
            <span>{w.stamp}</span>
            <small>{w.stampSub}</small>
          </div>
          {qrDataUrl ? (
            <figure className={p.pcStamp}>
              {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
              <img src={qrDataUrl} alt="" />
              <figcaption>{labels.scanToOpen}</figcaption>
            </figure>
          ) : null}
        </div>
        <div className={p.pcLines}>
          {signatures.length ? (
            <Signature signatures={signatures} className={p.pcSignature} />
          ) : names.length ? (
            <p className={p.pcNames}>{names.join(` ${labels.and} `)}</p>
          ) : null}
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className={p.pcFoot}>
        <span className={p.pcKilim} aria-hidden="true" />
        <p>{w.mapCredit}</p>
      </div>
    </div>
  );
}
