import { ThemeBorder, type KeepsakeProps } from '@/theme-sdk';
import { KILIM_BORDER } from '../border';
import { copyFor, coupleNames } from '../copy';
import fonts from '../fonts.module.css';
import garland from '../assets/garland.webp';
import rosette from '../assets/rosette.webp';
import kilimBand from '../assets/kilim-band.webp';
import p from './print.module.css';

/**
 * Keepsake of guest messages, A4: a cover with the garland, the kilim rosette, the title and the couple's names, then
 * the messages on the cream wall (never split inside a message) and a closing line. The kilim strips repeat on every page.
 */
export default function Keepsake({ locale, dir, lang, fields, event, labels, messages, border }: KeepsakeProps) {
  const t = copyFor(locale);
  const names = coupleNames(fields.person_1_name, fields.person_2_name, labels.and);
  return (
    <div className={`${fonts.fonts} ${p.keepsake}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <div className={p.keepsakeFrame}>
        <ThemeBorder border={border} fallback={KILIM_BORDER} medium="print" />
      </div>
      <section className={p.cover}>
        {/* eslint-disable @next/next/no-img-element -- print artwork */}
        <img className={p.coverGarland} src={garland.src} alt="" />
        <img className={p.coverRosette} src={rosette.src} alt="" />
        <img className={p.coverBand} src={kilimBand.src} alt="" />
        {/* eslint-enable @next/next/no-img-element */}
        <h1 className={p.coverTitle}>{labels.keepsakeTitle}</h1>
        {names ? <p className={p.names}>{names}</p> : null}
        {event.date ? <p className={p.when}>{event.date.full}</p> : null}
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
