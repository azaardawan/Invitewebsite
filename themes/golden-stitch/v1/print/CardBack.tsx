import type { PrintCardBackProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import divider from '../assets/card-divider-star.webp';
import flower from '../assets/card-flower-back.webp';
import { QrCodes } from './Ornaments';
import p from './print.module.css';

/**
 * Back of the A5 card, upright, as the owner drew it (2026-11-26): a star divider, the customer's title in italics
 * (e.g. "Thank you for being part of our special day."), their message, a sketched flower, a second divider, and at
 * the bottom the QR code, or two side by side when the customer bought guest photo sharing.
 */
export default function CardBack({ dir, lang, labels, title, message, qrDataUrl, photoQrDataUrl }: PrintCardBackProps) {
  return (
    <div className={`${fonts.fonts} ${p.card} ${p.cardPaper}`} dir={dir} lang={lang}>
      <div className={p.backFlow}>
        {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
        <img className={p.backStar} src={divider.src} alt="" />
        <h1 className={p.backTitle} data-long={title.length > 48 ? '' : undefined}>
          {title}
        </h1>
        {message ? (
          <p className={p.backMessage} data-long={message.length > 160 ? '' : undefined}>
            {message}
          </p>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
        <img className={p.backFlower} src={flower.src} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
        <img className={p.backStar} src={divider.src} alt="" />
        <QrCodes qr={qrDataUrl} photoQr={photoQrDataUrl} labels={labels} className={p.backQrRow} />
      </div>
    </div>
  );
}
