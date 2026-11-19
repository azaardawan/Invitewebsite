import { Signature, type PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { sunPoints } from '../motion';
import paper from '../assets/paper.png';
import { PosterFace } from './Poster';
import { namesOf } from './words';
import p from './print.module.css';

/**
 * The arch card (`card_arch`): the wedding poster cut to its pointed arch. Front: the poster; back: the customer's title
 * and message under the Kurdish sun, the names (or signatures) and the QR code.
 */
export default function Shape(props: PrintShapeProps) {
  const { widthMm, heightMm, outline, side, dir, lang, locale, title, message, signatures, fields, labels, qrDataUrl } = props;
  const clip = `path('${outline.replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round(((Number(n) * 96) / 25.4) * 100) / 100))}')`;
  const box = {
    width: `${widthMm}mm`,
    height: `${heightMm}mm`,
    clipPath: clip,
  };
  if (side === 'front') {
    return (
      <div className={`${fonts.fonts} ${p.shape}`} style={box}>
        <PosterFace {...props} className={p.shapePoster} />
      </div>
    );
  }
  const names = namesOf(fields);
  return (
    <div className={`${fonts.fonts} ${p.shape}`} style={box}>
      <div className={p.shapeBack} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'} style={{ backgroundImage: `url(${paper.src})` }}>
        <svg className={p.sun} viewBox="0 0 60 60" aria-hidden="true">
          <polygon points={sunPoints(30, 30, 17, 28)} />
        </svg>
        <h1 className={p.shapeTitle}>{title}</h1>
        {message ? <p className={p.shapeMessage}>{message}</p> : null}
        <span className={p.rule} aria-hidden="true" />
        {signatures.length ? (
          <Signature signatures={signatures} className={p.shapeSignature} />
        ) : names.length ? (
          <p className={p.shapeNames}>{names.join(` ${labels.and} `)}</p>
        ) : null}
        {qrDataUrl ? (
          <figure className={p.shapeQr}>
            {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
            <img src={qrDataUrl} alt="" />
            <figcaption>{labels.scanToOpen}</figcaption>
          </figure>
        ) : null}
      </div>
    </div>
  );
}
