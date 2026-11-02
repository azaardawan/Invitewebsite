import type { ReactNode } from 'react';
import type { BirthDateParts, InvitationLocale } from '@/theme-sdk';
import { SON_OF, copyFor, type Copy } from './copy';
import bunting from './assets/bunting.webp';
import family from './assets/family.webp';
import bow from './assets/bow.webp';
import booties from './assets/booties.webp';
import footprints from './assets/footprints.webp';
import teddyBalloons from './assets/teddy-balloons.webp';
import cornerArt from './assets/corner-art.webp';
import garland from './assets/garland.webp';
import pram from './assets/pram.webp';
import decoA from './assets/deco-a.webp';
import decoB from './assets/deco-b.webp';
import decoC from './assets/deco-c.webp';
import fonts from './fonts.module.css';
import styles from './design.module.css';

/**
 * The printed pieces in the announcement's art (Little Rose, the owner's edit, 2026-11-02): the A5 card, the Instagram story, the
 * chocolate stickers, the bottle label and the card's back. Each fills a box that is a CSS size container (the
 * platform's box for the extras, the card's own A5 box), so every size is in `cqw`/`cqh`. Server components.
 */
export type DesignData = {
  t: Copy;
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  lang: string;
  latin: boolean;
  name: string;
  /** «بن» (or the customer's connector) and the father's name, or null without a father's name. */
  father: string | null;
  birthLines: string[] | null;
  /** The customer's choice: the father's line on the stickers and bottle label too. */
  fatherOnExtras: boolean;
};

export function designData(p: {
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  lang: string;
  fields: Partial<Record<string, string>>;
  birthDate: BirthDateParts | null;
  wording: Readonly<Record<string, string>>;
  switches: Readonly<Record<string, boolean>>;
}): DesignData {
  const sonOf = p.wording.sonOf ?? SON_OF.ar;
  const father = p.fields.father_name?.trim();
  return {
    t: copyFor(p.locale),
    locale: p.locale,
    dir: p.dir,
    lang: p.lang,
    latin: p.locale === 'en',
    name: p.fields.baby_name?.trim() ?? '',
    father: father ? `${sonOf} ${father}` : null,
    birthLines: p.birthDate?.lines ?? null,
    fatherOnExtras: p.switches.fatherOnExtras ?? false,
  };
}

/** Name size: `max`, but never wider than `budget` (in `unit`s): long names shrink. */
function fit(text: string, budget: number, max: number, unit = 'cqw'): string {
  const len = Math.max(3, [...text].length);
  const perChar = /[A-Za-z]/.test(text) ? 0.5 : 0.42;
  return `${Math.min(max, budget / (len * perChar)).toFixed(2)}${unit}`;
}

function Root({ d, kind, children }: { d: DesignData; kind: string; children: ReactNode }) {
  return (
    <div className={`${fonts.fonts} ${styles.root} ${styles[kind]}`} dir={d.dir} lang={d.lang} data-script={d.latin ? 'latin' : 'arabic'}>
      {children}
    </div>
  );
}

/** One piece of the artwork, placed by its class. */
function Art({ src, className }: { src: { src: string }; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- print artwork
  return <img src={src.src} alt="" aria-hidden="true" className={`${styles.art} ${className ?? ''}`} />;
}

function Hearts() {
  return (
    <span className={styles.rule} aria-hidden="true">
      <i />
      <span>♡</span>
      <i />
    </span>
  );
}

/** A few of the announcement's sparkles, placed by the piece's CSS (`.sp1` … `.sp6`). */
function Sparkles() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <span key={i} className={`${styles.sparkle} ${styles[`sp${i}`] ?? ''}`} aria-hidden="true">
          {i % 3 ? '✧' : '♡'}
        </span>
      ))}
    </>
  );
}

/** The poster's nursery things around the family: the teddy and the pram at the foot, two small pieces above them. */
function PosterFrontArt() {
  return (
    <>
      <Sparkles />
      <Art src={decoB} className={styles.pdB} />
      <Art src={decoC} className={styles.pdC} />
      <Art src={teddyBalloons} className={styles.pdTeddy} />
      <Art src={pram} className={styles.pdPram} />
    </>
  );
}

/** The Instagram story, or the A5 card front: the announcement's opening page, laid out for each shape. */
export function StoryDesign({ d, variant, qr }: { d: DesignData; variant: 'story' | 'card' | 'poster'; qr?: { src: string; caption: string } | null }) {
  return (
    <Root d={d} kind={variant}>
      {variant === 'poster' ? <PosterFrontArt /> : <span className={styles.arch} aria-hidden="true" />}
      <Art src={bunting} className={styles.bunting} />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{d.t.introLabel}</p>
        <p className={styles.thanks}>{d.t.praise}</p>
        <Hearts />
        <p className={styles.welcome}>{d.t.welcome}</p>
        <p className={styles.name} style={{ fontSize: fit(d.name, 64, variant === 'story' ? 20 : variant === 'poster' ? 17 : 16) }}>
          {d.name}
        </p>
        {d.father ? (
          <p className={styles.father} dir="auto">
            {d.father}
          </p>
        ) : null}
        {d.birthLines?.length ? <p className={styles.date}>{d.birthLines.join(' ')}</p> : null}
        <p className={styles.ending}>{d.t.heroEnding}</p>
      </div>
      <Art src={family} className={styles.family} />
      {qr ? (
        <figure className={styles.qr}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
          <img src={qr.src} alt="" />
          <figcaption>{qr.caption}</figcaption>
        </figure>
      ) : null}
    </Root>
  );
}

