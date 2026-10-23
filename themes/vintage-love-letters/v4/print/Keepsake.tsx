import { ThemeBorder, type KeepsakeProps } from '@/theme-sdk';
import { LACE_BORDER } from '../border';
import { copyFor, posterBand } from '../copy';
import fonts from '../fonts.module.css';
import { PosterLayers } from './Poster';
import p from './print.module.css';

/**
 * Keepsake of guest messages, A4: the poster with the couple's names as the cover, then the messages on the
 * poster's paper between the lace borders (never split inside a message) and a closing line.
 */
export default function Keepsake({ locale, dir, lang, fields, labels, messages, border, occasion }: KeepsakeProps) {
  const t = copyFor(locale, occasion);
  return (
    <div className={`${fonts.fonts} ${p.keepsake}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <ThemeBorder border={border} fallback={LACE_BORDER} medium="print" />
      <section className={`${p.cover} ${p.poster}`}>
        <PosterLayers n1={fields.person_1_name} n2={fields.person_2_name} band={posterBand(occasion)} />
      </section>

      <section className={p.messages}>
        <h2 className={p.messagesTitle}>{labels.keepsakeTitle}</h2>
        {messages.length === 0 ? (
          <p className={p.empty}>{labels.keepsakeEmpty}</p>
        ) : (
          messages.map((m, i) => (
            <article key={i} className={p.note}>
              <p className={p.noteText}>{m.message}</p>
              <p className={p.noteFrom}>{m.guestName}</p>
            </article>
          ))
        )}
        <p className={p.closing}>{t.keepsakeClosing}</p>
      </section>
    </div>
  );
}
