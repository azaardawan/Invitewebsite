import { formatNumber, type PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { copyFor } from '../copy';
import { classYear, isLong } from '../names';
import cap from '../assets/graduation-cap.webp';
import roses from '../assets/ivory-roses.webp';
import p from './print.module.css';
import x from './shape.module.css';

/**
 * The arch card (manifest `print.shapes`): the inside page's arch cut out on its own, grey paper inside a double green
 * rule that follows the cut line. Front: the cap, the title, the graduate and the date; back: the customer's words and
 * the QR code. Transparent outside the shape.
 */
export default function Shape({ side, widthMm: w, heightMm: h, outline, locale, dir, lang, fields, event, labels, title, message, qrDataUrl, extraLine }: PrintShapeProps) {
  const t = copyFor(locale);
  const name = fields.person_1_name;
  const typed = fields.class_year?.trim();
  const year = classYear(typed && /^\d+$/.test(typed) ? formatNumber(Number(typed), locale) : typed, event.date?.year);
  const front = side === 'front';
  const inset = (mm: number) => `translate(${mm} ${mm}) scale(${(w - 2 * mm) / w} ${(h - 2 * mm) / h})`;
  return (
    <div className={`${fonts.fonts} ${p.shape} ${x.shape}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <svg className={x.art} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={outline} className={x.ground} />
        <path d={outline} transform={inset(4)} className={x.rule} vectorEffect="non-scaling-stroke" />
        <path d={outline} transform={inset(5.6)} className={x.ruleInner} vectorEffect="non-scaling-stroke" />
      </svg>
      {front ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
          <img className={x.flowers} src={roses.src} alt="" />
          <div className={x.content}>
            {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
            <img className={p.cap} src={cap.src} alt="" />
            <h1 className={`${p.title} ${x.title}`}>
              <span>{t.graduation}</span>
              <em>{t.celebration}</em>
            </h1>
            {year ? (
              <p className={p.class}>
                {t.classOf} {year}
              </p>
            ) : null}
            {name ? (
              <p className={`${p.graduate} ${x.graduate}`} data-long={isLong(name) ? '' : undefined}>
                {name}
              </p>
            ) : null}
            {fields.achievement ? <p className={p.degree}>{fields.achievement}</p> : null}
            <div className={p.rule} aria-hidden="true" />
            {event.date ? <p className={p.date}>{event.date.full}</p> : null}
            {extraLine ? <p className={p.extra}>{extraLine}</p> : null}
          </div>
        </>
      ) : (
        <div className={x.content}>
          <h1 className={`${p.backTitle} ${x.backTitle}`}>{title}</h1>
          {message ? <p className={`${p.backMessage} ${x.message}`}>{message}</p> : null}
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
