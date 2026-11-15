'use client';

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
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
import { BORDER } from './border';
import { PLACES, copyFor, type Copy, type PlaceKey } from './copy';
import { OPENING_MS, progressAt, sceneAt, sunPoints } from './motion';
import archFrame from './assets/arch-frame.webp';
import citadel from './assets/citadel.webp';
import cityMap from './assets/city-map.webp';
import clouds from './assets/clouds.webp';
import gate from './assets/gate.webp';
import leaves from './assets/leaves.webp';
import minaret from './assets/minaret.webp';
import paper from './assets/paper.png';
import postcardBack from './assets/postcard-back.webp';
import postcardFront from './assets/postcard-front.webp';
import square from './assets/square.webp';
import streetMap from './assets/street-map.webp';
import tea from './assets/tea.webp';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/** closed (the gate and the names) → opening (the journey through the city, ~3.6 s) → open (the card, then the page). */
type Phase = 'closed' | 'opening' | 'open';

const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

const noop = () => () => {};
const ART: Record<PlaceKey, string> = {
  citadel: citadel.src,
  square: square.src,
  minaret: minaret.src,
};
const SUN_FLAG = sunPoints(60, 40, 11, 18);

/* eslint-disable @next/next/no-img-element -- the design's layered watercolours */

export default function ErbilHewler(props: ThemeProps) {
  const { locale, dir, lang, fields, labels, event, mapUrl, occasion, photos } = props;
  const t = copyFor(locale);
  const reduced = useReducedMotion();
  const music = useMusic();
  const [phase, setPhase] = useState<Phase>('closed');
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  const stageRef = useRef<HTMLDivElement>(null);
  /** Writes every layer of the journey at progress p straight onto the elements (no re-render per frame). */
  const paint = useCallback((p: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const els = new Map<string, HTMLElement>();
    stage.querySelectorAll<HTMLElement>('[data-layer]').forEach((el) => els.set(el.dataset.layer ?? '', el));
    const gateEl = els.get('gate');
    const originY = gateEl ? gateEl.offsetTop + gateEl.offsetHeight * 0.72 : 0;
    const scene = sceneAt(p, stage.clientWidth, stage.clientHeight, originY);
    for (const [key, style] of Object.entries(scene)) {
      const el = els.get(key);
      if (!el) continue;
      if (style.transform !== undefined) el.style.transform = style.transform;
      if (style.opacity !== undefined) el.style.opacity = String(style.opacity);
    }
  }, []);

  // The journey, on animation frames; then the page.
  useEffect(() => {
    if (phase !== 'opening') return;
    let raf = 0,
      start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const ms = now - start;
      paint(progressAt(ms));
      if (ms >= OPENING_MS) setPhase('open');
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, paint]);

  // Open: the journey's last frame, kept right when the screen turns or resizes.
  useLayoutEffect(() => {
    if (phase !== 'open') return;
    const end = () => paint(1);
    end();
    window.addEventListener('resize', end);
    return () => window.removeEventListener('resize', end);
  }, [phase, paint]);

  const open = () => {
    if (phase !== 'closed') return;
    music.start();
    setPhase(reduced ? 'open' : 'opening');
  };

  const one = fields.person_1_name?.trim() ?? '';
  const two = fields.person_2_name?.trim() ?? '';
  const names = [one, two].filter(Boolean).join(` ${labels.and} `);
  const message = fields.invitation_message?.trim() ?? '';
  const occasionLine = occasion === 'engagement' ? t.engagement : t.wedding;
  const showCountdown = hasFeature(props, 'countdown') && event.startsAt !== null;
  const showMap = hasFeature(props, 'map') && mapUrl !== null;
  const showForm = hasFeature(props, 'rsvp');
  const photo = hasFeature(props, 'photos') ? photos[0] : undefined;
  const shut = hydrated && phase === 'closed';
  const script = locale === 'en' ? 'latin' : 'arabic';

  return (
    <div id={s.frame} className={`${fonts.fonts} ${c('page')}`}>
      <article
        className={c('root', reduced && 'reduced')}
        lang={lang}
        dir={dir}
        data-script={script}
        data-phase={phase}
        data-hydrated={hydrated ? '' : undefined}
        style={{ ['--paper' as string]: `url(${paper.src})` }}
      >
        <section className={c('opening')} aria-label={labels.openInvitation}>
          <div className={c('stage')} ref={stageRef}>
            <div className={c('sky')} aria-hidden="true" />
            <div className={c('warmth')} data-layer="warmth" aria-hidden="true" />
            <div className={c('cloud', 'cloud-one')} data-layer="cloudOne" aria-hidden="true">
              <img src={clouds.src} alt="" />
            </div>
            <div className={c('cloud', 'cloud-two')} data-layer="cloudTwo" aria-hidden="true">
              <img src={clouds.src} alt="" />
            </div>
            <div className={c('distant-citadel')} data-layer="distantCitadel" aria-hidden="true">
              <img src={citadel.src} alt="" />
            </div>
            <div className={c('opening-names')} data-layer="names" data-long={Math.max(one.length, two.length) > 11 ? '' : undefined}>
              <p className={c('eyebrow')}>
                {locale === 'en' ? t.cityLine : null}
                <span lang="ckb" dir="rtl">
                  هەولێر
                </span>
              </p>
              <h1>
                {one ? <span>{one}</span> : null}
                {one && two ? <i>&amp;</i> : null}
                {two ? <span>{two}</span> : null}
              </h1>
              <p className={c('occasion')}>{occasionLine}</p>
            </div>
            <div className={c('citadel-world')} data-layer="citadelWorld" aria-hidden="true">
              <div className={c('citadel-intro')} data-layer="citadelIntro">
                <p className={c('eyebrow')}>{t.citadelEyebrow}</p>
                <h2>
                  {t.citadelTitle}
                  <br /> <em>{t.citadelEm}</em>
                </h2>
                <p>{t.citadelLine}</p>
              </div>
              <div className={c('citadel-hill')} data-layer="citadelHill">
                <img src={citadel.src} alt="" />
              </div>
            </div>
            <div className={c('city-world')} data-layer="cityWorld" aria-hidden="true">
              <div className={c('city-light')} />
              <div className={c('city-square')} data-layer="citySquare">
                <img src={square.src} alt="" />
                <span className={c('landmark-note')}>{t.squareNote}</span>
                <div className={c('water-shimmer')}>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <div className={c('city-minaret')} data-layer="cityMinaret">
                <img src={minaret.src} alt="" />
                <span className={c('landmark-note')}>{t.minaretNote}</span>
              </div>
              <div className={c('city-caption')} data-layer="cityCaption">
                <span>{t.cityEyebrow}</span>
                <p>
                  {t.cityTitle}
                  <br /> <em>{t.cityEm}</em>
                </p>
              </div>
              <div className={c('paving')} />
            </div>
            <div className={c('map-backdrop')} data-layer="mapBackdrop" aria-hidden="true">
              <img src={cityMap.src} alt="" />
            </div>
            <div className={c('reveal-card')} data-layer="revealCard">
              <img className={c('painted-frame')} src={archFrame.src} alt="" />
              <div className={c('card-copy', message.length > 190 && 'dense')}>
                <p className={c('eyebrow')}>{t.together}</p>
                <h2>
                  {one ? <span>{one}</span> : null}
                  {one && two ? <i>&amp;</i> : null}
                  {two ? <span>{two}</span> : null}
                </h2>
                {message ? <p className={c('card-message')}>{message}</p> : null}
                <Rosette className={c('small-rosette')} />
                {event.date ? <p className={c('card-date')}>{event.date.full}</p> : null}
                <p className={c('card-city')}>{t.city}</p>
              </div>
            </div>
            <div className={c('gate-layer')} data-layer="gate" aria-hidden="true">
              <img src={gate.src} alt="" />
              <div className={c('flag-pole')}>
                <span />
                <KurdishFlag className={c('kurdish-flag')} />
              </div>
            </div>
            <div className={c('foreground', 'foliage-left')} data-layer="foliageLeft" aria-hidden="true">
              <div className={c('leaf-sway')}>
                <img src={leaves.src} alt="" />
              </div>
            </div>
            <div className={c('foreground', 'foliage-right')} data-layer="foliageRight" aria-hidden="true">
              <div className={c('leaf-sway')}>
                <img src={leaves.src} alt="" />
              </div>
            </div>
            {phase === 'closed' ? (
              <button type="button" className={c('opening-cue')} data-layer="cue" onClick={open}>
                <span>{labels.openInvitation}</span>
                <i aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </section>

        {music.available && phase !== 'closed' ? (
          <button
            type="button"
            className={c('audio')}
            onClick={music.toggle}
            aria-pressed={music.playing}
            aria-label={music.playing ? labels.musicPause : labels.musicPlay}
            title={music.playing ? labels.musicPause : labels.musicPlay}
          >
            <SpeakerIcon on={music.playing} />
          </button>
        ) : null}

        <main className={c('body')} inert={shut ? true : undefined}>
          <section className={c('welcome', 'content-section')}>
            <Kilim />
            <p className={c('eyebrow')}>{t.welcomeEyebrow}</p>
            <h2>
              {t.welcomeTitle}
              <br />
              <em>{t.welcomeEm}</em>
            </h2>
            {message ? <p className={c('welcome-message')}>{message}</p> : null}
            {names ? <div className={c('welcome-signature')}>{names}</div> : null}
          </section>

          <Atlas t={t} />

          {showCountdown ? <Countdown startsAt={event.startsAt} t={t} labels={labels} locale={locale} date={event.date?.full ?? null} /> : null}

          {event.date || event.time || fields.venue_name || showMap ? (
            <section className={c('details-section', 'content-section')}>
              <img className={c('details-map')} src={cityMap.src} alt="" aria-hidden="true" />
              <div className={c('details-art')}>
                <img src={square.src} alt="" />
                <span>{t.squareNote}</span>
              </div>
              <div className={c('details-copy')}>
                <p className={c('eyebrow')}>{t.detailsEyebrow}</p>
                <h2>
                  {t.detailsTitle}
                  <br />
                  <em>{t.detailsEm}</em>
                </h2>
                <div className={c('detail-rule')} />
                {event.date ? <p className={c('event-date')}>{event.date.full}</p> : null}
                {event.time ? (
                  <p className={c('event-time')}>
                    <span>{event.time}</span> <span className={c('muted')}>· {t.erbilTime}</span>
                  </p>
                ) : null}
                {fields.venue_name ? <h3>{fields.venue_name}</h3> : null}
                <p className={c('address')}>{t.city}</p>
                {showMap ? (
                  <div className={c('detail-actions')}>
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                      {labels.openMap}
                    </a>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <Postcard t={t} />

          {photo ? (
            <section className={c('photo-section', 'content-section')}>
              <div className={c('photo-arch')}>
                <Photo photo={photo} className={c('photo-fill')} />
              </div>
              <div>
                <p className={c('eyebrow')}>{t.photoEyebrow}</p>
                <h2>
                  {t.photoTitle}
                  <br />
                  <em>{t.photoEm}</em>
                </h2>
                {names ? <p className={c('photo-names')}>{names}</p> : null}
              </div>
            </section>
          ) : null}

          {showForm ? (
            <section className={c('reply-section', 'content-section')}>
              <Kilim />
              <div className={c('reply-heading')}>
                <p className={c('eyebrow')}>{t.replyEyebrow}</p>
                <h2>
                  {t.replyTitle}
                  <br /> <em>{t.replyEm}</em>
                </h2>
              </div>
              <GuestFormSlot render={(api) => <GuestForm api={api} labels={labels} locale={locale} />} />
            </section>
          ) : null}

          {props.guestbook ? (
            <section className={c('wishes-section', 'content-section')}>
              <p className={c('eyebrow')}>{t.wishesEyebrow}</p>
              <h2>{labels.guestbookTitle}</h2>
              <div className={c('wishes')}>
                {props.guestbook.length === 0 ? (
                  <p className={c('wishes-empty')}>{labels.guestbookEmpty}</p>
                ) : (
                  props.guestbook.map((m, i) => (
                    <article key={i} className={c('wish')}>
                      <p dir="auto">{m.message}</p>
                      <footer dir="auto">{m.guestName}</footer>
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : null}

          <section className={c('farewell')}>
            <ThemeBorder border={props.border} fallback={BORDER} medium="screen" />
            <div className={c('farewell-map')} aria-hidden="true">
              <img src={cityMap.src} alt="" />
            </div>
            <img className={c('tea-art')} src={tea.src} alt="" aria-hidden="true" />
            <div className={c('steam')} aria-hidden="true">
              <i />
              <i />
            </div>
            <p className={c('eyebrow')}>{t.farewellEyebrow}</p>
            <h2>
              {t.farewellTitle}
              <br />
              <em>{t.farewellEm}</em>
            </h2>
            {names ? <p className={c('farewell-names')}>{names}</p> : null}
            <p className={c('farewell-kurdish')} lang="ckb" dir="rtl">
              بە خۆشەویستییەوە
            </p>
            <button
              type="button"
              className={c('back-top')}
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: reduced ? 'auto' : 'smooth',
                })
              }
            >
              {t.backTop}
            </button>
            <Kilim />
          </section>
          <p className={c('map-license')}>{t.mapLicense}</p>
        </main>
      </article>
    </div>
  );
}

/** The three landmarks on the real street map; each opens its spot on Google Maps. */
function Atlas({ t }: { t: Copy }) {
  const [place, setPlace] = useState<PlaceKey>('citadel');
  const current = PLACES.find((p) => p.key === place) ?? PLACES[0];
  const text: Record<PlaceKey, string> = {
    citadel: t.citadelText,
    square: t.squareText,
    minaret: t.minaretText,
  };
  const name: Record<PlaceKey, string> = {
    citadel: t.citadel,
    square: t.square,
    minaret: t.minaret,
  };
  return (
    <section className={c('atlas-section', 'content-section')}>
      <div className={c('atlas-copy')}>
        <p className={c('eyebrow')}>{t.atlasEyebrow}</p>
        <h2>
          {t.atlasTitle}
          <br />
          <em>{t.atlasEm}</em>
        </h2>
        <p className={c('atlas-intro')}>{t.atlasIntro}</p>
        <div className={c('atlas-stops')} role="group" aria-label={t.atlasChoose}>
          {PLACES.map((p, i) => (
            <button key={p.key} type="button" className={c(place === p.key && 'active')} aria-pressed={place === p.key} onClick={() => setPlace(p.key)}>
              <span>{`0${i + 1}`}</span> {name[p.key]}
            </button>
          ))}
        </div>
        <div className={c('atlas-description')} aria-live="polite">
          <p>{text[place]}</p>
        </div>
        <div className={c('atlas-preview')}>
          <img src={ART[place]} alt="" data-landmark={place} />
        </div>
      </div>
      <div className={c('atlas-sheet')}>
        <div className={c('atlas-map-head')}>
          <span className={c('atlas-heading')}>
            {t.mapHeading} <small>{t.mapSub}</small>
          </span>
          <span className={c('map-north')}>{t.north}</span>
        </div>
        <div className={c('atlas-map')}>
          <img className={c('atlas-streets')} src={streetMap.src} alt={t.mapAlt} />
          {PLACES.map((p, i) => (
            <button
              key={p.key}
              type="button"
              className={c('map-pin', `pin-${p.key}`, place === p.key && 'active')}
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
              aria-pressed={place === p.key}
              onClick={() => setPlace(p.key)}
            >
              <i>{`0${i + 1}`}</i>
              <span>{name[p.key]}</span>
            </button>
          ))}
          <div className={c('map-scale')}>
            <i />
            {t.scale}
          </div>
        </div>
        <div className={c('atlas-map-foot')}>
          <a className={c('map-attribution')} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            © OpenStreetMap contributors
          </a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${current.query}`} target="_blank" rel="noopener noreferrer">
            {t.googleMaps}
          </a>
        </div>
      </div>
    </section>
  );
}

/** The Hewlêr postcard: tap to turn it over. */
function Postcard({ t }: { t: Copy }) {
  const [turned, setTurned] = useState(false);
  return (
    <section className={c('postcards-section', 'content-section')}>
      <div className={c('postcards-head')}>
        <div>
          <p className={c('eyebrow')}>{t.postcardEyebrow}</p>
          <h2>
            {t.postcardTitle}
            <br />
            <em>{t.postcardEm}</em>
          </h2>
        </div>
        <p>{t.postcardLine}</p>
      </div>
      <div className={c('postcards-layout')}>
        <article className={c('postcard-item')}>
          <button type="button" className={c('postcard-flip')} aria-pressed={turned} aria-label={t.turnLabel} onClick={() => setTurned((v) => !v)}>
            <span className={c('postcard-inner')}>
              <span className={c('postcard-front')}>
                <img src={postcardFront.src} alt="" />
              </span>
              <span className={c('postcard-back')} aria-hidden="true">
                <img src={postcardBack.src} alt="" />
              </span>
            </span>
          </button>
          <div className={c('postcard-caption')}>
            <span>{t.turnOver}</span>
          </div>
        </article>
        <div className={c('postcard-story')}>
          <span className={c('paper-edition')}>{t.edition}</span>
          <h3>
            {t.keepTitle} <br />
            <em>{t.keepEm}</em>
          </h3>
          <p>{t.keep1}</p>
          <p>{t.keep2}</p>
        </div>
      </div>
    </section>
  );
}

function Countdown({
  startsAt,
  t,
  labels,
  locale,
  date,
}: {
  startsAt: string | null;
  t: Copy;
  labels: ThemeLabels;
  locale: ThemeProps['locale'];
  date: string | null;
}) {
  const left = useCountdown(startsAt);
  const units: [number | undefined, string][] = [
    [left?.days, labels.countdownDays],
    [left?.hours, labels.countdownHours],
    [left?.minutes, labels.countdownMinutes],
    [left?.seconds, labels.countdownSeconds],
  ];
  return (
    <section className={c('countdown-section')}>
      <div className={c('count-border')} aria-hidden="true" />
      <p className={c('eyebrow')}>{t.countEyebrow}</p>
      <h2>{t.countTitle}</h2>
      {left?.started ? (
        <p className={c('count-date')}>{labels.eventStarted}</p>
      ) : (
        <div className={c('countdown')} role="timer" aria-live="off">
          {units.map(([n, label], i) => (
            <Fragment key={label}>
              {i ? <i aria-hidden="true">:</i> : null}
              <div>
                <b>{n === undefined ? '—' : formatNumber(n, locale)}</b>
                <span>{label}</span>
              </div>
            </Fragment>
          ))}
        </div>
      )}
      {date ? <p className={c('count-date')}>{date}</p> : null}
    </section>
  );
}

/** Attendance and, in packages with messages, a note to the couple, in one form. */
function GuestForm({ api, labels, locale }: { api: GuestFormApi; labels: ThemeLabels; locale: ThemeProps['locale'] }) {
  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  const [message, setMessage] = useState('');

  if (api.status === 'sent') {
    return (
      <div className={c('reply-sent')} role="status">
        <p>{labels.sent}</p>
        {api.isPreview ? <p className={c('reply-help')}>{labels.sentPreview}</p> : null}
      </div>
    );
  }
  const sending = api.status === 'sending';
  const e = api.fieldErrors;
  const left = api.limits.message - message.length;

  return (
    <form
      className={c('reply-form')}
      aria-label={labels.guestFormTitle}
      onSubmit={(ev) => {
        ev.preventDefault();
        void api.submit({ name, attendance, message });
      }}
      noValidate
      aria-busy={sending}
    >
      <label htmlFor="eh-guest-name">{labels.guestName}</label>
      <input
        id="eh-guest-name"
        name="name"
        autoComplete="name"
        value={name}
        maxLength={api.limits.name}
        onChange={(ev) => setName(ev.target.value)}
        disabled={sending}
        aria-invalid={e.name ? true : undefined}
        aria-describedby={e.name ? 'eh-guest-name-error' : undefined}
      />
      {e.name ? <FieldError id="eh-guest-name-error">{e.name}</FieldError> : null}

      <fieldset disabled={sending} aria-describedby={e.attendance ? 'eh-attending-error' : undefined}>
        <legend>{labels.attendanceQuestion}</legend>
        {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
          <label key={value} className={c('radio-label')}>
            <input type="radio" name="attendance" checked={attendance === value} onChange={() => setAttendance(value)} />
            <span>{value === 'ATTENDING' ? labels.attending : labels.notAttending}</span>
          </label>
        ))}
      </fieldset>
      {e.attendance ? <FieldError id="eh-attending-error">{e.attendance}</FieldError> : null}

      {api.withMessage ? (
        <>
          <label htmlFor="eh-guest-message">{labels.message}</label>
          <textarea
            id="eh-guest-message"
            name="message"
            rows={3}
            value={message}
            maxLength={api.limits.message}
            onChange={(ev) => setMessage(ev.target.value)}
            disabled={sending}
            aria-invalid={e.message ? true : undefined}
            aria-describedby={`eh-message-count${e.message ? ' eh-message-error' : ''}`}
          />
          <p id="eh-message-count" className={c('reply-help')}>
            {formatNumber(left, locale)}
          </p>
          {e.message ? <FieldError id="eh-message-error">{e.message}</FieldError> : null}
        </>
      ) : null}

      {api.error ? (
        <p className={c('reply-error')} role="alert">
          {api.error}
        </p>
      ) : null}

      <button type="submit" className={c('primary-button')} disabled={sending}>
        {sending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className={c('reply-error')} role="alert">
      {children}
    </span>
  );
}

/* eslint-enable @next/next/no-img-element */

function KurdishFlag({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 80" aria-hidden="true">
      <path fill="#c23b37" d="M0 0H120V26.667H0z" />
      <path fill="#fffced" d="M0 26.667H120V53.334H0z" />
      <path fill="#308254" d="M0 53.334H120V80H0z" />
      <polygon points={SUN_FLAG} fill="#e8b638" />
    </svg>
  );
}

function Rosette({ className }: { className: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 60 60">
        <path fill="#9a503b" d="M30 0 36 18 51 9 42 24 60 30 42 36 51 51 36 42 30 60 24 42 9 51 18 36 0 30 18 24 9 9 24 18Z" />
        <path fill="#c3a35a" d="m30 16 14 14-14 14-14-14Z" />
        <circle cx="30" cy="30" r="5" fill="#f4eddc" />
      </svg>
    </div>
  );
}

/** The kilim band of eleven diamonds between the sections. */
function Kilim() {
  return (
    <div className={c('kilim-divider')} aria-hidden="true">
      <svg viewBox="0 0 400 40">
        <path d="M0 3H400M0 37H400" stroke="#b99960" strokeWidth={1} />
        {Array.from({ length: 11 }, (_, i) => (
          <g key={i} transform={`translate(${25 + i * 35} 20)`}>
            <path d="M0-12 4-8 8-8 8-4 12 0 8 4 8 8 4 8 0 12-4 8-8 8-8 4-12 0-8-4-8-8-4-8Z" fill={i % 2 ? '#9b513c' : '#3d6560'} />
            <path d="M0-5 5 0 0 5-5 0Z" fill="#d5b877" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" fillOpacity={on ? 1 : 0.2} />
      {on ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
    </svg>
  );
}
