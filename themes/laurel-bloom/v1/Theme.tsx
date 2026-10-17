'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  GuestFormSlot,
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
import { BOTANICAL_BORDER } from './border';
import { copyFor, type Copy } from './copy';
import { classYear, isLong } from './names';
import corner from './assets/botanical-corner.webp';
import roses from './assets/ivory-roses.webp';
import spray from './assets/ivory-spray.webp';
import cap from './assets/graduation-cap.webp';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/** closed → opening (the gatefold panels swing open, the inside page and the website unfold below) → open. */
type Phase = 'closed' | 'opening' | 'open';

/** From the designer's prototype: the panels and the arch settle in 2.2 seconds. */
const OPENING_MS = 2200;
const REDUCED_MS = 100;

const noop = () => () => {};

/** Class names from the module; the prototype's names are kept so the styles read like the design. */
const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

/* eslint-disable @next/next/no-img-element -- the design's layered artwork */

export default function LaurelBloom(props: ThemeProps) {
  const { locale, dir, lang, fields, labels, event, mapUrl } = props;
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
  const typedYear = fields.class_year?.trim();
  const year = classYear(typedYear && /^\d+$/.test(typedYear) ? formatNumber(Number(typedYear), locale) : typedYear, event.date?.year);
  const closed = phase === 'closed';
  // Before JavaScript runs (and without it) everything is readable; once running, the website waits for the opening.
  const shut = hydrated && closed;

  const classLine = year ? (
    <p className={c('gl-class')}>
      <span>{t.classOf}</span> <span>{year}</span>
    </p>
  ) : null;

  return (
    <div id={s.frame} className={`${fonts.fonts} ${s.page}`}>
      <article className={c('root', reduced && 'reduced')} lang={lang} dir={dir} data-script={script} data-phase={phase} data-hydrated={hydrated ? '' : undefined}>
        {/* ---------------------------------------------------------------- the gatefold poster */}
        <section className={c('gl-hero')} aria-label={labels.openInvitation}>
          <div className={c('gl-hero-frame')} aria-hidden="true" />
          <div className={c('gl-fold', 'gl-fold-left')} aria-hidden="true">
            <div className={c('gl-fold-face')}>
              <img src={corner.src} alt="" className={c('gl-fold-corner', 'gl-tl')} />
              <img src={corner.src} alt="" className={c('gl-fold-corner', 'gl-bl')} />
            </div>
          </div>
          <div className={c('gl-fold', 'gl-fold-right')} aria-hidden="true">
            <div className={c('gl-fold-face')}>
              <img src={corner.src} alt="" className={c('gl-fold-corner', 'gl-tr')} />
              <img src={corner.src} alt="" className={c('gl-fold-corner', 'gl-br')} />
            </div>
          </div>
          <img className={c('gl-hero-flower', 'gl-hero-flower-top')} src={roses.src} alt="" aria-hidden="true" />
          <img className={c('gl-hero-flower', 'gl-hero-flower-bottom')} src={spray.src} alt="" aria-hidden="true" />
          <div className={c('gl-hero-copy')}>
            <p className={c('gl-eyebrow')}>{t.invited}</p>
            <img className={c('gl-hero-cap')} src={cap.src} alt="" aria-hidden="true" />
            <h1>
              <span>{t.graduation}</span>
              <em>{t.celebration}</em>
            </h1>
            {classLine}
            <div className={c('gl-small-rule')} aria-hidden="true" />
            {name ? <p className={c('gl-graduate')} data-long={isLong(name) ? '' : undefined}>{name}</p> : null}
            {fields.achievement ? <p className={c('gl-degree')}>{fields.achievement}</p> : null}
            {fullDate ? <p className={c('gl-hero-date')}>{fullDate}</p> : null}
            <div className={c('gl-hero-extra')} inert={shut ? true : undefined}>
              <div>
                {fields.invitation_message ? <p className={c('gl-message')}>{fields.invitation_message}</p> : null}
                <div className={c('gl-hero-links')}>
                  <a href="#lb-details">{t.viewDetails}</a>
                  {showForm ? <a href="#lb-rsvp">{t.reply}</a> : null}
                </div>
              </div>
            </div>
          </div>
          {closed ? <button type="button" className={c('gl-open-hit')} onClick={open} aria-label={labels.openInvitation} /> : null}
        </section>

        {music.available && phase === 'open' ? (
          <button
            type="button"
            className={c('lb-audio')}
            onClick={music.toggle}
            aria-pressed={music.playing}
            aria-label={music.playing ? labels.musicPause : labels.musicPlay}
            title={music.playing ? labels.musicPause : labels.musicPlay}
          >
            <SpeakerIcon on={music.playing} />
          </button>
        ) : null}

        {/* ---------------------------------------------------------------- the website, unfolding below the poster */}
        <div className={c('gl-body-wrap')} inert={shut ? true : undefined}>
          <main className={c('gl-body-inner')}>
            <section className={c('gl-portrait-section')}>
              <div className={c('gl-bridge')} aria-hidden="true" />
              <p className={c('gl-eyebrow')}>{t.newChapter}</p>
              <h2 className={c('lb-lines')}>{t.storyTitle}</h2>
              {/* The arched portrait frame. Until the graduate's photograph can be added (a later package), it holds the
                  year and the cap; the photograph then fills the same arch. */}
              <figure className={c('gl-portrait-frame')}>
                <div className={c('gl-portrait-mat')}>
                  <div className={c('gl-photo-placeholder')} aria-hidden="true">
                    {year ? <span className={c('gl-portrait-year')}>{year}</span> : null}
                    <img src={cap.src} alt="" />
                  </div>
                </div>
                {name || year ? (
                  <figcaption>
                    {name ? <span>{name}</span> : null}
                    {name && year ? <span className={c('gl-dot')} aria-hidden="true" /> : null}
                    {year ? (
                      <span>
                        {t.classOf} {year}
                      </span>
                    ) : null}
                  </figcaption>
                ) : null}
              </figure>
              <img className={c('gl-portrait-flowers')} src={roses.src} alt="" aria-hidden="true" />
              <p className={c('gl-story-copy')}>{t.storyCopy}</p>
            </section>

            {showCountdown ? <Countdown startsAt={event.startsAt} t={t} labels={labels} locale={locale} date={fullDate} /> : null}

            {event.date || event.time || fields.venue_name || showMap ? (
              <section className={c('gl-details')} id="lb-details">
                <p className={c('gl-eyebrow')}>{t.saveDate}</p>
                <h2>{t.detailsTitle}</h2>
                <div className={c('gl-event-paper')}>
                  <img src={corner.src} className={c('gl-event-corner')} alt="" aria-hidden="true" />
                  {event.date ? (
                    <>
                      <p className={c('gl-eyebrow')}>{event.date.weekday}</p>
                      <p className={c('gl-event-day')}>{event.date.day}</p>
                      <p className={c('gl-event-month')}>
                        {event.date.month} {event.date.year}
                      </p>
                    </>
                  ) : null}
                  {event.time || fields.venue_name || showMap ? <div className={c('gl-event-rule')} aria-hidden="true" /> : null}
                  {event.time ? (
                    <div className={c('gl-event-row')}>
                      <span className={c('gl-detail-label')}>{t.timeLabel}</span>
                      <p>{event.time}</p>
                    </div>
                  ) : null}
                  {fields.venue_name || showMap ? (
                    <div className={c('gl-event-row')}>
                      <span className={c('gl-detail-label')}>{t.placeLabel}</span>
                      {fields.venue_name ? <p>{fields.venue_name}</p> : null}
                      {showMap ? (
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                          {labels.openMap}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  <p className={c('gl-event-note')}>{t.presence}</p>
                </div>
              </section>
            ) : null}

            {showForm || props.guestbook ? (
              <section className={c('gl-rsvp')} id="lb-rsvp">
                <div className={c('gl-reply-paper')}>
                  {showForm ? (
                    <>
                      <p className={c('gl-eyebrow')}>{t.rsvpLabel}</p>
                      <h2>{t.rsvpTitle}</h2>
                      <p className={c('gl-rsvp-intro')}>{t.rsvpIntro}</p>
                      <GuestFormSlot render={(api) => <GuestForm api={api} labels={labels} locale={locale} />} />
                    </>
                  ) : null}
                  {props.guestbook ? (
                    <div className={c('gl-guestbook')}>
                      <h3>{t.guestbook}</h3>
                      {props.guestbook.length === 0 ? (
                        <p>{labels.guestbookEmpty}</p>
                      ) : (
                        props.guestbook.map((m, i) => (
                          <article key={i} className={c('gl-note')}>
                            <p dir="auto">{m.message}</p>
                            <footer dir="auto">{m.guestName}</footer>
                          </article>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
                <img className={c('gl-reply-flower')} src={spray.src} alt="" aria-hidden="true" />
              </section>
            ) : null}

            <footer className={c('gl-ending')}>
              <ThemeBorder border={props.border} fallback={BOTANICAL_BORDER} medium="screen" />
              <div className={c('gl-ending-frame')} aria-hidden="true" />
              <p className={c('gl-eyebrow')}>{t.closingLabel}</p>
              <h2 className={c('lb-lines')}>{t.closing}</h2>
              {name ? <p className={c('gl-ending-name')}>{name}</p> : null}
              {classLine}
              <img className={c('gl-ending-flowers')} src={roses.src} alt="" aria-hidden="true" />
            </footer>
          </main>
        </div>
      </article>
    </div>
  );
}

/* eslint-enable @next/next/no-img-element */

function Countdown({ startsAt, t, labels, locale, date }: { startsAt: string | null; t: Copy; labels: ThemeLabels; locale: ThemeProps['locale']; date: string | null }) {
  const left = useCountdown(startsAt);
  const units: [number | undefined, string][] = [
    [left?.days, labels.countdownDays],
    [left?.hours, labels.countdownHours],
    [left?.minutes, labels.countdownMinutes],
    [left?.seconds, labels.countdownSeconds],
  ];
  return (
    <section className={c('gl-countdown-section')}>
      <div className={c('gl-countdown-paper')}>
        <p className={c('gl-eyebrow')}>{t.countdownLabel}</p>
        <h2>{t.countdownTitle}</h2>
        {left?.started ? (
          <p className={c('gl-countdown-date')}>{labels.eventStarted}</p>
        ) : (
          <div className={c('gl-clock')} role="timer" aria-live="off">
            {units.map(([n, label]) => (
              <div key={label}>
                <strong>{n === undefined ? '–' : formatNumber(n, locale)}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
        {date ? <p className={c('gl-countdown-date')}>{date}</p> : null}
      </div>
    </section>
  );
}

function GuestForm({ api, labels, locale }: { api: GuestFormApi; labels: ThemeLabels; locale: ThemeProps['locale'] }) {
  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  const [message, setMessage] = useState('');

  if (api.status === 'sent') {
    return (
      <div className={c('gl-success')} role="status">
        <p className={c('gl-script')}>{labels.sent}</p>
        {api.isPreview ? <p>{labels.sentPreview}</p> : null}
      </div>
    );
  }
  const sending = api.status === 'sending';
  const e = api.fieldErrors;
  const left = api.limits.message - message.length;

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        void api.submit({ name, attendance, message });
      }}
      noValidate
      aria-busy={sending}
    >
      <h3 className={c('lb-sr-only')}>{labels.guestFormTitle}</h3>
      <label htmlFor="lb-guest-name">
        <span>{labels.guestName}</span>
      </label>
      <input
        id="lb-guest-name"
        name="name"
        autoComplete="name"
        value={name}
        maxLength={api.limits.name}
        onChange={(ev) => setName(ev.target.value)}
        disabled={sending}
        aria-invalid={e.name ? true : undefined}
        aria-describedby={e.name ? 'lb-guest-name-error' : undefined}
      />
      {e.name ? <FieldError id="lb-guest-name-error">{e.name}</FieldError> : null}

      <fieldset disabled={sending} aria-describedby={e.attendance ? 'lb-attending-error' : undefined}>
        <legend>{labels.attendanceQuestion}</legend>
        {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
          <label key={value} className={c('gl-radio')}>
            <input type="radio" name="attendance" checked={attendance === value} onChange={() => setAttendance(value)} />
            <span>{value === 'ATTENDING' ? labels.attending : labels.notAttending}</span>
          </label>
        ))}
        {e.attendance ? <FieldError id="lb-attending-error">{e.attendance}</FieldError> : null}
      </fieldset>

      {api.withMessage ? (
        <>
          <label htmlFor="lb-guest-message">
            <span>{labels.message}</span>
          </label>
          <textarea
            id="lb-guest-message"
            name="message"
            rows={3}
            value={message}
            maxLength={api.limits.message}
            onChange={(ev) => setMessage(ev.target.value)}
            disabled={sending}
            aria-invalid={e.message ? true : undefined}
            aria-describedby={`lb-message-count${e.message ? ' lb-message-error' : ''}`}
          />
          <p id="lb-message-count" className={c('lb-counter')}>
            {formatNumber(left, locale)}
          </p>
          {e.message ? <FieldError id="lb-message-error">{e.message}</FieldError> : null}
        </>
      ) : null}

      {api.error ? (
        <p className={c('gl-error')} role="alert">
          {api.error}
        </p>
      ) : null}

      <button type="submit" className={c('gl-submit')} disabled={sending}>
        {sending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className={c('gl-error')} role="alert">
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
