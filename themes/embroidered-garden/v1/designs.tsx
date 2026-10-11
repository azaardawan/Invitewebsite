import Image, { type StaticImageData } from 'next/image';
import type { BirthDateParts, InvitationLocale } from '@/theme-sdk';
import { BLESSED, DUA, DUA_PLAIN, HAMD, HAMD_PLAIN, SON_OF } from './copy';
import styles from './design.module.css';
import storyArt from './assets/story.webp';
import cardArt from './assets/card.webp';
import roundArt from './assets/sticker-round.webp';
import squareArt from './assets/sticker-square.webp';
import bottleArt from './assets/bottle.webp';

/**
 * The owner's five designs (docs/themes/embroidered-garden/owner-designs/) with the customer's details
 * written on them. Each fills a box that is a CSS size container (the platform's box for the extras,
 * the card's own A5 box, the preview's phone box), so every size is in `cqw`/`cqh`.
 */
export type DesignData = {
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  lang: string;
  name: string;
  father: string | null;
  /** The date of birth in the customer's chosen style (one or two lines). */
  birthLines: string[] | null;
  /** The father's line runs in the direction of its «son of» word (Arabic «بن» on an English order: right to left). */
  fatherAttrs: { lang?: string; dir?: 'rtl' | 'ltr' };
};

export function designData(p: {
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  lang: string;
  fields: Partial<Record<string, string>>;
  birthDate: BirthDateParts | null;
  wording: Readonly<Record<string, string>>;
}): DesignData {
  const sonOf = p.wording.sonOf ?? SON_OF.ar;
  const base = { dir: p.dir };
  return {
    locale: p.locale,
    dir: p.dir,
    lang: p.lang,
    name: p.fields.baby_name ?? '',
    father: p.fields.father_name ? `${sonOf} ${p.fields.father_name}` : null,
    birthLines: p.birthDate?.lines ?? null,
    fatherAttrs: ownLang(sonOf, base),
  };
}

/** A line whose script differs from the design's language (Arabic wording on an English order, or the
 * reverse) gets its own `lang`/`dir`, so it is shaped and styled for its own script. */
const BLESSED_LINE = { lang: 'ar', dir: 'rtl' } as const;
function ownLang(text: string, d: { dir: 'rtl' | 'ltr' }) {
  const arabicScript = /[\u0600-\u06FF]/.test(text);
  if (arabicScript && d.dir === 'ltr') return { lang: 'ar', dir: 'rtl' as const };
  if (!arabicScript && /[A-Za-z]/.test(text) && d.dir === 'rtl') return { lang: 'en', dir: 'ltr' as const };
  return {};
}

/** Name size: `max`, but never wider than `budget` cqw (long names shrink). */
function fit(text: string, budget: number, max: string): string {
  const len = Math.max(2, [...text].length);
  const perChar = /[A-Za-z]/.test(text) ? 0.95 : 0.56; // Marhey Bold
  return `min(${max}, ${(budget / (len * perChar)).toFixed(2)}cqw)`;
}

/** The owner's artwork, filling the whole box. */
function Art({ src, stretch }: { src: StaticImageData; stretch?: boolean }) {
  return <Image src={src} alt="" aria-hidden fill unoptimized priority sizes="100vw" className={styles.art} style={stretch ? { objectFit: 'fill' } : undefined} />;
}

function Lines({ lines, className, arabic }: { lines: string[]; className?: string; arabic?: boolean }) {
  return (
    <p className={className} {...(arabic ? { lang: 'ar', dir: 'rtl' } : {})}>
      {lines.map((l, i) => (
        <span key={i} className={styles.line}>
          {l}
        </span>
      ))}
    </p>
  );
}

/** The baby's name, stitched in sage thread. */
function Name({ name, size }: { name: string; size: string }) {
  return (
    <p className={styles.name} style={{ fontSize: size }}>
      <span className={styles.thread}>{name}</span>
    </p>
  );
}

