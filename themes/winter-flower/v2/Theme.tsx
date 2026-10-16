'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
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
import { RULE_BORDER } from './border';
import { copyFor, type Copy } from './copy';
import { nameScale } from './names';
import flowersLeft from './assets/flowers-left.webp';
import flowersRight from './assets/flowers-right.webp';
import flourish from './assets/flourish.webp';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/**
 * closed: the two flower stems stand joined in the middle of the page → opening: the left stem moves up and left,
 * the right one down and right, and the names, message and date appear between them → open.
 */
type Phase = 'closed' | 'opening' | 'open';

/** From the designer's prototype: the flowers' 2 s move, then the page is ready to scroll. */
const OPENING_MS = 2050;

const noop = () => () => {};

/** Class names from the module; the prototype's hyphenated names are kept so the styles read like the design. */
const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

/**
 * Where each stem stands while the invitation is closed, as a fraction of the opening page (from the prototype):
 * its left edge, its width, and its vertical offset from the centre.
 */
const CLOSED_GEOMETRY = [
  { left: 0.1730186378, width: 0.4086590313, offset: 0.05 },
  { left: 0.4654709828, width: 0.4037538111, offset: -0.05 },
] as const;

export default function WinterFlower(props: ThemeProps) {
  const { locale, dir, lang, fields, labels, event, mapUrl, occasion } = props;
  const t = copyFor(locale, occasion);
  const reduced = useReducedMotion();
  const music = useMusic();
  const [phase, setPhase] = useState<Phase>('closed');
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const hero = useRef<HTMLElement>(null);
  const left = useRef<HTMLImageElement>(null);
  const right = useRef<HTMLImageElement>(null);

  // The joined arrangement is measured from the page, so the stems meet in the same place at every width.
  const measure = useCallback(() => {
    const h = hero.current;
    if (!h) return;
    const width = h.clientWidth;
    const height = h.clientHeight;
    [left.current, right.current].forEach((flower, i) => {
      if (!flower || !flower.offsetWidth || !flower.offsetHeight || !width || !height) return;
      const g = CLOSED_GEOMETRY[i]!;
      const scale = (width * g.width) / flower.offsetWidth;
      const top = (height - flower.offsetHeight * scale) / 2 + height * g.offset;
      flower.style.setProperty('--closed-x', `${width * g.left - flower.offsetLeft}px`);
      flower.style.setProperty('--closed-y', `${top - flower.offsetTop}px`);
      flower.style.setProperty('--closed-scale', String(scale));
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    [hero.current, left.current, right.current].forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [measure]);

  const open = () => {
    if (phase !== 'closed') return;
    measure();
    music.start();
    setPhase(reduced ? 'open' : 'opening');
  };

  useEffect(() => {
    if (phase !== 'opening') return;
    const id = window.setTimeout(() => setPhase('open'), OPENING_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const script = locale === 'en' ? 'latin' : 'arabic';
  const showCountdown = hasFeature(props, 'countdown') && event.startsAt !== null;
  const showMap = hasFeature(props, 'map') && mapUrl !== null;
  const showForm = hasFeature(props, 'rsvp');
  const fullDate = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  const closed = phase === 'closed';

  return (
    <div id={s.frame} className={`${fonts.fonts} ${s.page}`}>
      <article className={c('root', reduced && 'reduced')} lang={lang} dir={dir} data-script={script} data-phase={phase} data-hydrated={hydrated ? '' : undefined}>
        <div className={c('website')}>
          {/* ---------------------------------------------------------------- the opening page */}
          <section ref={hero} className={c('wf-welcome')} data-ink="dark">
            <ThemeBorder border={props.border} fallback={RULE_BORDER} medium="screen" />
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork, moved by the opening */}
            <img ref={left} className={c('wf-hero-flower', 'wf-hero-left')} src={flowersLeft.src} alt="" aria-hidden="true" onLoad={measure} />
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork, moved by the opening */}
            <img ref={right} className={c('wf-hero-flower', 'wf-hero-right')} src={flowersRight.src} alt="" aria-hidden="true" onLoad={measure} />
            <div className={c('wf-hero-copy')} aria-hidden={hydrated && closed ? true : undefined}>
              <p className={c('wf-kicker')}>{t.saveDate}</p>
              <p className={c('wf-kicker')}>{t.weddingOf}</p>
              <h1 className={c('wf-names')}>
                {n1 ? <span style={{ fontSize: `${nameScale(n1)}em` }}>{n1}</span> : null}
                {n1 && n2 ? <em>{labels.and}</em> : null}
                {n2 ? <span style={{ fontSize: `${nameScale(n2)}em` }}>{n2}</span> : null}
              </h1>
              {fields.invitation_message ? <p id={s['vl-live-message']}>{fields.invitation_message}</p> : null}
              {fullDate ? (
                <div className={c('wf-hero-date')}>
                  <span className={c('wf-kicker')}>{t.celebrationOn}</span>
                  <strong>{fullDate}</strong>
                </div>
              ) : null}
              <Flourish />
            </div>
            {closed ? (
              <button type="button" className={c('wf-floral-hit')} onClick={open}>
                <span className={c('wf-open-hint', 'wf-kicker')}>{labels.openInvitation}</span>
              </button>
            ) : null}
          </section>

          {music.available && phase === 'open' ? (
            <button
              type="button"
              className={c('wf-audio')}
              onClick={music.toggle}
              aria-pressed={music.playing}
              aria-label={music.playing ? labels.musicPause : labels.musicPlay}
              title={music.playing ? labels.musicPause : labels.musicPlay}
            >
              <SpeakerIcon on={music.playing} />
            </button>
          ) : null}

          {/* ---------------------------------------------------------------- the invitation */}
          <main id={s['wf-website-body']} inert={hydrated && closed ? true : undefined}>
            <section className={c('wf-photo-section')} data-ink="dark">
              <div className={c('wf-photo-trail')} aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork */}
              <img className={c('wf-photo-botanical')} src={flowersLeft.src} alt="" aria-hidden="true" />
              <p className={c('wf-kicker')}>{t.together}</p>
              <p className={c('wf-story')}>{t.ourStory}</p>
              <p className={c('wf-photo-note')}>{t.presence}</p>
            </section>

            {fields.person_1_family || fields.person_2_family ? (
              <section className={c('wf-family-section')} data-ink="dark">
                <p className={c('wf-kicker')}>{t.familiesLead}</p>
                <div className={c('wf-family-pair')}>
                  {fields.person_1_family ? (
                    <div className={c('wf-family')}>
                      <p className={c('wf-kicker', 'wf-family-label')}>{t.groomFamily}</p>
                      <p className={c('wf-family-name')}>{fields.person_1_family}</p>
                    </div>
                  ) : null}
                  {fields.person_1_family && fields.person_2_family ? <span className={c('wf-family-rule')} aria-hidden="true" /> : null}
                  {fields.person_2_family ? (
                    <div className={c('wf-family')}>
                      <p className={c('wf-kicker', 'wf-family-label')}>{t.brideFamily}</p>
                      <p className={c('wf-family-name')}>{fields.person_2_family}</p>
                    </div>
                  ) : null}
                </div>
                <Flourish />
              </section>
            ) : null}

            {showCountdown ? <Countdown startsAt={event.startsAt} t={t} labels={labels} locale={locale} date={fullDate} /> : null}

            {event.date || event.time || fields.venue_name || showMap ? (
              <section className={c('wf-details')} data-ink="dark">
                <div className={c('wf-details-frame')}>
                  <p className={c('wf-kicker')}>{t.detailsLead}</p>
                  <h2>{t.detailsTitle}</h2>
                  {event.date || event.time ? (
                    <div className={c('wf-date-table')} data-single={event.date && event.time ? undefined : ''}>
                      {event.date ? (
                        <div className={c('wf-calendar')}>
                          <p id={s['vl-weekday']}>{event.date.weekday}</p>
                          <strong id={s['vl-detail-day']}>{event.date.day}</strong>
                          <span id={s['vl-detail-month']}>
                            {event.date.month} {event.date.year}
                          </span>
                        </div>
                      ) : null}
                      {event.time ? (
                        <div className={c('wf-time')}>
                          <span className={c('wf-kicker')}>{t.at}</span>
                          <strong id={s['vl-event-time']}>{event.time}</strong>
                          <span>{t.withFamilies}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {fields.venue_name || showMap ? (
                    <div className={c('wf-venue')}>
                      <p className={c('wf-kicker')}>{t.venueLabel}</p>
                      {fields.venue_name ? <h3>{fields.venue_name}</h3> : null}
                      {showMap ? (
                        <a className={c('wf-button', 'wf-outline')} href={mapUrl} target="_blank" rel="noopener noreferrer">
                          {labels.openMap}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  <Flourish />
                </div>
              </section>
            ) : null}

            {showForm || props.guestbook ? (
              <section className={c('wf-rsvp')} data-ink="dark">
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork */}
                <img className={c('wf-rsvp-botanical')} src={flowersRight.src} alt="" aria-hidden="true" />
                {showForm ? (
                  <>
                    <header className={c('wf-rsvp-title')}>
                      <p className={c('wf-kicker')}>{t.replyLead}</p>
                      <h2>{t.replyTitle}</h2>
                      <p>{t.replyIntro}</p>
                    </header>
                    <div className={c('wf-reply-card')}>
                      <GuestFormSlot render={(api) => <GuestForm api={api} labels={labels} locale={locale} />} />
                    </div>
                  </>
                ) : null}
                {props.guestbook ? (
                  <div className={c('wf-guestbook')}>
                    <h3>{labels.guestbookTitle}</h3>
                    {props.guestbook.length === 0 ? (
                      <p id={s['vl-guestbook-empty']}>{labels.guestbookEmpty}</p>
                    ) : (
                      props.guestbook.map((m, i) => (
                        <article key={i} className={c('vl-guest-note')}>
                          <p dir="auto">{m.message}</p>
                          <footer dir="auto">{m.guestName}</footer>
                        </article>
                      ))
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}

            <footer className={c('wf-ending')} data-ink="dark">
              <div className={c('wf-ending-frame')} />
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative artwork */}
              <img className={c('wf-ending-flowers')} src={flowersRight.src} alt="" aria-hidden="true" />
              <div className={c('wf-ending-copy')}>
                <p className={c('wf-kicker')}>{t.withLove}</p>
                <h2>{t.closing}</h2>
                <p className={c('wf-signature')}>
                  {n1 ? <span>{n1}</span> : null}
                  {n1 && n2 ? <em>{labels.and}</em> : null}
                  {n2 ? <span>{n2}</span> : null}
                </p>
                {fullDate ? <p id={s['vl-ending-date']}>{fullDate}</p> : null}
                <Flourish />
              </div>
            </footer>
          </main>
        </div>
      </article>
    </div>
  );
}

function Flourish({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- decorative artwork
  return <img className={className ?? c('wf-flourish')} src={flourish.src} alt="" aria-hidden="true" />;
}

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
    <section className={c('wf-countdown')} data-ink="dark">
      <div className={c('wf-countdown-panel')} data-ink="light">
        <Flourish className={c('wf-countdown-ornament')} />
        <p className={c('wf-kicker')}>{t.countdownLead}</p>
        <h2>{t.countdownTitle}</h2>
        {left?.started ? (
          <p className={c('wf-started')}>{labels.eventStarted}</p>
        ) : (
          <div className={c('wf-countdown-values')} role="timer" aria-live="off">
            {units.map(([n, label]) => (
              <div key={label}>
                <strong>{n === undefined ? '–' : two(n)}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
        {date ? <p id={s['vl-countdown-date']}>{date}</p> : null}
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
      <div className={c('wf-success')} role="status">
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
      <h3 className={c('wf-sr-only')}>{labels.guestFormTitle}</h3>
      <label className={c('wf-field')}>
        <span>{labels.guestName}</span>
        <input
          name="name"
          autoComplete="name"
          value={name}
          maxLength={api.limits.name}
          onChange={(ev) => setName(ev.target.value)}
          disabled={sending}
          aria-invalid={e.name ? true : undefined}
          aria-describedby={e.name ? 'wf-guest-name-error' : undefined}
        />
        {e.name ? <FieldError id="wf-guest-name-error">{e.name}</FieldError> : null}
      </label>

      <fieldset disabled={sending} aria-describedby={e.attendance ? 'wf-attending-error' : undefined}>
        <legend>{labels.attendanceQuestion}</legend>
        {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
          <label key={value} className={c('wf-attendance')}>
            <input type="radio" name="attendance" checked={attendance === value} onChange={() => setAttendance(value)} />
            <span>{value === 'ATTENDING' ? labels.attending : labels.notAttending}</span>
          </label>
        ))}
        {e.attendance ? <FieldError id="wf-attending-error">{e.attendance}</FieldError> : null}
      </fieldset>

      {api.withMessage ? (
        <label className={c('wf-field')}>
          <span>{labels.message}</span>
          <textarea
            name="message"
            rows={3}
            value={message}
            maxLength={api.limits.message}
            onChange={(ev) => setMessage(ev.target.value)}
            disabled={sending}
            aria-invalid={e.message ? true : undefined}
            aria-describedby={`wf-message-count${e.message ? ' wf-message-error' : ''}`}
          />
          <span id="wf-message-count" className={c('wf-counter')}>
            {formatNumber(left, locale)}
          </span>
          {e.message ? <FieldError id="wf-message-error">{e.message}</FieldError> : null}
        </label>
      ) : null}

      {api.error ? (
        <p className={c('wf-error')} role="alert">
          {api.error}
        </p>
      ) : null}

      <button type="submit" id={s['vl-send']} className={c('wf-button')} data-ink="light" disabled={sending}>
        {sending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className={c('wf-error')} role="alert">
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
