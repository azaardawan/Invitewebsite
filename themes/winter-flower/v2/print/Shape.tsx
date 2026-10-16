import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { copyFor } from '../copy';
import { nameScale } from '../names';
import left from '../assets/flowers-left.webp';
import right from '../assets/flowers-right.webp';
import flourish from '../assets/flourish.webp';
import p from './print.module.css';
import x from './shape.module.css';

/**
 * The shaped cards (manifest `print.shapes`): a heart and a tall arch, white like the A5 card, inside a fine double
 * slate rule that follows the cut line, with the design's two winter flower stems growing in from the edge (cut with
 * the card). Front: the names and the date; back: the customer's title and message, the names and the QR code.
 */
export default function Shape({ shape, side, widthMm: w, heightMm: h, outline, locale, dir, lang, fields, event, labels, title, message, qrDataUrl, extraLine, occasion }: PrintShapeProps) {
  const t = copyFor(locale, occasion);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const front = side === 'front';
  const kind = shape === 'arch' ? 'arch' : 'heart';
  const clip = `wf-${kind}-${side}`;
  const inset = (mm: number) => `translate(${mm} ${mm}) scale(${(w - 2 * mm) / w} ${(h - 2 * mm) / h})`;
  // the stems: upper left and lower right on the arch, one on each lobe of the heart; smaller on the back
  const stem = (front ? 1 : 0.72) * (kind === 'arch' ? 92 : 74);
  const stems =
    kind === 'arch'
      ? [
          { src: left.src, x: 1, y: 3, h: stem },
          { src: right.src, x: w - stem * (209 / 859) - 1, y: h - stem - 2, h: stem, ratio: 209 / 859 },
        ]
      : [
          { src: left.src, x: 7, y: 6, h: stem },
          { src: right.src, x: w - stem * (209 / 859) - 7, y: 6, h: stem, ratio: 209 / 859 },
        ];
  return (
    <div className={`${fonts.fonts} ${x.shape} ${x[kind]} ${front ? x.front : x.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <svg className={x.art} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <clipPath id={clip}>
          <path d={outline} />
        </clipPath>
        <path d={outline} className={x.ground} />
        <g clipPath={`url(#${clip})`}>
          {stems.map((s, i) => (
            <image key={i} href={s.src} x={s.x} y={s.y} height={s.h} width={s.h * (s.ratio ?? 213 / 870)} preserveAspectRatio="xMidYMid meet" />
          ))}
        </g>
        <path d={outline} transform={inset(3.5)} className={x.rule} vectorEffect="non-scaling-stroke" />
        <path d={outline} transform={inset(5)} className={x.ruleInner} vectorEffect="non-scaling-stroke" />
      </svg>
      {front ? (
        <div className={x.content}>
          <p className={p.kicker}>{t.weddingOf}</p>
          <h1 className={`${p.names} ${x.names}`}>
            {n1 ? <span style={{ fontSize: `${nameScale(n1)}em` }}>{n1}</span> : null}
            {n1 && n2 ? <span className={p.and}>{labels.and}</span> : null}
            {n2 ? <span style={{ fontSize: `${nameScale(n2)}em` }}>{n2}</span> : null}
          </h1>
          {event.date ? (
            <>
              <p className={p.kicker}>{event.date.weekday}</p>
              <p className={p.big}>
                {event.date.day} {event.date.month} {event.date.year}
              </p>
            </>
          ) : null}
          {kind === 'arch' && fields.venue_name ? <p className={p.venue}>{fields.venue_name}</p> : null}
          {extraLine ? <p className={p.extra}>{extraLine}</p> : null}
          {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
          <img className={x.flourish} src={flourish.src} alt="" />
        </div>
      ) : (
        <div className={x.content}>
          <h1 className={`${p.backTitle} ${x.title}`}>{title}</h1>
          {message ? (
            <p className={`${p.backMessage} ${x.message}`} data-long={message.length > 150 ? '' : undefined}>
              {message}
            </p>
          ) : null}
          <p className={`${p.backNames} ${x.backNames}`}>{[n1, n2].filter(Boolean).join(` ${labels.and} `)}</p>
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
