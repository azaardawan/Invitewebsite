import Image, { type StaticImageData } from 'next/image';
import type { BirthDateParts, InvitationLocale } from '@/theme-sdk';
import { DUA, GIFT, HANDLE, PRAISE, SON_OF } from './copy';
import styles from './design.module.css';
import linen from './assets/linen.webp';
import garlandArch from './assets/garland-arch.webp';
import garlandFlat from './assets/garland-flat.webp';
import branchLeft from './assets/branch-left.webp';
import branchRight from './assets/branch-right.webp';
import bird from './assets/bird.webp';

/**
 * The owner's designs (docs/themes/pearl-garden/), rebuilt from their embroidered pieces (two garlands, two
 * bird branches, a dove; the linen made to match) so every word is live. Each fills a box that is a CSS size
 * container (the platform's box for the extras, the card's own A5 box, the preview's phone box), so every size
 * is in `cqw`/`cqh`.
 */
export type DesignData = {
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  lang: string;
  name: string;
  /** «بنت» (or the customer's connector) and the father's name, or null without a father's name. */
  father: string | null;
  /** The father's line runs in the direction of its connector (Arabic «بنت» on an English order: right to left). */
  fatherAttrs: { lang?: string; dir?: 'rtl' | 'ltr' };
  /** The date of birth in the customer's chosen style (one or two lines). */
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
  return {
    locale: p.locale,
    dir: p.dir,
    lang: p.lang,
    name: p.fields.baby_name ?? '',
    father: p.fields.father_name ? `${sonOf} ${p.fields.father_name}` : null,
    fatherAttrs: ownLang(sonOf, p.dir),
    birthLines: p.birthDate?.lines ?? null,
    fatherOnExtras: p.switches.fatherOnExtras ?? false,
  };
}

/** A line whose script differs from the design's language gets its own `lang`/`dir`. */
function ownLang(text: string, dir: 'rtl' | 'ltr') {
  const arabicScript = /[؀-ۿ]/.test(text);
  if (arabicScript && dir === 'ltr') return { lang: 'ar', dir: 'rtl' as const };
  if (!arabicScript && /[A-Za-z]/.test(text) && dir === 'rtl') return { lang: 'en', dir: 'ltr' as const };
  return {};
}

const ARABIC = { lang: 'ar', dir: 'rtl' } as const;

/**
 * Name size: `max`, but never wider than `budget` (long names shrink). The maxima stay moderate so a short
 * name's tails (م ر ي ڕ) keep clear of «بنت …» below it.
 */
function fit(text: string, budget: number, max: string, unit = 'cqw'): string {
  const len = Math.max(3, [...text].length);
  const perChar = /[A-Za-z]/.test(text) ? 0.78 : 0.56; // Marhey Bold (its Latin is wide)
  return `min(${max}, ${(budget / (len * perChar)).toFixed(2)}${unit})`;
}

function Linen() {
  return <Image src={linen} alt="" aria-hidden fill unoptimized priority sizes="100vw" className={styles.linen} />;
}

/** One piece of the owner's embroidery, placed by its class. */
function Piece({ src, className }: { src: StaticImageData; className?: string }) {
  return <Image src={src} alt="" aria-hidden unoptimized priority className={`${styles.piece} ${className ?? ''}`} />;
}

function Lines({ lines, className }: { lines: readonly string[]; className?: string }) {
  return (
    <p className={`${styles.at} ${className ?? ''}`} {...ARABIC}>
      {lines.map((l, i) => (
        <span key={i} className={styles.line}>
          {l}
        </span>
      ))}
    </p>
  );
}

/** The baby's name, stitched in pink thread. */
function Name({ name, size, className }: { name: string; size: string; className?: string }) {
  return (
    <p className={`${styles.at} ${styles.name} ${className ?? ''}`} style={{ fontSize: size }}>
      <span className={styles.thread}>{name}</span>
    </p>
  );
}

function Father({ d, className }: { d: DesignData; className?: string }) {
  return d.father ? (
    <p className={`${styles.at} ${styles.father} ${className ?? ''}`} {...d.fatherAttrs}>
      {d.father}
    </p>
  ) : null;
}

/** A small stitched sprig either side of the date: a dotted thread ending in a pink leaf pair. */
function Sprig({ flip }: { flip?: boolean }) {
  return (
    <svg className={styles.sprig} viewBox="0 0 40 16" aria-hidden style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M2 8 H28" stroke="#c98b95" strokeWidth="1.1" strokeDasharray="1.4 1.6" strokeLinecap="round" fill="none" />
      <path d="M30 8 C33 3.5 37 3.5 39 5.5 C37 8 34 9 30 8 Z" fill="#c27a86" />
      <path d="M30 8 C33 12.5 37 12.5 39 10.5 C37 8 34 7 30 8 Z" fill="#d79aa4" />
      <circle cx="28.6" cy="8" r="1.3" fill="#b06b77" />
    </svg>
  );
}

