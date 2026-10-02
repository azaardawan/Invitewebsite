import type { KeepsakeProps } from '@/theme-sdk';
import { Diamond, Names } from './Ornament';
import p from './print.module.css';

/**
 * Keepsake of guest messages, A4 portrait: a full-page painted cover, then the
 * messages flowing over as many pages as needed (never split inside one).
 * The platform sets `@page` size, margins and page numbers.
 */
export default function Keepsake({ dir, lang, fields, event, labels, messages }: KeepsakeProps) {
  return (
    <div className={p.keepsake} dir={dir} lang={lang}>
      <section className={p.cover}>
        <span className={`${p.side} ${p.sideLeft}`} aria-hidden="true" />
        <span className={`${p.side} ${p.sideRight}`} aria-hidden="true" />
        <span className={p.coverScene} aria-hidden="true" />
        <div className={p.coverInner}>
          <Diamond />
          <p className={p.coverEyebrow}>{labels.keepsakeTitle}</p>
          <Names first={fields.person_1_name} second={fields.person_2_name} and={labels.and} className={p.coverNames} />
          {event.date ? <p className={p.coverDate}>{event.date.full}</p> : null}
        </div>
      </section>

      <section className={p.messages}>
        <h2 className={p.messagesTitle}>{labels.keepsakeTitle}</h2>
        {messages.length === 0 ? (
          <p className={p.empty}>{labels.keepsakeEmpty}</p>
        ) : (
          messages.map((m, i) => (
            <article key={i} className={p.message}>
              <p className={p.messageText} dir="auto">
                {m.message}
              </p>
              <p className={p.messageFrom} dir="auto">
                — {m.guestName}
              </p>
            </article>
          ))
        )}
        <footer className={p.closing}>
          <Diamond small />
        </footer>
      </section>
    </div>
  );
}
