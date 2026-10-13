import Image, { type StaticImageData } from 'next/image';
import type { BirthDateParts, InvitationLocale } from '@/theme-sdk';
import { DUA, GIFT, HANDLE, PRAISE, SON_OF } from './copy';
import styles from './design.module.css';
import linen from './assets/linen.webp';
import water from './assets/water.webp';
import swanBow from './assets/swan-bow.webp';
import swan from './assets/swan.webp';
import flowersLeft from './assets/flowers-left.webp';
import flowersRight from './assets/flowers-right.webp';
import bellsA from './assets/bells-a.webp';
import bellsB from './assets/bells-b.webp';

/**
 * The owner's designs (docs/themes/swan-garden/), rebuilt from their pieces (two swans, flower corners and
 * bell-flower sprigs; the linen and the pond made to match) so every word is live. Each fills a box that is a
 * CSS size container (the platform's box for the extras, the card's own A5 box, the preview's phone box), so
 * every size is in `cqw`/`cqh`.
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
 * Name size: `max`, but never wider than `budget` (long names shrink). The maxima are kept low: Ruqaa letters are
 * tall (ك ل) and have long tails (م ر ي), so a short name would otherwise run into the lines around it.
 */
function fit(text: string, budget: number, max: string, unit = 'cqw'): string {
  const len = Math.max(3, [...text].length);
  const perChar = /[A-Za-z]/.test(text) ? 0.6 : 0.42; // Aref Ruqaa Ink Bold
  return `min(${max}, ${(budget / (len * perChar)).toFixed(2)}${unit})`;
}

function Linen() {
  return <Image src={linen} alt="" aria-hidden fill unoptimized priority sizes="100vw" className={styles.linen} />;
}

/** One piece of the owner's artwork, placed by its class. */
function Piece({ src, className }: { src: StaticImageData; className?: string }) {
  return <Image src={src} alt="" aria-hidden unoptimized priority className={`${styles.piece} ${className ?? ''}`} />;
}

/** The pond: water along the bottom, the flowers and bell sprigs at both sides. */
function Garden() {
  return (
    <>
      <Piece src={water} className={styles.water} />
      <Piece src={bellsA} className={styles.bellsL} />
      <Piece src={bellsB} className={styles.bellsR} />
      <Piece src={flowersLeft} className={styles.flL} />
      <Piece src={flowersRight} className={styles.flR} />
    </>
  );
}

/** The two swans: the one with the bow behind, the other in front. */
function Swans() {
  return (
    <>
      <Piece src={swanBow} className={styles.swanBow} />
      <Piece src={swan} className={styles.swan} />
    </>
  );
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

/** The baby's name in pink glass. */
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
    <p className={`${styles.at} ${styles.father} ${className ?? ''}`} {...d.fatherAttrs}>
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
      <Linen />
      <Garden />
      <Swans />
      <Lines lines={PRAISE} className={styles.praise} />
      <p className={`${styles.at} ${styles.gift}`} {...ARABIC}>
        {GIFT}
      </p>
      <Name name={d.name} size={fit(d.name, 70, variant === 'story' ? '24cqw' : '18cqw')} className={styles.nameAt} />
      <Father d={d} className={styles.fatherAt} />
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
      <Linen />
      <Garden />
      <Swans />
      {round ? <span aria-hidden className={styles.ring} /> : null}
      <Name name={d.name} size={fit(d.name, 48, father ? '14cqw' : '17cqw')} className={styles.stName} />
      {father ? <Father d={d} className={styles.stFather} /> : null}
    </div>
  );
}

/** The water-bottle label: a swan with a bow at each end facing the name, flowers at both ends, the pond. */
export function BottleDesign({ d }: { d: DesignData }) {
  const father = d.fatherOnExtras && d.father;
  return (
    <div className={`${styles.root} ${styles.bottle} ${father ? styles.withFather : ''}`} dir={d.dir} lang={d.lang}>
      <Linen />
      <Piece src={water} className={styles.water} />
      <Piece src={flowersLeft} className={styles.flL} />
      <Piece src={flowersRight} className={styles.flR} />
      <Piece src={swanBow} className={styles.swanL} />
      <Piece src={swanBow} className={styles.swanR} />
      <Name name={d.name} size={fit(d.name, 110, father ? '30cqh' : '36cqh', 'cqh')} className={styles.btName} />
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
 * The back of the A5 card (landscape): the same linen, flowers and bell sprigs as the front; the customer's
 * title in pink glass, their message, then the baby's name.
 */
export function CardBackDesign({ d, title, message }: { d: DesignData; title: string; message: string | null }) {
  return (
    <div className={`${styles.root} ${styles.back}`} dir={d.dir} lang={d.lang}>
      <Linen />
      <Piece src={bellsA} className={styles.bellsL} />
      <Piece src={bellsB} className={styles.bellsR} />
      <Piece src={flowersLeft} className={styles.flL} />
      <Piece src={flowersRight} className={styles.flR} />
      <div className={styles.backColumn}>
        <GlassText text={title} size={fit(title, 50, '13cqw')} dir={d.dir} />
        {message ? <p className={styles.backMessage}>{message}</p> : null}
        {d.name ? <GlassText text={d.name} size={fit(d.name, 30, '8.5cqw')} dir={d.dir} /> : null}
      </div>
    </div>
  );
}
