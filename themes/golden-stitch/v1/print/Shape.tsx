import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import heart from '../assets/heart-sketch.webp';
import { PrintDivider, QrCodes, StackedNames } from './Ornaments';
import p from './print.module.css';

/**
 * The arch card (manifest `print.shapes`, feature `card_arch`), on the owner's scalloped arch artwork (the same on both
 * sides; the outline is symmetric). Front: the names stacked, the divider, the date and the sketched heart. Back: the
 * customer's title and message in italics, a heart between two short rules, and at the bottom the QR code (two side
 * by side when the customer bought guest photo sharing). Transparent outside the arch.
 */
export default function Shape({ side, dir, lang, fields, event, labels, title, message, qrDataUrl, photoQrDataUrl, extraLine }: PrintShapeProps) {
  return (
    <div className={`${fonts.fonts} ${p.arch}`} dir={dir} lang={lang}>
      {side === 'front' ? (
        <div className={p.archFront}>
          <StackedNames one={fields.person_1_name} two={fields.person_2_name} and={labels.and} className={`${p.names} ${p.archNames}`} />
          <PrintDivider className={p.archDivider} />
          {event.date ? <p className={`${p.date} ${p.archDate}`}>{event.date.full}</p> : null}
          {extraLine ? <p className={p.cardLine}>{extraLine}</p> : null}
          {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
          <img className={p.archHeart} src={heart.src} alt="" />
        </div>
      ) : (
        <div className={p.archBack}>
          <h1 className={p.archTitle} data-long={title.length > 40 ? '' : undefined}>
            {title}
          </h1>
          {message ? (
            <p className={p.archMessage} data-long={message.length > 120 ? '' : undefined}>
              {message}
            </p>
          ) : null}
          <p className={p.heartRule} aria-hidden="true">
            <span />
            <HeartOutline />
            <span />
          </p>
          <QrCodes qr={qrDataUrl} photoQr={photoQrDataUrl} labels={labels} className={p.archQrs} />
        </div>
      )}
    </div>
  );
}

function HeartOutline() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round">
      <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
    </svg>
  );
}
