import type { KeepsakeProps } from '@/theme-sdk';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import heart from '../assets/heart-sketch.webp';
import { PrintDivider, PrintFrame, StackedNames } from './Ornaments';
import p from './print.module.css';

/**
 * Keepsake of guest messages, A4 portrait. The cover is a framed cream page like the online invitation; then the
 * messages are written on the owner's flower paper (it repeats on every page; no ruled lines, owner 2026-11-27),
 * each followed by a short centred line, a message never split across pages.
 */
export default function Keepsake({ locale, dir, lang, fields, event, labels, messages, border, eventWording }: KeepsakeProps) {
  const t = copyFor(locale, eventWording);
  return (
    <div className={`${fonts.fonts} ${p.keepsake}`} dir={dir} lang={lang}>
      <div className={p.paper} aria-hidden="true" />
      <section className={p.cover}>
        <PrintFrame unitMm={0.5} insetMm={8.5} border={border} />
        <div className={p.coverInner}>
          <PrintDivider star className={p.cardStar} />
          <p className={p.coverEyebrow}>{labels.keepsakeTitle}</p>
          <PrintDivider className={p.cardDivider} />
          <StackedNames one={fields.person_1_name} two={fields.person_2_name} and={labels.and} className={`${p.names} ${p.coverNames}`} />
          {event.date ? <p className={p.date}>{event.date.full}</p> : null}
          <p className={p.coverSub}>{t.keepsakeSub}</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
          <img className={p.backHeart} src={heart.src} alt="" />
        </div>
      </section>

      <section className={p.messages}>
        {messages.length === 0 ? (
          <p className={p.messageText}>{labels.keepsakeEmpty}</p>
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
      </section>
    </div>
  );
}
