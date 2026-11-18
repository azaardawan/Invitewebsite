import { ThemeBorder, type PrintCardProps } from '@/theme-sdk';
import { LACE_BORDER } from '../border';
import fonts from '../fonts.module.css';
import { posterBand } from '../copy';
import { PosterLayers } from './Poster';
import p from './print.module.css';

/**
 * Printable invitation, A5 portrait: the source poster with the customer's names and the details, large and easy to
 * read. The QR code is on the back (CardBack), under the names.
 */
export default function Card({ locale, dir, lang, fields, event, extraLine, border, occasion }: PrintCardProps) {
  return (
    <div className={`${fonts.fonts} ${p.card} ${p.poster}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {/* The poster already has its lace down the left edge; an owner's border is drawn over it. */}
      {border ? <ThemeBorder border={border} fallback={LACE_BORDER} medium="print" /> : null}
      <PosterLayers n1={fields.person_1_name} n2={fields.person_2_name} band={posterBand(occasion)}>
        <div className={p.details}>
          {event.date ? (
            <p className={p.date}>{event.date.full}</p>
          ) : null}
          {event.time ? <p className={p.time}>{event.time}</p> : null}
          {fields.venue_name ? <p className={p.venue}>{fields.venue_name}</p> : null}
          {extraLine ? <p className={p.extra}>{extraLine}</p> : null}
        </div>
      </PosterLayers>
    </div>
  );
}
