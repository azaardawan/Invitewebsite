'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ThemeBorder, hasFeature, useMusic, useReducedMotion, type ThemeProps } from '@/theme-sdk';
import { ROSETTE_BORDER } from './border';
import { copyFor, type Copy } from './copy';
import { DURATION, SPEED, createRenderer, petals, stageHeight, type DrawOptions, type LineBox, type LineKey } from './motion';
import { Scene } from './Scene';
import cake from './assets/cake.webp';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/** closed → opening (the lettering writes itself, the cake blooms) → open (the greeting below; candles and stars keep moving). */
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

type LineSpec = { text: string; y: number; size: number; max: number; kind: 'script' | 'serif'; fill: string; track?: number };

/** How large a line is drawn: shrunk to fit its width (an estimate per script, as the poster is drawn before fonts load). */
function fit({ text, size, max, kind, track = 0 }: LineSpec) {
  const arabic = ARABIC.test(text);
  const n = Math.max(1, Array.from(text).length);
  const em = arabic ? (kind === 'script' ? 0.5 : 0.52) : kind === 'script' ? 0.42 : 0.7 + track / size;
  return { arabic, size: Math.min(arabic ? size * (kind === 'script' ? 0.8 : 1.45) : size, max / (n * em)) };
}

/** One of the customer's lines on the poster, behind the wipe that writes it (motion.ts moves `wipe-<key>`). */
function PosterLine({ p, k, spec }: { p: string; k: LineKey; spec: LineSpec }) {
  const { arabic, size } = fit(spec);
  const family = arabic ? (spec.kind === 'script' ? "'FS Ruqaa', 'FS Arabic', serif" : "'FS Arabic', serif") : spec.kind === 'script' ? "'FS Script', serif" : "'FS Serif', Georgia, serif";
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
        fontSize={size}
        fontFamily={family}
        letterSpacing={arabic ? 0 : (spec.track ?? 0)}
        direction={arabic ? 'rtl' : 'ltr'}
        clipPath={`url(#${p}clip-${k})`}
      >
        {spec.kind === 'serif' && !arabic ? spec.text.toUpperCase() : spec.text}
      </text>
    </>
  );
}

/** The wipe's box for a line: around its baseline, as wide as the line may be, in its reading direction. */
const lineBox = (spec: LineSpec): LineBox => {
  const { arabic, size } = fit(spec);
  return { y: spec.y, height: size * (spec.kind === 'script' ? 1.3 : 1.2), max: spec.max, rtl: arabic };
};

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

