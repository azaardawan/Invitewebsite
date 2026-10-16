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
import { LACE_BORDER } from './border';
import { copyFor, posterBand, type Copy } from './copy';
import { stripScale } from './names';
import coverBase from './assets/cover-base.webp';
import envelope from './assets/envelope.webp';
import waxSeal from './assets/wax-seal.webp';
import letterPaper from './assets/letter-paper.webp';
import rose from './assets/rose.webp';
import posterTitle from './assets/poster-title.webp';
import tulips from './assets/tulips.webp';
import spark from './assets/spark.webp';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/**
 * closed: the original poster with its sealed envelope → opening: the poster fades, the envelope comes forward,
 * the flap opens, the seal breaks and a letter with the couple's names rises out → open: the letter-style website.
 */
type Phase = 'closed' | 'opening' | 'open';

/** From the designer's prototype: the letter has risen and the envelope has dropped away. */
const OPENING_MS = 3300;
/** Then the letter dissolves into the page: the poster stays over the page and fades while the page rises in beneath it. */
const HANDOFF_MS = 650;
const REDUCED_MS = 100;

const noop = () => () => {};

/** Class names from the module; the prototype's hyphenated names are kept so the styles read like the design. */
const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

/* eslint-disable @next/next/no-img-element -- the poster's layered artwork (and its envelope animation) */