function BirthDate({ lines, className }: { lines: string[] | null; className?: string }) {
  if (!lines?.length) return null;
  return (
    <div className={`${styles.at} ${styles.date} ${className ?? ''}`}>
      <Sprig />
      <p className={styles.dateText}>
        {lines.map((l, i) => (
          <span key={i} className={styles.line}>
            {l}
          </span>
        ))}
      </p>
      <Sprig flip />
    </div>
  );
}

/** The garlands at the top and bottom and the bird branches up both sides (story, card). */
function Frame() {
  return (
    <>
      <Piece src={branchLeft} className={styles.brL} />
      <Piece src={branchRight} className={styles.brR} />
      <Piece src={garlandArch} className={styles.top} />
      <Piece src={garlandFlat} className={styles.bottom} />
    </>
  );
}

/** The Instagram story, or the A5 card front (the same composition, laid out for each shape). */
export function StoryDesign({ d, variant }: { d: DesignData; variant: 'story' | 'card' }) {
  return (
    <div className={`${styles.root} ${variant === 'story' ? styles.story : styles.card}`} dir={d.dir} lang={d.lang}>
      <Linen />
      <Frame />
      <Lines lines={PRAISE} className={styles.praise} />
      <p className={`${styles.at} ${styles.gift}`} {...ARABIC}>
        {GIFT}
      </p>
      <Name name={d.name} size={fit(d.name, 58, variant === 'story' ? '17cqw' : '14cqw')} className={styles.nameAt} />
      <Father d={d} className={styles.fatherAt} />
      <BirthDate lines={d.birthLines} className={styles.dateAt} />
      <Lines lines={DUA} className={styles.dua} />
      <p className={`${styles.at} ${styles.handle}`} dir="ltr" lang="en">
        {HANDLE}
      </p>
    </div>
  );
}

/** One chocolate sticker, round (with its stitched rose ring) or square: garlands above and below, two doves facing the name. */
export function StickerDesign({ d, round }: { d: DesignData; round: boolean }) {
  const father = d.fatherOnExtras && d.father;
  return (
    <div className={`${styles.root} ${styles.sticker} ${round ? styles.round : styles.square} ${father ? styles.withFather : ''}`} dir={d.dir} lang={d.lang}>
      <Linen />
      <Piece src={garlandArch} className={styles.stTop} />
      <Piece src={garlandArch} className={styles.stBottom} />
      <Piece src={bird} className={styles.birdL} />
      <Piece src={bird} className={styles.birdR} />
      {round ? <span aria-hidden className={styles.ring} /> : null}
      <Name name={d.name} size={fit(d.name, 40, father ? '12cqw' : '15cqw')} className={styles.stName} />
      {father ? <Father d={d} className={styles.stFather} /> : null}
    </div>
  );
}

/** The water-bottle label: a garland at each end, a dove on each side facing the name. */
export function BottleDesign({ d }: { d: DesignData }) {
  const father = d.fatherOnExtras && d.father;
  return (
    <div className={`${styles.root} ${styles.bottle} ${father ? styles.withFather : ''}`} dir={d.dir} lang={d.lang}>
      <Linen />
      <Piece src={garlandFlat} className={styles.btEndL} />
      <Piece src={garlandFlat} className={styles.btEndR} />
      <Piece src={bird} className={styles.btBirdL} />
      <Piece src={bird} className={styles.btBirdR} />
      <Name name={d.name} size={fit(d.name, 90, father ? '30cqh' : '36cqh', 'cqh')} className={styles.btName} />
      {father ? <Father d={d} className={styles.btFather} /> : null}
    </div>
  );
}

/** Stitched lettering that may wrap (the back's title and name), centred in its column. */
function Stitched({ text, size, dir }: { text: string; size: string; dir: 'rtl' | 'ltr' }) {
  return (
    <p className={styles.name} style={{ fontSize: size }} {...ownLang(text, dir)}>
      <span className={styles.thread}>{text}</span>
    </p>
  );
}

/**
 * The back of the A5 card (landscape): the same linen with the bird branches at both sides; the customer's title
 * stitched in pink, their message, then the baby's name.
 */
export function CardBackDesign({ d, title, message }: { d: DesignData; title: string; message: string | null }) {
  return (
    <div className={`${styles.root} ${styles.back}`} dir={d.dir} lang={d.lang}>
      <Linen />
      <Piece src={branchLeft} className={styles.brL} />
      <Piece src={branchRight} className={styles.brR} />
      <div className={styles.backColumn}>
        <Stitched text={title} size={fit(title, 46, '8cqw')} dir={d.dir} />
        {message ? <p className={styles.backMessage}>{message}</p> : null}
        {d.name ? <Stitched text={d.name} size={fit(d.name, 24, '5.4cqw')} dir={d.dir} /> : null}
      </div>
    </div>
  );
}

/** The design's name lettering, for the online invitation's cover and closing (wraps, centred). */
export function Lettering({ text, size, dir }: { text: string; size: string; dir: 'rtl' | 'ltr' }) {
  return <Stitched text={text} size={size} dir={dir} />;
}

/** A size for `Lettering`: `max`, but never wider than `budget` (in the box's `cqw`) for long names. */
export const fitLettering = (text: string, budget: number, max: string) => fit(text, budget, max);
