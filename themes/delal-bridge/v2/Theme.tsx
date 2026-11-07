'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
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
import { KILIM_BORDER } from './border';
import { byOccasion, copyFor, coupleNames, type Copy } from './copy';
import { Scene, SCENE_FILES, type SceneImages } from './scene';
import { T_FINAL } from './layout';
import sky from './assets/sky.webp';
import cloudA from './assets/cloud-a.webp';
import cloudB from './assets/cloud-b.webp';
import mountainsFar from './assets/mountains-far.webp';
import hills from './assets/hills.webp';
import river from './assets/river.webp';
import bridge from './assets/bridge.webp';
import treeLeft from './assets/tree-left.webp';
import treeRight from './assets/tree-right.webp';
import bushes from './assets/bushes.webp';
import leaf1 from './assets/leaf-1.webp';
import leaf2 from './assets/leaf-2.webp';
import leaf3 from './assets/leaf-3.webp';
import leaf4 from './assets/leaf-4.webp';
import leaf5 from './assets/leaf-5.webp';
import arch from './assets/arch.webp';
import garland from './assets/garland.webp';
import pillarLeft from './assets/pillar-left.webp';
import pillarRight from './assets/pillar-right.webp';
import cardPaper from './assets/card-paper.webp';
import rosette from './assets/rosette.webp';
import kilimBand from './assets/kilim-band.webp';
import ornament from './assets/ornament.webp';
import eventFrame from './assets/event-frame.webp';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/**
 * closed (the bridge cover) → scroll (the guest scrolls through the opening: the flight through the arch, the leaves,
 * the gateway and the card, then the website below) ; open: reduced motion, the end shown at once.
 */
type Phase = 'closed' | 'scroll' | 'open';

/** How quickly the drawn opening catches up with the scroll (ms): small enough to follow, large enough to glide. */
const FOLLOW_MS = 160;

const SRC: Record<string, string> = {
  sky: sky.src,
  'cloud-a': cloudA.src,
  'cloud-b': cloudB.src,
  'mountains-far': mountainsFar.src,
  hills: hills.src,
  river: river.src,
  bridge: bridge.src,
  'tree-left': treeLeft.src,
  'tree-right': treeRight.src,
  bushes: bushes.src,
  'leaf-1': leaf1.src,
  'leaf-2': leaf2.src,
  'leaf-3': leaf3.src,
  'leaf-4': leaf4.src,
  'leaf-5': leaf5.src,
  arch: arch.src,
  garland: garland.src,
  'pillar-left': pillarLeft.src,
  'pillar-right': pillarRight.src,
  'card-paper': cardPaper.src,
};

const noop = () => () => {};
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

/* eslint-disable @next/next/no-img-element -- the design's layered artwork */

