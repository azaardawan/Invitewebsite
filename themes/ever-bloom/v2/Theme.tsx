'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  COLLAGES,
  EditableText,
  PhotoSlot,
  ThemeBorder,
  hasFeature,
  useMusic,
  useReducedMotion,
  useTemplateEditing,
  type CollageKind,
  type ThemeProps,
} from '@/theme-sdk';
import { BORDER } from './border';
import { copyFor } from './copy';
import { BLOOM_MS, FALL_MS, createTunnel } from './motion';
import flowers from './assets/flowers.webp';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/** closed (the gift) → opening (the flowers grow, turn and fall) → open (the page). */
type Phase = 'closed' | 'opening' | 'open';

const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

/** One flower of the atlas (0–8) as a background picture. */
const flower = (i: number): CSSProperties => ({
  backgroundImage: `url(${flowers.src})`,
  backgroundSize: '300% 300%',
  backgroundPosition: `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%`,
});

const PETALS = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${-((i * 1.7) % 11)}s`,
  duration: `${11 + ((i * 3) % 7)}s`,
}));

/** The polaroid collage: the photo collages' artwork (its couples' version, no birthday drawing), photos in its frames. */
const POLAROIDS = COLLAGES.polaroids;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;
/** The collages after the polaroids, in the order bigger packages add them: the story, then the photo wall. */
const MORE: { kind: CollageKind; from: number }[] = [
  { kind: 'story', from: 3 },
  { kind: 'wall', from: 7 },
];

/** One collage: its artwork, the customer's photos in its frames (places from `from` on) and the artwork over them. */
function Board({
  kind,
  from,
  photos,
  label,
  children,
}: {
  kind: CollageKind;
  from: number;
  photos: ThemeProps['photos'];
  label: string;
  children?: ReactNode;
}) {
  const k = COLLAGES[kind];
  return (
    <div className={c('collage')} style={{ backgroundImage: `url(${k.loveArt ?? k.art})`, aspectRatio: `${k.width} / ${k.height}` }}>
      {k.frames.map((f, i) => (
        <PhotoSlot
          key={i}
          index={from + i}
          photos={photos}
          label={label}
          className={c('collage-photo')}
          style={{
            position: 'absolute',
            left: pct(f.x, k.width),
            top: pct(f.y, k.height),
            width: pct(f.w, k.width),
            height: pct(f.h, k.height),
            transform: f.rot ? `rotate(${f.rot}deg)` : undefined,
          }}
        />
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element -- the collage's artwork over the photos */}
      <img className={c('collage-top')} src={k.top} alt="" />
      {children}
    </div>
  );
}
/** How much of the poster's height the page shows: down to just under the photos. */
const COLLAGE_CROP = 880;

export default function EverBloom(props: ThemeProps) {
  const { locale, dir, lang, fields, wording, labels, photos } = props;
  const t = copyFor(locale);
  const editing = useTemplateEditing();
  const reduced = useReducedMotion();
  const music = useMusic();
  const [phase, setPhase] = useState<Phase>(editing ? 'open' : 'closed');
  const [falling, setFalling] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const one = fields.person_1_name?.trim() ?? '';
  const two = fields.person_2_name?.trim() ?? '';
  const shown = editing || phase === 'open';
  const withMusic = hasFeature(props, 'music') && music.available;
  /** A collage is on the page when the package sells its places (the editor) or it holds a photo (the invitation). */
  const sold = (m: { from: number; kind: CollageKind }) =>
    editing ? props.photoPlaces > m.from : photos.some((p) => p.index >= m.from && p.index < m.from + COLLAGES[m.kind].frames.length);

  // The flowers are loaded and cut while the gift waits, so the tap starts drawing at once.
  const tunnelRef = useRef<ReturnType<typeof createTunnel> | null>(null);
  useEffect(() => {
    if (shown || !canvasRef.current) return;
    tunnelRef.current = createTunnel(canvasRef.current, flowers.src);
    return () => {
      tunnelRef.current = null;
    };
  }, [shown]);

  // The opening: the tunnel on a canvas, on animation frames; the page shows through as the flowers fall.
  useEffect(() => {
    const tunnel = tunnelRef.current;
    if (phase !== 'opening' || !tunnel) return;
    tunnel.resize();
    window.addEventListener('resize', tunnel.resize);
    let raf = 0,
      start = 0,
      fell = false,
      stopped = false;
    const tick = (now: number) => {
      if (stopped) return;
      if (!start) start = now;
      const ms = now - start;
      tunnel.draw(ms);
      if (!fell && ms >= FALL_MS) {
        fell = true;
        setFalling(true);
      }
      if (ms >= BLOOM_MS) {
        tunnel.clear();
        setPhase('open');
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    // Without the flowers' picture (offline) the page simply opens.
    tunnel.ready.then(
      () => !stopped && (raf = requestAnimationFrame(tick)),
      () => !stopped && setPhase('open'),
    );
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', tunnel.resize);
    };
  }, [phase]);

  // Sections appear as they scroll into view.
  useEffect(() => {
    if (!shown) return;
    const seen = s['is-seen'] ?? 'is-seen';
    const nodes = document.querySelectorAll(`.${s.reveal}`);
    if (editing || reduced) {
      nodes.forEach((n) => n.classList.add(seen));
      return;
    }
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
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [shown, editing, reduced]);

  const open = () => {
    if (phase !== 'closed') return;
    music.start();
    window.scrollTo({ top: 0 });
    setPhase(reduced ? 'open' : 'opening');
  };
  const replay = () => {
    setFalling(false);
    setPhase('closed');
    window.scrollTo({ top: 0 });
  };

  return (
    <div id={s.frame} className={`${fonts.fonts} ${s.page}`}>
      <article
        className={c('root', phase === 'opening' && 'is-opening', falling && 'is-falling', shown && 'is-open')}
        lang={lang}
        dir={dir}
        data-script={locale === 'en' ? 'latin' : 'arabic'}
      >
        <div className={c('petals')} aria-hidden="true">
          {PETALS.map((p, i) => (
            <span
              key={i}
              className={c('petal')}
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>

        {!shown ? (
          <div className={c('opening')}>
            <div className={c('opening-paper')} />
            <button type="button" className={c('gift-button')} onClick={open} disabled={phase !== 'closed'} aria-label={labels.openInvitation}>
              <GiftArt />
              <span className={c('gift-title')}>
                {t.giftFor} {one ? <span dir="auto">{one}</span> : null}
              </span>
              <span className={c('gift-hint')}>{t.hint}</span>
              <span className={c('tap')}>{t.tap}</span>
            </button>
            <canvas ref={canvasRef} className={c('flowers')} aria-hidden="true" />
          </div>
        ) : null}

        {/* Hidden behind the gift until it opens (nothing of the page shows through the cover). */}
        <main className={c('main')} inert={!(shown || falling)} style={phase === 'closed' && !shown ? { visibility: 'hidden' } : undefined}>
          <section className={c('intro')}>
            <p className={c('eyebrow')}>{t.eyebrow}</p>
            <EditableText id="wording:title" value={wording.title} placeholder="" as="h1" className={c('title')} />
            <EditableText id="wording:intro" value={wording.intro} placeholder="" as="p" className={c('intro-text')} />
            <div className={c('single-flower')} style={flower(8)} aria-hidden="true" />
            <a className={c('continue-link')} href="#ever-bloom-memories">
              <span>{t.continue}</span>
              <span aria-hidden="true">↓</span>
            </a>
          </section>

          {editing || photos.length ? (
            <section id="ever-bloom-memories" className={c('memories', 'reveal')}>
              <p className={c('eyebrow')}>{t.memories}</p>
              <EditableText id="wording:memoryTitle" value={wording.memoryTitle} placeholder="" as="h2" className={c('memory-title')} />
              <EditableText id="wording:memoryIntro" value={wording.memoryIntro} placeholder="" as="p" className={c('section-intro')} />
              {/* The poster's bottom (where the printed collage writes a message) is left out on the page. */}
              <div className={c('collage-crop')} style={{ aspectRatio: `${POLAROIDS.width} / ${COLLAGE_CROP}` }}>
                <Board kind="polaroids" from={0} photos={photos} label={t.addPhoto}>
                  <p className={c('collage-names')} dir={dir}>
                    <EditableText id="field:person_1_name" value={fields.person_1_name} placeholder={t.namePlaceholder} />
                    {(one && two) || editing ? <span className={c('collage-and')}>{labels.and}</span> : null}
                    <EditableText id="field:person_2_name" value={fields.person_2_name} placeholder={t.namePlaceholder} />
                  </p>
                </Board>
              </div>
              {/* Bigger packages: the story collage (places 4–7) and the photo wall (8–16), each shown once sold. */}
              {MORE.some((m) => sold(m)) ? (
                <div className={c('more-collages')}>
                  {MORE.filter((m) => sold(m)).map((m) => (
                    <div key={m.kind} className={c('more-collage', `more-${m.kind}`)}>
                      <Board kind={m.kind} from={m.from} photos={photos} label={t.addPhoto} />
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className={c('letter-section', 'reveal')}>
            <p className={c('eyebrow')}>{t.letterLabel}</p>
            <article className={c('letter-paper')}>
              <ThemeBorder border={props.border} fallback={BORDER} medium="screen" />
              <EditableText id="wording:salutation" value={wording.salutation} placeholder="" as="h2" className={c('salutation')} />
              <EditableText id="field:letter" value={fields.letter} placeholder={t.letterPlaceholder} as="div" className={c('letter-body')} multiline />
              <p className={c('signature')}>
                <EditableText id="wording:signoff" value={wording.signoff} placeholder="" />
                <EditableText id="field:person_2_name" value={fields.person_2_name} placeholder={t.namePlaceholder} className={c('signature-name')} />
              </p>
            </article>
          </section>

          <footer className={c('footer', 'reveal')}>
            <div className={c('footer-bouquet')} aria-hidden="true">
              <span style={flower(7)} />
              <span style={flower(8)} />
              <span style={flower(2)} />
            </div>
            <EditableText id="wording:footer" value={wording.footer} placeholder="" as="h2" className={c('footer-title')} />
            <EditableText id="wording:footerSub" value={wording.footerSub} placeholder="" as="p" className={c('footer-sub')} />
            {editing ? null : (
              <div className={c('footer-actions')}>
                <button type="button" onClick={replay}>
                  {t.replay}
                </button>
                {withMusic ? (
                  <button type="button" onClick={music.toggle} aria-pressed={music.playing}>
                    {music.playing ? labels.musicPause : labels.musicPlay}
                  </button>
                ) : null}
              </div>
            )}
            <span className={c('tiny-heart')} aria-hidden="true">
              ♡
            </span>
          </footer>
        </main>
      </article>
    </div>
  );
}

/** The designer's hand-drawn gift (its lid lifts on hover and when it opens). */
function GiftArt() {
  return (
    <svg className={c('gift-art')} viewBox="0 0 240 245" fill="none" aria-hidden="true">
      <defs>
        <pattern id="ever-bloom-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
          <path d="M1 0v6" stroke="#bd5275" strokeWidth=".75" opacity=".55" />
        </pattern>
      </defs>
      <g stroke="#a54865" strokeWidth="2.1" strokeLinejoin="round">
        <path d="m50 117 141 1-5 93-130-2z" fill="#f7d6db" />
        <path d="m53 120 135 1-5 86-125-2z" fill="url(#ever-bloom-hatch)" />
        <path d="m111 119 23 1-2 89-23-1z" fill="#f8e9e1" />
        <path d="m58 125 1 76m118-74-2 73M68 131l-1 65m96-69v75" opacity=".4" />
      </g>
      <g className={c('gift-lid')} stroke="#a54865" strokeWidth="2.1" strokeLinejoin="round">
        <path d="m44 102 150 1 1 23-153-3z" fill="#f5c7d3" />
        <path d="m47 105 145 1-1 16-144-2z" fill="url(#ever-bloom-hatch)" />
        <path d="m110 103 24 1v20l-25-1z" fill="#f9e6dd" />
        <path d="M119 99C81 101 64 79 71 62c9-18 39 6 48 31C128 65 151 51 164 65c12 19-12 35-45 34Z" fill="#edb1c2" />
        <path d="M119 97C101 80 84 68 78 70c-4 12 16 23 41 27Zm5 0c15-18 28-28 33-25 2 11-11 20-33 25Z" fill="#fce6e7" />
        <path d="m116 96-23 33 23-10 7-20 15 29 3-17 17 7-27-24" fill="#f8dbe1" />
        <path d="m116 90 13 1 4 12-17 2z" fill="#d685a1" />
      </g>
    </svg>
  );
}
