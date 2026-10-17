import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { copyFor } from '../copy';
import { isLong } from '../names';
import paper from '../assets/paper.webp';
import rosesTop from '../assets/roses-top.webp';
import rosesBottom from '../assets/roses-bottom.webp';
import laurel from '../assets/laurel-cap.webp';
import { numericDate, yearOf } from './shared';
import p from './print.module.css';

const GOLD: [number, string][] = [
  [0, '#a67a12'],
  [0.17, '#a87c14'],
  [0.3, '#f2df77'],
  [0.48, '#fff7bc'],
  [0.62, '#dac37e'],
  [0.765, '#935e00'],
  [0.96, '#eab30e'],
];

/**
 * The arch card (manifest `print.shapes`): the poster's gold arch cut out on its own. The poster's paper inside a gold
 * rule that follows the cut line, the roses tucked into the corners. Front: the laurel, the name, the date and the
 * venue; back: the customer's words and the QR code. Transparent outside the shape.
 */
export default function Shape({ shape, side, widthMm: w, heightMm: h, outline, locale, dir, lang, fields, event, labels, title, message, qrDataUrl, extraLine, wording }: PrintShapeProps) {
  const t = copyFor(locale);
  const name = fields.person_1_name;
  const year = yearOf(fields.class_year, event.date?.year, locale);
  const date = numericDate(fields.event_date, locale);
  const front = side === 'front';
  const id = `ga-${shape}-${side}`;
  const inset = (mm: number) => `translate(${mm} ${mm}) scale(${(w - 2 * mm) / w} ${(h - 2 * mm) / h})`;
  return (
    <div className={`${fonts.fonts} ${p.shape}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <svg className={p.shapeArt} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-clip`}>
            <path d={outline} />
          </clipPath>
          <linearGradient id={`${id}-gold`} gradientUnits="userSpaceOnUse" x1={-0.2 * w} y1={0.2 * w} x2={1.05 * w} y2={1.46 * w}>
            {GOLD.map(([o, col]) => (
              <stop key={o} offset={o} stopColor={col} />
            ))}
          </linearGradient>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          <rect width={w} height={h} fill="#efeeed" />
          <image href={paper.src} x="0" y="0" width={w} height={h} preserveAspectRatio="xMidYMid slice" />
          {front ? (
            <>
              <image href={rosesTop.src} x={-0.16 * w} y={-0.05 * w} width={0.6 * w} height={0.6 * w * (1053 / 760)} />
              <image href={rosesBottom.src} x={0.62 * w} y={h - 0.62 * w} width={0.46 * w} height={0.46 * w * (764 / 520)} />
            </>
          ) : null}
        </g>
        <path d={outline} transform={inset(3.5)} fill="none" stroke={`url(#${id}-gold)`} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      </svg>
      {front ? (
        <div className={p.shapeContent}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
          <img className={p.shapeLaurel} src={laurel.src} alt="" />
          {name ? (
            <h1 className={`${p.name} ${p.shapeName}`} data-long={isLong(name) ? '' : undefined}>
              {name}
            </h1>
          ) : null}
          {fields.achievement || year ? <p className={p.standing}>{[fields.achievement, year ? `${t.classOf} ${year}` : null].filter(Boolean).join(' · ')}</p> : null}
          {date || event.time ? (
            <p className={`${p.when} ${p.shapeWhen}`} dir="ltr">
              {date ? <span>{date}</span> : null}
              {date && event.time ? <span className={p.bar} /> : null}
              {event.time ? <span dir={dir}>{event.time}</span> : null}
            </p>
          ) : null}
          {fields.venue_name ? <p className={p.venue}>{fields.venue_name}</p> : null}
          {wording.followLine ? <p className={p.follow}>{wording.followLine}</p> : null}
          {extraLine ? <p className={p.extra}>{extraLine}</p> : null}
        </div>
      ) : (
        <div className={p.shapeContent}>
          <h1 className={p.backTitle}>{title}</h1>
          {message ? <p className={p.backMessage}>{message}</p> : null}
          {name ? <p className={p.backName}>{name}</p> : null}
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