export default function VintageLoveLetters(props: ThemeProps) {
  const { locale, dir, lang, fields, labels, event, mapUrl, occasion } = props;
  const t = copyFor(locale, occasion);
  const band = posterBand(occasion);
  const reduced = useReducedMotion();
  const music = useMusic();
  const [phase, setPhase] = useState<Phase>('closed');
  const [handoff, setHandoff] = useState(false);
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
    const id = window.setTimeout(() => {
      setPhase('open');
      if (!reduced) setHandoff(true);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, reduced ? REDUCED_MS : OPENING_MS);
    return () => window.clearTimeout(id);
  }, [phase, reduced]);

  useEffect(() => {
    if (!handoff) return;
    const id = window.setTimeout(() => setHandoff(false), HANDOFF_MS);
    return () => window.clearTimeout(id);
  }, [handoff]);

  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const script = locale === 'en' ? 'latin' : 'arabic';
  const showCountdown = hasFeature(props, 'countdown') && event.startsAt !== null;
  const showMap = hasFeature(props, 'map') && mapUrl !== null;
  const showForm = hasFeature(props, 'rsvp');
  const fullDate = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  const pair = (
    <>
      {n1 ? <span>{n1}</span> : null}
      {n1 && n2 ? <em> {labels.and} </em> : null}
      {n2 ? <span>{n2}</span> : null}
    </>
  );
  const strips = (where: 'cover' | 'page') => (
    <>
      {n1 ? (
        <span className={c('vl-strip', 'vl-strip-one', where === 'cover' && 'vl-strip-cover')}>
          <span style={{ fontSize: `${stripScale(n1)}em` }}>{n1}</span>
        </span>
      ) : null}
      {n2 ? (
        <span className={c('vl-strip', 'vl-strip-two', where === 'cover' && 'vl-strip-cover')}>
          <span style={{ fontSize: `${stripScale(n2)}em` }}>{n2}</span>
        </span>
      ) : null}
    </>
  );

  // Before JavaScript runs (and without it) the website shows under the poster; once running, one at a time.
  const showCover = !hydrated || phase !== 'open' || handoff;
  const showWebsite = !hydrated || phase === 'open';

  return (
    <div id={s.frame} className={`${fonts.fonts} ${s.page}`}>
      <article
        className={c('root', reduced && 'reduced', handoff && 'vl-handoff')}
        lang={lang}
        dir={dir}
        data-script={script}
        data-locale={locale}
        // during the hand-off the poster keeps its opened state (its animations hold their last frame)
        data-phase={handoff ? 'opening' : phase}
      >
        {/* SVG clip paths for the envelope's flap and pocket (from the prototype). */}
        <svg className={c('vl-clip-defs')} aria-hidden="true" width="0" height="0">
          <defs>
            <clipPath id="vr-flap-clip" clipPathUnits="objectBoundingBox">
              <path d="M.032 .003H.981C.964 .080 .952 .158 .903 .220L.568 .594Q.512 .661 .459 .606L.157 .264C.071 .179 .055 .108 .032 .003Z" />
            </clipPath>
            <clipPath id="vr-front-clip" clipPathUnits="objectBoundingBox">
              <path
                clipRule="evenodd"
                d="M0 0H1V1H0ZM.032 .003H.981C.964 .080 .952 .158 .903 .220L.568 .594Q.512 .661 .459 .606L.157 .264C.071 .179 .055 .108 .032 .003Z"
              />
            </clipPath>
          </defs>
        </svg>

        {/* ---------------------------------------------------------------- the poster and its envelope */}
        {showCover ? (
          <section className={c('vl-cover')} aria-hidden={handoff ? true : undefined}>
            <div className={c('vl-stage')}>
              <img className={c('vl-base')} src={coverBase.src} alt="" aria-hidden="true" />
              {band ? (
                <span className={c('vl-band')} aria-hidden="true">
                  {band}
                </span>
              ) : null}
              <p className={c('vl-cover-names')} lang={lang} dir="ltr">
                {strips('cover')}
              </p>
              <div className={c('vl-envelope')}>
                <div className={c('vl-motion-layers')} aria-hidden="true">
                  <div className={c('vl-interior')} />
                  <div className={c('vl-letter-window')}>
                    <div className={c('vl-letter')} dir={dir}>
                      <span className={c('vl-small')}>{t.letterLove}</span>
                      <strong style={{ fontSize: `${stripScale([n1, n2].filter(Boolean).join(' '), 16) * 4.2}cqw` }}>{pair}</strong>
                      <span className={c('vl-letter-rule')} />
                      <span className={c('vl-letter-invite')}>{t.letterInvite}</span>
                    </div>
                  </div>
                  <img className={c('vl-front')} src={envelope.src} alt="" />
                  <div className={c('vl-flap')}>
                    <div className={c('vl-flap-face', 'vl-flap-front')}>
                      <img className={c('vl-flap-art')} src={envelope.src} alt="" />
                      <img className={c('vl-seal')} src={waxSeal.src} alt="" />
                    </div>
                    <div className={c('vl-flap-face', 'vl-flap-back')}>
                      <img className={c('vl-flap-art')} src={envelope.src} alt="" />
                    </div>
                  </div>
                </div>
                <img className={c('vl-original-envelope')} src={envelope.src} alt="" aria-hidden="true" />
                <img className={c('vl-seal', 'vl-original-seal')} src={waxSeal.src} alt="" aria-hidden="true" />
                <button type="button" className={c('vl-envelope-hit')} onClick={open} disabled={phase !== 'closed'} tabIndex={-1} aria-hidden="true" />
              </div>
            </div>
            <div className={c('vl-cover-actions')}>
              <button type="button" className={c('vl-primary')} onClick={open} disabled={phase !== 'closed'}>
                {labels.openInvitation}
              </button>
              <p className={c('vl-cover-hint')}>{t.sealed}</p>
            </div>
          </section>
        ) : null}

        {music.available && phase === 'open' ? (
          <button
            type="button"
            className={c('vl-audio')}
            onClick={music.toggle}
            aria-pressed={music.playing}
            aria-label={music.playing ? labels.musicPause : labels.musicPlay}
            title={music.playing ? labels.musicPause : labels.musicPlay}
          >
            <SpeakerIcon on={music.playing} />
          </button>
        ) : null}

        {/* ---------------------------------------------------------------- the letter-style website */}
        {showWebsite ? (
          <main className={c('website')}>
            <section className={c('vp-welcome')} data-ink="wine">
              <header className={c('vp-poster-heading')}>
                <img className={c('vp-handwritten')} src={letterPaper.src} alt="" aria-hidden="true" />
                <img className={c('vp-rose')} src={rose.src} alt="" aria-hidden="true" />
                <h1 className={c('vp-title')} data-text={band && script === 'latin' ? '' : undefined}>
                  <img className={c('vp-title-art')} src={posterTitle.src} alt={`${t.wedding} ${t.invitation}`} />
                  <span className={c('vp-arabic-title')}>
                    <span data-ink="cream">{t.wedding}</span>
                    <em>{t.invitation}</em>
                  </span>
                </h1>
                <p className={c('vp-family')}>{t.join}</p>
              </header>

              <div className={c('vl-names-block')}>
                {fullDate && event.date ? (
                  <div className={c('vp-date-stamp')} data-ink="wine">
                    <span>{t.saveDate}</span>
                    <strong>{event.date.day}</strong>
                    <span>
                      {event.date.month} · {event.date.year}
                    </span>
                  </div>
                ) : null}
                <h2 className={c('vl-names')} dir="ltr">
                  {strips('page')}
                </h2>
              </div>

              <div className={c('vp-letter-message')}>
                <span className={c('vp-letter-dear')}>{t.dear}</span>
                {fields.invitation_message ? <p id={s['vl-live-message']}>{fields.invitation_message}</p> : null}
                <p className={c('vp-letter-signature')}>{t.letterLove}</p>
                {fullDate ? <span className={c('vp-hero-date')}>{fullDate}</span> : null}
              </div>
            </section>

            {fields.person_1_family || fields.person_2_family ? (
              <section className={c('vl-family-section')} data-ink="wine">
                <p className={c('vp-kicker')}>{t.familiesLead}</p>
                {/* each family on its own small letter, pinned to the page like the calendar card */}
                <div className={c('vl-family-pair')}>
                  {fields.person_1_family ? (
                    <div className={c('vl-family-note')}>
                      <p className={c('vp-kicker')}>{t.groomFamily}</p>
                      <p className={c('vl-family-name')}>{fields.person_1_family}</p>
                    </div>
                  ) : null}
                  {fields.person_2_family ? (
                    <div className={c('vl-family-note')}>
                      <p className={c('vp-kicker')}>{t.brideFamily}</p>
                      <p className={c('vl-family-name')}>{fields.person_2_family}</p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {showCountdown ? <Countdown startsAt={event.startsAt} t={t} labels={labels} locale={locale} date={fullDate} /> : null}

            {event.date || event.time || fields.venue_name || showMap ? (
              <section className={c('vp-details')} data-ink="wine">
                <div className={c('vp-detail-heading')}>
                  <p className={c('vp-kicker')}>{t.detailsLead}</p>
                  <h2>{t.detailsTitle}</h2>
                </div>
                <div className={c('vp-stationery')}>
                  <div className={c('vp-lace-edge')} aria-hidden="true" />
                  {event.date || event.time ? (
                    <article className={c('vp-calendar-card')}>
                      {event.date ? (
                        <>
                          <p className={c('vp-weekday')}>{event.date.weekday}</p>
                          <strong className={c('vp-calendar-day')}>{event.date.day}</strong>
                          <p className={c('vp-calendar-month')}>
                            {event.date.month} {event.date.year}
                          </p>
                        </>
                      ) : null}
                      {event.time ? (
                        <div className={c('vp-time-line')}>
                          <span>{t.at}</span>
                          <strong>{event.time}</strong>
                        </div>
                      ) : null}
                    </article>
                  ) : null}
                  <article className={c('vp-venue-card')} data-ink="cream">
                    <p className={c('vp-kicker')}>{t.venueLabel}</p>
                    {fields.venue_name ? <h3>{fields.venue_name}</h3> : null}
                    <p>{t.presence}</p>
                    {showMap ? (
                      <a className={c('vp-map-link')} href={mapUrl} target="_blank" rel="noopener noreferrer">
                        {labels.openMap}
                      </a>
                    ) : null}
                  </article>
                </div>
              </section>
            ) : null}

            {showForm || props.guestbook ? (
              <section className={c('vp-rsvp')} data-ink="cream">
                {showForm ? (
                  <>
                    <header className={c('vp-reply-heading')}>
                      <p className={c('vp-kicker')}>{t.replyLead}</p>
                      <h2>{t.replyTitle}</h2>
                      <p>{t.replyIntro}</p>
                    </header>
                    <div className={c('vp-reply-paper')} data-ink="wine">
                      <div className={c('vp-postmark')} aria-hidden="true">
                        <span>{t.letterLove}</span>
                        <span>{[n1, n2].filter(Boolean).join(` ${labels.and} `)}</span>
                      </div>
                      <img className={c('vp-reply-seal')} src={waxSeal.src} alt="" aria-hidden="true" />
                      <GuestFormSlot render={(api) => <GuestForm api={api} labels={labels} locale={locale} />} />
                    </div>
                  </>
                ) : null}
                {props.guestbook ? (
                  <div className={c('vp-guestbook')}>
                    <h3>{labels.guestbookTitle}</h3>
                    {props.guestbook.length === 0 ? (
                      <p id={s['vl-guestbook-empty']}>{labels.guestbookEmpty}</p>
                    ) : (
                      <div data-ink="wine">
                        {props.guestbook.map((m, i) => (
                          <article key={i} className={c('vl-guest-note')}>
                            <p dir="auto">{m.message}</p>
                            <footer dir="auto">{m.guestName}</footer>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}

            <footer className={c('vp-ending')} data-ink="wine">
              <div className={c('vp-ending-page')}>
                <ThemeBorder border={props.border} fallback={LACE_BORDER} medium="screen" />
                <div className={c('vp-ending-copy')}>
                  <p className={c('vp-kicker')}>{t.letterLove}</p>
                  <h2>{t.closing}</h2>
                  <p className={c('vp-ending-names')}>{pair}</p>
                  {fullDate ? <p id={s['vl-ending-date']}>{fullDate}</p> : null}
                </div>
                <img className={c('vp-tulips')} src={tulips.src} alt="" aria-hidden="true" />
                <img className={c('vp-ending-spark')} src={spark.src} alt="" aria-hidden="true" />
              </div>
            </footer>
          </main>
        ) : null}
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
  const two = (n: number) => (n < 10 ? formatNumber(0, locale) + formatNumber(n, locale) : formatNumber(n, locale));
  return (
    <section className={c('vp-countdown')} data-ink="cream">
      <p className={c('vp-kicker')}>{t.countdownLead}</p>
      <h2>{t.countdownTitle}</h2>
      {left?.started ? (
        <p className={c('vp-countdown-date')}>{labels.eventStarted}</p>
      ) : (
        <div className={c('vp-countdown-ticket')} data-ink="wine" role="timer" aria-live="off">
          {units.map(([n, label]) => (
            <div key={label}>
              <strong>{n === undefined ? '–' : two(n)}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
      {date ? <p className={c('vp-countdown-date')}>{date}</p> : null}
    </section>
  );
}

function GuestForm({ api, labels, locale }: { api: GuestFormApi; labels: ThemeLabels; locale: ThemeProps['locale'] }) {
  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  const [message, setMessage] = useState('');

  if (api.status === 'sent') {
    return (
      <div className={c('vp-success')} role="status">
        <h3>{labels.sent}</h3>
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
      <h3 className={c('vp-sr-only')}>{labels.guestFormTitle}</h3>
      <label className={c('vp-field')}>
        <span>{labels.guestName}</span>
        <input
          name="name"
          autoComplete="name"
          value={name}
          maxLength={api.limits.name}
          onChange={(ev) => setName(ev.target.value)}
          disabled={sending}
          aria-invalid={e.name ? true : undefined}
          aria-describedby={e.name ? 'vl-guest-name-error' : undefined}
        />
        {e.name ? <FieldError id="vl-guest-name-error">{e.name}</FieldError> : null}
      </label>

      <fieldset disabled={sending} aria-describedby={e.attendance ? 'vl-attending-error' : undefined}>
        <legend>{labels.attendanceQuestion}</legend>
        {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
          <label key={value} className={c('vp-attendance')}>
            <input type="radio" name="attendance" checked={attendance === value} onChange={() => setAttendance(value)} />
            <span>{value === 'ATTENDING' ? labels.attending : labels.notAttending}</span>
          </label>
        ))}
        {e.attendance ? <FieldError id="vl-attending-error">{e.attendance}</FieldError> : null}
      </fieldset>

      {api.withMessage ? (
        <label className={c('vp-field')}>
          <span>{labels.message}</span>
          <textarea
            name="message"
            rows={3}
            value={message}
            maxLength={api.limits.message}
            onChange={(ev) => setMessage(ev.target.value)}
            disabled={sending}
            aria-invalid={e.message ? true : undefined}
            aria-describedby={`vl-message-count${e.message ? ' vl-message-error' : ''}`}
          />
          <span id="vl-message-count" className={c('vl-counter')}>
            {formatNumber(left, locale)}
          </span>
          {e.message ? <FieldError id="vl-message-error">{e.message}</FieldError> : null}
        </label>
      ) : null}

      {api.error ? (
        <p className={c('vp-form-error')} role="alert">
          {api.error}
        </p>
      ) : null}

      <button type="submit" className={c('vp-send')} data-ink="cream" disabled={sending}>
        {sending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className={c('vp-form-error')} role="alert">
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
