'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  GuestFormSlot,
  Photo,
  ThemeBorder,
  formatNumber,
  hasFeature,
  useMusic,
  useReducedMotion,
  type GuestAttendance,
  type GuestFormApi,
  type ThemeLabels,
  type ThemeProps,
} from '@/theme-sdk';
import { BORDER } from './border';
import { SON_OF, copyFor, storyLines } from './copy';
import { OPENING_MS, daysSince, ribbonFrame, type RibbonKey } from './motion';
import bunting from './assets/bunting.webp';
import family from './assets/family.webp';
import teddyBalloons from './assets/teddy-balloons.webp';
import garland from './assets/garland.webp';
import footprints from './assets/footprints.webp';
import booties from './assets/booties.webp';
import cornerArt from './assets/corner-art.webp';
import fonts from './fonts.module.css';
import s from './theme.module.css';

/** closed (the ribbon waits) → opening (it unties, the paper doors fold open) → open (the announcement below). */
type Phase = 'closed' | 'opening' | 'open';

const c = (...names: (string | false | null | undefined)[]) =>
  names
    .filter((n): n is string => Boolean(n))
    .map((n) => s[n] ?? n)
    .join(' ');

const RIBBONS: RibbonKey[] = ['bandLeft', 'bandRight', 'tailLeft', 'tailRight'];
const SPARKLES = [
  [-112, -123, 36, 0, '✧'],
  [91, -148, -32, 90, '✧'],
  [-157, -28, -21, 170, '·'],
  [153, -57, 28, 130, '✧'],
  [-66, -185, 17, 60, '·'],
  [55, -85, -18, 210, '♡'],
  [-98, 75, 24, 190, '✧'],
  [121, 62, -36, 20, '·'],
  [14, -201, 30, 150, '✧'],
] as const;

/** Today in the guest's calendar (`YYYY-MM-DD`); null while the page is drawn on the server. */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const noSubscribe = () => () => {};

/**
 * Little Blue (Bluebird Garden v4, the owner's edit, 2026-11-02): a powder-blue watercolour birth announcement. Closed,
 * a satin ribbon ties two paper doors under swaying bunting; tapped, the bow loosens and its tails fly, the doors fold
 * open on the family by the bassinet, the baby's name and the date of birth. Then the story (the birth order the
 * customer chose), the day they were born with the days of love since, the baby's photo when there is one, the du'a,
 * the guests' wishes and the guest form.
 */
