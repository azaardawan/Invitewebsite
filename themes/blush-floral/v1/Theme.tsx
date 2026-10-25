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
import { ROSETTE_BORDER } from './border';
import { copyFor, type Copy } from './copy';
import { DURATION, SPEED, createRenderer, petals, stageHeight, type DrawOptions, type LineBox, type LineKey } from './motion';
import { Scene } from './Scene';
import cake from './assets/cake.webp';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/** closed → opening (the lettering writes itself, the cake blooms) → open (the website below; candles and stars keep moving). */
type Phase = 'closed' | 'opening' | 'open';

/** The website opens below once the lettering is written (designer time; the page plays SPEED times faster). */
const CONTENT_AT = 6;

const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');
const sceneClass = (...names: string[]) => c(...names);

const ARABIC = /[؀-ۿ]/;
const SVG_X = 148.875;

/** One line of the poster: the designer's serif, in capitals (or italic lower case), tracked. */
type LineSpec = { text: string; y: number; size: number; max: number; fill: string; track: number; italic?: boolean; opacity?: number };

/** How large a line is drawn: shrunk to fit its width (an estimate per script, as the poster is drawn before fonts load). */
function fit({ text, size, max, track, italic }: LineSpec) {
  const arabic = ARABIC.test(text);
  const n = Math.max(1, Array.from(text).length);
  const em = arabic ? 0.52 : (italic ? 0.46 : 0.72) + track / size;
  return { arabic, size: Math.min(arabic ? size * 1.25 : size, max / (n * em)) };
}

/** One of the invitation's lines on the poster, behind the wipe that writes it (motion.ts moves `wipe-<key>`). */
function PosterLine({ p, k, spec }: { p: string; k: LineKey; spec: LineSpec }) {
  const { arabic, size } = fit(spec);
  return (
    <>
      <defs>
        <clipPath id={`${p}clip-${k}`} clipPathUnits="userSpaceOnUse">
          <rect id={`${p}wipe-${k}`} x={0} y={0} width={0} height={0} />
        </clipPath>
      </defs>
      <text
        x={SVG_X}
        y={spec.y}
        textAnchor="middle"
        fill={spec.fill}
        fillOpacity={spec.opacity}
        fontSize={size}
        fontFamily={arabic ? "'BF Arabic', serif" : "'BF Serif', Georgia, serif"}
        fontStyle={spec.italic && !arabic ? 'italic' : undefined}
        letterSpacing={arabic ? 0 : spec.track}
        direction={arabic ? 'rtl' : 'ltr'}
        clipPath={`url(#${p}clip-${k})`}
      >
        {spec.italic || arabic ? spec.text : spec.text.toUpperCase()}
      </text>
    </>
  );
}

/** The wipe's box for a line: around its baseline, as wide as the line may be, in its reading direction. */
const lineBox = (spec: LineSpec): LineBox => {
  const { arabic, size } = fit(spec);
  return { y: spec.y, height: size * 1.2, max: spec.max, rtl: arabic };
};

/** The poster's lettering (positions from the designer's artwork, in poster units). */
function posterLines(t: Copy, posterName: string, details: string, venue: string): Record<LineKey, LineSpec> {
  return {
    eyebrow: { text: t.posterEyebrow, y: 21, size: 8.4, max: 170, fill: '#bc7630', track: 3, italic: true },
    name: { text: posterName, y: 35.7, size: 9.4, max: 160, fill: '#bc7630', track: 1.6, opacity: 0.8 },
    party: { text: t.posterParty, y: 345.4, size: 12, max: 140, fill: '#bc7630', track: 4.5, opacity: 0.8 },
    details: { text: details, y: 377.6, size: 12.5, max: 220, fill: '#be2026', track: 1.4 },
    address: { text: venue, y: 385.6, size: 6.6, max: 180, fill: '#be2026', track: 1.6, italic: true },
  };
}

