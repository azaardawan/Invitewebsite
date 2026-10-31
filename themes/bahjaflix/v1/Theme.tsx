'use client';

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { EditableText, PhotoSlot, ThemeBorder, VideoSlot, hasFeature, useReducedMotion, useTemplateEditing, type ThemePhoto, type ThemeProps } from '@/theme-sdk';
import { FRAME_BORDER } from './border';
import { copyFor, type Copy } from './copy';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/** closed (the logo and the Open button) → opening (the logo rushes at the screen in red streaks) → open. */
type Phase = 'closed' | 'opening' | 'open';
const OPENING_MS = 1900;
const REDUCED_MS = 100;

/** The three rows: which places they hold and their shape (as the manifest's frames). */
const ROWS = [
  { key: 'row1', shape: 'tall', from: 0 },
  { key: 'row2', shape: 'wide', from: 6 },
  { key: 'row3', shape: 'tall', from: 12 },
] as const;
const PER_ROW = 6;
/** Cards in view at once on a computer (the rest page in with the arrows). */
const PER_PAGE = { tall: 6, wide: 4 } as const;

const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

/** The BAHJAFLIX wordmark: its letters taller towards the ends, like the streaming logo's curve. */
function Wordmark({ className, animate = false }: { className?: string; animate?: boolean }) {
  const word = 'BAHJAFLIX';
  const mid = (word.length - 1) / 2;
  return (
    <span className={c('logo', className)} aria-label="BAHJAFLIX" role="img" dir="ltr">
      {[...word].map((ch, i) => {
        const d = Math.abs(i - mid) / mid;
        return (
          <span key={i} aria-hidden style={{ transform: `scaleY(${(1 + 0.16 * d * d).toFixed(3)})`, ...(animate ? { animationDelay: `${(i * 0.06).toFixed(2)}s` } : {}) }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}

const Icon = {
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 4l15 8-15 8z" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-5M12 8h.01" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden>
      <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8l6 4-6 4z" fill="currentColor" />
    </svg>
  ),
  row: [
    <svg key="a" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="m4 16 5-5 4 4 3-3 4 4" />
    </svg>,
    <svg key="b" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 17-6-6-9 9" />
    </svg>,
    <svg key="c" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path d="M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z" />
    </svg>,
  ],
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d="m9 5 7 7-7 7" />
    </svg>
  ),
};

/* eslint-disable @next/next/no-img-element -- the customer's photos, shown whole in the photo view */

export default function Bahjaflix(props: ThemeProps) {
  const { locale, dir, lang, fields, wording, photos, video, labels, mode } = props;
  const t = copyFor(locale);
  const editing = useTemplateEditing();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('closed');
  const [view, setView] = useState<number | 'story' | null>(null);
  const [playing, setPlaying] = useState(false);
  const shown: Phase = editing ? 'open' : phase;

  useEffect(() => {
    if (phase !== 'opening') return;
    const id = window.setTimeout(() => setPhase('open'), reduced ? REDUCED_MS : OPENING_MS);
    return () => window.clearTimeout(id);
  }, [phase, reduced]);

  // Escape closes the photo or the video.
  useEffect(() => {
    if (view === null && !playing) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setView(null);
      setPlaying(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view, playing]);

  const withPhotos = hasFeature(props, 'photos');
  const withVideo = hasFeature(props, 'video');
  const places = withPhotos ? (editing ? Math.max(props.photoPlaces, photos.length) : photos.length) : 0;
  const names = [fields.person_1_name, fields.person_2_name].filter((n): n is string => Boolean(n?.trim()));
  const couple = names.join(` ${labels.and} `);
  const story = fields.invitation_message?.trim() || (mode === 'sample' ? t.sampleStory : '');
  const sample = (i: number) => (mode === 'sample' ? t.samples[i % t.samples.length] : undefined);
  const titleOf = (p: ThemePhoto | undefined, i: number) => p?.title ?? sample(i)?.[0] ?? null;
  const captionOf = (p: ThemePhoto | undefined, i: number) => p?.caption ?? sample(i)?.[1] ?? null;
  const rows = ROWS.map((r, n) => ({ ...r, n, indexes: Array.from({ length: PER_ROW }, (_, k) => r.from + k).filter((i) => i < places) })).filter((r) => r.indexes.length);
  // The still behind the title when there is no video yet: the first photo (drawn plainly, not as a photo place).
  const still = video?.poster ?? photos[0]?.src ?? null;

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  const play = () => video && !editing && setPlaying(true);

  const castLine = (className: string, gold = true) =>
    editing ? (
      <span className={c(className)}>
        <em>{t.starring}</em>{' '}
        <EditableText id="field:person_1_name" value={fields.person_1_name} placeholder={t.namesHint} />
        {` ${labels.and} `}
        <EditableText id="field:person_2_name" value={fields.person_2_name} placeholder={t.namesHint} />
        {gold ? <i>★★★★★</i> : null}
      </span>
    ) : couple ? (
      <span className={c(className)}>
        <em>{t.starring}</em> {couple}
        {gold ? <i>★★★★★</i> : null}
      </span>
    ) : null;

  return (
    <div className={c(fonts.root, 'page', editing && 'editing', dir === 'ltr' && 'ltr', reduced && 'reduced')} dir={dir} lang={lang} data-phase={shown}>
      {/* A computer's side rail: icons, their names sliding out on hover. */}
      {!editing ? (
        <nav className={s.rail} aria-label={t.home}>
          <button type="button" className={s.on} onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}>
            {Icon.home}
            <span>{t.home}</span>
          </button>
          {withVideo && video ? (
            <button type="button" onClick={play}>
              {Icon.video}
              <span>{t.video}</span>
            </button>
          ) : null}
          {rows.map((r) => (
            <button type="button" key={r.key} onClick={() => scrollTo(`bf-${r.key}`)}>
              {Icon.row[r.n]}
              <span>{wording[r.key]}</span>
            </button>
          ))}
        </nav>
      ) : null}

      {/* A phone's top bar: the B and the rows as chips. */}
      <header className={s.appbar}>
        <span className={s.logoBox} aria-hidden>
          <span className={s.B}>B</span>
        </span>
        {!editing ? (
          <div className={s.chips}>
            {rows.map((r) => (
              <button type="button" key={r.key} className={s.chip} onClick={() => scrollTo(`bf-${r.key}`)}>
                {wording[r.key]}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {/* The title: the couple's video, the logo, their title and names. */}
      <section className={s.heroWrap} id="bf-top">
        <div className={s.hero}>
          <ThemeBorder border={props.border} fallback={FRAME_BORDER} medium="screen" />
          <div className={s.reel}>
            {withVideo ? (
              <VideoSlot
                video={video}
                className={s.reelMedia}
                autoPlay
                muted
                loop
                playsInline
                label={t.addVideo}
                fallback={still ? <img src={still} alt="" className={c('reelMedia', 'kenburns')} /> : <span className={s.reelEmpty} />}
              />
            ) : still ? (
              <img src={still} alt="" className={c('reelMedia', 'kenburns')} />
            ) : (
              <span className={s.reelEmpty} />
            )}
          </div>
          <div className={s.shade} aria-hidden />
          <div className={s.ribbon} aria-hidden dir="ltr">
            <small>TOP</small>
            <b>01</b>
          </div>
          <EditableText id="wording:tag" value={wording.tag} placeholder={wording.tag ?? ''} className={s.tag} as="div" />
          <div className={s.info}>
            <Wordmark className={s.brand} />
            <div className={s.sub}>
              <span className={s.B}>B</span>
              <EditableText id="wording:label" value={wording.label} placeholder="" />
            </div>
            <EditableText id="wording:title" value={wording.title} placeholder="" as="h1" className={s.title} />
            <div className={s.rank}>
              <span className={s.chipTop} dir="ltr">
                TOP<b>#01</b>
              </span>
              <EditableText id="wording:badge" value={wording.badge} placeholder="" />
            </div>
            {editing ? (
              <EditableText id="field:invitation_message" value={fields.invitation_message} placeholder={t.storyHint} as="p" className={s.synopsis} multiline />
            ) : story ? (
              <p className={s.synopsis}>{story}</p>
            ) : null}
            {castLine('star')}
            <div className={s.btns}>
              {withVideo && (video || editing) ? (
                <button type="button" className={c('btn', 'play')} onClick={play} disabled={!video}>
                  {Icon.play}
                  {t.play}
                </button>
              ) : null}
              <button type="button" className={c('btn', 'more')} onClick={() => !editing && setView('story')}>
                {Icon.info}
                <span className={s.moreLong}>{t.moreInfo}</span>
                <span className={s.moreShort}>{t.info}</span>
              </button>
              <span className={s.meta}>
                <span className={s.green}>{t.match}</span>
                <EditableText id="wording:since" value={wording.since} placeholder="" className={s.when} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {editing ? (
        <div className={s.storyEdit}>
          <span>{t.storyLabel}</span>
          <EditableText id="field:invitation_message" value={fields.invitation_message} placeholder={t.storyHint} as="p" multiline />
        </div>
      ) : null}

      {/* The rows of photos. */}
      <main className={s.rows}>
        {rows.map((r) => (
          <Row key={r.key} id={`bf-${r.key}`} title={<EditableText id={`wording:${r.key}`} value={wording[r.key]} placeholder="" />} shape={r.shape} count={r.indexes.length} t={t} editing={editing} reduced={reduced} dir={dir}>
            {r.indexes.map((i, k) => {
              const p = photos[i];
              const title = titleOf(p, i);
              const caption = captionOf(p, i);
              return (
                <Card key={i} photo={p} position={k} editing={editing} onOpen={() => p && setView(i)} label={title ?? t.addPhoto}>
                  <span className={s.pic}>
                    <PhotoSlot index={i} photos={photos} className={s.img} label={t.addPhoto} eager={i < 3} />
                    {p ? (
                      <span className={s.bm} aria-hidden>
                        B
                      </span>
                    ) : null}
                    {p && title ? <span className={s.cap}>{title}</span> : null}
                  </span>
                  {p ? (
                    <span className={s.peek} aria-hidden>
                      {title ? <b>{title}</b> : null}
                      {caption ? <span className={s.moreText}>{caption}</span> : null}
                      {couple ? (
                        <span className={s.moreCast}>
                          {t.starring} {couple}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  <span className={s.nm}>{title ?? ''}</span>
                </Card>
              );
            })}
          </Row>
        ))}
      </main>

      {/* A phone's bottom bar: icons only. */}
      {!editing ? (
        <nav className={s.tabs} aria-label={t.home}>
          <button type="button" className={s.on} onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })} aria-label={t.home}>
            {Icon.home}
          </button>
          {withVideo && video ? (
            <button type="button" onClick={play} aria-label={t.video}>
              {Icon.video}
            </button>
          ) : null}
          {rows.map((r) => (
            <button type="button" key={r.key} onClick={() => scrollTo(`bf-${r.key}`)} aria-label={wording[r.key]}>
              {Icon.row[r.n]}
            </button>
          ))}
        </nav>
      ) : null}

      {/* One photo, its words and the couple's names: nothing else. */}
      {view !== null && !editing ? (
        <PhotoView
          src={view === 'story' ? still : (photos[view]?.src ?? null)}
          title={view === 'story' ? wording.title : titleOf(photos[view], view)}
          text={view === 'story' ? story : captionOf(photos[view], view)}
          couple={couple}
          t={t}
          reduced={reduced}
          onClose={() => setView(null)}
        />
      ) : null}

      {/* The video, full screen. */}
      {playing && video ? (
        <div className={s.player} role="dialog" aria-modal="true" aria-label={wording.title}>
          <VideoSlot video={video} className={s.playerVideo} autoPlay controls playsInline />
          <button type="button" className={s.x} onClick={() => setPlaying(false)} aria-label={t.close}>
            {Icon.close}
          </button>
        </div>
      ) : null}

      {/* The opening: the logo and the Open button; then the logo rushes at the screen. */}
      {shown !== 'open' ? (
        <div className={c('intro', shown === 'opening' && 'going')}>
          <div className={s.introZoom}>
            <Wordmark className={s.introLogo} animate />
          </div>
          <div className={s.streaks} aria-hidden />
          {shown === 'closed' ? (
            <button type="button" className={s.open} onClick={() => setPhase('opening')}>
              {Icon.play}
              {labels.openInvitation}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** A row: its title, then its cards; on a computer they page with the arrows, on a phone they swipe. */
function Row({
  id,
  title,
  shape,
  count,
  t,
  editing,
  reduced,
  dir,
  children,
}: {
  id: string;
  title: ReactNode;
  shape: 'tall' | 'wide';
  count: number;
  t: Copy;
  editing: boolean;
  reduced: boolean;
  dir: 'rtl' | 'ltr';
  children: ReactNode;
}) {
  const per = PER_PAGE[shape];
  const pages = Math.max(1, Math.ceil(count / per));
  const [page, setPage] = useState(0);
  const shift = Math.max(0, Math.min(page * per, count - per));
  const style = { '--n': per, '--shift': shift, '--sign': dir === 'rtl' ? 1 : -1 } as CSSProperties;
  return (
    <section className={c('row', shape)} id={id} style={style} data-page={page}>
      <h2 className={s.rowTitle}>{title}</h2>
      <div className={s.slider}>
        {!editing && page > 0 ? (
          <button type="button" className={c('arrow', 'prev')} onClick={() => setPage((p) => Math.max(0, p - 1))} aria-label={t.previous}>
            {Icon.chevron}
          </button>
        ) : null}
        <div className={c('track', reduced && 'still')}>{children}</div>
        {!editing && page < pages - 1 ? (
          <button type="button" className={c('arrow', 'next')} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} aria-label={t.next}>
            {Icon.chevron}
          </button>
        ) : null}
      </div>
    </section>
  );
}

/** One card of a row: opens its photo (outside the editor, where the photo place itself takes the tap). */
function Card({ photo, position, editing, onOpen, label, children }: { photo: ThemePhoto | undefined; position: number; editing: boolean; onOpen: () => void; label: string; children: ReactNode }) {
  const interactive = Boolean(photo) && !editing;
  return (
    <div
      className={c('card', position === 0 && 'first')}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? label : undefined}
      onClick={interactive ? onOpen : undefined}
      onKeyDown={interactive ? (e: KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen()) : undefined}
    >
      {children}
    </div>
  );
}

/** The photo view: on a computer a card over the page; on a phone the whole screen, pulled down to close. */
function PhotoView({ src, title, text, couple, t, reduced, onClose }: { src: string | null; title: string | null | undefined; text: string | null | undefined; couple: string; t: Copy; reduced: boolean; onClose: () => void }) {
  const sheet = useRef<HTMLDivElement>(null);
  const pull = useRef<{ y: number; dy: number } | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeBtn.current?.focus();
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = overflow;
    };
  }, []);
  return (
    <div className={c('viewWrap', reduced && 'still')} onClick={onClose}>
      <div
        ref={sheet}
        className={s.view}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? undefined}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          if ((sheet.current?.scrollTop ?? 0) <= 0) pull.current = { y: e.touches[0]!.clientY, dy: 0 };
        }}
        onTouchMove={(e) => {
          const p = pull.current;
          if (!p || !sheet.current) return;
          p.dy = e.touches[0]!.clientY - p.y;
          if (p.dy > 0) {
            sheet.current.style.transition = 'none';
            sheet.current.style.transform = `translateY(${p.dy}px) scale(${1 - Math.min(p.dy, 400) / 4000})`;
          }
        }}
        onTouchEnd={() => {
          const p = pull.current;
          pull.current = null;
          if (!p || !sheet.current) return;
          sheet.current.style.transition = '';
          if (p.dy > 110) onClose();
          else sheet.current.style.transform = '';
        }}
      >
        <div className={s.viewPhoto}>{src ? <img src={src} alt={title ?? ''} /> : null}</div>
        <span className={s.grab} aria-hidden />
        <div className={s.viewText}>
          <span className={s.bm} aria-hidden>
            B
          </span>
          {title ? <h3>{title}</h3> : null}
          {text ? <p>{text}</p> : null}
          {couple ? (
            <div className={s.viewCast}>
              <b>{t.starring}</b> {couple}
            </div>
          ) : null}
        </div>
        <button ref={closeBtn} type="button" className={s.x} onClick={onClose} aria-label={t.close}>
          {Icon.close}
        </button>
      </div>
    </div>
  );
}
