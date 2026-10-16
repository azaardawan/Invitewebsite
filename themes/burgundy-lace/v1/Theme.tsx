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
import { monthGrid, twoDigits } from './calendar';
import { copyFor, type Copy } from './copy';
import { initial, isLong } from './names';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/** closed → opening (the seal lifts, the flap swings, the lace card rises) → open. */
type Phase = 'closed' | 'opening' | 'open';

/** From the designer's prototype: the card has risen and the headings have faded in. */
const OPENING_MS = 2500;
const REDUCED_MS = 200;

const noop = () => () => {};

/** Class names from the module; the prototype's hyphenated names are kept so the styles read like the design. */
const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

export default function BurgundyLace(props: ThemeProps) {
  const { locale, dir, lang, fields, labels, event, mapUrl } = props;
  const t = copyFor(locale);
  const reduced = useReducedMotion();
  const music = useMusic();
  const [phase, setPhase] = useState<Phase>('closed');
  const [animating, setAnimating] = useState(false);
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  const open = () => {
    if (phase !== 'closed') return;
    music.start();
    setAnimating(true);
    setPhase('opening');
  };

  useEffect(() => {
    if (phase !== 'opening') return;
    const id = window.setTimeout(() => setPhase('open'), reduced ? REDUCED_MS : OPENING_MS);
    return () => window.clearTimeout(id);
  }, [phase, reduced]);

  const n1 = fields.person_1_name;
  const n2 = fields.person_2_name;
  const script = locale === 'en' ? 'latin' : 'arabic';
  const showCountdown = hasFeature(props, 'countdown') && event.startsAt !== null;
  const showMap = hasFeature(props, 'map') && mapUrl !== null;
  const showForm = hasFeature(props, 'rsvp');
  const calendar = monthGrid(event.startsAt, locale);
  const shortDate = event.date ? `${event.date.day} ${event.date.month} ${event.date.year}` : null;
  const closed = phase === 'closed';

  const names = (
    <>
      {n1 ? <span>{n1}</span> : null}
      {n1 && n2 ? <em>{labels.and}</em> : null}
      {n2 ? <span>{n2}</span> : null}
    </>
  );

  return (
    <div id={s.frame} className={`${fonts.fonts} ${s.page}`}>
      <article
        className={c('root', animating && 'si-animating', reduced && 'si-reduced', isLong(n1, n2) && 'si-long')}
        lang={lang}
        dir={dir}
        data-script={script}
        data-phase={phase}
        data-hydrated={hydrated ? '' : undefined}
      >
        {/* ---------------------------------------------------------------- envelope (cover → opened card) */}
        <section className={c('si-hero')} aria-label={labels.openInvitation}>
          <div className={c('si-lace-frame')} aria-hidden="true">
            {/* The other two lace corners (first and fourth, as in the design) belong to the theme's own artwork;
                an owner's border brings its own. The platform border comes after them so their positions hold. */}
            {props.border ? null : (
              <>
                <i />
                <i hidden />
                <i hidden />
                <i />
              </>
            )}
            <ThemeBorder border={props.border} fallback={LACE_BORDER} medium="screen" />
          </div>
          <div className={c('si-painting')} aria-hidden="true" />

          <header className={c('si-cover-heading')} aria-hidden={closed ? undefined : true}>
            <p className={c('si-kicker')}>{t.wedding}</p>
            <h1 className={c('si-cover-names', 'si-script')}>{names}</h1>
          </header>

          <p className={c('si-open-heading', 'si-kicker')} aria-hidden={closed ? true : undefined}>
            {t.cordially}
          </p>

          <div className={c('si-paper')}>
            <div className={c('si-paper-back')} aria-hidden="true">
              <div className={c('si-art', 'si-back-art')} />
            </div>
            <div className={c('si-card-pocket')}>
              <div className={c('si-lace-card')} aria-hidden={closed ? true : undefined}>
                <div className={c('si-lace-art', 'si-art')} aria-hidden="true" />
                <div className={c('si-card-copy')}>
                  <h2 className={c('si-card-names', 'si-script')}>{names}</h2>
                  {shortDate ? <p className={c('si-card-date')}>{shortDate}</p> : null}
                  {fields.venue_name ? <p className={c('si-card-venue')}>{fields.venue_name}</p> : null}
                </div>
              </div>
            </div>
            <div className={c('si-paper-front')} aria-hidden="true">
              <div className={c('si-art', 'si-front-art')} />
            </div>
            <div className={c('si-closed-shell')} aria-hidden="true">
              <div className={c('si-art', 'si-closed-art')} />
            </div>
            <div className={c('si-flap')} aria-hidden="true">
              <div className={c('si-art', 'si-closed-art')} />
            </div>
            <div className={c('bw-wax')} aria-hidden="true" />
            <button type="button" className={c('si-paper-hit')} onClick={open} disabled={!closed} tabIndex={-1} aria-hidden="true" />
          </div>

          <button type="button" className={c('si-open-link')} onClick={open} disabled={!closed}>
            {labels.openInvitation}
          </button>
          <p className={c('si-hero-footer', 'si-kicker')} aria-hidden={closed ? true : undefined}>
            {t.celebrate}
          </p>
        </section>

        {music.available && phase === 'open' ? (
          <button
            type="button"
            className={c('bl-audio')}
            onClick={music.toggle}
            aria-pressed={music.playing}
            aria-label={music.playing ? labels.musicPause : labels.musicPlay}
            title={music.playing ? labels.musicPause : labels.musicPlay}
          >
            <SpeakerIcon on={music.playing} />
          </button>
        ) : null}

        {/* ---------------------------------------------------------------- the invitation */}
        <main className={c('bl-content')} inert={hydrated && phase !== 'open' ? true : undefined}>
          <section className={c('si-intro')}>
            <div className={c('si-ivory-ornament')} aria-hidden="true">
              <span />
            </div>
            <p className={c('si-kicker', 'si-intro-kicker')}>{t.invitation}</p>
            {fields.invitation_message ? <p id={s['si-live-message']}>{fields.invitation_message}</p> : null}
            {fields.family_names ? <p className={c('si-family-line')}>{fields.family_names}</p> : null}
            <div className={c('bl-intro-rule')} aria-hidden="true">
              <span />
            </div>
            <p className={c('si-kicker')}>{t.withLove}</p>
            <p className={c('si-signature', 'si-script')}>{names}</p>
          </section>

          {showCountdown ? <Countdown startsAt={event.startsAt} t={t} labels={labels} locale={locale} /> : null}

          {event.date || event.time || fields.venue_name || showMap ? (
            <section className={c('si-details')}>
              <p className={c('si-kicker')}>{t.detailsLead}</p>
              <h2 className={c('bl-h3', 'si-script')}>{t.detailsTitle}</h2>
              <div className={c('si-detail-stationery')}>
                <div className={c('si-stationery-ornament')} aria-hidden="true">
                  <span />
                </div>
                {event.date ? (
                  <>
                    <p id={s['si-event-weekday']} className={c('si-detail-label')}>
                      {event.date.weekday}
                    </p>
                    <p className={c('si-event-date')}>{shortDate}</p>
                  </>
                ) : null}
                {calendar ? (
                  <div className={c('si-wedding-calendar')} aria-hidden="true">
                    {calendar.weekdays.map((d, i) => (
                      <span key={`w${i}`} className={c('si-weekday')}>
                        {d}
                      </span>
                    ))}
                    {calendar.days.map((d, i) => (
                      <span key={i} className={i === calendar.weddingIndex ? c('si-wedding-day') : undefined}>
                        {d}
                      </span>
                    ))}
                  </div>
                ) : null}
                {event.time ? (
                  <div className={c('si-event-time')}>
                    <span className={c('si-detail-label')}>{t.timeCaption}</span>
                    <p id={s['si-live-time']}>{event.time}</p>
                  </div>
                ) : null}
                {fields.venue_name ? (
                  <div className={c('si-event-place')}>
                    <span className={c('si-detail-label')}>{t.placeCaption}</span>
                    <p id={s['si-live-venue']}>{fields.venue_name}</p>
                  </div>
                ) : null}
                {showMap ? (
                  <a id={s['si-live-map']} className={c('si-outline-button')} href={mapUrl} target="_blank" rel="noopener noreferrer">
                    {labels.openMap}
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          {showForm ? (
            <section className={c('si-rsvp-call')}>
              <div className={c('si-small-paper')}>
                <div className={c('si-paper-back')} aria-hidden="true">
                  <div className={c('si-art', 'si-back-art')} />
                </div>
                <div className={c('si-lace-card')}>
                  <div className={c('si-lace-art', 'si-art')} aria-hidden="true" />
                  <div className={c('si-card-copy')}>
                    <p>{t.replyLead}</p>
                    <a href="#bl-guest-form" id={s['si-to-rsvp']} className={c('si-script')}>
                      {t.replyTitle}
                    </a>
                  </div>
                </div>
                <div className={c('si-paper-front')} aria-hidden="true">
                  <div className={c('si-art', 'si-front-art')} />
                </div>
              </div>
              <p className={c('si-kicker')}>{t.presence}</p>
            </section>
          ) : null}

          {showForm ? (
            <section className={c('si-form-wrap')} id="bl-guest-form">
              <GuestFormSlot render={(api) => <GuestForm api={api} labels={labels} locale={locale} />} />
            </section>
          ) : null}

          {props.guestbook ? (
            <section className={c('si-guestbook')}>
              <h2 className={c('bl-h3', 'si-script')}>{labels.guestbookTitle}</h2>
              {props.guestbook.length === 0 ? (
                <p>{labels.guestbookEmpty}</p>
              ) : (
                <ul className={c('bl-notes')}>
                  {props.guestbook.map((m, i) => (
                    <li key={i}>
                      <p className={c('bl-note-text')} dir="auto">
                        {m.message}
                      </p>
                      <p className={c('bl-note-name')} dir="auto">
                        {m.guestName}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          <footer className={c('si-end')}>
            {n1 || n2 ? (
              <span className={c('si-script', 'si-crest')} role="img" aria-label={[n1, n2].filter(Boolean).join(` ${labels.and} `)}>
                <span className={c('si-initial-one')}>{initial(n1)}</span>
                <span className={c('si-initial-two')}>{initial(n2)}</span>
              </span>
            ) : null}
            {shortDate ? <p>{shortDate}</p> : null}
          </footer>
        </main>
      </article>
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
    <section className={c('si-countdown')}>
      <p className={c('si-count-lead')}>{t.countdownLead}</p>
      <h2 className={c('bl-h3', 'si-script')}>{t.countdownTitle}</h2>
      {left?.started ? (
        <p className={c('si-small')}>{labels.eventStarted}</p>
      ) : (
        <div className={c('si-clock')} role="timer" aria-live="off">
          {units.map(([n, label]) => (
            <div key={label}>
              <strong>{n === undefined ? '–' : twoDigits(n, locale)}</strong>
              <span>{label}</span>
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
      <div className={c('si-success')} role="status">
        <h2 className={c('bl-h3', 'si-script')}>{labels.sent}</h2>
        {api.isPreview ? <p>{labels.sentPreview}</p> : null}
      </div>
    );
  }
  const sending = api.status === 'sending';
  const e = api.fieldErrors;
  const left = api.limits.message - message.length;

  return (
    <form
      className={c('bl-form')}
      onSubmit={(ev) => {
        ev.preventDefault();
        void api.submit({ name, attendance, message });
      }}
      noValidate
      aria-busy={sending}
    >
      {/* The reply card just above already shows the design's title; the form keeps it for screen readers. */}
      <h2 className={c('bl-sr-only')}>{labels.guestFormTitle}</h2>

      <label className={c('si-form-label')} htmlFor="bl-guest-name">
        {labels.guestName}
      </label>
      <input
        id="bl-guest-name"
        name="name"
        autoComplete="name"
        value={name}
        maxLength={api.limits.name}
        onChange={(ev) => setName(ev.target.value)}
        disabled={sending}
        aria-invalid={e.name ? true : undefined}
        aria-describedby={e.name ? 'bl-guest-name-error' : undefined}
      />
      {e.name ? <FieldError id="bl-guest-name-error">{e.name}</FieldError> : null}

      <fieldset disabled={sending} aria-describedby={e.attendance ? 'bl-attending-error' : undefined}>
        <legend>{labels.attendanceQuestion}</legend>
        {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
          <label key={value} className={c('si-choice')}>
            <input type="radio" name="attendance" checked={attendance === value} onChange={() => setAttendance(value)} />
            <span>{value === 'ATTENDING' ? labels.attending : labels.notAttending}</span>
          </label>
        ))}
        {e.attendance ? <FieldError id="bl-attending-error">{e.attendance}</FieldError> : null}
      </fieldset>

      {api.withMessage ? (
        <>
          <label className={c('si-form-label')} htmlFor="bl-guest-message">
            {labels.message}
          </label>
          <textarea
            id="bl-guest-message"
            name="message"
            rows={4}
            value={message}
            maxLength={api.limits.message}
            onChange={(ev) => setMessage(ev.target.value)}
            disabled={sending}
            aria-invalid={e.message ? true : undefined}
            aria-describedby={`bl-message-count${e.message ? ' bl-message-error' : ''}`}
          />
          <p id="bl-message-count" className={c('bl-counter')}>
            {formatNumber(left, locale)}
          </p>
          {e.message ? <FieldError id="bl-message-error">{e.message}</FieldError> : null}
        </>
      ) : null}

      {api.error ? (
        <p className={c('si-error')} role="alert">
          {api.error}
        </p>
      ) : null}

      <button type="submit" className={c('si-outline-button')} disabled={sending}>
        {sending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className={c('si-error')} role="alert">
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