export default function LittleBlue(props: ThemeProps) {
  const { locale, dir, lang, fields, labels, birthDate, wording, photos } = props;
  const t = copyFor(locale);
  const reduced = useReducedMotion();
  const music = useMusic();
  const p = useId().replace(/:/g, '') + '-';
  const [phase, setPhase] = useState<Phase>('closed');
  const coverRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hoverRef = useRef(0);
  const articleRef = useRef<HTMLElement>(null);

  const name = fields.baby_name?.trim() ?? '';
  const sonOf = wording.sonOf ?? SON_OF.ar;
  const father = fields.father_name?.trim() ? `${sonOf} ${fields.father_name.trim()}` : '';
  const story = storyLines(t, locale, wording.order);
  const photo = hasFeature(props, 'photos') ? (photos[0] ?? null) : null;
  const date = birthDate?.lines.join(' ') ?? '';
  const days = daysSince(fields.birth_date, useSyncExternalStore(noSubscribe, today, () => '') || '');
  const withMusic = hasFeature(props, 'music') && music.available;
  const script = locale === 'en' ? 'latin' : 'arabic';

  // The ribbon: drawn to the cover's size; it sways while closed, unties while opening.
  useEffect(() => {
    if (phase === 'open') return;
    const cover = coverRef.current,
      svg = svgRef.current;
    if (!cover || !svg) return;
    let raf = 0,
      last = 0;
    const start = performance.now();
    const draw = (elapsed: number, clock: number) => {
      const w = cover.clientWidth || 1,
        h = cover.clientHeight || 1;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const f = ribbonFrame(w, h, elapsed, clock, hoverRef.current);
      for (const key of RIBBONS) svg.querySelector(`[data-ribbon="${key}"]`)?.setAttribute('d', f.paths[key]);
      svg.style.opacity = String(f.opacity);
      const set = (sel: string, transform: string, opacity: number) => {
        const g = svg.querySelector(sel);
        g?.setAttribute('transform', transform);
        if (g instanceof SVGElement) g.style.opacity = String(opacity);
      };
      set('[data-part="left"]', f.leftTransform, f.loopOpacity);
      set('[data-part="right"]', f.rightTransform, f.loopOpacity);
      set('[data-part="knot"]', f.knotTransform, f.knotOpacity);
    };
    draw(-1, 0);
    if (reduced && phase === 'closed') return;
    const tick = (now: number) => {
      if (phase === 'opening') {
        draw(Math.min(OPENING_MS, now - start), now);
        if (now - start >= OPENING_MS) return setPhase('open');
      } else if (now - last >= 32 && !document.hidden) {
        draw(-1, now);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, reduced]);

  // Sections appear as they scroll into view.
  useEffect(() => {
    if (phase !== 'open') return;
    const root = articleRef.current;
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
  }, [phase]);

  const open = () => {
    if (phase !== 'closed') return;
    music.start();
    // With reduced motion the announcement opens at once.
    setPhase(reduced ? 'open' : 'opening');
  };
  const replay = () => {
    setPhase('closed');
    articleRef.current?.querySelectorAll(`.${s.reveal}`).forEach((n) => n.classList.remove(s['is-seen'] ?? 'is-seen'));
    articleRef.current?.scrollIntoView({ block: 'start' });
  };

  const opened = phase === 'open';
  return (
    <div id={s.frame} className={`${fonts.fonts} ${s.page}`}>
      <article
        ref={articleRef}
        className={c('root', ...(phase === 'open' ? ['is-open'] : phase === 'opening' ? ['is-closed', 'is-opening'] : ['is-closed']), photo && 'has-photo')}
        lang={lang}
        dir={dir}
        data-script={script}
      >
        <main className={c('keepsake')}>
          <section className={c('announcement')} aria-label={name || t.coverLabel}>
            <div className={c('hero-border')} aria-hidden="true" />
            <div className={c('hero-corner', 'corner-a')} aria-hidden="true">
              ✧
            </div>
            <div className={c('hero-corner', 'corner-b')} aria-hidden="true">
              ✧
            </div>
            <div className={c('hero-inner')} inert={!opened && phase !== 'opening'}>
              <div className={c('hero-copy')}>
                <p className={c('eyebrow')}>{t.introLabel}</p>
                <p className={c('hero-thanks')}>{t.praise}</p>
                <div className={c('fine-rule')} aria-hidden="true">
                  <i />
                  <span>♡</span>
                  <i />
                </div>
                <p className={c('welcome-line')}>{t.welcome}</p>
                <h1 className={c('baby-name')}>{name}</h1>
                {father ? (
                  <p className={c('family-name')} dir="auto">
                    {father}
                  </p>
                ) : null}
                {date ? <p className={c('hero-date')}>{date}</p> : null}
                <p className={c('hero-ending')}>{t.heroEnding}</p>
              </div>
              <figure className={c('family-portrait')}>
                <div className={c('portrait-arch')} aria-hidden="true">
                  <span className={c('arch-star', 'star-one')}>✧</span>
                  <span className={c('arch-star', 'star-two')}>✧</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element -- design artwork */}
                <img src={family.src} width={family.width} height={family.height} alt={t.familyAlt} fetchPriority="high" />
              </figure>
            </div>
            {opened ? (
              <a className={c('hero-scroll')} href={`#${p}our-joy`}>
                <span>{t.discover}</span>
                <span aria-hidden="true">↓</span>
              </a>
            ) : null}

            {!opened ? (
              <div ref={coverRef} className={c('opening-cover')}>
                <div className={c('paper-door', 'door-left')} aria-hidden="true">
                  <div className={c('door-frame')} />
                </div>
                <div className={c('paper-door', 'door-right')} aria-hidden="true">
                  <div className={c('door-frame')} />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element -- design artwork */}
                <img className={c('cover-bunting')} src={bunting.src} width={bunting.width} height={bunting.height} alt="" aria-hidden="true" />
                <div className={c('cover-copy')} aria-hidden="true">
                  <p className={c('eyebrow')}>{t.coverLabel}</p>
                  <p className={c('cover-title')}>
                    <span>{t.coverTitle1}</span>
                    <br />
                    <em>{t.coverTitle2}</em>
                  </p>
                </div>
                <svg ref={svgRef} className={c('ribbon-stage')} aria-hidden="true" focusable="false">
                  <defs>
                    <linearGradient id={`${p}satin`} x1="0" y1="0" x2=".15" y2="1">
                      <stop offset="0" className={c('ribbon-dark')} />
                      <stop offset=".28" className={c('ribbon-light')} />
                      <stop offset=".54" className={c('ribbon-main')} />
                      <stop offset=".83" className={c('ribbon-light')} />
                      <stop offset="1" className={c('ribbon-dark')} />
                    </linearGradient>
                    <linearGradient id={`${p}loop`} x1="0" y1="0" x2=".9" y2="1">
                      <stop offset="0" className={c('ribbon-light')} />
                      <stop offset=".34" className={c('ribbon-main')} />
                      <stop offset=".7" className={c('ribbon-light')} />
                      <stop offset="1" className={c('ribbon-dark')} />
                    </linearGradient>
                    <linearGradient id={`${p}tail`} x1="0" y1="0" x2="1" y2=".2">
                      <stop offset="0" className={c('ribbon-dark')} />
                      <stop offset=".2" className={c('ribbon-main')} />
                      <stop offset=".5" className={c('ribbon-light')} />
                      <stop offset=".82" className={c('ribbon-main')} />
                      <stop offset="1" className={c('ribbon-dark')} />
                    </linearGradient>
                  </defs>
                  <g className={c('ribbon-strips')}>
                    <path data-ribbon="bandLeft" fill={`url(#${p}satin)`} />
                    <path data-ribbon="bandRight" fill={`url(#${p}satin)`} />
                    <path data-ribbon="tailLeft" fill={`url(#${p}tail)`} />
                    <path data-ribbon="tailRight" fill={`url(#${p}tail)`} />
                  </g>
                  <g data-part="left" className={c('bow-loop-left')}>
                    <path className={c('loop-shape')} fill={`url(#${p}loop)`} d="M-5 -3C-30 -43 -94 -52 -89 -8C-85 25 -38 24 -6 7Z" />
                    <path className={c('loop-crease')} d="M-8 0C-30 -17 -64 -26 -79 -17M-11 7C-34 12 -59 14 -75 4" />
                    <path className={c('loop-shine')} d="M-19 -17C-44 -41 -77 -39 -82 -22" />
                  </g>
                  <g data-part="right" className={c('bow-loop-right')}>
                    <path className={c('loop-shape')} fill={`url(#${p}loop)`} d="M5 -3C30 -48 94 -51 89 -8C85 25 38 24 6 7Z" />
                    <path className={c('loop-crease')} d="M8 0C30 -17 64 -26 79 -17M11 7C34 12 59 14 75 4" />
                    <path className={c('loop-shine')} d="M19 -18C44 -43 77 -39 82 -22" />
                  </g>
                  <g data-part="knot" className={c('bow-knot')}>
                    <path className={c('knot-shape')} fill={`url(#${p}satin)`} d="M-12 -13Q0 -20 12 -12L15 13Q0 21 -14 12Z" />
                    <path className={c('loop-shine')} d="M-6 -11Q-9 0 -5 12" />
                  </g>
                </svg>
                <div className={c('opening-sparkles')} aria-hidden="true">
                  {SPARKLES.map(([x, y, spin, delay, ch], i) => (
                    <i
                      key={i}
                      style={{
                        ['--x' as string]: `${x}px`,
                        ['--y' as string]: `${y}px`,
                        ['--spin' as string]: `${spin}deg`,
                        ['--delay' as string]: `${delay}ms`,
                      }}
                    >
                      {ch}
                    </i>
                  ))}
                </div>
                <button
                  type="button"
                  className={c('open-announcement')}
                  aria-label={labels.openInvitation}
                  onClick={open}
                  disabled={phase !== 'closed'}
                  onPointerEnter={() => (hoverRef.current = 1)}
                  onPointerLeave={() => (hoverRef.current = 0)}
                >
                  <span className={c('open-prompt')}>{t.open}</span>
                </button>
                <p className={c('cover-foot')} aria-hidden="true">
                  {t.madeWithLove}
                </p>
                <span className={c('cover-spark', 'spark-a')} aria-hidden="true">
                  ✧
                </span>
                <span className={c('cover-spark', 'spark-b')} aria-hidden="true">
                  ✧
                </span>
              </div>
            ) : null}
          </section>

          <div className={c('announcement-content')} hidden={!opened} inert={!opened}>
            <section className={c('our-joy', 'section')} id={`${p}our-joy`}>
              <div className={c('seam-line')} aria-hidden="true" />
              <div className={c('story-art', 'reveal')}>
                {/* eslint-disable-next-line @next/next/no-img-element -- design artwork */}
                <img src={teddyBalloons.src} width={teddyBalloons.width} height={teddyBalloons.height} loading="lazy" alt="" />
              </div>
              <div className={c('story-copy', 'reveal')}>
                <p className={c('eyebrow')}>{t.storyLabel}</p>
                <h2>
                  <span>{story.title1}</span>
                  <br />
                  <em>{story.title2}</em>
                </h2>
                <p className={c('story-body')}>{story.body}</p>
                <div className={c('handwritten')}>{t.storySignature}</div>
              </div>
            </section>

            <section className={c('birth-section', 'section')}>
              {/* eslint-disable-next-line @next/next/no-img-element -- design artwork */}
              <img
                className={c('nursery-garland', 'reveal')}
                src={garland.src}
                width={garland.width}
                height={garland.height}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
              <div className={c('birth-paper', 'reveal')}>
                <div className={c('paper-stitches')} aria-hidden="true" />
                <p className={c('eyebrow')}>{t.detailsLabel}</p>
                <h2>{t.detailsTitle}</h2>
                {birthDate ? (
                  <div className={c('date-medallion')}>
                    <span>{birthDate.month}</span>
                    <strong>{birthDate.day}</strong>
                    <span>{birthDate.year}</span>
                  </div>
                ) : null}
                <p className={c('detail-family')}>
                  <span>{name}</span> {father ? <span dir="auto">{father}</span> : null}
                </p>
                {days !== null && days >= 0 ? (
                  <div className={c('days-of-love')}>
                    <span className={c('mini-heart')} aria-hidden="true">
                      ♡
                    </span>
                    <p>{t.days(days, formatNumber(days, locale))}</p>
                    <span aria-hidden="true">♡</span>
                  </div>
                ) : null}
                {/* eslint-disable @next/next/no-img-element -- design artwork */}
                <img
                  className={c('footprints')}
                  src={footprints.src}
                  width={footprints.width}
                  height={footprints.height}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                />
                <img className={c('booties')} src={booties.src} width={booties.width} height={booties.height} alt="" aria-hidden="true" loading="lazy" />
                {/* eslint-enable @next/next/no-img-element */}
              </div>
            </section>

            {photo ? (
              <section className={c('memory-section', 'section')}>
                <div className={c('memory-copy', 'reveal')}>
                  <p className={c('eyebrow')}>{t.memoryLabel}</p>
                  <h2>
                    <span>{t.memoryTitle1}</span>
                    <br />
                    <em>{t.memoryTitle2}</em>
                  </h2>
                  <p>{t.memoryBody}</p>
                </div>
                <figure className={c('photo-keepsake', 'reveal')}>
                  <div className={c('photo-corners')} aria-hidden="true" />
                  <Photo photo={photo} className={c('baby-photo')} alt={t.photoAlt} />
                  <figcaption>
                    <span>{name}</span>
                    <span aria-hidden="true">♡</span>
                    <span>{date}</span>
                  </figcaption>
                </figure>
              </section>
            ) : null}

            <section className={c('blessing-section', 'section')}>
              <div className={c('blessing-frame')} aria-hidden="true" />
              <p className={c('eyebrow', 'reveal')}>{t.blessingLabel}</p>
              <h2 className={c('reveal')} lang={/[؀-ۿ]/.test(t.blessing) && locale !== 'ar' ? 'ar' : undefined}>
                {t.blessing}
              </h2>
              <div className={c('blessing-signature', 'reveal')}>
                <span>{t.closingLove}</span>
                <p>
                  {t.familyOf} {name}
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element -- design artwork */}
              <img className={c('toy-corner')} src={cornerArt.src} width={cornerArt.width} height={cornerArt.height} alt="" aria-hidden="true" loading="lazy" />
              <div className={c('closing-star')} aria-hidden="true">
                ✧
              </div>
              <p className={c('closing-small')}>{t.closingSmall}</p>
            </section>

            <div className={c('guest-pages')}>
              <ThemeBorder border={props.border} fallback={BORDER} medium="screen" />
              <GuestFormSlot
                render={(form) => (
                  <section className={c('guest-section', 'reveal')}>
                    <p className={c('eyebrow')}>{labels.guestFormTitle}</p>
                    <GuestForm form={form} labels={labels} />
                  </section>
                )}
              />
              {props.guestbook ? (
                <section className={c('guest-section', 'reveal')}>
                  <p className={c('eyebrow')}>{t.wishesLabel}</p>
                  <h2>{labels.guestbookTitle}</h2>
                  {props.guestbook.length ? (
                    <ul className={c('wishes')}>
                      {props.guestbook.map((m, i) => (
                        <li key={i} className={c('wish')}>
                          <p dir="auto">{m.message}</p>
                          <p className={c('wish-from')} dir="auto">
                            — {m.guestName}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={c('wish-empty')}>{labels.guestbookEmpty}</p>
                  )}
                </section>
              ) : null}
            </div>

            <footer className={c('footer')}>
              <button type="button" onClick={replay}>
                {t.replay}
              </button>
              {withMusic ? (
                <>
                  <span aria-hidden="true">·</span>
                  <button type="button" onClick={music.toggle} aria-pressed={music.playing}>
                    {music.playing ? labels.musicPause : labels.musicPlay}
                  </button>
                </>
              ) : null}
            </footer>
          </div>
        </main>
        {withMusic && opened ? (
          <button
            type="button"
            className={c('music-fab')}
            onClick={music.toggle}
            aria-pressed={music.playing}
            aria-label={music.playing ? labels.musicPause : labels.musicPlay}
          >
            <span aria-hidden="true">{music.playing ? '❚❚' : '♪'}</span>
          </button>
        ) : null}
      </article>
    </div>
  );
}

/** The guest form in the design's paper and ink; the platform validates, stores and adds "how many of you". */
function GuestForm({ form, labels }: { form: GuestFormApi; labels: ThemeLabels }) {
  const [attendance, setAttendance] = useState<GuestAttendance | null>(null);
  if (form.status === 'sent') {
    return (
      <p role="status" className={c('form-sent')}>
        {form.isPreview ? labels.sentPreview : labels.sent}
      </p>
    );
  }
  const error = (text: string | undefined): ReactNode => (text ? <span className={c('form-error')}>{text}</span> : null);
  return (
    <form
      className={c('guest-form')}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        void form.submit({ name: String(data.get('name') ?? ''), attendance, message: String(data.get('message') ?? '') });
      }}
    >
      <label className={c('form-field')}>
        <span>{labels.guestName}</span>
        <input name="name" maxLength={form.limits.name} autoComplete="name" aria-invalid={Boolean(form.fieldErrors.name)} />
        {error(form.fieldErrors.name)}
      </label>
      <fieldset className={c('form-choices')}>
        <legend>{labels.attendanceQuestion}</legend>
        {(['ATTENDING', 'NOT_ATTENDING'] as const).map((value) => (
          <label key={value} className={c('form-choice')}>
            <input type="radio" name="attendance" value={value} checked={attendance === value} onChange={() => setAttendance(value)} />
            <span>{value === 'ATTENDING' ? labels.attending : labels.notAttending}</span>
          </label>
        ))}
        {error(form.fieldErrors.attendance)}
      </fieldset>
      {form.withMessage ? (
        <label className={c('form-field')}>
          <span>{labels.message}</span>
          <textarea name="message" rows={4} maxLength={form.limits.message} aria-invalid={Boolean(form.fieldErrors.message)} />
          {error(form.fieldErrors.message)}
        </label>
      ) : null}
      {form.error ? (
        <p role="alert" className={c('form-error')}>
          {form.error}
        </p>
      ) : null}
      <button type="submit" className={c('form-submit')} disabled={form.status === 'sending'}>
        {form.status === 'sending' ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
