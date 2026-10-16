import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { copyFor } from '../copy';
import { stripScale } from '../names';
import paper from '../assets/paper.webp';
import rose from '../assets/rose.webp';
import seal from '../assets/wax-seal.webp';
import p from './shape.module.css';

/**
 * The shaped cards (manifest `print.shapes`): a heart and a tall arch cut from the poster's lined letter paper, inside
 * a double wine rule that follows the cut line. Front: the rose, the names on the poster's two red strips, the date
 * and the wax seal; back: the customer's title and message, the names and the QR code.
 */
export default function Shape({ shape, side, widthMm: w, heightMm: h, outline, locale, dir, lang, fields, event, labels, title, message, qrDataUrl, extraLine, occasion }: PrintShapeProps) {
  const t = copyFor(locale, occasion);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const front = side === 'front';
  const kind = shape === 'arch' ? 'arch' : 'heart';
  const clip = `vl-${kind}-${side}`;
  const inset = (mm: number) => `translate(${mm} ${mm}) scale(${(w - 2 * mm) / w} ${(h - 2 * mm) / h})`;
  return (
    <div className={`${fonts.fonts} ${p.shape} ${p[kind]} ${front ? p.front : p.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <svg className={p.art} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <clipPath id={clip}>
          <path d={outline} />
        </clipPath>
        <path d={outline} className={p.ground} />
        {/* the paper is drawn larger, from its lower left, so its curled upper-right corner falls outside the card */}
        <g clipPath={`url(#${clip})`}>
          <image href={paper.src} x="0" y={-h * 0.3} width={w * 1.3} height={h * 1.3} preserveAspectRatio="xMinYMax slice" />
        </g>
        <path d={outline} transform={inset(3.5)} className={p.rule} vectorEffect="non-scaling-stroke" />
        <path d={outline} transform={inset(5)} className={p.ruleInner} vectorEffect="non-scaling-stroke" />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      {front ? <img className={p.rose} src={rose.src} alt="" /> : null}
      {front ? (
        <div className={p.content}>
          <p className={p.kicker}>{t.letterLove}</p>
          <div className={p.strips} dir="ltr">
            {n1 ? (
              <p className={`${p.strip} ${p.stripOne}`}>
                <span style={{ fontSize: `${stripScale(n1)}em` }}>{n1}</span>
              </p>
            ) : null}
            {n2 ? (
              <p className={`${p.strip} ${p.stripTwo}`}>
                <span style={{ fontSize: `${stripScale(n2)}em` }}>{n2}</span>
              </p>
            ) : null}
          </div>
          {event.date ? <p className={p.date}>{event.date.full}</p> : null}
          {kind === 'arch' && event.time ? <p className={p.small}>{event.time}</p> : null}
          {kind === 'arch' && fields.venue_name ? <p className={p.small}>{fields.venue_name}</p> : null}
          {extraLine ? <p className={p.small}>{extraLine}</p> : null}
          {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
          <img className={p.seal} src={seal.src} alt="" />
        </div>
      ) : (
        <div className={p.content}>
          <h1 className={p.title}>{title}</h1>
          {message ? (
            <p className={p.message} data-long={message.length > 150 ? '' : undefined}>
              {message}
            </p>
          ) : null}
          <p className={p.backNames}>{[n1, n2].filter(Boolean).join(` ${labels.and} `)}</p>
          {qrDataUrl ? (
            <figure className={p.qr}>
              {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
              <img src={qrDataUrl} alt="" />
              <figcaption>{labels.scanToOpen}</figcaption>
            </figure>
          ) : null}
        </div>
      )}
    </div>
  );
}
