import type { PrintShapeProps } from "@/theme-sdk";
import fonts from "../fonts.module.css";
import { copyFor, posterBand } from "../copy";
import { stripScale } from "../names";
import wavy from "../assets/frame-wavy.svg";
import wavyBack from "../assets/frame-wavy-back.svg";
import { FRAMES } from "./frames";
import { ExtraLine, PosterBack, PosterFront, boxStyle } from "./PosterShape";
import p from "./poster.module.css";

/** The red band over the poster's «WEDDING» (an engagement): the title's box, its band part (% of the card). */
const BAND = [23.15, 21.31, 53.6, 11.88] as const;

/**
 * The printed frame (manifest `print.shapes`): the owner's poster on wavy letter paper, its «WEDDING Invitation» title
 * (with the engagement band when sold as one), the couple's names on the two red strips, the message, the date, time
 * and place. Back: the frame alone, with the customer's title and message, the names and the QR code.
 */
export default function Shape({
  side,
  locale,
  dir,
  lang,
  fields,
  event,
  labels,
  title,
  message,
  qrDataUrl,
  extraLine,
  occasion,
}: PrintShapeProps) {
  const frame = FRAMES.arch;
  const t = copyFor(locale, occasion);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const date = event.date
    ? `${event.date.day} ${event.date.month} ${event.date.year}`
    : null;
  const band = posterBand(occasion);
  return (
    <div
      className={`${fonts.fonts} ${p.poster}`}
      dir={dir}
      lang={lang}
      data-script={locale === "en" ? "latin" : "arabic"}
    >
      {side === "front" ? (
        <PosterFront
          frame={frame}
          art={wavy.src}
          lines={{
            kicker: t.dear,
            message: fields.invitation_message || t.presence,
            date,
            time: event.time,
            venue: fields.venue_name,
          }}
        >
          {band ? (
            <p className={`${p.box} ${p.band}`} style={boxStyle(BAND)}>
              {band}
            </p>
          ) : null}
          {n1 ? (
            <p
              className={`${p.box} ${p.strip}`}
              style={{
                ...boxStyle(frame.boxes.strip1),
                fontSize: `${6 * stripScale(n1)}mm`,
              }}
            >
              {n1}
            </p>
          ) : null}
          {n2 ? (
            <p
              className={`${p.box} ${p.strip} ${p.stripTwo}`}
              style={{
                ...boxStyle(frame.boxes.strip2),
                fontSize: `${6 * stripScale(n2)}mm`,
              }}
            >
              {n2}
            </p>
          ) : null}
          <ExtraLine frame={frame} text={extraLine} />
        </PosterFront>
      ) : (
        <PosterBack
          art={wavyBack.src}
          ink="#78291f"
          title={title}
          message={message}
          names={[n1, n2].filter(Boolean).join(` ${labels.and} `)}
          qrDataUrl={qrDataUrl}
          scanToOpen={labels.scanToOpen}
        />
      )}
    </div>
  );
}
