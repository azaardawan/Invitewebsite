import { ThemeBorder, type KeepsakeProps } from '@/theme-sdk';
import { OLIVE_BORDER } from '../border';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import { Rule } from './Card';
import p from './print.module.css';

/**
 * Keepsake of guest messages, A4 portrait: a full-page cover, then messages
 * flowing across as many pages as needed (never split inside a message), then
 * a closing line. The platform sets the A4 page (no margins); the border repeats on every page.
 */
export default function Keepsake({ locale, dir, lang, fields, event, labels, messages, border }: KeepsakeProps) {
  const t = copyFor(locale);
  return (
    <div className={`${fonts.fonts} ${p.keepsake}`} dir={dir} lang={lang}>
      {/* Fixed in print: the same corner branches on the cover and on every message page. */}
      <ThemeBorder border={border} fallback={OLIVE_BORDER} medium="print" />
      <section className={p.cover}>
        <div className={p.coverInner}>
          <p className={p.coverEyebrow}>{labels.keepsakeTitle}</p>
          <Rule />
          <h1 className={p.coverNames}>
            <span>{fields.person_1_name}</span>
            {fields.person_2_name ? (
              <>
                <span className={p.cardAnd}>{t.and}</span>
                <span>{fields.person_2_name}</span>
              </>
            ) : null}
          </h1>
          {event.date ? <p className={p.coverDate}>{event.date.full}</p> : null}
          <p className={p.coverSub}>{t.keepsakeSubtitle}</p>
        </div>
      </section>

      <section className={p.messages}>
        <h2 className={p.messagesTitle}>{labels.keepsakeTitle}</h2>
        {messages.length === 0 ? (
          <p className={p.empty}>{labels.keepsakeEmpty}</p>
        ) : (
          messages.map((m, i) => (
            <article key={i} className={p.message}>
              <p className={p.messageText}>{m.message}</p>
              <p className={p.messageFrom}>— {m.guestName}</p>
            </article>
          ))
        )}
        <footer className={p.closing}>
          <span className={p.closingSprig} aria-hidden="true" />
          <p>{t.keepsakeClosing}</p>
        </footer>
      </section>
    </div>
  );
}
