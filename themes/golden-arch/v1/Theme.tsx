'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  GuestFormSlot,
  Photo,
  ThemeBorder,
  formatNumber,
  hasFeature,
  useCountdown,
  useMusic,
  useReducedMotion,
  type GuestAttendance,
  type GuestFormApi,
  type ThemeLabels,
  type ThemeProps,
} from '@/theme-sdk';
import { GOLD_BORDER } from './border';
import { copyFor, type Copy } from './copy';
import { classYear, isLong } from './names';
import rosesTop from './assets/roses-top.webp';
import rosesBottom from './assets/roses-bottom.webp';
import hands from './assets/hands.webp';
import laurel from './assets/laurel-cap.webp';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/** closed → opening (the arch draws itself, the flowers bloom in, the caps fly, the details appear) → open. */
type Phase = 'closed' | 'opening' | 'open';

/** The last line settles at about 2.6 s. */
const OPENING_MS = 2700;
const REDUCED_MS = 100;

const noop = () => () => {};

const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

/** The event date written as on the poster: 20.10.2029 (digits in the invitation's numerals). */
function numericDate(iso: string | undefined, locale: ThemeProps['locale']): string | null {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const n = (v: string) => (locale === 'en' ? v : v.replace(/\d/g, (x) => formatNumber(Number(x), locale)));
  return `${n(d!)}.${n(mo!)}.${n(y!)}`;
}

/* eslint-disable @next/next/no-img-element -- the poster's layered artwork, moved by the opening */

