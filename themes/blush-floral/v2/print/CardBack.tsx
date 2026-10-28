import { Signature, ThemeBorder, type PrintCardBackProps } from '@/theme-sdk';
import { ROSETTE_BORDER } from '../border';
import fonts from '../fonts.module.css';
import peony from '../assets/deco/peony.webp';
import p from './print.module.css';

/**
 * Back of the A5 card, landscape: the design's drawings at the sides, the customer's title in the design's script (Aref
 * Ruqaa in Arabic and Kurdish) and their message, signed by them (or their name), and the QR code to the invitation.
 */
export default function CardBack({ locale, dir, lang, fields, labels, title, message, signatures, qrDataUrl, border }: PrintCardBackProps) {
  const name = fields.person_1_name?.trim();
  return (
    <div className={`${fonts.fonts} ${p.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.peony} src={peony.src} alt="" />
      <span className={`${p.deco} ${p['deco-ribbon']} ${p['at-top']}`} />
      <div className={p.backSafe}>
        <h1 className={p.backTitle} data-long={title.length > 22 ? '' : undefined}>
          {title}
        </h1>
        {message ? (
          <p className={p.backMessage} data-long={message.length > 160 ? '' : undefined}>
            {message}
          </p>
        ) : null}
        <svg className={p.sparkle} viewBox="-15 -17 30 34" aria-hidden="true">
          <path d="M0-12Q1.5-1.5 10 0Q1.5 1.5 0 12Q-1.5 1.5-10 0Q-1.5-1.5 0-12Z" />
        </svg>
        {signatures.length ? <Signature signatures={signatures} className={p.signature} /> : name ? <p className={p.backName}>{name}</p> : null}
      </div>
      {qrDataUrl ? (
        <figure className={p.qr}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
          <img src={qrDataUrl} alt="" />
          <figcaption>{labels.scanToOpen}</figcaption>
        </figure>
      ) : null}
      {border ? <ThemeBorder border={border} fallback={ROSETTE_BORDER} medium="print" /> : null}
    </div>
  );
}
