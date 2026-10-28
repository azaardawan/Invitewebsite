'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  GuestFormSlot,
  Photo,
  Signature,
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
import { BOW_BORDER } from './border';
import { copyFor, type Copy } from './copy';
import { DURATION, PIECE_INK, createRenderer, frameLayout, particles, ribbons, stars, type Layout } from './motion';
import { Scene } from './Scene';
import bow from './assets/bow.svg';
import cakeArt from './assets/cake.svg';
import paper from './assets/paper.webp';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/** closed → opening (the popper bursts, the lettering settles) → open (the greeting below; stars keep twinkling). */
type Phase = 'closed' | 'opening' | 'open';

/** The website opens below once the lettering is in place; the last confetti falls over it. */
const CONTENT_AT = 2.6;

const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');
const sceneClass = (...names: string[]) => c(...names);

const ARABIC = /[؀-ۿ]/;
const SVG_X = 148.875;

/** One line of the poster's lettering: centred, shrunk to fit its width, in the design's script or serif (Arabic and Kurdish:
 * Aref Ruqaa for the script lines, Noto Naskh for the others; never spaced out, which would break the letters apart). */
function PosterLine({ text, y, size, max, kind, track = 0 }: { text: string; y: number; size: number; max: number; kind: 'script' | 'serif'; track?: number }) {
  const arabic = ARABIC.test(text);
  const n = Math.max(1, Array.from(text).length);
  const em = arabic ? (kind === 'script' ? 0.48 : 0.5) : kind === 'script' ? 0.44 : 0.66 + track / size;
  const fitted = Math.min(arabic ? size * (kind === 'script' ? 0.9 : 1.25) : size, max / (n * em));
  return (
    <text
      x={SVG_X}
      y={y}
      textAnchor="middle"
      fill={PIECE_INK}
      fontSize={fitted}
      fontFamily={arabic ? (kind === 'script' ? "'PR Ruqaa', serif" : "'PR Arabic', serif") : kind === 'script' ? "'PR Script', serif" : "'PR Serif', Georgia, serif"}
      fontWeight={arabic && kind === 'serif' ? 600 : undefined}
      letterSpacing={arabic ? 0 : track}
      direction={arabic ? 'rtl' : 'ltr'}
    >
      {kind === 'serif' && !arabic ? text.toUpperCase() : text}
    </text>
  );
}

function Sprig({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <image href={bow.src} width="100" height="100" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}
function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-15 -17 30 34" aria-hidden="true">
      <path d="M0-12Q1.5-1.5 10 0Q1.5 1.5 0 12Q-1.5 1.5-10 0Q-1.5-1.5 0-12Z" />
    </svg>
  );
}

/** One of the designer's drawings (assets/deco), placed in a corner of its section; `soft` takes the lighter ink. */
function Deco({ name, at, soft, motion }: { name: string; at: string; soft?: boolean; motion?: 'sway' | 'float' }) {
  return <span className={c('deco', `deco-${name}`, `d-${at}`, soft && 'deco-soft', motion)} aria-hidden="true" />;
}

/** Two-line copy (written with \n in copy.ts). */
const lines = (text: string): ReactNode =>
  text.split('\n').map((line, i, all) => (
    <span key={i}>
      {line}
      {i < all.length - 1 ? (
        <>
          {' '}
          <br />
        </>
      ) : null}
    </span>
  ));

