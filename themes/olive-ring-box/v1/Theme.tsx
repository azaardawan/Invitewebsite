'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  GuestFormSlot,
  eventInstant,
  formatEventDate,
  formatEventTime,
  formatNumber,
  useCountdown,
  useMusic,
  useReducedMotion,
  type GuestFormApi,
  type ThemeProps,
} from '@/theme-sdk/runtime';
import { copyFor, type Copy } from './copy';
import { RingBox } from './RingBox';
import fonts from './fonts.module.css';
import o from './opening.module.css';
import s from './theme.module.css';

/** closed → opening (box animation) → open (invitation revealed, light fading) → done. */
type Stage = 'closed' | 'opening' | 'open' | 'done';

const noop = () => () => {};

/** Upper bound for the whole opening; if an animation event never arrives, the invitation opens anyway. */
const OPENING_FAILSAFE_MS = 4500;

export default function OliveRingBox(props: ThemeProps) {
  const { locale, dir, fields, features, mode } = props;
  const t = copyFor(locale);
  const reduced = useReducedMotion();
  const music = useMusic(features.includes('music') ? props.music : null);
  const [stage, setStage] = useState<Stage>('closed');
  // The page is only made inert once JavaScript runs; without it the overlay is hidden and the page must stay usable.
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  const open = () => {
    if (stage !== 'closed') return;
    music.start();
    setStage(reduced ? 'open' : 'opening');
  };

  useEffect(() => {
    if (stage !== 'opening' && stage !== 'open') return;
    const id = window.setTimeout(() => setStage('done'), OPENING_FAILSAFE_MS);
    return () => window.clearTimeout(id);
  }, [stage]);

  const has = (f: (typeof features)[number]) => features.includes(f);
  const when = eventInstant(fields.event_date, fields.event_time);
  const showCountdown = has('countdown') && when !== null;
  const showMap = has('map') && !!fields.venue_map_url;

  return (
    <div className={`${fonts.fonts} ${s.root}`} dir={dir} lang={locale === 'en' ? 'en' : 'ar'} data-stage={stage}>
      {stage !== 'done' && (
        <div
          className={`${o.overlay} ${stage !== 'closed' ? o.opening : ''} ${reduced ? o.reduced : ''}`}
          style={stage === 'open' ? { pointerEvents: 'none' } : undefined}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) setStage('done');
            else if ((e.target as HTMLElement).dataset.wash !== undefined) setStage('open');
          }}
        >
          <RingBox />
          <button type="button" className={o.openButton} onClick={open} autoFocus>
            {t.open}
          </button>
          <p className={o.hint}>{t.openHint}</p>
          <div className={o.wash} data-wash="" />
        </div>
      )}
      {/* Without JavaScript the box cannot open; show the invitation instead. */}
      <noscript>
        <style>{`.${o.overlay}{display:none!important}`}</style>
      </noscript>

      {music.available && stage !== 'closed' && (
        <button
          type="button"
          className={s.audio}
          onClick={music.toggle}
          aria-pressed={music.playing}
          aria-label={music.playing ? t.musicOn : t.musicOff}
          title={music.playing ? t.musicOn : t.musicOff}
        >
          <SpeakerIcon on={music.playing} />
        </button>
      )}

      <main className={s.page} inert={hydrated && (stage === 'closed' || stage === 'opening') ? true : undefined}>
        <Reveal as="header" className={s.hero} still>
          <span className={s.branchTop} aria-hidden="true" />
          <p className={s.basmala} lang="ar" dir="rtl">
            {copyFor('ar').basmala}
          </p>
          {locale === 'en' && <p className={s.basmalaTranslation}>{t.basmala}</p>}
          <Divider />
        </Reveal>

        <Reveal className={s.names}>
          <h1 className={s.namesHeading}>
            <span className={s.name}>{fields.person_1_name}</span>
            <span className={s.and} aria-hidden="true">
              {t.and}
            </span>
            <span className={s.srOnly}> {t.and} </span>
            <span className={s.name}>{fields.person_2_name}</span>
          </h1>
        </Reveal>

        {fields.invitation_message && (
          <Reveal className={s.message}>
            <p>{fields.invitation_message}</p>
          </Reveal>
        )}

        <Reveal className={s.details}>
          <dl className={s.detailList}>
            <Detail icon={<CalendarIcon />} label={t.date}>
              {formatEventDate(fields.event_date, locale)}
            </Detail>
            <Detail icon={<ClockIcon />} label={t.time}>
              {formatEventTime(fields.event_date, fields.event_time, locale)}
            </Detail>
            <Detail icon={<PinIcon />} label={t.venue}>
              {fields.venue_name}
            </Detail>
          </dl>
        </Reveal>

        <div className={s.branchSideRow} aria-hidden="true">
          <span className={s.branchSide} />
        </div>

        {(showCountdown || showMap) && (
          <Reveal className={s.countdownSection}>
            {showCountdown && <CountdownBlock target={when} t={t} locale={locale} />}
            {showMap && (
              <a className={s.mapButton} href={fields.venue_map_url} target="_blank" rel="noopener noreferrer">
                <PinIcon />
                <span>{t.map}</span>
                <span className={s.srOnly}> {t.opensNewTab}</span>
              </a>
            )}
          </Reveal>
        )}

        {has('rsvp') && (
          <Reveal className={s.formSection}>
            <GuestFormSlot mode={mode} features={features} render={(api) => <GuestForm api={api} t={t} locale={locale} />} />
          </Reveal>
        )}

        <Reveal as="footer" className={s.closing}>
          <span className={s.sprig} aria-hidden="true" />
          <p className={s.closingTitle}>{t.closing}</p>
          <p className={s.closingSub}>{t.closingSub}</p>
        </Reveal>
      </main>
    </div>
  );
}

