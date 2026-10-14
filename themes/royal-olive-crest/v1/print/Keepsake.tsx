import { ThemeBorder, type KeepsakeProps } from '@/theme-sdk';
import { CREST_BORDER } from '../border';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import p from './print.module.css';

/**
 * Keepsake of guest messages, A4 portrait: the owner's crest page (#10) as the cover, then the messages
 * on cream pages (never split inside a message), then a closing line. The platform sets the A4 page
 * (no margins); the corner flourishes repeat on every page.
 */
export default function Keepsake({ locale, dir, lang, fields, event, labels, messages, border }: KeepsakeProps) {
  const t = copyFor(locale);
  return (
    <div className={`${fonts.fonts} ${p.keepsake}`} dir={dir} lang={lang}>
      <ThemeBorder border={border} fallback={CREST_BORDER} medium="print" />
      <section className={p.cover}>
        <div className={p.coverInner}>
          <p className={p.coverEyebrow}>{labels.keepsakeTitle}</p>
          <h1 className={p.names}>
            {fields.person_1_name ? <span>{fields.person_1_name}</span> : null}
            {fields.person_1_name && fields.person_2_name ? <span className={p.and}>{labels.and}</span> : null}
            {fields.person_2_name ? <span>{fields.person_2_name}</span> : null}
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
          <span className={p.closingRule} aria-hidden="true" />
          <p>{t.keepsakeClosing}</p>
        </footer>
      </section>
    </div>
  );
}
