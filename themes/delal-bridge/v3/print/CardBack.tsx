import { Signature, ThemeBorder, type PrintCardBackProps } from '@/theme-sdk';
import { KILIM_BORDER } from '../border';
import { coupleNames } from '../copy';
import fonts from '../fonts.module.css';
import art from '../assets/print-a5-back.webp';
import p from './cards.module.css';

/**
 * Back of the A5 card, upright like the front (manifest `print.card.back: 'portrait'`), on the owner's back artwork:
 * the framed paper with the kilim medallion, the star and pomegranates and the kilim band. The customer's title, their
 * message (or the invitation's message) and their signatures or the names above the star; the QR code where the
 * artwork has it, bottom right.
 */
export default function CardBack({ locale, dir, lang, fields, title, message, signatures, labels, qrDataUrl, border }: PrintCardBackProps) {
  const names = coupleNames(fields.person_1_name, fields.person_2_name, labels.and);
  const words = message ?? fields.invitation_message ?? null;
  return (
    <div className={`${fonts.fonts} ${p.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {border ? <ThemeBorder border={border} fallback={KILIM_BORDER} medium="print" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.backArt} src={art.src} alt="" />
      <div className={p.backSafe}>
        <h1 className={p.backTitle}>{title}</h1>
        <span className={p.backRule} />
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