export default function DelalBridge(props: ThemeProps) {
  const { locale, dir, lang, fields, labels, event, mapUrl, occasion } = props;
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
    setPhase(reduced ? 'open' : 'scroll');
  };

  const names = coupleNames(fields.person_1_name, fields.person_2_name, labels.and);
  const script = locale === 'en' ? 'latin' : 'arabic';
  const showCountdown = hasFeature(props, 'countdown') && event.startsAt !== null;
  const showMap = hasFeature(props, 'map') && mapUrl !== null;
  const showForm = hasFeature(props, 'rsvp');
  const shut = hydrated && phase === 'closed';

  return (
    <div className={`${fonts.fonts} ${s.page}`}>
      <article
        className={c('root', reduced && 'reduced')}
        lang={lang}
        dir={dir}
        data-script={script}
        data-phase={phase}
        data-hydrated={hydrated ? '' : undefined}
      >
        <Hero
          phase={phase}
          reduced={reduced}
          onOpen={open}
          labels={labels}
          person1={fields.person_1_name}
          person2={fields.person_2_name}
          heroLine={byOccasion(occasion, t.heroWedding, t.heroEngagement)}
          card={
            <>
              <p className={c('cardBlessing')}>{t.blessing}</p>
              {names ? <p className={c('cardNames')}>{names}</p> : null}
              <p className={c('cardLine')}>{byOccasion(occasion, t.cardWedding, t.cardEngagement)}</p>
              {event.date ? <p className={c('cardWhen')}>{event.date.full}</p> : null}
              {fields.venue_name ? <p className={c('cardVenue')}>{fields.venue_name}</p> : null}
            </>
          }
        />

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
          <section className={c('sec')}>
            <img className={c('rosette')} src={rosette.src} alt="" aria-hidden="true" />
            <p className={c('eyebrow', 'basmala')}>{t.verseLead}</p>
            <div className={c('verse')}>
              <p className={c('verseText')} lang="ar" dir="rtl">
                {t.verse}
              </p>
              {t.verseTranslation ? <p className={c('verseTr')}>{t.verseTranslation}</p> : null}
              <p className={c('verseRef')}>{t.verseRef}</p>
            </div>
          </section>

          <img className={c('band')} src={kilimBand.src} alt="" aria-hidden="true" />

          <section className={c('sec')}>
            <img className={c('ornament')} src={ornament.src} alt="" aria-hidden="true" />
            <p className={c('eyebrow')}>{t.eventLead}</p>
            <h2 className={c('title')}>{t.eventTitle}</h2>
            {fields.invitation_message ? <p className={c('message')}>{fields.invitation_message}</p> : null}
            {event.date || event.time || fields.venue_name || showMap ? (
              <article className={c('event')} style={{ backgroundImage: `url(${eventFrame.src})` }}>
                <h3 className={c('eventTitle')}>{byOccasion(occasion, t.eventWedding, t.eventEngagement)}</h3>
                {event.date || event.time ? <p className={c('meta')}>{[event.date?.full, event.time].filter(Boolean).join(' · ')}</p> : null}
                {fields.venue_name ? <p className={c('meta')}>{fields.venue_name}</p> : null}
                {showMap ? (
                  <a className={c('button', 'buttonRiver')} href={mapUrl} target="_blank" rel="noopener noreferrer">
                    {labels.openMap}
                  </a>
                ) : null}
              </article>
            ) : null}
          </section>

          {showCountdown ? <Countdown startsAt={event.startsAt} t={t} labels={labels} locale={locale} /> : null}

          {showForm ? (
            <>
              <img className={c('band')} src={kilimBand.src} alt="" aria-hidden="true" />
              <section className={c('sec')}>
                <img className={c('ornament')} src={ornament.src} alt="" aria-hidden="true" />
                <p className={c('eyebrow')}>{t.replyLead}</p>
                <h2 className={c('title')}>{t.replyTitle}</h2>
                <GuestFormSlot render={(api) => <GuestForm api={api} labels={labels} locale={locale} />} />
              </section>
            </>
          ) : null}

          {props.guestbook ? (
            <section className={c('sec')}>
              <p className={c('eyebrow')}>{t.guestbookLead}</p>
              <h2 className={c('title')}>{labels.guestbookTitle}</h2>
              <div className={c('wall')}>
                {props.guestbook.length === 0 ? (
                  <p className={c('message')}>{labels.guestbookEmpty}</p>
                ) : (
                  props.guestbook.map((m, i) => (
                    <article key={i} className={c('note')}>
                      <p dir="auto">{m.message}</p>
                      <footer dir="auto">{m.guestName}</footer>
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : null}

          <footer className={c('closing')}>
            <ThemeBorder border={props.border} fallback={KILIM_BORDER} medium="screen" />
            <img className={c('closingGarland')} src={garland.src} alt="" aria-hidden="true" />
            <p className={c('eyebrow')}>{t.closingLead}</p>
            {names ? <p className={c('closingNames')}>{names}</p> : null}
            <p className={c('message')}>{t.closing}</p>
          </footer>
        </main>
      </article>
    </div>
  );
}

/**
 * The opening on a canvas, played by the guest's scroll. Closed: the bridge cover with the names and the Open button.
 * Scroll: the hero stays on screen (sticky) while the guest scrolls through a tall track; how far they have scrolled
 * sets the opening clock (0 → T_FINAL): the flight to Delal Bridge and through its arch, the leaves, the gateway, then
 * the card coming forward. The drawing glides after the scroll (FOLLOW_MS), so a flick or a mouse wheel's steps play
 * smoothly; scrolling back plays it backwards. The website follows below. Open (reduced motion): the end at once.
 */
function Hero({
  phase,
  reduced,
  onOpen,
  labels,
  person1,
  person2,
  heroLine,
  card,
}: {
  phase: Phase;
  reduced: boolean;
  onOpen: () => void;
  labels: ThemeLabels;
  person1: string | undefined;
  person2: string | undefined;
  heroLine: string;
  card: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const namesRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const clock = useRef(0);
  const [ready, setReady] = useState(false);

  const paint = (time: number) => {
    clock.current = time;
    const scene = sceneRef.current;
    const nm = namesRef.current;
    const cd = cardRef.current;
    if (nm) {
      nm.style.opacity = String(1 - clamp(time / 0.55, 0, 1));
      nm.style.transform = `translate3d(0, ${-time * 28}vh, 0)`;
    }
    if (glowRef.current) glowRef.current.style.opacity = String(0.6 * Math.sin(Math.PI * clamp(time / 2.2, 0, 1)));
    if (hintRef.current) hintRef.current.style.opacity = String(1 - clamp(time / 0.25, 0, 1));
    if (!scene) return;
    const namesBottom = nm ? nm.offsetTop + nm.offsetHeight : 0;
    scene.draw(time, namesBottom);
    if (cd) {
      const b = scene.cardBox(time);
      cd.style.left = `${b.left + b.width * 0.14}px`;
      cd.style.width = `${b.width * 0.72}px`;
      cd.style.top = `${b.top + b.height * 0.27}px`;
      cd.style.height = `${b.height * 0.6}px`;
      cd.style.setProperty('--cw', `${b.width}px`);
      cd.style.opacity = String(clamp((time - 2.75) / 0.25, 0, 1));
    }
  };

  // Load the layers, then draw the cover.
  useEffect(() => {
    let alive = true;
    const imgs: SceneImages = {};
    Promise.all(
      SCENE_FILES.map(
        (f) =>
          new Promise<void>((res) => {
            const i = new Image();
            i.onload = () => {
              imgs[f] = i;
              res();
            };
            i.onerror = () => res();
            i.src = SRC[f] ?? '';
          }),
      ),
    ).then(() => {
      if (!alive || !canvasRef.current) return;
      sceneRef.current = new Scene(canvasRef.current, imgs);
      sceneRef.current.resize();
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Redraw on resize.
  useEffect(() => {
    if (!ready) return;
    const onResize = () => {
      sceneRef.current?.resize();
      paint(clock.current);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [ready]);

  // Closed: the cover; reduced motion: the end. Scroll: follow how far the guest has scrolled through the track.
  useEffect(() => {
    if (phase === 'closed') {
      paint(0);
      return;
    }
    if (phase === 'open' || reduced) {
      paint(T_FINAL);
      return;
    }
    const track = trackRef.current;
    if (!track) return;
    const target = () => {
      const r = track.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      return span > 0 ? clamp(-r.top / span, 0, 1) * T_FINAL : T_FINAL;
    };
    let raf = 0;
    let last = 0;
    const step = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const goal = target();
      let next = clock.current + (goal - clock.current) * (1 - Math.exp(-dt / FOLLOW_MS));
      if (Math.abs(goal - next) < 0.0008) next = goal;
      if (next !== clock.current) paint(next);
      raf = next === goal ? 0 : requestAnimationFrame(step);
    };
    const wake = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(step);
    };
    wake();
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', wake);
    };
  }, [phase, reduced, ready]);

  return (
    <div ref={trackRef} className={c('track')}>
      <section className={c('hero')} aria-label={labels.openInvitation}>
        <canvas ref={canvasRef} className={c('canvas')} aria-hidden="true" />
        <div ref={glowRef} className={c('glow')} aria-hidden="true" />
        <div ref={namesRef} className={c('names')}>
          {person1 ? <p className={c('name')}>{person1}</p> : null}
          {person1 && person2 ? <p className={c('amp')}>{labels.and}</p> : null}
          {person2 ? <p className={c('name')}>{person2}</p> : null}
          <p className={c('heroLine')}>{heroLine}</p>
        </div>
        <div ref={cardRef} className={c('card')}>
          {card}
        </div>
        {phase === 'closed' ? (
          <button type="button" className={c('open')} onClick={onOpen}>
            {labels.openInvitation}
          </button>
        ) : null}
        {phase === 'scroll' ? (
          <div ref={hintRef} className={c('hint')} aria-hidden="true">
            <span className={c('hintMouse')} />
            <span className={c('hintArrow')} />
          </div>
        ) : null}
      </section>
    </div>
  );
}

/* eslint-enable @next/next/no-img-element */

function Countdown({ startsAt, t, labels, locale }: { startsAt: string | null; t: Copy; labels: ThemeLabels; locale: ThemeProps['locale'] }) {
  const left = useCountdown(startsAt);
  const units: [number | undefined, string][] = [
    [left?.days, labels.countdownDays],
    [left?.hours, labels.countdownHours],
    [left?.minutes, labels.countdownMinutes],
    [left?.seconds, labels.countdownSeconds],
  ];
  return (
    <section className={c('sec')}>
      <p className={c('eyebrow')}>{t.countdownLead}</p>
      <h2 className={c('title')}>{t.countdownTitle}</h2>
      {left?.started ? (
        <p className={c('message')}>{labels.eventStarted}</p>
      ) : (
        <div className={c('count')} role="timer" aria-live="off">
          {units.map(([n, label]) => (
            <div key={label} className={c('tile')}>
              <strong>{n === undefined ? '–' : formatNumber(n, locale)}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Attendance and the message to the couple in one form; the message only in packages with messages. */
function GuestForm({ api, labels, locale }: { api: GuestFormApi; labels: ThemeLabels; locale: ThemeProps['locale'] }) {
  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  const [message, setMessage] = useState('');

  if (api.status === 'sent') {
    return (
      <div className={c('sent')} role="status">
        <p className={c('title')}>{labels.sent}</p>
        {api.isPreview ? <p className={c('message')}>{labels.sentPreview}</p> : null}
      </div>
    );
  }
  const sending = api.status === 'sending';
  const e = api.fieldErrors;
  const left = api.limits.message - message.length;

  return (
    <form
      className={c('form')}
      onSubmit={(ev) => {
        ev.preventDefault();
        void api.submit({ name, attendance, message });
      }}
      noValidate
      aria-busy={sending}
    >
      <h3 className={c('srOnly')}>{labels.guestFormTitle}</h3>
      <label className={c('label')} htmlFor="db-guest-name">
        {labels.guestName}
      </label>
      <input
        id="db-guest-name"
        name="name"
        autoComplete="name"
        value={name}
        maxLength={api.limits.name}
        onChange={(ev) => setName(ev.target.value)}
        disabled={sending}
        aria-invalid={e.name ? true : undefined}
        aria-describedby={e.name ? 'db-guest-name-error' : undefined}
      />
      {e.name ? <FieldError id="db-guest-name-error">{e.name}</FieldError> : null}

      <fieldset className={c('choices')} disabled={sending} aria-describedby={e.attendance ? 'db-attending-error' : undefined}>
        <legend className={c('label')}>{labels.attendanceQuestion}</legend>
        {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
          <label key={value} className={c('choice')} data-on={attendance === value ? '' : undefined}>
            <input type="radio" name="attendance" checked={attendance === value} onChange={() => setAttendance(value)} />
            <span>{value === 'ATTENDING' ? labels.attending : labels.notAttending}</span>
          </label>
        ))}
      </fieldset>
      {e.attendance ? <FieldError id="db-attending-error">{e.attendance}</FieldError> : null}

      {api.withMessage ? (
        <>
          <label className={c('label')} htmlFor="db-guest-message">
            {labels.message}
          </label>
          <textarea
            id="db-guest-message"
            name="message"
            rows={3}
            value={message}
            maxLength={api.limits.message}
            onChange={(ev) => setMessage(ev.target.value)}
            disabled={sending}
            aria-invalid={e.message ? true : undefined}
            aria-describedby={`db-message-count${e.message ? ' db-message-error' : ''}`}
          />
          <p id="db-message-count" className={c('counter')}>
            {formatNumber(left, locale)}
          </p>
          {e.message ? <FieldError id="db-message-error">{e.message}</FieldError> : null}
        </>
      ) : null}

      {api.error ? (
        <p className={c('error')} role="alert">
          {api.error}
        </p>
      ) : null}

      <button type="submit" className={c('button')} disabled={sending}>
        {sending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className={c('error')} role="alert">
      {children}
    </span>
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
