import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { nameScale } from '../names';
import p from './shape.module.css';

/**
 * The shaped cards (manifest `print.shapes`): the leaf (#12 front; back: the owner's #9, a landscape design read
 * with the card turned sideways, rebuilt on the leaf's own cut line) and the heart (#14 front, #13 back fitted to
 * the front's outline). Front: the couple's names and the date; back: the customer's title and
 * message, the names and the QR code. Transparent outside the shape; the text stays well inside it.
 */
export default function Shape({ shape, side, dir, lang, fields, event, labels, title, message, qrDataUrl }: PrintShapeProps) {
  const art = `${shape === 'heart' ? 'heart' : 'leaf'}-${side}`;
  return (
    <div className={`${fonts.fonts} ${p.shape} ${p[art]}`} dir={dir} lang={lang}>
      {side === 'front' ? (
        <div className={p.front}>
          <h1 className={p.names}>
            {fields.person_1_name ? <span style={{ fontSize: `${nameScale(fields.person_1_name)}em` }}>{fields.person_1_name}</span> : null}
            {fields.person_1_name && fields.person_2_name ? <span className={p.and}>{labels.and}</span> : null}
            {fields.person_2_name ? <span style={{ fontSize: `${nameScale(fields.person_2_name)}em` }}>{fields.person_2_name}</span> : null}
          </h1>
          {event.date ? <p className={p.date}>{event.date.full}</p> : null}
        </div>
      ) : (
        <div className={p.back}>
          <h1 className={p.title}>{title}</h1>
          {message ? (
            <p className={p.message} data-long={message.length > 150 ? '' : undefined}>
              {message}
            </p>
          ) : null}
          <p className={p.backNames}>{[fields.person_1_name, fields.person_2_name].filter(Boolean).join(` ${labels.and} `)}</p>
          {qrDataUrl ? (
            <figure className={p.qr}>
              {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
              <img src={qrDataUrl} alt="" width={64} height={64} />
              <figcaption>{labels.scanToOpen}</figcaption>
            </figure>
          ) : null}
        </div>
      )}
    </div>
  );
}
