import { ThemeBorder, type KeepsakeProps } from '@/theme-sdk';
import { BOTANICAL_BORDER } from '../border';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import cap from '../assets/graduation-cap.webp';
import roses from '../assets/ivory-roses.webp';
import p from './print.module.css';

/**
 * Keepsake of guest messages, A4: a cover with the cap, the title and the graduate's name, then the messages on the
 * grey paper (never split inside a message) and a closing line. The botanical corners repeat on every page.
 */
export default function Keepsake({ locale, dir, lang, fields, event, labels, messages, border }: KeepsakeProps) {
  const t = copyFor(locale);
  const date = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  return (
    <div className={`${fonts.fonts} ${p.keepsake}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <div className={p.keepsakeFrame}>
        <ThemeBorder border={border} fallback={BOTANICAL_BORDER} medium="print" />
      </div>
      <section className={p.cover}>
        {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
        <img className={p.coverCap} src={cap.src} alt="" />
        <h1 className={p.coverTitle}>{labels.keepsakeTitle}</h1>
        {fields.person_1_name ? <p className={p.graduate}>{fields.person_1_name}</p> : null}
        {date ? <p className={p.date}>{date}</p> : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
        <img className={p.coverFlowers} src={roses.src} alt="" />
      </section>
      <section className={p.messages}>
        {messages.length === 0 ? <p className={p.empty}>{labels.keepsakeEmpty}</p> : null}
        {messages.map((m, i) => (
          <article key={i} className={p.note}>
            <p dir="auto">{m.message}</p>
            <footer dir="auto">{m.guestName}</footer>
          </article>
        ))}
        <p className={p.closing}>{t.keepsakeClosing}</p>
      </section>
    </div>
  );
}
