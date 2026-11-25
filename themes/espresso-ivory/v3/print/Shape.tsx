import type { PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { copyFor } from '../copy';
import crest from '../assets/frame-crest.svg';
import crestBack from '../assets/frame-crest-back.svg';
import { FRAMES } from './frames';
import { ExtraLine, PosterBack, PosterFront } from './PosterShape';
import p from './poster.module.css';

/**
 * The printed frame (manifest `print.shapes`): the owner's poster, an ivory crest with the bouquet and the gold seal.
 * Front: the couple's names, the message, the date, time and place where the poster has its own. Back: the crest alone,
 * with the customer's title and message, the names and the QR code.
 */
export default function Shape({ side, locale, dir, lang, fields, event, labels, title, message, qrDataUrl, extraLine, occasion }: PrintShapeProps) {
  const frame = FRAMES.arch;
  const t = copyFor(locale, occasion);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const date = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  return (
    <div className={`${fonts.fonts} ${p.poster}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {side === 'front' ? (
        <PosterFront
          frame={frame}
          art={crest.src}
          lines={{
            kicker: t.wedding,
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
          art={crestBack.src}
          ink="#38271f"
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
