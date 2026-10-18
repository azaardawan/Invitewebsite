import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { copyFor } from '../copy';
import { sealText } from '../initials';
import corners from '../assets/frame-corners.svg';
import cornersBack from '../assets/frame-corners-back.svg';
import cut from '../assets/frame-cut.svg';
import cutBack from '../assets/frame-cut-back.svg';
import { FRAMES } from './frames';
import { ExtraLine, PosterBack, PosterFront, boxStyle } from './PosterShape';
import { PrintSeal } from './PrintSeal';
import p from './poster.module.css';

const ART = { cut: [cut, cutBack], corners: [corners, cornersBack] } as const;

/**
 * The printed frames (manifest `print.shapes`): the owner's posters, a frame with cut corners and one with rounded corners. Front:
 * the poster (the wine ground, the lace square) with the couple's names on the lace, the date and place under it, and
 * the wax seal with their initials where the poster has its seal. Back: the frame alone, with the customer's title and
 * message, the names and the QR code.
 */
export default function Shape({
  shape,
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
  wording,
  switches,
  occasion,
}: PrintShapeProps) {
  const frame = FRAMES[shape as keyof typeof FRAMES] ?? FRAMES['arch-cut'];
  const [front, back] = ART[frame.art];
  const t = copyFor(locale, occasion);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const date = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  const seal = switches.sealInitials === false ? null : sealText(fields, wording.sealJoin ?? '&');
  return (
    <div className={`${fonts.fonts} ${p.poster}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {side === 'front' ? (
        <PosterFront
          frame={frame}
          art={front.src}
          lines={{
            kicker: t.wedding,
            name1: n1,
            and: n1 && n2 ? labels.and : null,
            name2: n2,
            message: fields.invitation_message || t.presence,
            date,
            timeVenue: [event.time, fields.venue_name].filter(Boolean).join(' · '),
          }}
        >
          <ExtraLine frame={frame} text={extraLine} />
          <div className={p.box} style={boxStyle(frame.boxes.seal)}>
            <PrintSeal seal={seal} id={`${shape}-front`} className={p.fill} />
          </div>
        </PosterFront>
      ) : (
        <PosterBack
          art={back.src}
          ink="#f5ecda"
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