export default function PinkRibbonParty(props: ThemeProps) {
  const { locale, dir, lang, fields, labels, event, mapUrl, photos } = props;
  const t: Copy = copyFor(locale);
  const reduced = useReducedMotion();
  const music = useMusic();
  const p = useId().replace(/:/g, '') + '-';
  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('closed');
  const [opened, setOpened] = useState(false);

  const name = fields.person_1_name?.trim() ?? '';
  const venue = fields.venue_name?.trim() ?? '';
  const note = fields.invitation_message?.trim() || t.noteDefault;
  const date = event.date;
  const showCountdown = hasFeature(props, 'countdown') && event.startsAt !== null;
  const showMap = hasFeature(props, 'map') && mapUrl !== null;
  const showForm = hasFeature(props, 'rsvp');
  const showSignature = hasFeature(props, 'signature') && props.signatures.length > 0;
  const shownPhotos = hasFeature(props, 'photos') ? photos.slice(0, 2) : [];
  const script = locale === 'en' ? 'latin' : 'arabic';
  // The poster's date line, as the designer's «SUN | 07 | 7 PM».
  const details = date ? [date.weekday, `${date.day} ${date.month}`, event.time].filter(Boolean).join('  |  ') : t.posterSoon;

  // The poster's frame of reference: the stage's width and the screen's height (as the designer's page).
  const layoutRef = useRef<Layout>(frameLayout());
  const drawRef = useRef<ReturnType<typeof createRenderer> | null>(null);
  const draw = useCallback((time: number, options: Parameters<ReturnType<typeof createRenderer>>[1] = {}) => {
    const stage = stageRef.current;
    const svg = stage?.querySelector('svg');
    if (!stage || !svg) return;
    if (!drawRef.current) drawRef.current = createRenderer(svg, p);
    const state = drawRef.current(time, { ...options, layout: layoutRef.current });
    const view = state['birthday-scene']?.viewBox;
    if (view && !options.twinkleOnly) stage.style.height = `${Number(String(view).split(' ')[3]) * layoutRef.current.scale}px`;
  }, [p]);

  // Measure, then draw the closed poster (and again on resize).
  useEffect(() => {
    const measure = () => {
      const stage = stageRef.current;
      if (!stage) return;
      layoutRef.current = frameLayout(stage.clientWidth, Math.min(window.innerHeight, 940));
    };
    measure();
    draw(0, { idle: true });
    const onResize = () => {
      measure();
      draw(0, { idle: true });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  // The opening: the scene runs on animation frames; the website opens at CONTENT_AT; then the stars twinkle.
  useEffect(() => {
    if (phase === 'closed') return;
    if (reduced) {
      draw(DURATION, { reduced: true });
      return;
    }
    let raf = 0;
    let twinkle = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const time = (now - start) / 1000;
      draw(time);
      if (time >= CONTENT_AT) setOpened(true);
      if (time < DURATION) raf = requestAnimationFrame(tick);
      else {
        setPhase('open');
        twinkle = window.setInterval(() => {
          if (!document.hidden) draw(DURATION + performance.now() / 1000, { twinkleOnly: true });
        }, 140);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(twinkle);
    };
    // The opening runs once per tap; phase changes within it must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'closed', reduced, draw]);

  // Sections appear as they scroll into view.
  useEffect(() => {
    if (!opened) return;
    const root = stageRef.current?.closest('article');
    if (!root) return;
    const seen = s['is-seen'] ?? 'is-seen';
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add(seen);
            observer.unobserve(e.target);
          }
      },
      { threshold: 0.12 },
    );
    root.querySelectorAll(`.${s.reveal}`).forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [opened]);

  const open = () => {
    if (phase !== 'closed') return;
    music.start();
    // Reduced motion: the finished poster and the greeting at once.
    if (reduced) setOpened(true);
    setPhase(reduced ? 'open' : 'opening');
  };
  const replay = () => {
    drawRef.current = null;
    setOpened(false);
    setPhase('closed');
    requestAnimationFrame(() => {
      draw(0, { idle: true });
      stageRef.current?.scrollIntoView({ block: 'start' });
      requestAnimationFrame(() => setPhase('opening'));
    });
  };

  const closed = phase === 'closed';
  const fill = (text: string) => text.replace('{name}', name);

  return (
    <div id={s.frame} className={`${fonts.fonts} ${s.page}`}>
      <article className={c('root', reduced && 'reduced', !closed && 'is-playing')} lang={lang} dir={dir} data-script={script} data-phase={phase}>
        <section className={c('hero')} aria-label={fill(t.posterLabel)}>
          <div ref={stageRef} className={c('poster-stage', closed && 'is-idle')}>
            <Scene
              p={p}
              c={sceneClass}
              img={{ paper: paper.src }}
              role="img"
              aria-label={fill(t.posterLabel)}
              slots={{
                'layer-eyebrow': <PosterLine text={t.posterEyebrow} y={63} size={7.5} max={180} kind="serif" track={0.6} />,
                'layer-name': <PosterLine text={fill(t.posterName)} y={280} size={40} max={180} kind="script" />,
                // Arabic and Kurdish: the greeting in their own calligraphy instead of the drawn English «Birthday».
                ...(locale === 'en' ? {} : { 'layer-birthday': <PosterLine text={t.posterHappy} y={128} size={40} max={190} kind="script" /> }),
                'layer-details': <PosterLine text={details} y={321} size={11} max={200} kind="serif" track={0.45} />,
                'layer-dress': <PosterLine text={venue} y={355} size={6.5} max={180} kind="serif" track={0.35} />,
                'burst-confetti': particles.map((q) =>
                  q.kind === 0 ? (
                    <circle key={q.id} id={`${p}confetti-${q.id}`} fill={q.color} opacity={0} r={q.size * 0.52} />
                  ) : q.kind === 1 ? (
                    <path
                      key={q.id}
                      id={`${p}confetti-${q.id}`}
                      fill={q.color}
                      opacity={0}
                      d={`M ${-q.size} ${-q.size * 0.35} Q 0 ${-q.size} ${q.size} ${-q.size * 0.35} L ${q.size * 0.8} ${q.size * 0.5} Q 0 0 ${-q.size * 0.8} ${q.size * 0.5} Z`}
                    />
                  ) : (
                    <rect key={q.id} id={`${p}confetti-${q.id}`} fill={q.color} opacity={0} x={-q.size * 0.35} y={-q.size} width={q.size * 0.7} height={q.size * 2} rx={0.35} />
                  ),
                ),
                'burst-ribbons': ribbons.map((q) => (
                  <path key={q.id} id={`${p}ribbon-${q.id}`} fill="none" stroke={q.color} strokeWidth={q.width} strokeLinecap="round" strokeLinejoin="round" opacity={0} d="M 0 0" />
                )),
                'burst-stars': stars.map((q) => (
                  <path
                    key={q.id}
                    id={`${p}flying-star-${q.id}`}
                    d="M 0 -3 Q .5 -.5 2.7 0 Q .5 .5 0 3 Q -.5 .5 -2.7 0 Q -.5 -.5 0 -3 Z"
                    fill={PIECE_INK}
                    fillOpacity={0.28}
                    stroke={PIECE_INK}
                    strokeWidth={0.45}
                    strokeLinejoin="round"
                    opacity={0}
                  />
                )),
              }}
            />
            {closed ? (
              <button type="button" className={c('open-invitation')} onClick={open} aria-label={labels.openInvitation}>
                <span className={c('open-hint')} aria-hidden="true">
                  {t.hintLine}
                  <br />
                  <b>{t.hintTap}</b>
                </span>
              </button>
            ) : null}
          </div>
          {opened ? (
            <a className={c('hero-caption')} href={`#${p}the-party`}>
              {t.more} <span aria-hidden="true">↓</span>
            </a>
          ) : null}
        </section>

        <div className={c('website-content')} hidden={!opened} inert={!opened}>
          <section id={`${p}the-party`} className={c('intro', 'section', 'reveal')}>
            <Deco name="tulips" at="top-start" motion="sway" />
            <Deco name="balloons" at="side-end" soft motion="float" />
            <Sprig className={c('botanical', 'intro-left')} />
            <Sprig className={c('botanical', 'intro-right')} />
            <div className={c('flourish')} aria-hidden="true">
              <i />
              <Sparkle className={c('twinkle')} />
              <i />
            </div>
            <p className={c('eyebrow')}>{t.invited}</p>
            <h1>
              {t.introTitle}
              <br />
              <em>{t.introEm}</em>
            </h1>
            <p className={c('intro-copy')}>{lines(t.introCopy)}</p>
            {name ? <p className={c('signature')}>{fill(t.introSign)}</p> : null}
          </section>

          <section className={c('details', 'section', 'reveal')} aria-labelledby={`${p}details-title`}>
            <div className={c('stationery')}>
              <span className={c('stationery-number')} aria-hidden="true">
                {t.occasionNo}
              </span>
              <h2 id={`${p}details-title`}>
                {t.detailsTitle} <em>{t.detailsEm}</em>
              </h2>
              <div className={c('detail-grid', !(venue || showMap) && 'detail-grid-single')}>
                {date ? (
                  <div className={c('date-cell')}>
                    <p className={c('eyebrow')}>{date.weekday}</p>
                    <span className={c('date-number')}>{date.day}</span>
                    <p>
                      {date.month} {date.year}
                    </p>
                    {event.time ? <span className={c('fine-print')}>{event.time}</span> : null}
                  </div>
                ) : null}
                {venue || showMap ? (
                  <div className={c('venue-cell')}>
                    <Sprig className={c('small-rosette')} />
                    <p className={c('eyebrow')}>{t.thePlace}</p>
                    {venue ? <h3 dir="auto">{venue}</h3> : null}
                    <p>{lines(t.gathering)}</p>
                    {showMap ? (
                      <a className={c('text-link')} href={mapUrl} target="_blank" rel="noopener noreferrer">
                        {labels.openMap} <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {showCountdown ? <Countdown startsAt={event.startsAt} t={t} labels={labels} locale={locale} /> : null}

          <section className={c('wishes', 'section', 'reveal')}>
            <div className={c('wish-art')}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the design's own drawing */}
              <img src={cakeArt.src} alt="" />
              <Sparkle className={c('wish-spark', 'twinkle')} />
              <span className={c('tiny-caption')}>{t.wishCaption}</span>
            </div>
            <div className={c('wish-copy')}>
              <p className={c('eyebrow')}>{t.wishEyebrow}</p>
              <h2>
                {t.wishTitle}
                <br />
                <em>{t.wishEm}</em>
              </h2>
              <p>{t.wishCopy}</p>
              {showForm ? (
                <a className={c('text-link')} href={`#${p}rsvp`}>
                  {t.wishLink} <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          </section>

          {shownPhotos.length ? (
            <section className={c('memory-gallery')}>
              {shownPhotos.map((photo, i) => (
                <figure key={photo.index}>
                  <Photo photo={photo} className={c('memory-photo')} />
                  <figcaption>{i ? t.photo2 : t.photo1}</figcaption>
                </figure>
              ))}
            </section>
          ) : null}

          {/* The customer's own note, signed in their hand: the signature draws itself when the guest scrolls to it. */}
          <section className={c('note', 'section', 'reveal')} aria-labelledby={`${p}note-title`}>
            <Deco name="bouquet" at="top-end" motion="sway" />
            <Deco name="ribbon" at="bottom-start" soft />
            <Sparkle className={c('floating-spark', 'one', 'twinkle')} />
            <p id={`${p}note-title`} className={c('eyebrow')}>
              {t.noteEyebrow}
            </p>
            <p className={c('note-copy')} dir="auto">
              {note}
            </p>
            {showSignature ? (
              <div className={c('note-signature')}>
                <Signature signatures={props.signatures} className={c('signature-ink')} alt={name} />
              </div>
            ) : null}
            {name ? <p className={c('note-name')}>{name}</p> : null}
          </section>

          {showForm || props.guestbook ? (
            <section id={`${p}rsvp`} className={c('rsvp', 'section', 'reveal')} aria-labelledby={`${p}rsvp-title`}>
              <div className={c('rsvp-card')}>
                <Sprig className={c('rsvp-flower')} />
                <p className={c('eyebrow')}>{t.replyEyebrow}</p>
                <h2 id={`${p}rsvp-title`}>
                  {t.replyTitle} <em>{t.replyEm}</em>
                </h2>
                <p>{t.replyCopy}</p>
                {showForm ? <GuestFormSlot render={(api) => <GuestForm api={api} labels={labels} locale={locale} p={p} />} /> : null}
                {props.guestbook ? (
                  <div className={c('guestbook')}>
                    <p className={c('eyebrow')}>{t.guestbook}</p>
                    {props.guestbook.length === 0 ? (
                      <p className={c('fine-print')}>{labels.guestbookEmpty}</p>
                    ) : (
                      props.guestbook.map((m, i) => (
                        <figure key={i} className={c('guestbook-note')}>
                          <blockquote dir="auto">{m.message}</blockquote>
                          <figcaption dir="auto">{m.guestName}</figcaption>
                        </figure>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <footer className={c('footer', 'section', 'safa-footer')}>
            <Deco name="balloons" at="bottom-end" soft motion="float" />
            <ThemeBorder border={props.border} fallback={BOW_BORDER} medium="screen" />
            <Sprig className={c('botanical', 'footer-botanical')} />
            <Sparkle className={c('twinkle', 'footer-star')} />
            <p className={c('eyebrow')}>{t.footerEyebrow}</p>
            {name ? <p className={c('footer-name')}>{name}</p> : null}
            <p>{t.footerCopy}</p>
            <div className={c('footer-links')}>
              <button type="button" onClick={replay}>
                {t.replay}
              </button>
              {hasFeature(props, 'music') && music.available ? (
                <button type="button" onClick={music.toggle} aria-pressed={music.playing}>
                  {music.playing ? labels.musicPause : labels.musicPlay}
                </button>
              ) : null}
            </div>
          </footer>
        </div>
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
    <section className={c('countdown', 'section', 'reveal')}>
      <Deco name="candelabra" at="bottom-start" motion="sway" />
      <Deco name="candle-slim" at="bottom-end" soft />
      <Sparkle className={c('floating-spark', 'one', 'twinkle')} />
      <Sparkle className={c('floating-spark', 'two', 'twinkle')} />
      <p className={c('eyebrow')}>{t.untilWe}</p>
      <h2>
        {t.soonTitle}
        <br />
        <em>{t.soonEm}</em>
      </h2>
      {left?.started ? (
        <p>{labels.eventStarted}</p>
      ) : (
        <div className={c('countdown-grid')} role="timer" aria-live="off">
          {units.map(([n, label]) => (
            <div key={label}>
              <strong>{n === undefined ? '–' : formatNumber(n, locale)}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
      <svg className={c('loop-ribbon')} viewBox="0 0 600 70" aria-hidden="true">
        <path d="M4 41C78 7 171 78 250 37S345 11 322 39C298 70 272 17 309 29S442 69 596 21" />
      </svg>
    </section>
  );
}

/** The reply card's form (the designer's: name and reply side by side, then a note), with the platform's labels. */
function GuestForm({ api, labels, locale, p }: { api: GuestFormApi; labels: ThemeLabels; locale: ThemeProps['locale']; p: string }) {
  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  const [message, setMessage] = useState('');

  if (api.status === 'sent') {
    return (
      <div className={c('rsvp-status')} role="status">
        <p>{labels.sent}</p>
        {api.isPreview ? <p className={c('fine-print')}>{labels.sentPreview}</p> : null}
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
      <h3 className={c('sr-only')}>{labels.guestFormTitle}</h3>
      <div className={c('form-row')}>
        <label>
          {labels.guestName}
          <input
            name="name"
            autoComplete="name"
            value={name}
            maxLength={api.limits.name}
            onChange={(ev) => setName(ev.target.value)}
            disabled={sending}
            aria-invalid={e.name ? true : undefined}
            aria-describedby={e.name ? `${p}name-error` : undefined}
          />
          {e.name ? <FieldError id={`${p}name-error`}>{e.name}</FieldError> : null}
        </label>
        <label>
          {labels.attendanceQuestion}
          <select
            name="attendance"
            value={attendance ?? ''}
            onChange={(ev) => setAttendance(ev.target.value ? (ev.target.value as GuestAttendance) : null)}
            disabled={sending}
            aria-invalid={e.attendance ? true : undefined}
            aria-describedby={e.attendance ? `${p}attendance-error` : undefined}
          >
            <option value="">—</option>
            <option value="ATTENDING">{labels.attending}</option>
            <option value="NOT_ATTENDING">{labels.notAttending}</option>
          </select>
          {e.attendance ? <FieldError id={`${p}attendance-error`}>{e.attendance}</FieldError> : null}
        </label>
      </div>
      {api.withMessage ? (
        <label>
          {labels.message}
          <textarea
            name="message"
            rows={3}
            value={message}
            maxLength={api.limits.message}
            onChange={(ev) => setMessage(ev.target.value)}
            disabled={sending}
            aria-invalid={e.message ? true : undefined}
            aria-describedby={`${p}message-count${e.message ? ` ${p}message-error` : ''}`}
          />
          <span id={`${p}message-count`} className={c('counter')}>
            {formatNumber(left, locale)}
          </span>
          {e.message ? <FieldError id={`${p}message-error`}>{e.message}</FieldError> : null}
        </label>
      ) : null}
      {api.error ? (
        <p className={c('form-error')} role="alert">
          {api.error}
        </p>
      ) : null}
      <button type="submit" className={c('primary-button')} disabled={sending}>
        {sending ? labels.sending : labels.submit} <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className={c('form-error')} role="alert">
      {children}
    </span>
  );
}
