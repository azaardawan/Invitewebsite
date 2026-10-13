import Image, { type StaticImageData } from 'next/image';
import type { BirthDateParts, InvitationLocale } from '@/theme-sdk';
import { DUA, HANDLE, ORDER, PRAISE, SON_OF } from './copy';
import styles from './design.module.css';
import paper from './assets/paper.webp';
import family from './assets/family.webp';
import birdLeft from './assets/bird-left.webp';
import birdRight from './assets/bird-right.webp';
import flowersLeft from './assets/flowers-left.webp';
import flowersRight from './assets/flowers-right.webp';

/**
 * The owner's designs (docs/themes/bluebird-garden/, recoloured rose for girls), rebuilt from their pieces (paper, delphiniums, birds,
 * the family) so every word is live. Each fills a box that is a CSS size container (the platform's box for
 * the extras, the card's own A5 box, the preview's phone box), so every size is in `cqw`/`cqh`.
 */
export type DesignData = {
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  lang: string;
  name: string;
  /** «بن» (or the customer's connector) and the father's name, or null without a father's name. */
  father: string | null;
  /** The father's line runs in the direction of its connector (Arabic «بن» on an English order: right to left). */
  fatherAttrs: { lang?: string; dir?: 'rtl' | 'ltr' };
  /** The date of birth in the customer's chosen style (one or two lines). */
  birthLines: string[] | null;
  /** «وهبنا الله … أفراحنا وأميرنا …» with the birth order the customer chose. */
  order: string;
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
    order: p.wording.order ?? ORDER.ar,
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

/** Name size: `max`, but never wider than `budget` cqw (long names shrink). */
function fit(text: string, budget: number, max: string, unit = 'cqw'): string {
  const len = Math.max(3, [...text].length);
  const perChar = /[A-Za-z]/.test(text) ? 0.64 : 0.46; // Scheherazade New Bold (its Latin is wide)
  return `min(${max}, ${(budget / (len * perChar)).toFixed(2)}${unit})`;
}

function Paper() {
  return <Image src={paper} alt="" aria-hidden fill unoptimized priority sizes="100vw" className={styles.paper} />;
}

/** One piece of the owner's artwork, placed by its class. */
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

/** The baby's name in rose glass. */
function Name({ name, size, className }: { name: string; size: string; className?: string }) {
  return (
    <p className={`${styles.at} ${styles.name} ${className ?? ''}`} style={{ fontSize: size }}>
      <span className={styles.glass} data-text={name}>
        {name}
      </span>
    </p>
  );
}

function Father({ d, className }: { d: DesignData; className?: string }) {
  return d.father ? (
    <p className={`${styles.at} ${className ?? ''}`} {...d.fatherAttrs}>
      {d.father}
    </p>
  ) : null;
}

function BirthDate({ lines, className }: { lines: string[] | null; className?: string }) {
  if (!lines?.length) return null;
  return (
    <p className={`${styles.at} ${styles.date} ${className ?? ''}`}>
      {lines.map((l, i) => (
        <span key={i} className={styles.line}>
          {l}
        </span>
      ))}
    </p>
  );
}

/** The Instagram story, or the A5 card front (the same composition, laid out for each shape). */
export function StoryDesign({ d, variant }: { d: DesignData; variant: 'story' | 'card' }) {
  return (
    <div className={`${styles.root} ${variant === 'story' ? styles.story : styles.card}`} dir={d.dir} lang={d.lang}>
      <Paper />
      <Piece src={flowersLeft} className={styles.flL} />
      <Piece src={flowersRight} className={styles.flR} />
      <Piece src={birdLeft} className={styles.birdL} />
      <Piece src={birdRight} className={styles.birdR} />
      <Piece src={family} className={styles.family} />
      <Lines lines={PRAISE} className={styles.praise} />
      <p className={`${styles.at} ${styles.order}`} {...ARABIC}>
        {d.order}
      </p>
      <Name name={d.name} size={fit(d.name, 72, variant === 'story' ? '25cqw' : '18cqw')} className={styles.nameAt} />
      <Father d={d} className={styles.father} />
      <BirthDate lines={d.birthLines} className={styles.dateAt} />
      <Lines lines={DUA} className={styles.dua} />
      <p className={`${styles.at} ${styles.handle}`} dir="ltr" lang="en">
        {HANDLE}
      </p>
    </div>
  );
}

/** One chocolate sticker, round (with its thin rose ring) or square. */
export function StickerDesign({ d, round }: { d: DesignData; round: boolean }) {
  const father = d.fatherOnExtras && d.father;
  return (
    <div className={`${styles.root} ${styles.sticker} ${round ? styles.round : styles.square} ${father ? styles.withFather : ''}`} dir={d.dir} lang={d.lang}>
      <Paper />
      <Piece src={flowersLeft} className={styles.flL} />
      <Piece src={flowersRight} className={styles.flR} />
      <Piece src={birdLeft} className={styles.birdL} />
      <Piece src={birdRight} className={styles.birdR} />
      {round ? <span aria-hidden className={styles.ring} /> : null}
      <Name name={d.name} size={fit(d.name, 46, father ? '16cqw' : '20cqw')} className={styles.stName} />
      {father ? <Father d={d} className={styles.stFather} /> : null}
    </div>
  );
}

/** The water-bottle label: flowers at both ends, birds, the name in the middle. */
export function BottleDesign({ d }: { d: DesignData }) {
  const father = d.fatherOnExtras && d.father;
  return (
    <div className={`${styles.root} ${styles.bottle} ${father ? styles.withFather : ''}`} dir={d.dir} lang={d.lang}>
      <Paper />
      <Piece src={flowersLeft} className={styles.flL} />
      <Piece src={flowersRight} className={styles.flR} />
      <Piece src={birdLeft} className={styles.birdL} />
      <Piece src={birdRight} className={styles.birdR} />
      <Name name={d.name} size={fit(d.name, 120, father ? '40cqh' : '52cqh', 'cqh')} className={styles.btName} />
      {father ? <Father d={d} className={styles.btFather} /> : null}
    </div>
  );
}

/** Glass lettering that may wrap (the back's title and name), centred in its column. */
function GlassText({ text, size, dir }: { text: string; size: string; dir: 'rtl' | 'ltr' }) {
  return (
    <p className={styles.name} style={{ fontSize: size }} {...ownLang(text, dir)}>
      <span className={styles.glass} data-text={text}>
        {text}
      </span>
    </p>
  );
}

/**
 * The back of the A5 card (landscape): the same paper, delphiniums and birds as the front; the customer's
 * title in rose glass, their message, then the baby's name.
 */
export function CardBackDesign({ d, title, message }: { d: DesignData; title: string; message: string | null }) {
  return (
    <div className={`${styles.root} ${styles.back}`} dir={d.dir} lang={d.lang}>
      <Paper />
      <Piece src={flowersLeft} className={styles.flL} />
      <Piece src={flowersRight} className={styles.flR} />
      <Piece src={birdLeft} className={styles.birdL} />
      <Piece src={birdRight} className={styles.birdR} />
      <div className={styles.backColumn}>
        <GlassText text={title} size={fit(title, 50, '10cqw')} dir={d.dir} />
        {message ? <p className={styles.backMessage}>{message}</p> : null}
        {d.name ? <GlassText text={d.name} size={fit(d.name, 26, '6.4cqw')} dir={d.dir} /> : null}
      </div>
    </div>
  );
}