export default function FloralSurprise(props: ThemeProps) {
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
  const script = locale === 'en' ? 'latin' : 'arabic';

  // The poster's lettering (positions from the designer's artwork, in poster units).
  const specs = useMemo<Record<LineKey, LineSpec>>(
    () => ({
    eyebrow: { text: t.posterEyebrow, y: 11.6, size: 6.2, max: 150, kind: 'serif', fill: '#bc7630', track: 1.6 },
    name: { text: name, y: 54, size: 46, max: 200, kind: 'script', fill: '#bc7630' },
    party: { text: t.posterParty, y: 359.2, size: 6.2, max: 120, kind: 'serif', fill: '#bc7630', track: 1.2 },
    details: { text: day ?? t.posterDay, y: 387.2, size: 7.6, max: 200, kind: 'serif', fill: '#be2026', track: 0.6 },
    address: { text: t.posterDress, y: 404.1, size: 4.8, max: 150, kind: 'serif', fill: '#9b562d', track: 1 },
    }),
    [t, name, day],
  );
  const boxes = useMemo(() => Object.fromEntries((Object.keys(specs) as LineKey[]).map((k) => [k, lineBox(specs[k])])) as Record<LineKey, LineBox>, [specs]);

  // The stage: the screen's height while the lettering is written, then the poster's own (as the designer's page).
  const sizeRef = useRef({ initial: 700, final: 700 });
  const drawRef = useRef<ReturnType<typeof createRenderer> | null>(null);
  const draw = useCallback(
    (time: number, options: DrawOptions = {}) => {
      const stage = stageRef.current;
      const svg = stage?.querySelector('svg');
      if (!stage || !svg) return;
      if (!drawRef.current) drawRef.current = createRenderer(svg, p);
      drawRef.current(time, { ...options, lines: boxes });
      if (!options.ambient) {
        const { initial, final } = sizeRef.current;
        stage.style.height = `${Math.round(stageHeight(time, initial, final, options) * 100) / 100}px`;
      }
    },
    [p, boxes],
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
            <Sprig className={c('botanical', 'intro-left')} />
            <Sprig className={c('botanical', 'intro-right')} />
            <div className={c('flourish')} aria-hidden="true">
              <i />
              <Sparkle className={c('twinkle')} />
              <i />
            </div>
            <p className={c('eyebrow')}>{day ? `${day} · ${t.justForYou}` : `${t.posterDay} · ${t.justForYou}`}</p>
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
            <div className={c('wish-paper', wish && 'wish-made')}>
              <div className={c('paper-corner', 'top-left')} aria-hidden="true">
                <Rosette />
              </div>
              <div className={c('paper-corner', 'bottom-right')} aria-hidden="true">
                <Rosette />
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
            <div className={c('date-keepsake')}>
              <span className={c('eyebrow')}>{event.date ? event.date.month : t.dayToCelebrate}</span>
              <span className={c('keepsake-number')}>{dayNumber ?? '✧'}</span>
              <Rosette className={c('small-rosette')} />
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

          <footer className={c('footer', 'section', 'safa-footer')}>
            <ThemeBorder border={props.border} fallback={ROSETTE_BORDER} medium="screen" />
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
            <rect width="27" height="27" fill="#ffd2db" />
            <path d="M2 0V27M7 0V27" stroke="#d31c5b" strokeWidth="1" opacity=".7" />
          </pattern>
        </defs>
        <g fill="none" stroke="#d31c5b" strokeWidth=".9" strokeLinejoin="round">
          <path d="M47 201C61 186 155 183 174 200C170 215 57 220 47 201Z" fill="#fff9f2" />
          <path d="M68 200C85 202 138 203 155 197M68 210C68 217 151 216 156 207" />
          <path d="M88 76Q110 71 131 76L130 194Q110 202 89 196Z" fill={`url(#${p}candle-stripes)`} />
          <path d="M88 76C85 88 91 103 97 93C101 82 101 105 108 100C114 95 111 87 117 90C126 96 129 87 131 76" fill="#fff9f2" />
          <ellipse cx="109.5" cy="76" rx="21.5" ry="4" fill="#ffe5e7" />
          <path d="M109 76Q112 66 109 60" stroke="#8c512c" strokeWidth="1.6" />
          <g className={c('wish-flame')}>
            <path d="M110 59C93 53 100 39 110 26C111 39 128 50 110 59Z" fill="#f8c882" stroke="#bc7630" />
            <path d="M111 56C103 51 108 43 111 40C112 47 119 53 111 56Z" fill="#fff9f2" stroke="none" />
          </g>
          <g className={c('candle-smoke')} stroke="#b29c84">
            <path d="M110 57C91 43 128 34 110 15" />
            <path d="M113 54C132 42 108 36 121 24" />
          </g>
          <path d="M87 140C62 111 50 137 70 144C50 155 74 173 88 145C98 159 110 157 112 143C100 130 92 133 87 140Z" fill="#ffd2db" />
          <path d="M87 142C80 144 74 144 70 144M87 142C91 143 101 144 112 143M84 147C76 165 80 183 69 187M91 149C104 166 98 175 109 180" />
        </g>
        <g fill="#e4ac77" stroke="#ad6b3e" strokeWidth=".7">
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
                  '--piece-color': i % 3 ? '#ffd2db' : '#e5b07a',
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