/** One chocolate sticker, round (with its thin ring) or square: the bow, the name, the booties. */
export function StickerDesign({ d, round }: { d: DesignData; round: boolean }) {
  const father = d.fatherOnExtras && d.father;
  return (
    <Root d={d} kind="sticker">
      <span className={`${styles.ring} ${round ? styles.round : styles.square}`} aria-hidden="true" />
      <Art src={bow} className={styles.stBow} />
      <p className={styles.name} style={{ fontSize: fit(d.name, 62, father ? 19 : 23) }}>
        {d.name}
      </p>
      {father ? (
        <p className={styles.stFather} dir="auto">
          {father}
        </p>
      ) : null}
      <Art src={booties} className={styles.stBooties} />
    </Root>
  );
}

/** The water-bottle label: the booties and the teddy at the ends, the name and the date between. */
export function BottleDesign({ d }: { d: DesignData }) {
  const father = d.fatherOnExtras && d.father;
  return (
    <Root d={d} kind="bottle">
      <Art src={footprints} className={styles.btStart} />
      <Art src={teddyBalloons} className={styles.btEnd} />
      <div className={styles.btCopy}>
        <p className={styles.name} style={{ fontSize: fit(d.name, 150, father ? 40 : 48, 'cqh') }}>
          {d.name}
        </p>
        {father ? (
          <p className={styles.btFather} dir="auto">
            {father}
          </p>
        ) : null}
        <Hearts />
      </div>
    </Root>
  );
}

/** The A5 card's back (landscape): the customer's title and message under the du'a's arch, the toy corner, the name. */
export function CardBackDesign({ d, title, message }: { d: DesignData; title: string; message: string | null }) {
  return (
    <Root d={d} kind="back">
      <span className={styles.arch} aria-hidden="true" />
      <Sparkles />
      <Art src={cornerArt} className={styles.backCorner} />
      <Art src={decoA} className={styles.backDecoA} />
      <Art src={pram} className={styles.backPram} />
      <Art src={footprints} className={styles.backFeet} />
      <div className={styles.backColumn}>
        <p className={styles.eyebrow}>{d.t.blessingLabel}</p>
        <p className={styles.backTitle} dir="auto">
          {title}
        </p>
        {message ? (
          <p className={styles.backMessage} dir="auto">
            {message}
          </p>
        ) : null}
        <Hearts />
        {d.name ? (
          <p className={styles.backName}>
            {d.t.familyOf} {d.name}
          </p>
        ) : null}
      </div>
    </Root>
  );
}

/**
 * One side of a printed poster: the paper inside the cut line with a fine line just inside it (transparent outside,
 * the platform cuts there). Front: the announcement's page; back: the du'a's words, the customer's title and message,
 * the family's name and the QR code, in one column as on the other designs' posters.
 */
export function PosterDesign({
  d,
  shape,
  side,
  widthMm: w,
  heightMm: h,
  outline,
  title,
  message,
  qr,
}: {
  d: DesignData;
  shape: string;
  side: 'front' | 'back';
  widthMm: number;
  heightMm: number;
  outline: string;
  title: string;
  message: string | null;
  qr: { src: string; caption: string } | null;
}) {
  const inset = `translate(${w / 2} ${h / 2}) scale(0.94) translate(${-w / 2} ${-h / 2})`;
  return (
    <div className={styles.posterBox} data-shape={shape}>
      <svg className={styles.posterPaper} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={outline} className={styles.paperFill} />
        <path d={outline} transform={inset} className={styles.paperLine} vectorEffect="non-scaling-stroke" />
      </svg>
      {side === 'front' ? (
        // The QR code goes on the back, as on the other designs' posters.
        <StoryDesign d={d} variant="poster" />
      ) : (
        <Root d={d} kind="posterBack">
          <Sparkles />
          <Art src={garland} className={styles.pbGarland} />
          <Art src={teddyBalloons} className={styles.pbTeddy} />
          <Art src={pram} className={styles.pbPram} />
          <Art src={decoA} className={styles.pbDecoA} />
          <p className={styles.eyebrow}>{d.t.blessingLabel}</p>
          <p className={styles.backTitle} dir="auto">
            {title}
          </p>
          {message ? (
            <p className={styles.backMessage} dir="auto">
              {message}
            </p>
          ) : null}
          <Hearts />
          {d.name ? (
            <p className={styles.backName}>
              {d.t.familyOf} {d.name}
            </p>
          ) : null}
          {qr ? (
            <figure className={styles.posterQr}>
              {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
              <img src={qr.src} alt="" />
              <figcaption>{qr.caption}</figcaption>
            </figure>
          ) : null}
        </Root>
      )}
    </div>
  );
}
