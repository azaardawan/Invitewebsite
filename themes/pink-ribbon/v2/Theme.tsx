'use client';

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Photo, ThemeBorder, hasFeature, useMusic, useReducedMotion, type ThemeProps } from '@/theme-sdk';
import { BOW_BORDER } from './border';
import { copyFor, type Copy } from './copy';
import { DURATION, PIECE_INK, createRenderer, frameLayout, particles, ribbons, stars, type Layout } from './motion';
import { Scene } from './Scene';
import bow from './assets/bow.svg';
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

export default function PinkRibbon(props: ThemeProps) {
  const { locale, dir, lang, fields, labels, event } = props;
  const t: Copy = copyFor(locale);
  const reduced = useReducedMotion();
  const music = useMusic();
  const p = useId().replace(/:/g, '') + '-';
  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('closed');
  const [opened, setOpened] = useState(false);
  const [wish, setWish] = useState(false);

  const name = fields.person_1_name?.trim() || t.you;
  const day = event.date ? `${event.date.day} ${event.date.month}` : null;
  const message = fields.invitation_message?.trim() || t.message;
  const memories = hasFeature(props, 'photos') ? props.photos.slice(0, 3) : [];
  const script = locale === 'en' ? 'latin' : 'arabic';

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
    setWish(false);
    setPhase('closed');
    requestAnimationFrame(() => {
      draw(0, { idle: true });
      stageRef.current?.scrollIntoView({ block: 'start' });
      requestAnimationFrame(() => setPhase('opening'));
    });
  };

  const closed = phase === 'closed';
  const fill = (text: string) => text.replace('{name}', name);
  const dayNumber = event.date ? event.date.day : null;

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
                'layer-name': <PosterLine text={name} y={280} size={40} max={180} kind="script" />,
                // Arabic and Kurdish: the greeting in their own calligraphy instead of the drawn English «Birthday».
                ...(locale === 'en' ? {} : { 'layer-birthday': <PosterLine text={t.posterHappy} y={128} size={40} max={190} kind="script" /> }),
                'layer-details': <PosterLine text={day ?? t.posterDay} y={321} size={11} max={200} kind="serif" track={0.45} />,
                'layer-dress': <PosterLine text={t.posterDress} y={355} size={6.5} max={180} kind="serif" track={0.35} />,
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
            <a className={c('hero-caption')} href={`#${p}for-you`}>
              {t.more} <span aria-hidden="true">↓</span>
            </a>
          ) : null}
        </section>

        <div className={c('website-content')} hidden={!opened} inert={!opened}>
          <section id={`${p}for-you`} className={c('intro', 'section', 'reveal', 'safa-intro')}>
            <Deco name="tulips" at="top-start" motion="sway" />
            <Deco name="balloons" at="side-end" soft motion="float" />
            <Sprig className={c('botanical', 'intro-left')} />
            <Sprig className={c('botanical', 'intro-right')} />
            <div className={c('flourish')} aria-hidden="true">
              <i />
              <Sparkle className={c('twinkle')} />
              <i />
            </div>
            <p className={c('eyebrow')}>{day ? `${day} · ${t.justForYou}` : t.justForYou}</p>
            <h1>
              {t.introTitle}
              <br />
              <em>{name}.</em>
            </h1>
            <p className={c('intro-copy')}>{lines(t.introCopy)}</p>
            <p className={c('signature')}>{t.introSign}</p>
            <svg className={c('loop-ribbon', 'flowing-ribbon')} viewBox="0 0 600 70" aria-hidden="true">
              <path d="M4 41C78 7 171 78 250 37S345 11 322 39C298 70 272 17 309 29S442 69 596 21" />
            </svg>
          </section>

          <section className={c('wish-section', 'section', 'reveal')} aria-labelledby={`${p}wish-title`}>
            <Deco name="candelabra" at="bottom-start" motion="sway" />
            <Deco name="candle-slim" at="top-end" soft />
            <div className={c('wish-paper', wish && 'wish-made')}>
              <div className={c('paper-corner', 'top-left')} aria-hidden="true">
                <Sprig />
              </div>
              <div className={c('paper-corner', 'bottom-right')} aria-hidden="true">
                <Sprig />
              </div>
              <p className={c('eyebrow')}>{t.wishEyebrow}</p>
              <h2 id={`${p}wish-title`}>
                {t.wishTitle}
                <br />
                <em>{t.wishTitleEm}</em>
              </h2>
              <Candle p={p} label={wish ? t.candleOut : t.candle} />
              {wish ? (
                <div className={c('wish-message')} role="status">
                  <p className={c('eyebrow')}>{t.wishMade}</p>
                  <h3>
                    {t.wishMadeTitle}
                    <br />
                    <em>{t.wishMadeEm}</em>
                  </h3>
                  <p>{lines(t.wishMadeCopy)}</p>
                  <button type="button" className={c('text-link')} onClick={() => setWish(false)}>
                    {t.relight} <span aria-hidden="true">↻</span>
                  </button>
                </div>
              ) : (
                <>
                  <p>{lines(t.wishInstruction)}</p>
                  <button type="button" className={c('primary-button')} onClick={() => setWish(true)}>
                    {t.makeWish} <span aria-hidden="true">✧</span>
                  </button>
                </>
              )}
            </div>
          </section>

          <section className={c('birthday-letter', 'section', 'reveal')} aria-labelledby={`${p}letter-title`}>
            <Deco name="bouquet" at="top-end" motion="sway" />
            <Deco name="ribbon" at="bottom-start" soft />
            <div className={c('date-keepsake')}>
              <span className={c('eyebrow')}>{event.date ? event.date.month : t.dayToCelebrate}</span>
              <span className={c('keepsake-number')}>{dayNumber ?? '✧'}</span>
              <Sprig className={c('small-rosette')} />
              <span className={c('eyebrow')}>{day ?? t.posterDay}</span>
            </div>
            <div className={c('letter-copy')}>
              <p className={c('eyebrow')}>{t.letterEyebrow}</p>
              <h2 id={`${p}letter-title`}>
                {lines(t.letterTitle)}
                <br />
                <em>{t.letterTitleEm}</em>
              </h2>
              <p className={c('personal-message')} dir="auto">
                {message}
              </p>
              <p className={c('signature')}>{t.letterSign}</p>
            </div>
            <Sparkle className={c('floating-spark', 'one', 'twinkle')} />
            <Sparkle className={c('floating-spark', 'two', 'twinkle')} />
          </section>

          {memories.length ? (
            <section className={c('memories', 'section', 'reveal')} aria-labelledby={`${p}memories-title`}>
              <Deco name="bouquet" at="top-start" motion="sway" />
              <p className={c('eyebrow')}>{t.memoriesEyebrow}</p>
              <h2 id={`${p}memories-title`}>
                {t.memoriesTitle}
                <br />
                <em>{t.memoriesEm}</em>
              </h2>
              <div className={c('polaroids')} data-count={memories.length}>
                {memories.map((photo) => (
                  <figure key={photo.index} className={c('polaroid')}>
                    <Photo photo={photo} className={c('polaroid-photo')} />
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <footer className={c('footer', 'section', 'safa-footer')}>
            <Deco name="balloons" at="bottom-end" soft motion="float" />
            <ThemeBorder border={props.border} fallback={BOW_BORDER} medium="screen" />
            <Sprig className={c('botanical', 'footer-botanical')} />
            <Sprig className={c('botanical', 'footer-botanical-right')} />
            <Sparkle className={c('twinkle', 'footer-star')} />
            <Sparkle className={c('twinkle', 'footer-star-left')} />
            <p className={c('eyebrow')}>{t.footerEyebrow}</p>
            <p className={c('footer-name')}>{name}</p>
            <p>{lines(t.footerCopy)}</p>
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

/** The birthday candle of the wish section (the designer's drawing); it goes out when the wish is made. */
function Candle({ p, label }: { p: string; label: string }) {
  return (
    <div className={c('candle-moment')}>
      <svg className={c('birthday-candle')} viewBox="0 0 220 235" role="img" aria-label={label}>
        <defs>
          <pattern id={`${p}candle-stripes`} width="27" height="27" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
            <rect width="27" height="27" fill="#ebaaa9" />
            <path d="M2 0V27M7 0V27" stroke="#920d25" strokeWidth="1" opacity=".7" />
          </pattern>
        </defs>
        <g fill="none" stroke="#920d25" strokeWidth=".9" strokeLinejoin="round">
          <path d="M47 201C61 186 155 183 174 200C170 215 57 220 47 201Z" fill="#fff9f2" />
          <path d="M68 200C85 202 138 203 155 197M68 210C68 217 151 216 156 207" />
          <path d="M88 76Q110 71 131 76L130 194Q110 202 89 196Z" fill={`url(#${p}candle-stripes)`} />
          <path d="M88 76C85 88 91 103 97 93C101 82 101 105 108 100C114 95 111 87 117 90C126 96 129 87 131 76" fill="#fff9f2" />
          <ellipse cx="109.5" cy="76" rx="21.5" ry="4" fill="#ffe5e7" />
          <path d="M109 76Q112 66 109 60" stroke="#8c512c" strokeWidth="1.6" />
          <g className={c('wish-flame')}>
            <path d="M110 59C93 53 100 39 110 26C111 39 128 50 110 59Z" fill="#f8c882" stroke="#920d25" />
            <path d="M111 56C103 51 108 43 111 40C112 47 119 53 111 56Z" fill="#fff9f2" stroke="none" />
          </g>
          <g className={c('candle-smoke')} stroke="#b29c84">
            <path d="M110 57C91 43 128 34 110 15" />
            <path d="M113 54C132 42 108 36 121 24" />
          </g>
          <path d="M87 140C62 111 50 137 70 144C50 155 74 173 88 145C98 159 110 157 112 143C100 130 92 133 87 140Z" fill="#ebaaa9" />
          <path d="M87 142C80 144 74 144 70 144M87 142C91 143 101 144 112 143M84 147C76 165 80 183 69 187M91 149C104 166 98 175 109 180" />
        </g>
        <g fill="#ebaaa9" stroke="#920d25" strokeWidth=".7">
          <path className={c('candle-star', 'star-a')} d="M55 55Q57 68 68 70Q57 72 55 85Q53 72 42 70Q53 68 55 55Z" />
          <path className={c('candle-star', 'star-b')} d="M163 115Q165 125 173 126Q165 128 163 137Q161 128 153 126Q161 124 163 115Z" />
        </g>
      </svg>
      <div className={c('wish-burst')} aria-hidden="true">
        {Array.from({ length: 22 }, (_, i) => {
          const side = i % 2 ? 1 : -1,
            drift = side * (60 + ((i * 23) % 75));
          return (
            <svg
              key={i}
              viewBox="-12 -14 24 28"
              style={
                {
                  '--piece-color': i % 3 ? '#e8b5a8' : '#e5b07a',
                  '--delay': `${(i % 6) * 0.035}s`,
                  '--drift': `${drift}px`,
                  '--height': `${-70 - ((i * 17) % 85)}px`,
                  '--land': `${drift * 1.2}px`,
                  '--turn': `${side * (65 + i * 13)}deg`,
                  '--turn-end': `${side * (110 + i * 18)}deg`,
                } as CSSProperties
              }
            >
              <path d={i % 3 ? 'M0-7C9-9 11 2 0 9C-9 1-8-6 0-7Z' : 'M0-12Q2-2 10 0Q2 2 0 12Q-2 2-10 0Q-2-2 0-12Z'} />
            </svg>
          );
        })}
      </div>
      <svg className={c('wish-strings')} viewBox="0 0 500 300" aria-hidden="true">
        <path d="M100 120C150 55 82 190 130 235" />
        <path d="M370 100C430 160 340 175 390 245" />
      </svg>
    </div>
  );
}