export default function GoldenArch(props: ThemeProps) {
  const { locale, dir, lang, fields, labels, event, mapUrl, wording, photos } = props;
  const t = copyFor(locale);
  const reduced = useReducedMotion();
  const music = useMusic();
  const [phase, setPhase] = useState<Phase>('closed');
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  const open = () => {
    if (phase !== 'closed') return;
    music.start();
    setPhase('opening');
  };

  useEffect(() => {
    if (phase !== 'opening') return;
    const id = window.setTimeout(() => setPhase('open'), reduced ? REDUCED_MS : OPENING_MS);
    return () => window.clearTimeout(id);
  }, [phase, reduced]);

  const name = fields.person_1_name;
  const script = locale === 'en' ? 'latin' : 'arabic';
  const showCountdown = hasFeature(props, 'countdown') && event.startsAt !== null;
  const showMap = hasFeature(props, 'map') && mapUrl !== null;
  const showForm = hasFeature(props, 'rsvp');
  const fullDate = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  const shortDate = numericDate(fields.event_date, locale);
  const typedYear = fields.class_year?.trim();
  const year = classYear(typedYear && /^\d+$/.test(typedYear) ? formatNumber(Number(typedYear), locale) : typedYear, event.date?.year);
  const closed = phase === 'closed';
  const shut = hydrated && closed;
  const follow = wording.followLine?.trim();

  const standing = [fields.achievement, year ? `${t.classOf} ${year}` : null].filter(Boolean);

  return (
    <div id={s.frame} className={`${fonts.fonts} ${s.page}`}>
      <article
        className={c('root', reduced && 'reduced')}
        lang={lang}
        dir={dir}
        data-script={script}
        data-phase={phase}
        data-hydrated={hydrated ? '' : undefined}
      >
        {/* ---------------------------------------------------------------- the poster */}
        <section className={c('ga-hero')} aria-label={labels.openInvitation}>
          <img className={c('ga-roses-top')} src={rosesTop.src} alt="" aria-hidden="true" />
          <img className={c('ga-roses-bottom')} src={rosesBottom.src} alt="" aria-hidden="true" />
          <img className={c('ga-hands')} src={hands.src} alt="" aria-hidden="true" />

          <div className={c('ga-arch')}>
            <GoldArch drawn={!shut} />
            <div className={c('ga-arch-copy')}>
              <img className={c('ga-laurel')} src={laurel.src} alt="" aria-hidden="true" />
              <p className={c('ga-caps', 'ga-kicker', 'ga-line', 'ga-l0')}>{t.celebrating}</p>
              {name ? (
                <h1 className={c('ga-name')} data-long={isLong(name) ? '' : undefined}>
                  {name}
                </h1>
              ) : null}
              {standing.length ? <p className={c('ga-caps', 'ga-standing', 'ga-line', 'ga-l1')}>{standing.join(' · ')}</p> : null}
              {fields.invitation_message ? <p className={c('ga-caps', 'ga-message', 'ga-line', 'ga-l2')}>{fields.invitation_message}</p> : null}
              {shortDate || event.time ? (
                <p className={c('ga-when', 'ga-line', 'ga-l3')} dir="ltr">
                  {shortDate ? <span>{shortDate}</span> : null}
                  {shortDate && event.time ? <span className={c('ga-bar')} aria-hidden="true" /> : null}
                  {event.time ? <span dir={dir}>{event.time}</span> : null}
                </p>
              ) : null}
              {fields.venue_name ? <p className={c('ga-caps', 'ga-venue', 'ga-line', 'ga-l4')}>{fields.venue_name}</p> : null}
              {follow ? <p className={c('ga-follow', 'ga-line', 'ga-l5')}>{follow}</p> : null}
            </div>
            {closed ? (
              <button type="button" className={c('ga-open')} onClick={open}>
                {labels.openInvitation}
              </button>
            ) : null}
          </div>
        </section>

        {music.available && phase === 'open' ? (
          <button
            type="button"
            className={c('ga-audio')}
            onClick={music.toggle}
            aria-pressed={music.playing}
            aria-label={music.playing ? labels.musicPause : labels.musicPlay}
            title={music.playing ? labels.musicPause : labels.musicPlay}
          >
            <SpeakerIcon on={music.playing} />
          </button>
        ) : null}

        {/* ---------------------------------------------------------------- the website */}
        <main className={c('ga-body')} inert={shut ? true : undefined}>
          <section className={c('ga-portrait')}>
            <p className={c('ga-caps', 'ga-eyebrow')}>{t.portraitLead}</p>
            <h2 className={c('ga-title', 'ga-lines')}>{t.portraitTitle}</h2>
            {/* The portrait arch: the graduate's photograph (photos[0]), or without one the laurel and the year. */}
            <figure className={c('ga-frame')}>
              {photos[0] ? (
                <div className={c('ga-frame-inner', 'ga-frame-photo')}>
                  <Photo photo={photos[0]} className={c('ga-photo')} />
                </div>
              ) : (
                <div className={c('ga-frame-inner')} aria-hidden="true">
                  <img src={laurel.src} alt="" />
                  {year ? <span className={c('ga-frame-year')}>{year}</span> : null}
                </div>
              )}
              {name || fields.achievement ? (
                <figcaption>
                  {name ? <span className={c('ga-frame-name')}>{name}</span> : null}
                  {fields.achievement ? <span className={c('ga-caps')}>{fields.achievement}</span> : null}
                </figcaption>
              ) : null}
            </figure>
            <p className={c('ga-note')}>{t.portraitNote}</p>
            <img className={c('ga-portrait-roses')} src={rosesBottom.src} alt="" aria-hidden="true" />
          </section>

          {showCountdown ? <Countdown startsAt={event.startsAt} t={t} labels={labels} locale={locale} /> : null}

          {event.date || event.time || fields.venue_name || showMap ? (
            <section className={c('ga-details')}>
              <p className={c('ga-caps', 'ga-eyebrow')}>{t.detailsLead}</p>
              <h2 className={c('ga-title')}>{t.detailsTitle}</h2>
              <div className={c('ga-card', 'ga-gold-frame')}>
                {event.date ? <p className={c('ga-caps', 'ga-weekday')}>{event.date.weekday}</p> : null}
                {shortDate || event.time ? (
                  <p className={c('ga-when', 'ga-when-big')} dir="ltr">
                    {shortDate ? <span>{shortDate}</span> : null}
                    {shortDate && event.time ? <span className={c('ga-bar')} aria-hidden="true" /> : null}
                    {event.time ? <span dir={dir}>{event.time}</span> : null}
                  </p>
                ) : null}
                {fullDate ? <p className={c('ga-full-date')}>{fullDate}</p> : null}
                {fields.venue_name || showMap ? <span className={c('ga-rule')} aria-hidden="true" /> : null}
                {fields.venue_name ? (
                  <>
                    <p className={c('ga-caps', 'ga-label')}>{t.placeLabel}</p>
                    <p className={c('ga-caps', 'ga-venue')}>{fields.venue_name}</p>
                  </>
                ) : null}
                {showMap ? (
                  <a className={c('ga-button')} href={mapUrl} target="_blank" rel="noopener noreferrer">
                    {labels.openMap}
                  </a>
                ) : null}
                {follow ? <p className={c('ga-follow')}>{follow}</p> : null}
              </div>
            </section>
          ) : null}

          {showForm || props.guestbook ? (
            <section className={c('ga-reply')}>
              <div className={c('ga-card', 'ga-gold-frame')}>
                {showForm ? (
                  <>
                    <p className={c('ga-caps', 'ga-eyebrow')}>{t.replyLead}</p>
                    <h2 className={c('ga-title')}>{t.replyTitle}</h2>
                    <p className={c('ga-intro')}>{t.replyIntro}</p>
                    <GuestFormSlot render={(api) => <GuestForm api={api} labels={labels} locale={locale} />} />
                  </>
                ) : null}
                {props.guestbook ? (
                  <div className={c('ga-guestbook')}>
                    <h3>{t.guestbook}</h3>
                    {props.guestbook.length === 0 ? (
                      <p className={c('ga-intro')}>{labels.guestbookEmpty}</p>
                    ) : (
                      props.guestbook.map((m, i) => (
                        <article key={i} className={c('ga-note-card')}>
                          <p dir="auto">{m.message}</p>
                          <footer dir="auto">{m.guestName}</footer>
                        </article>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <footer className={c('ga-ending')}>
            <ThemeBorder border={props.border} fallback={GOLD_BORDER} medium="screen" />
            <img className={c('ga-ending-laurel')} src={laurel.src} alt="" aria-hidden="true" />
            <h2 className={c('ga-title', 'ga-lines')}>{t.closing}</h2>
            {name ? <p className={c('ga-name', 'ga-ending-name')}>{name}</p> : null}
            {year ? (
              <p className={c('ga-caps', 'ga-standing')}>
                {t.classOf} {year}
              </p>
            ) : null}
            <img className={c('ga-ending-hands')} src={hands.src} alt="" aria-hidden="true" />
            <img className={c('ga-ending-roses')} src={rosesBottom.src} alt="" aria-hidden="true" />
          </footer>
        </main>
      </article>
    </div>
  );
}

/* eslint-enable @next/next/no-img-element */

/**
 * The poster's gold arch (a half-circle top on straight sides, closed at the bottom), drawn as two halves that grow
 * from the bottom centre and meet at the top when the invitation opens. Sized to its box in pixels, so the top stays
 * a true half-circle whatever the screen; the gradient is the poster's (diagonal gold with a pale highlight).
 */
function GoldArch({ drawn }: { drawn: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number; sw: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w && h) setBox({ w, h, sw: Math.max(3, w * 0.016) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  let halves: [string, string] | null = null;
  if (box) {
    const { w, h, sw } = box;
    const x0 = sw / 2;
    const x1 = w - sw / 2;
    const yb = h - sw / 2;
    const r = (w - sw) / 2;
    const yc = sw / 2 + r;
    const mid = w / 2;
    halves = [
      `M ${mid} ${yb} L ${x0} ${yb} L ${x0} ${yc} A ${r} ${r} 0 0 1 ${mid} ${sw / 2}`,
      `M ${mid} ${yb} L ${x1} ${yb} L ${x1} ${yc} A ${r} ${r} 0 0 0 ${mid} ${sw / 2}`,
    ];
  }
  return (
    <div ref={ref} className={c('ga-arch-line')} data-drawn={drawn ? '' : undefined} aria-hidden="true">
      {box && halves ? (
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`}>
          <defs>
            <linearGradient id="ga-gold" gradientUnits="userSpaceOnUse" x1={-0.2 * box.w} y1={0.2 * box.w} x2={1.05 * box.w} y2={1.46 * box.w}>
              <stop offset="0" stopColor="#a67a12" />
              <stop offset="0.17" stopColor="#a87c14" />
              <stop offset="0.3" stopColor="#f2df77" />
              <stop offset="0.48" stopColor="#fff7bc" />
              <stop offset="0.62" stopColor="#dac37e" />
              <stop offset="0.765" stopColor="#935e00" />
              <stop offset="0.96" stopColor="#eab30e" />
            </linearGradient>
          </defs>
          {halves.map((d, i) => (
            <path key={i} d={d} pathLength={1} fill="none" stroke="url(#ga-gold)" strokeWidth={box.sw} strokeLinejoin="miter" />
          ))}
        </svg>
      ) : null}
    </div>
  );
}

function Countdown({ startsAt, t, labels, locale }: { startsAt: string | null; t: Copy; labels: ThemeLabels; locale: ThemeProps['locale'] }) {
  const left = useCountdown(startsAt);
  const units: [number | undefined, string][] = [
    [left?.days, labels.countdownDays],
    [left?.hours, labels.countdownHours],
    [left?.minutes, labels.countdownMinutes],
    [left?.seconds, labels.countdownSeconds],
  ];
  return (
    <section className={c('ga-countdown')}>
      <p className={c('ga-caps', 'ga-eyebrow')}>{t.countdownLead}</p>
      <h2 className={c('ga-title')}>{t.countdownTitle}</h2>
      {left?.started ? (
        <p className={c('ga-intro')}>{labels.eventStarted}</p>
      ) : (
        <div className={c('ga-clock')} role="timer" aria-live="off">
          {units.map(([n, label]) => (
            <div key={label}>
              <strong>{n === undefined ? '–' : formatNumber(n, locale)}</strong>
              <span className={c('ga-caps')}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function GuestForm({ api, labels, locale }: { api: GuestFormApi; labels: ThemeLabels; locale: ThemeProps['locale'] }) {
  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  const [message, setMessage] = useState('');

  if (api.status === 'sent') {
    return (
      <div className={c('ga-sent')} role="status">
        <p className={c('ga-follow')}>{labels.sent}</p>
        {api.isPreview ? <p className={c('ga-intro')}>{labels.sentPreview}</p> : null}
      </div>
    );
  }
  const sending = api.status === 'sending';
  const e = api.fieldErrors;
  const left = api.limits.message - message.length;

  return (
    <form
      className={c('ga-form')}
      onSubmit={(ev) => {
        ev.preventDefault();
        void api.submit({ name, attendance, message });
      }}
      noValidate
      aria-busy={sending}
    >
      <h3 className={c('ga-sr-only')}>{labels.guestFormTitle}</h3>
      <label className={c('ga-caps', 'ga-field-label')} htmlFor="ga-guest-name">
        {labels.guestName}
      </label>
      <input
        id="ga-guest-name"
        name="name"
        autoComplete="name"
        value={name}
        maxLength={api.limits.name}
        onChange={(ev) => setName(ev.target.value)}
        disabled={sending}
        aria-invalid={e.name ? true : undefined}
        aria-describedby={e.name ? 'ga-guest-name-error' : undefined}
      />
      {e.name ? <FieldError id="ga-guest-name-error">{e.name}</FieldError> : null}

      <fieldset disabled={sending} aria-describedby={e.attendance ? 'ga-attending-error' : undefined}>
        <legend className={c('ga-caps', 'ga-field-label')}>{labels.attendanceQuestion}</legend>
        {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
          <label key={value} className={c('ga-choice')}>
            <input type="radio" name="attendance" checked={attendance === value} onChange={() => setAttendance(value)} />
            <span>{value === 'ATTENDING' ? labels.attending : labels.notAttending}</span>
          </label>
        ))}
        {e.attendance ? <FieldError id="ga-attending-error">{e.attendance}</FieldError> : null}
      </fieldset>

      {api.withMessage ? (
        <>
          <label className={c('ga-caps', 'ga-field-label')} htmlFor="ga-guest-message">
            {labels.message}
          </label>
          <textarea
            id="ga-guest-message"
            name="message"
            rows={3}
            value={message}
            maxLength={api.limits.message}
            onChange={(ev) => setMessage(ev.target.value)}
            disabled={sending}
            aria-invalid={e.message ? true : undefined}
            aria-describedby={`ga-message-count${e.message ? ' ga-message-error' : ''}`}
          />
          <p id="ga-message-count" className={c('ga-counter')}>
            {formatNumber(left, locale)}
          </p>
          {e.message ? <FieldError id="ga-message-error">{e.message}</FieldError> : null}
        </>
      ) : null}

      {api.error ? (
        <p className={c('ga-error')} role="alert">
          {api.error}
        </p>
      ) : null}

      <button type="submit" className={c('ga-button', 'ga-submit')} disabled={sending}>
        {sending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className={c('ga-error')} role="alert">
      {children}
    </span>
  );
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" fillOpacity={on ? 1 : 0.2} />
      {on ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
    </svg>
  );
}
