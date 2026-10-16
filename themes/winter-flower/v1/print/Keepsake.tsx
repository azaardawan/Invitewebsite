import { ThemeBorder, type KeepsakeProps } from '@/theme-sdk';
import { RULE_BORDER } from '../border';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import { nameScale } from '../names';
import flourish from '../assets/flourish.webp';
import { Flowers } from './Flowers';
import p from './print.module.css';

/**
 * Keepsake of guest messages, A4: a cover like the card (flowers, names, date), then the messages on white pages
 * between the double rules (never split inside a message) and a closing line.
 */
export default function Keepsake({ locale, dir, lang, fields, event, labels, messages, border }: KeepsakeProps) {
  const t = copyFor(locale);
  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  return (
    <div className={`${fonts.fonts} ${p.keepsake}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <ThemeBorder border={border} fallback={RULE_BORDER} medium="print" />
      <section className={p.cover}>
        <Flowers />
        <div className={p.coverInner}>
          <p className={p.kicker}>{labels.keepsakeTitle}</p>
          <h1 className={p.names}>
            {n1 ? <span style={{ fontSize: `${nameScale(n1)}em` }}>{n1}</span> : null}
            {n1 && n2 ? <span className={p.and}>{labels.and}</span> : null}
            {n2 ? <span style={{ fontSize: `${nameScale(n2)}em` }}>{n2}</span> : null}
          </h1>
          {event.date ? (
            <p className={p.big}>
              {event.date.day} {event.date.month} {event.date.year}
            </p>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
          <img className={p.flourish} src={flourish.src} alt="" />
        </div>
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
        <footer className={p.closing}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
          <img className={p.flourish} src={flourish.src} alt="" />
          <p>{t.keepsakeClosing}</p>
        </footer>
      </section>
    </div>
  );
}
