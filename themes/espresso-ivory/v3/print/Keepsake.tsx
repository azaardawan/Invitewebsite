import type { KeepsakeProps } from '@/theme-sdk';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import { isLong } from '../names';
import { GoldFrame } from './Frame';
import p from './print.module.css';

/**
 * Keepsake of guest messages, A4: an espresso cover with the ivory card and the names, then the messages on
 * ivory pages (never split inside a message) and a closing line. The gold frame repeats on every page.
 */
export default function Keepsake({ locale, dir, lang, fields, event, labels, messages, border, occasion }: KeepsakeProps) {
  const t = copyFor(locale, occasion);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const date = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  return (
    <div className={`${fonts.fonts} ${p.keepsake}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <GoldFrame border={border} />
      <section className={p.cover}>
        <div className={p.coverInner}>
          <p className={p.kicker}>{labels.keepsakeTitle}</p>
          <div className={p.lace}>
            <h1 className={p.laceNames} data-long={isLong(n1, n2) ? '' : undefined}>
              {n1 ? <span>{n1}</span> : null}
              {n1 && n2 ? <em>{labels.and}</em> : null}
              {n2 ? <span>{n2}</span> : null}
            </h1>
          </div>
          {date ? <p className={p.coverDate}>{date}</p> : null}
          <div className={p.rule} aria-hidden="true">
            <span />
          </div>
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
              <p className={p.messageFrom}>{m.guestName}</p>
            </article>
          ))
        )}
        <footer className={p.closing}>
          <div className={p.rule} aria-hidden="true">
            <span />
          </div>
          <p>{t.keepsakeClosing}</p>
        </footer>
      </section>
    </div>
  );
}
