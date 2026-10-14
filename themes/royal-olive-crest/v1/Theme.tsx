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
import { copyFor, type Copy } from './copy';
import { CREST_BORDER } from './border';
import { Envelope } from './Envelope';
import { sealText } from './initials';
import { nameScale } from './names';
import fonts from './fonts.module.css';
import o from './opening.module.css';
import s from './theme.module.css';

/** closed → opening (the envelope opens) → open (the invitation is live, the overlay fades) → done. */
type Stage = 'closed' | 'opening' | 'open' | 'done';

const noop = () => () => {};

/** When the flaps have swung open: the invitation goes live and the song begins. */
const OPENED_AT_MS = 2050;
/** Upper bound for the whole opening; if an animation event never arrives, the invitation opens anyway. */
const OPENING_FAILSAFE_MS = 4500;

export default function RoyalOliveCrest(props: ThemeProps) {
  const { locale, dir, lang, fields, labels, event, mapUrl, wording } = props;
  const t = copyFor(locale);
  const reduced = useReducedMotion();
  const music = useMusic();
  const [stage, setStage] = useState<Stage>('closed');
  // The page is only made inert once JavaScript runs; without it the overlay is hidden and the page must stay usable.
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  const open = () => {
    if (stage !== 'closed') return;
    if (reduced) {
      music.start();
      setStage('open');
    } else {
      // Owner's choice: the song begins when the invitation appears, not with the tap.
      music.prime();
      setStage('opening');
    }
  };

  // `start` is stable; the music object itself changes whenever the song plays or pauses.
  const startMusic = music.start;
  useEffect(() => {
    if (stage !== 'opening') return;
    const id = window.setTimeout(() => {
      setStage('open');
      startMusic();
    }, OPENED_AT_MS);
    return () => window.clearTimeout(id);
  }, [stage, startMusic]);

  useEffect(() => {
    if (stage !== 'open') return;
    const id = window.setTimeout(() => setStage('done'), OPENING_FAILSAFE_MS - OPENED_AT_MS);
    return () => window.clearTimeout(id);
  }, [stage]);

  const showCountdown = hasFeature(props, 'countdown') && event.startsAt !== null;
  const showMap = hasFeature(props, 'map') && mapUrl !== null;
  const seal = sealText(fields, wording.sealJoin ?? '&');

  return (
    <div className={`${fonts.fonts} ${s.root}`} dir={dir} lang={lang} data-stage={stage} data-hydrated={hydrated ? '' : undefined}>
      {stage !== 'done' && (
        <div
          className={`${o.overlay} ${reduced ? o.reduced : ''}`}
          data-stage={stage}
          data-reduced={reduced ? '' : undefined}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget && stage === 'open') setStage('done');
          }}
        >
          <div className={o.backdrop} />
          <Envelope seal={seal} onOpen={open} />
          <button type="button" className={o.openButton} onClick={open} autoFocus>
            {labels.openInvitation}
          </button>
        </div>
      )}
      {/* Without JavaScript the envelope cannot open; show the invitation instead. */}
      <noscript>
        <style>{`.${o.overlay}{display:none!important}`}</style>
      </noscript>

      {music.available && (stage === 'open' || stage === 'done') && (
        <button
          type="button"
          className={s.audio}
          onClick={music.toggle}
          aria-pressed={music.playing}
          aria-label={music.playing ? labels.musicPause : labels.musicPlay}
          title={music.playing ? labels.musicPause : labels.musicPlay}
        >
          <SpeakerIcon on={music.playing} />
        </button>
      )}

      <main className={s.page} inert={hydrated && (stage === 'closed' || stage === 'opening') ? true : undefined}>
        {/* The crest page the envelope opens onto: the couple's names and the date, in calligraphy. */}
        <header className={s.hero}>
          <div className={`${s.sheet} ${s.sheetNames}`}>
            <div className={s.heroContent}>
              <h1 className={s.names}>
                {fields.person_1_name ? (
                  <span className={s.name} style={{ fontSize: `${nameScale(fields.person_1_name)}em` }}>
                    {fields.person_1_name}
                  </span>
                ) : null}
                {fields.person_1_name && fields.person_2_name ? (
                  <>
                    <span className={s.and} aria-hidden="true">
                      {labels.and}
                    </span>
                    <span className={s.srOnly}> {labels.and} </span>
                  </>
                ) : null}
                {fields.person_2_name ? (
                  <span className={s.name} style={{ fontSize: `${nameScale(fields.person_2_name)}em` }}>
                    {fields.person_2_name}
                  </span>
                ) : null}
              </h1>
              {event.date ? <p className={s.heroDate}>{event.date.full}</p> : null}
            </div>
          </div>
          <span className={s.scrollCue} aria-hidden="true" />
        </header>

        <div className={s.paper}>
          <section className={`${s.sheet} ${s.sheetVerse}`}>
            <div className={s.verseBox}>
              <p className={s.verse} lang="ar" dir="rtl">
                {t.verse}
              </p>
              <p className={s.verseRef} lang={locale === 'en' ? 'en' : 'ar'}>
                {t.verseRef}
              </p>
              {t.verseTranslation ? <p className={s.verseTranslation}>{t.verseTranslation}</p> : null}
            </div>
          </section>

          {fields.invitation_message ? (
            <section className={`${s.sheet} ${s.sheetMessage}`}>
              <div className={s.messageBox}>
                <p className={s.message}>{fields.invitation_message}</p>
              </div>
            </section>
          ) : null}

          {fields.venue_name || event.date || event.time || showMap ? (
            <section className={`${s.sheet} ${s.sheetVenue}`}>
              <div className={s.venueBox}>
                {fields.venue_name ? (
                  <>
                    <h2 className={s.eyebrow}>{labels.venue}</h2>
                    <p className={s.venueName}>{fields.venue_name}</p>
                    <span className={s.divider} aria-hidden="true" />
                  </>
                ) : null}
                <dl className={s.details}>
                  {event.date ? (
                    <div>
                      <dt className={s.eyebrow}>{labels.date}</dt>
                      <dd className={s.detailValue}>{event.date.full}</dd>
                    </div>
                  ) : null}
                  {event.time ? (
                    <div>
                      <dt className={s.eyebrow}>{labels.time}</dt>
                      <dd className={s.detailValue}>{event.time}</dd>
                    </div>
                  ) : null}
                </dl>
                {showMap ? (
                  <a className={s.mapButton} href={mapUrl} target="_blank" rel="noopener noreferrer">
                    <PinIcon />
                    <span>{labels.openMap}</span>
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          {showCountdown ? (
            <section className={`${s.sheet} ${s.sheetCountdown}`}>
              <CountdownBlock startsAt={event.startsAt} t={t} labels={labels} locale={locale} />
              <div className={s.countdownAfter}>
                {event.date ? <p className={s.countdownDate}>{event.date.full}</p> : null}
                {event.time ? <p className={s.countdownTime}>{event.time}</p> : null}
              </div>
            </section>
          ) : null}

          <div className={s.finale}>
            <ThemeBorder border={props.border} fallback={CREST_BORDER} medium="screen" />
            {hasFeature(props, 'rsvp') ? (
              <section className={s.formSection}>
                <span className={s.crest} aria-hidden="true" />
                <GuestFormSlot render={(api) => <GuestForm api={api} t={t} labels={labels} locale={locale} />} />
              </section>
            ) : null}

            {props.guestbook ? (
              <section className={s.guestbook}>
                <h2 className={s.sectionTitle}>{labels.guestbookTitle}</h2>
                {props.guestbook.length === 0 ? (
                  <p className={s.guestbookEmpty}>{labels.guestbookEmpty}</p>
                ) : (
                  <ul className={s.guestbookList}>
                    {props.guestbook.map((m, i) => (
                      <li key={i} className={s.guestbookItem}>
                        <p className={s.guestbookMessage} dir="auto">
                          {m.message}
                        </p>
                        <p className={s.guestbookName} dir="auto">
                          — {m.guestName}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}

            <footer className={s.closing}>
              <span className={`${s.crest} ${s.crestSmall}`} aria-hidden="true" />
              <p className={s.closingTitle}>{t.closing}</p>
              <p className={s.closingSub}>{t.closingSub}</p>
              <span className={s.divider} aria-hidden="true" />
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}

function CountdownBlock({ startsAt, t, labels, locale }: { startsAt: string | null; t: Copy; labels: ThemeLabels; locale: ThemeProps['locale'] }) {
  const left = useCountdown(startsAt);
  if (left?.started) {
    return (
      <div className={s.countdownCircle}>
        <p className={s.countdownTitle}>{labels.eventStarted}</p>
      </div>
    );
  }
  const units: [number | null, string][] = [
    [left?.days ?? null, labels.countdownDays],
    [left?.hours ?? null, labels.countdownHours],
    [left?.minutes ?? null, labels.countdownMinutes],
  ];
  return (
    <div className={s.countdownCircle}>
      <p className={s.countdownTitle}>{t.countdownTitle}</p>
      <div className={s.countdownUnits} role="timer" aria-live="off">
        {units.map(([n, label]) => (
          <div key={label} className={s.unit}>
            <span className={s.unitValue}>{n === null ? '–' : formatNumber(n, locale)}</span>
            <span className={s.unitLabel}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuestForm({ api, t, labels, locale }: { api: GuestFormApi; t: Copy; labels: ThemeLabels; locale: ThemeProps['locale'] }) {
  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  const [message, setMessage] = useState('');

  if (api.status === 'sent') {
    return (
      <div className={s.success} role="status">
        <span className={s.successMark} aria-hidden="true">
          <CheckIcon />
        </span>
        <p className={s.successTitle}>{labels.sent}</p>
        {api.isPreview && <p className={s.successBody}>{labels.sentPreview}</p>}
      </div>
    );
  }
  const sending = api.status === 'sending';
  const e = api.fieldErrors;
  const left = api.limits.message - message.length;

  return (
    <form
      className={s.form}
      onSubmit={(ev) => {
        ev.preventDefault();
        void api.submit({ name, attendance, message });
      }}
      noValidate
      aria-busy={sending}
    >
      <h2 className={s.sectionTitle}>{labels.guestFormTitle}</h2>
      <p className={s.formIntro}>{t.formIntro}</p>

      <div className={s.field} data-invalid={e.name ? '' : undefined}>
        <label className={s.label} htmlFor="roc-guest-name">
          {labels.guestName}
        </label>
        <input
          id="roc-guest-name"
          className={s.input}
          name="name"
          autoComplete="name"
          value={name}
          maxLength={api.limits.name}
          onChange={(ev) => setName(ev.target.value)}
          disabled={sending}
          aria-invalid={e.name ? true : undefined}
          aria-describedby={e.name ? 'roc-guest-name-error' : undefined}
        />
        {e.name && <FieldError id="roc-guest-name-error">{e.name}</FieldError>}
      </div>

      <fieldset
        className={s.field}
        data-invalid={e.attendance ? '' : undefined}
        aria-describedby={e.attendance ? 'roc-attending-error' : undefined}
        disabled={sending}
      >
        <legend className={s.label}>{labels.attendanceQuestion}</legend>
        <div className={s.choices}>
          {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
            <label key={value} className={s.choice} data-checked={attendance === value ? '' : undefined}>
              <input
                type="radio"
                name="attendance"
                className={s.choiceInput}
                checked={attendance === value}
                onChange={() => setAttendance(value)}
              />
              <span className={s.choiceDot} aria-hidden="true" />
              <span>{value === 'ATTENDING' ? labels.attending : labels.notAttending}</span>
            </label>
          ))}
        </div>
        {e.attendance && <FieldError id="roc-attending-error">{e.attendance}</FieldError>}
      </fieldset>

      {api.withMessage && (
        <div className={s.field} data-invalid={e.message ? '' : undefined}>
          <label className={s.label} htmlFor="roc-message">
            {labels.message}
          </label>
          <textarea
            id="roc-message"
            className={`${s.input} ${s.textarea}`}
            name="message"
            rows={5}
            value={message}
            maxLength={api.limits.message}
            onChange={(ev) => setMessage(ev.target.value)}
            disabled={sending}
            aria-invalid={e.message ? true : undefined}
            aria-describedby={`roc-message-count${e.message ? ' roc-message-error' : ''}`}
          />
          <div className={s.fieldFoot}>
            {e.message ? <FieldError id="roc-message-error">{e.message}</FieldError> : <span />}
            <span id="roc-message-count" className={s.counter} data-over={left < 0 ? '' : undefined}>
              {formatNumber(left, locale)}
            </span>
          </div>
        </div>
      )}

      {api.error && (
        <p className={s.formError} role="alert">
          {api.error}
        </p>
      )}

      <button type="submit" className={s.submit} disabled={sending}>
        {sending && <span className={s.spinner} aria-hidden="true" />}
        {sending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className={s.error} role="alert">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.5v4.2M8 11.2v.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}

// ---------------------------------------------------------------- icons (line, 1.5 px)

const iconProps = { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg {...iconProps} width={26} height={26} strokeWidth={1.8}>
      <path d="M6 12.5l4 4 8-9" />
    </svg>
  );
}
function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg {...iconProps} width={24} height={24}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" fillOpacity={on ? 1 : 0.2} />
      {on ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
    </svg>
  );
}
