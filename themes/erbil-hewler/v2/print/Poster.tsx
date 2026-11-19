import type { PrintCardProps } from '@/theme-sdk';
import { sunPoints } from '../motion';
import panorama from '../assets/panorama.webp';
import paper from '../assets/paper.png';
import { namesOf, wordsFor } from './words';
import p from './print.module.css';

type Face = Pick<PrintCardProps, 'locale' | 'dir' | 'lang' | 'fields' | 'event' | 'occasion'> & { extraLine: string | null; className?: string };

/**
 * The wedding poster (the designer's Erbil-Wedding-Poster): a pointed sandstone arch, the Kurdish sun, the names, the
 * day, and the watercolour panorama of the Citadel, Shar Square and the Choli Minaret. Sized in container units, so
 * the A5 card and the arch card share it. Never prints the invitation's paragraph (owner rule).
 */
export function PosterFace({ locale, dir, lang, fields, event, occasion, extraLine, className }: Face) {
  const w = wordsFor(locale);
  const names = namesOf(fields);
  const longest = Math.max(0, ...names.map((n) => n.length));
  const arabic = locale !== 'en';
  // The names fill the arch's width; long names step down so they stay on one line each.
  const nameSize = Math.min(arabic ? 11 : 13, 64 / Math.max(1, longest * (arabic ? 0.42 : 0.5)));
  return (
    <div
      className={`${p.poster} ${className ?? ''}`}
      dir={dir}
      lang={lang}
      data-script={arabic ? 'arabic' : 'latin'}
      style={{ backgroundImage: `url(${paper.src})` }}
    >
      <svg className={p.arch} viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
        <path d="M1 140 V44 C1 22 24 6 50 1 C76 6 99 22 99 44 V140" />
        <path className={p.archInner} d="M3.4 140 V45 C3.4 24 25 9 50 3.6 C75 9 96.6 24 96.6 45 V140" />
      </svg>
      <span className={p.diamonds} data-side="start" aria-hidden="true" />
      <span className={p.diamonds} data-side="end" aria-hidden="true" />
      <div className={p.copy}>
        <svg className={p.sun} viewBox="0 0 60 60" aria-hidden="true">
          <polygon points={sunPoints(30, 30, 17, 28)} />
        </svg>
        <p className={p.kicker}>{w.together}</p>
        {names.length ? (
          <h1 className={p.names} style={{ fontSize: `${nameSize.toFixed(2)}cqw` }}>
            {names.map((n, i) => (
              <span key={i}>
                {i ? <i className={p.amp}>&amp;</i> : null}
                <span className={p.name}>{n}</span>
              </span>
            ))}
          </h1>
        ) : null}
        <p className={p.invite}>{occasion === 'engagement' ? w.inviteEngagement : w.inviteWedding}</p>
        <span className={p.rule} aria-hidden="true" />
        {event.date ? <p className={p.date}>{event.date.full}</p> : null}
        {event.time ? <p className={p.time}>{event.time}</p> : null}
        {fields.venue_name ? <p className={p.venue}>{fields.venue_name}</p> : null}
        <p className={p.city}>{w.city}</p>
        {extraLine ? <p className={p.extra}>{extraLine}</p> : null}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.panorama} src={panorama.src} alt="" />
      <p className={p.footer}>{w.footer}</p>
    </div>
  );
}