/** A small embroidered sprig either side of the date. */
function Sprig({ flip }: { flip?: boolean }) {
  return (
    <svg className={styles.sprig} viewBox="0 0 40 16" aria-hidden style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M2 8 H30" stroke="#8a9a7c" strokeWidth="1.1" strokeDasharray="2.2 1.4" fill="none" />
      <path d="M30 8 C33 3 37 3 39 5 C37 8 34 9 30 8 Z" fill="#8a9a7c" />
      <path d="M22 8 C24 4 27 3.5 29 4.5 C27 7 25 8 22 8 Z" fill="#9aab8c" />
      <path d="M22 8 C24 12 27 12.5 29 11.5 C27 9 25 8 22 8 Z" fill="#7f8f71" />
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

/** The Instagram story, or the A5 card front (same composition, the card's own artwork). */
export function StoryDesign({ d, variant }: { d: DesignData; variant: 'story' | 'card' }) {
  const story = variant === 'story';
  return (
    <div className={`${styles.root} ${story ? styles.story : styles.card}`} dir={d.dir} lang={d.lang}>
      <Art src={story ? storyArt : cardArt} />
      <Lines lines={HAMD} className={`${styles.at} ${styles.hamd}`} arabic />
      <p className={`${styles.at} ${styles.blessed}`} {...BLESSED_LINE}>
        {BLESSED}
      </p>
      <div className={`${styles.at} ${styles.nameAt}`}>
        <Name name={d.name} size={fit(d.name, 64, story ? '23cqw' : '21cqw')} />
      </div>
      {d.father ? <p className={`${styles.at} ${styles.father}`} {...d.fatherAttrs}>{d.father}</p> : null}
      <BirthDate lines={d.birthLines} className={styles.cardDate} />
      <Lines lines={DUA} className={`${styles.at} ${styles.dua}`} arabic />
    </div>
  );
}

/** One chocolate sticker, round or square (the platform clips the round one). */
export function StickerDesign({ d, round }: { d: DesignData; round: boolean }) {
  return (
    <div className={`${styles.root} ${styles.sticker} ${round ? styles.round : styles.square}`} dir={d.dir} lang={d.lang}>
      <Art src={round ? roundArt : squareArt} />
      <p className={`${styles.at} ${styles.stBlessed}`} {...BLESSED_LINE}>
        {BLESSED}
      </p>
      <div className={`${styles.at} ${styles.stName}`}>
        {/* English has two lines of wording above the name: a smaller largest size keeps them apart. */}
        <Name name={d.name} size={fit(d.name, 46, d.locale === 'en' ? '10.5cqw' : '13cqw')} />
      </div>
      {d.father ? <p className={`${styles.at} ${styles.stFather}`} {...d.fatherAttrs}>{d.father}</p> : null}
      <BirthDate lines={d.birthLines} className={styles.stDate} />
    </div>
  );
}

/** The water-bottle label: verse on the right, name in the middle, du'a on the left (as in the owner's design). */
export function BottleDesign({ d }: { d: DesignData }) {
  return (
    <div className={`${styles.root} ${styles.bottle}`} dir={d.dir} lang={d.lang}>
      <Art src={bottleArt} stretch />
      <div className={`${styles.at} ${styles.btRight}`}>
        <Lines lines={HAMD_PLAIN} className={styles.btVerse} arabic />
        <p className={`${styles.btVerse} ${styles.btBlessed}`} {...BLESSED_LINE}>
          {BLESSED}
        </p>
      </div>
      <div className={`${styles.at} ${styles.btName}`}>
        <Name name={d.name} size={fit(d.name, 24, '26cqh')} />
      </div>
      {d.father ? <p className={`${styles.at} ${styles.btFather}`} {...d.fatherAttrs}>{d.father}</p> : null}
      <BirthDate lines={d.birthLines ? [d.birthLines.join(' · ')] : null} className={styles.btDate} />
      <Lines lines={DUA_PLAIN} className={`${styles.at} ${styles.btLeft} ${styles.btVerse}`} arabic />
    </div>
  );
}
