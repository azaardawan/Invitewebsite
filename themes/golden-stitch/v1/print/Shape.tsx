import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import frontTop from '../assets/arch-front-top.webp';
import frontDivider from '../assets/arch-front-divider.webp';
import frontBottom from '../assets/arch-front-bottom.webp';
import backTop from '../assets/arch-back-top.webp';
import backDivider from '../assets/arch-back-divider.webp';
import backBottom from '../assets/arch-back-bottom.webp';
import burgRect from '../assets/burg-rect.webp';
import burgArch from '../assets/burg-arch.webp';
import { EVENT_DEFAULT, copyFor, withEvent } from '../copy';
import { QrCodes, numericDate } from './Ornaments';
import p from './print.module.css';

/**
 * The arch card (manifest `print.shapes`, feature `card_arch`), as the owner drew it (2026-11-26): the scalloped card
 * with its double gold line (the same on both sides; the outline is symmetric).
 * Front: a flowering branch, the names stacked ("Aza", "&", "Raghad"), a star divider, the date and a small sprig.
 * Back: a branch of tiny blossoms, the customer's title and message in italics, an arrow divider, the QR code(s) and a
 * sprig. Transparent outside the arch.
 */
export default function Shape(props: PrintShapeProps) {
  if (props.shape === 'arch-frame') return <Burgundy {...props} />;
  if (props.shape === 'arch-lantern') return <Burgundy {...props} />;
  return <GoldArch {...props} />;
}

function GoldArch({ side, dir, lang, locale, fields, labels, title, message, qrDataUrl, photoQrDataUrl, extraLine }: PrintShapeProps) {
  const one = fields.person_1_name;
  const two = fields.person_2_name;
  const date = numericDate(fields.event_date, locale);
  return (
    <div className={`${fonts.fonts} ${p.arch}`} dir={dir} lang={lang}>
      {side === 'front' ? (
        <>
          {/* eslint-disable @next/next/no-img-element -- print document */}
          <img className={p.archFrontTop} src={frontTop.src} alt="" />
          <h1 className={p.archNames}>
            {one ? <span style={{ fontSize: `${archScale(one)}em` }}>{one}</span> : null}
            {one && two ? <span className={p.archAnd}>{labels.and}</span> : null}
            {two ? <span style={{ fontSize: `${archScale(two)}em` }}>{two}</span> : null}
          </h1>
          <img className={p.archFrontDivider} src={frontDivider.src} alt="" />
          {date ? (
            <p className={p.archDate} dir="ltr">
              {date}
            </p>
          ) : null}
          {extraLine ? <p className={p.archExtra}>{extraLine}</p> : null}
          <img className={p.archFrontBottom} src={frontBottom.src} alt="" />
          {/* eslint-enable @next/next/no-img-element */}
        </>
      ) : (
        <>
          {/* eslint-disable @next/next/no-img-element -- print document */}
          <img className={p.archBackTop} src={backTop.src} alt="" />
          <div className={p.archWords}>
            <h1 className={p.archTitle} data-long={title.length > 44 ? '' : undefined}>
              {title}
            </h1>
            {message ? (
              <p className={p.archMessage} data-long={message.length > 110 ? '' : undefined}>
                {message}
              </p>
            ) : null}
          </div>
          <img className={p.archBackDivider} src={backDivider.src} alt="" />
          <QrCodes qr={qrDataUrl} photoQr={photoQrDataUrl} labels={labels} className={p.archQrs} />
          <img className={p.archBackBottom} src={backBottom.src} alt="" />
          {/* eslint-enable @next/next/no-img-element */}
        </>
      )}
    </div>
  );
}

/** A long name is written smaller so it stays on one line inside the arch (up to 30 letters). */
function archScale(name: string): number {
  return Math.min(1, 9 / Math.max(1, Array.from(name).length));
}

/**
 * The two burgundy-and-gold cards (owner, 2026-11-26), on the owner's painted artwork (its lettering removed):
 * `arch-frame`, the rectangle with flowers in two corners; `arch-lantern`, the arch with the hanging lantern. Each
 * uses the same artwork on both sides. Front: "The Wedding of", the names with a gold "&", the date. Back: the
 * customer's title and message in italics, "With love" and the QR code(s).
 */
function Burgundy({ shape, side, dir, lang, locale, fields, labels, title, message, qrDataUrl, photoQrDataUrl, extraLine, wording, eventWording }: PrintShapeProps) {
  const t = copyFor(locale, eventWording);
  const lantern = shape === 'arch-lantern';
  const one = fields.person_1_name;
  const two = fields.person_2_name;
  const date = numericDate(fields.event_date, locale);
  const kind = lantern ? p.burgLantern : p.burgFrame;
  return (
    <div
      className={`${fonts.fonts} ${p.burg} ${kind}`}
      data-side={side}
      dir={dir}
      lang={lang}
      style={{ backgroundImage: `url(${(lantern ? burgArch : burgRect).src})` }}
    >
      {side === 'front' ? (
        <div className={p.burgFront}>
          <p className={p.burgWeddingOf}>{withEvent(t.weddingOf, wording.eventName, EVENT_DEFAULT[locale])}</p>
          <h1 className={p.burgNames}>
            {one ? <span style={{ fontSize: `${archScale(one)}em` }}>{one}</span> : null}
            {one && two ? <span className={p.burgAnd}>{labels.and}</span> : null}
            {two ? <span style={{ fontSize: `${archScale(two)}em` }}>{two}</span> : null}
          </h1>
          {date ? (
            <p className={p.burgDate} dir="ltr">
              {date}
            </p>
          ) : null}
          {extraLine ? <p className={p.burgExtra}>{extraLine}</p> : null}
        </div>
      ) : (
        <div className={p.burgBack}>
          <h1 className={p.burgTitle} data-long={title.length > 44 ? '' : undefined}>
            {title}
          </h1>
          {message ? (
            <p className={p.burgMessage} data-long={message.length > 110 ? '' : undefined}>
              {message}
            </p>
          ) : null}
          <p className={p.burgWithLove}>{t.withLoveShort}</p>
          <QrCodes qr={qrDataUrl} photoQr={photoQrDataUrl} labels={labels} className={p.burgQrs} />
        </div>
      )}
    </div>
  );
}