function Sprig({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 260" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth=".85" strokeLinecap="round" strokeLinejoin="round">
        <path d="M51 253C59 212 52 185 71 155C86 131 68 116 63 88C60 71 64 51 74 29M61 202C51 197 28 184 27 169C44 169 57 186 61 202ZM59 209C67 198 85 193 101 194C99 207 75 218 59 209ZM64 175C50 158 31 161 21 147C39 144 57 153 64 175ZM72 150C87 136 107 140 112 125C90 124 78 131 72 150ZM75 126C64 114 43 119 35 100C54 99 69 110 75 126ZM64 94C77 82 91 82 95 64C76 65 66 79 64 94ZM65 64C52 58 48 42 53 31C65 39 70 51 65 64Z" />
        <path d="M73 31C54 35 45 14 60 11C59-4 80-2 81 11C100 3 106 25 90 29C96 48 74 50 73 31Z" fill="#ffd2db" />
        <path d="M73 31C71 22 76 15 81 11M73 31C66 23 61 21 60 11M73 31C81 27 86 25 90 29M71 24L80 25M74 20L76 30" />
      </g>
    </svg>
  );
}
function Rosette({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth=".8">
        <path d="M49 35C25 8 11 38 33 48C6 67 38 91 49 66C69 94 94 60 67 49C94 27 62 8 49 35Z" fill="#ffd2db" />
        <path d="M49 35C54 40 58 45 67 49M33 48C40 48 46 50 49 66M37 34C43 41 46 47 49 55M62 31C56 40 52 47 49 55M72 60C62 56 54 54 49 55M36 70C42 64 46 58 49 55M25 57C35 54 43 54 49 55" />
        <circle cx="49" cy="52" r="6" />
      </g>
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

export default function BlushFloral(props: ThemeProps) {
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
  const fill = (text: string) => text.replace('{name}', name);
  const date = event.date;
  const showCountdown = hasFeature(props, 'countdown') && event.startsAt !== null;
  const showMap = hasFeature(props, 'map') && mapUrl !== null;
  const showForm = hasFeature(props, 'rsvp');
  const showSignature = hasFeature(props, 'signature') && props.signatures.length > 0;
  const shownPhotos = hasFeature(props, 'photos') ? photos.slice(0, 2) : [];

  // The poster's lettering: «You are invited to», «ROSIE’S», «SUN | 07 | 7 PM», the place.
  const details = date ? [date.weekday, date.day, event.time].filter(Boolean).join('  |  ') : t.posterSoon;
  const posterName = name ? t.posterName.replace('{name}', name) : '';
  const specs = posterLines(t, posterName, details, venue);
  // The wipes' boxes, for the renderer (kept in a ref: the opening reads the latest without restarting).
  const boxes = Object.fromEntries((Object.keys(specs) as LineKey[]).map((k) => [k, lineBox(specs[k])])) as Record<LineKey, LineBox>;
  const boxesRef = useRef(boxes);
  const boxesKey = JSON.stringify(boxes);
  useEffect(() => {
    boxesRef.current = JSON.parse(boxesKey) as Record<LineKey, LineBox>;
  }, [boxesKey]);

  // The stage: the screen's height while the lettering is written, then the poster's own (as the designer's page).
  const sizeRef = useRef({ initial: 700, final: 700 });
  const drawRef = useRef<ReturnType<typeof createRenderer> | null>(null);
  const draw = useCallback(
    (time: number, options: DrawOptions = {}) => {
      const stage = stageRef.current;
      const svg = stage?.querySelector('svg');
      if (!stage || !svg) return;
      if (!drawRef.current) drawRef.current = createRenderer(svg, p);
      drawRef.current(time, { ...options, lines: boxesRef.current });
      if (!options.ambient) {
        const { initial, final } = sizeRef.current;
        stage.style.height = `${Math.round(stageHeight(time, initial, final, options) * 100) / 100}px`;
      }
    },
    [p],
  );

  // Measure, then draw the closed poster (and again on resize).
  useEffect(() => {
    const measure = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const initial = Math.max(500, Math.min(window.innerHeight, 940));
      const width = stage.clientWidth;
      sizeRef.current = { initial, final: width <= 700 ? (width * 419.25) / 297.75 : Math.min(initial, 1000) };
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

  // The opening: the scene runs on animation frames; the website opens at CONTENT_AT; then candles and stars move on.
  useEffect(() => {
    if (phase === 'closed') return;
    if (reduced) {
      draw(DURATION, { reduced: true });
      return;
    }
    let raf = 0;
    let ambient = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const time = ((now - start) / 1000) * SPEED;
      draw(time);
      if (time >= CONTENT_AT) setOpened(true);
      if (time < DURATION) raf = requestAnimationFrame(tick);
      else {
        draw(DURATION);
        setPhase('open');
        ambient = window.setInterval(() => {
          if (!document.hidden) draw(DURATION + performance.now() / 1000, { ambient: true });
        }, 140);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(ambient);
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
    // Reduced motion: the finished poster and the website at once.
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

  return (
    <div id={s.frame} className={`${fonts.fonts} ${s.page}`}>
      <article className={c('root', reduced && 'reduced')} lang={lang} dir={dir} data-phase={phase}>
        <section className={c('hero')} aria-label={fill(t.posterLabel)}>
          <div ref={stageRef} className={c('poster-stage', closed && 'is-idle')}>
            <Scene
              p={p}
              c={sceneClass}
              img={{ cake: cake.src }}
              aria-label={fill(t.posterLabel)}
              slots={{
                'text-eyebrow': <PosterLine p={p} k="eyebrow" spec={specs.eyebrow} />,
                'text-name': <PosterLine p={p} k="name" spec={specs.name} />,
                'text-party': <PosterLine p={p} k="party" spec={specs.party} />,
                'text-details': <PosterLine p={p} k="details" spec={specs.details} />,
                'text-address': <PosterLine p={p} k="address" spec={specs.address} />,
                'petal-drift': (
                  <>
                    {petals.map((q) => (
                      <path
                        key={q.id}
                        id={`${p}petal-${q.id}`}
                        d="M0 -4 C5 -4 5 2 0 5 C-4 1 -3 -3 0 -4Z"
                        fill={q.id % 3 ? '#ffd2db' : '#f0c5a5'}
                        stroke={q.id % 3 ? '#d31c5b' : '#bc7630'}
                        strokeWidth=".35"
                        opacity={0}
                      />
                    ))}
                    {[-1, 1].map((side) => (
                      <path key={side} id={`${p}ribbon-${side}`} d="M0 0" fill="none" stroke="#d31c5b" strokeWidth=".65" strokeLinecap="round" opacity={0} />
                    ))}
                  </>
                ),
              }}
            />
            {closed ? (
              <button type="button" className={c('open-invitation')} onClick={open} aria-label={labels.openInvitation}>
                <span className={c('open-hint')} aria-hidden="true">
                  {t.hintTap}
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
              <div className={c('detail-grid')}>
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
                <div className={c('venue-cell')}>
                  <Rosette className={c('small-rosette')} />
                  <p className={c('eyebrow')}>{t.thePlace}</p>
                  {venue ? <h3 dir="auto">{venue}</h3> : null}
                  <p>{lines(t.gathering)}</p>
                  {showMap ? (
                    <a className={c('text-link')} href={mapUrl} target="_blank" rel="noopener noreferrer">
                      {labels.openMap} <span aria-hidden="true">↗</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {showCountdown ? <Countdown startsAt={event.startsAt} t={t} labels={labels} locale={locale} /> : null}

          <section className={c('wishes', 'section', 'reveal')}>
            <div className={c('wish-art')}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the design's own drawing */}
              <img src={cake.src} alt="" />
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
                <Rosette className={c('rsvp-flower')} />
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

          <footer className={c('footer', 'section')}>
            <ThemeBorder border={props.border} fallback={ROSETTE_BORDER} medium="screen" />
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
