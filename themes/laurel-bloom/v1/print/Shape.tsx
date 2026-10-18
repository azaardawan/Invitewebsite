import { formatNumber, type PrintShapeProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { copyFor } from '../copy';
import { classYear } from '../names';
import corners from '../assets/frame-corners.svg';
import cornersBack from '../assets/frame-corners-back.svg';
import oval from '../assets/frame-oval.svg';
import ovalBack from '../assets/frame-oval-back.svg';
import { FRAMES } from './frames';
import { ExtraLine, PosterBack, PosterFront } from './PosterShape';
import p from './poster.module.css';

const ART = {
  oval: [oval, ovalBack],
  corners: [corners, cornersBack],
} as const;

/**
 * The printed frames (manifest `print.shapes`): the owner's posters, an oval and rounded corners, with the cap and the
 * flowers. Front: the class year, «graduation», the graduate's name and degree, the message, the date, time and place
 * where the poster has its own. Back: the frame alone, with the customer's title and message and the QR code.
 */
export default function Shape({ shape, side, locale, dir, lang, fields, event, labels, title, message, qrDataUrl, extraLine }: PrintShapeProps) {
  const frame = FRAMES[shape as keyof typeof FRAMES] ?? FRAMES['arch-oval'];
  const [front, back] = ART[frame.art];
  const t = copyFor(locale);
  const name = fields.person_1_name;
  const typed = fields.class_year?.trim();
  const year = classYear(typed && /^\d+$/.test(typed) ? formatNumber(Number(typed), locale) : typed, event.date?.year);
  const date = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  return (
    <div className={`${fonts.fonts} ${p.poster}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {side === 'front' ? (
        <PosterFront
          frame={frame}
          art={front.src}
          lines={{
            classOf: year ? `${t.classOf} ${year}` : null,
            title: t.graduation,
            name,
            achievement: fields.achievement,
            message: fields.invitation_message || t.presence,
            date,
            time: event.time,
            venue: fields.venue_name,
          }}
        >
          <ExtraLine frame={frame} text={extraLine} />
        </PosterFront>
      ) : (
        <PosterBack art={back.src} ink="#20443b" title={title} message={message} names={name ?? ''} qrDataUrl={qrDataUrl} scanToOpen={labels.scanToOpen} />
      )}
    </div>
  );
}
