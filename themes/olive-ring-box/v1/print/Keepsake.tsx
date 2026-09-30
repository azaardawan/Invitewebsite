import { formatEventDate } from '@/theme-sdk/format';
import type { KeepsakeProps } from '@/theme-sdk/print';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import { Rule } from './Card';
import p from './print.module.css';

/**
 * Keepsake of guest messages, A4 portrait: a full-page cover, then messages
 * flowing across as many pages as needed (never split inside a message), then
 * a closing line. The host sets `@page` size, margins and page numbers.
 */
export default function Keepsake({ locale, dir, fields, messages }: KeepsakeProps) {
  const t = copyFor(locale);
  return (
    <div className={`${fonts.fonts} ${p.keepsake}`} dir={dir} lang={locale === 'en' ? 'en' : 'ar'}>
      <section className={p.cover}>
        <span className={p.coverBranchTop} aria-hidden="true" />
        <span className={p.coverBranchBottom} aria-hidden="true" />
        <div className={p.coverInner}>
          <p className={p.coverEyebrow}>{t.keepsakeTitle}</p>
          <Rule />
          <h1 className={p.coverNames}>
            <span>{fields.person_1_name}</span>
            <span className={p.cardAnd}>{t.and}</span>
            <span>{fields.person_2_name}</span>
          </h1>
          <p className={p.coverDate}>{formatEventDate(fields.event_date, locale)}</p>
          <p className={p.coverSub}>{t.keepsakeSubtitle}</p>
        </div>
      </section>

      <section className={p.messages}>
        <h2 className={p.messagesTitle}>{t.keepsakeTitle}</h2>
        {messages.length === 0 ? (
          <p className={p.empty}>{t.keepsakeEmpty}</p>
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
