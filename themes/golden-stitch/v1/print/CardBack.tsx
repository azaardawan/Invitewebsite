import type { PrintCardBackProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import heart from '../assets/heart-sketch.webp';
import { PrintDivider, PrintFrame, QrCodes } from './Ornaments';
import p from './print.module.css';

/**
 * Back of the A5 card, portrait, as the owner drew it: the frame, the customer's title (in italics, e.g. "Thank you for
 * being a part of our special day.") between two dividers, their message and the sketched heart; at the bottom the QR
 * code, or two side by side when the customer bought guest photo sharing.
 */
export default function CardBack({ dir, lang, labels, title, message, qrDataUrl, photoQrDataUrl, border }: PrintCardBackProps) {
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang}>
      <PrintFrame unitMm={0.4} insetMm={6.6} border={border} />
      <div className={p.backSafe}>
        <PrintDivider className={p.backDivider} />
        <h1 className={p.backTitle} data-long={title.length > 40 ? '' : undefined}>
          {title}
        </h1>
        {message ? (
          <p className={p.backMessage} data-long={message.length > 160 ? '' : undefined}>
            {message}
          </p>
        ) : null}
        <PrintDivider className={p.backDivider} />
        {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
        <img className={p.backHeart} src={heart.src} alt="" />
      </div>
      {/* At the bottom, between the corner sprigs: the invitation's QR code, and the guests' photo QR when bought. */}
      <QrCodes qr={qrDataUrl} photoQr={photoQrDataUrl} labels={labels} className={p.backQrs} />
    </div>
  );
}
