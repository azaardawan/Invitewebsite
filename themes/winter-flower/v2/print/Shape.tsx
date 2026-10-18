import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { copyFor } from '../copy';
import corners from '../assets/frame-corners.svg';
import cornersBack from '../assets/frame-corners-back.svg';
import oval from '../assets/frame-oval.svg';
import ovalBack from '../assets/frame-oval-back.svg';
import wavy from '../assets/frame-wavy.svg';
import wavyBack from '../assets/frame-wavy-back.svg';
import { FRAMES } from './frames';
import { ExtraLine, PosterBack, PosterFront } from './PosterShape';
import p from './poster.module.css';

const ART = {
  oval: [oval, ovalBack],
  wavy: [wavy, wavyBack],
  corners: [corners, cornersBack],
} as const;

/**
 * The printed frames (manifest `print.shapes`): the owner's posters, an oval, a wavy frame and rounded corners, each
 * with the winter flowers. Front: «save the date», the couple's names, the message, the date, time and place where the
 * poster has its own. Back: the frame alone, with the customer's title and message, the names and the QR code.
 */
export default function Shape({ shape, side, locale, dir, lang, fields, event, labels, title, message, qrDataUrl, extraLine, occasion }: PrintShapeProps) {
  const frame = FRAMES[shape as keyof typeof FRAMES] ?? FRAMES['arch-oval'];
  const [front, back] = ART[frame.art];
  const t = copyFor(locale, occasion);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const date = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  return (
    <div className={`${fonts.fonts} ${p.poster}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {side === 'front' ? (
        <PosterFront
          frame={frame}
          art={front.src}
          lines={{
            kicker1: t.saveDate,
            kicker2: t.weddingOf,
            name1: n1,
            and: n1 && n2 ? labels.and : null,
            name2: n2,
            message: fields.invitation_message || t.presence,
            date,
            time: event.time,
            venue: fields.venue_name,
          }}
        >
          <ExtraLine frame={frame} text={extraLine} />
        </PosterFront>
      ) : (
        <PosterBack
          art={back.src}
          ink="#3f535e"
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
