import { Signature, ThemeBorder, type PrintCardBackProps } from '@/theme-sdk';
import { KILIM_BORDER } from '../border';
import { coupleNames } from '../copy';
import fonts from '../fonts.module.css';
import art from '../assets/print-a5-back.webp';
import ornament from '../assets/print-ornament.webp';
import p from './cards.module.css';

/**
 * Back of the A5 card, landscape (the owner's back artwork widened: the framed paper, the kilim medallion and band).
 * The customer's title, the star and pomegranates, their message (or the invitation's message), their signatures or
 * the names, and the QR code in the corner above the band.
 */
export default function CardBack({ locale, dir, lang, fields, title, message, signatures, labels, qrDataUrl, border }: PrintCardBackProps) {
  const names = coupleNames(fields.person_1_name, fields.person_2_name, labels.and);
  const words = message ?? fields.invitation_message ?? null;
  return (
    <div className={`${fonts.fonts} ${p.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {border ? <ThemeBorder border={border} fallback={KILIM_BORDER} medium="print" /> : null}
      {/* eslint-disable @next/next/no-img-element -- print artwork */}
      <img className={p.backArt} src={art.src} alt="" />
      <div className={p.backSafe} data-qr={qrDataUrl ? '' : undefined}>
        <h1 className={p.backTitle}>{title}</h1>
        <img className={p.backOrnament} src={ornament.src} alt="" />
        {/* eslint-enable @next/next/no-img-element */}
        {words ? (
          <p className={p.backMessage} data-long={words.length > 220 ? '' : undefined}>
            {words}
          </p>
        ) : null}
        {signatures.length ? <Signature signatures={signatures} className={p.backSignature} /> : names ? <p className={p.backNames}>{names}</p> : null}
      </div>
      {qrDataUrl ? (
        <figure className={p.backQr}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
          <img src={qrDataUrl} alt="" />
          <figcaption>{labels.scanToOpen}</figcaption>
        </figure>
      ) : null}
    </div>
  );
}