/**
 * Fades a section in (0.6 s, at most 12 px upward) the first time it scrolls
 * into view. `still` = fade only, used for religious text.
 */
function Reveal({
  as: Tag = 'section',
  className,
  still,
  children,
}: {
  as?: 'section' | 'header' | 'footer';
  className?: string;
  still?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<'static' | 'waiting' | 'shown'>('static');

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState('shown');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    // Hide only once JS is running, so the content is never invisible without it.
    setState('waiting');
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} className={`${s.reveal} ${className ?? ''}`} data-reveal={state} data-still={still ? '' : undefined}>
      {children}
    </Tag>
  );
}

function Divider() {
  return (
    <svg className={s.divider} viewBox="0 0 160 12" aria-hidden="true">
      <path d="M4 6H68M92 6H156" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M80 1.5L84.5 6L80 10.5L75.5 6Z" fill="currentColor" />
    </svg>
  );
}

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className={s.detail}>
      <span className={s.detailIcon} aria-hidden="true">
        {icon}
      </span>
      <dt className={s.detailLabel}>{label}</dt>
      <dd className={s.detailValue}>{children}</dd>
    </div>
  );
}

function CountdownBlock({ target, t, locale }: { target: Date | null; t: Copy; locale: ThemeProps['locale'] }) {
  const left = useCountdown(target);
  if (left?.done) return <p className={s.countdownTitle}>{t.countdownDone}</p>;
  const units: [number | null, string][] = [
    [left?.days ?? null, t.days],
    [left?.hours ?? null, t.hours],
    [left?.minutes ?? null, t.minutes],
  ];
  return (
    <div className={s.countdown}>
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

function GuestForm({ api, t, locale }: { api: GuestFormApi; t: Copy; locale: ThemeProps['locale'] }) {
  if (api.status === 'success') {
    return (
      <div className={s.success} role="status">
        <span className={s.successMark} aria-hidden="true">
          <CheckIcon />
        </span>
        <p className={s.successTitle}>{t.successTitle}</p>
        <p className={s.successBody}>{t.successBody}</p>
      </div>
    );
  }
  const sending = api.status === 'sending';
  const e = api.errors;
  const nameError = e.guestName === 'required' ? t.errRequiredName : e.guestName === 'too_long' ? t.errTooLongName : null;
  const attendingError = e.attending ? t.errRequiredAttending : null;
  const messageError = e.message ? t.errTooLongMessage : null;
  const formError =
    api.formError === 'closed' ? t.errClosed : api.formError === 'rate_limited' ? t.errRateLimited : api.status === 'error' && !Object.values(e).some(Boolean) ? t.errForm : null;
  const left = api.limits.message - api.values.message.length;

  return (
    <form className={s.form} onSubmit={api.onSubmit} noValidate aria-busy={sending}>
      <h2 className={s.formTitle}>{t.formTitle}</h2>
      <p className={s.formIntro}>{t.formIntro}</p>

      <div className={s.field} data-invalid={nameError ? '' : undefined}>
        <label className={s.label} htmlFor="orb-guest-name">
          {t.guestName}
        </label>
        <input
          id="orb-guest-name"
          className={s.input}
          name="guestName"
          autoComplete="name"
          placeholder={t.guestNamePlaceholder}
          value={api.values.guestName}
          maxLength={api.limits.guestName + 20}
          onChange={(ev) => api.setGuestName(ev.target.value)}
          disabled={sending}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? 'orb-guest-name-error' : undefined}
        />
        {nameError && <FieldError id="orb-guest-name-error">{nameError}</FieldError>}
      </div>

      <fieldset
        className={s.field}
        data-invalid={attendingError ? '' : undefined}
        aria-describedby={attendingError ? 'orb-attending-error' : undefined}
        disabled={sending}
      >
        <legend className={s.label}>{t.attendance}</legend>
        <div className={s.choices}>
          {([true, false] as const).map((value) => (
            <label key={String(value)} className={s.choice} data-checked={api.values.attending === value ? '' : undefined}>
              <input
                type="radio"
                name="attending"
                className={s.choiceInput}
                checked={api.values.attending === value}
                onChange={() => api.setAttending(value)}
              />
              <span className={s.choiceDot} aria-hidden="true" />
              <span>{value ? t.attending : t.notAttending}</span>
            </label>
          ))}
        </div>
        {attendingError && <FieldError id="orb-attending-error">{attendingError}</FieldError>}
      </fieldset>

      {api.includeMessage && (
        <div className={s.field} data-invalid={messageError ? '' : undefined}>
          <label className={s.label} htmlFor="orb-message">
            {t.message} <span className={s.optional}>{t.messageOptional}</span>
          </label>
          <textarea
            id="orb-message"
            className={`${s.input} ${s.textarea}`}
            name="message"
            rows={4}
            placeholder={t.messagePlaceholder}
            value={api.values.message}
            onChange={(ev) => api.setMessage(ev.target.value)}
            disabled={sending}
            aria-invalid={messageError ? true : undefined}
            aria-describedby={`orb-message-count${messageError ? ' orb-message-error' : ''}`}
          />
          <div className={s.fieldFoot}>
            {messageError ? <FieldError id="orb-message-error">{messageError}</FieldError> : <span />}
            <span id="orb-message-count" className={s.counter} data-over={left < 0 ? '' : undefined}>
              {formatNumber(left, locale)} {t.charsLeft}
            </span>
          </div>
        </div>
      )}

      {formError && (
        <p className={s.formError} role="alert">
          {formError}
        </p>
      )}

      <button type="submit" className={s.submit} disabled={sending}>
        {sending && <span className={s.spinner} aria-hidden="true" />}
        {sending ? t.sending : t.send}
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

// ---------------------------------------------------------------- icons (line, 1.5 px, olive)

const iconProps = { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
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
    <svg {...iconProps} width={22} height={22}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" fillOpacity={on ? 0.15 : 0} />
      {on ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
    </svg>
  );
}
