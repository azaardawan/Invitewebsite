import Image, { type StaticImageData } from 'next/image';
import type { CSSProperties } from 'react';
import type { KitProps } from '@/theme-sdk';
import styles from './kit.module.css';
import storyBg from './assets/story-bg.webp';
import bandTop from './assets/band-top.webp';
import bandBottom from './assets/band-bottom.webp';
import cornerTl from './assets/corner-tl.webp';
import cornerTr from './assets/corner-tr.webp';
import cornerBr from './assets/corner-br.webp';
import doveSmall from './assets/dove-small.webp';
import doveLarge from './assets/dove-large.webp';
import linen from './assets/linen.webp';

/**
 * The owner's fixed religious wording: always Arabic, in every kit language
 * (owner decision). Everything else that can change comes from `copy`.
 */
const HAMD = ['الحمد لله الذي جعل لنا من زينة الحياة نصيبًا', 'ومـن الذكــــور حظًّا وسنـدًا'];
const DUA = ['اللّهُمَّ أنبِتهُ نباتًا حسنًا واجعلهُ قُرّةَ عينٍ لنا', 'واجعَلـهُ صغيرًا بارًّا وكبيرًا بارًّا'];

/** Name size: as large as `max`, but never wider than `budget` (same container unit). */
function fit(text: string, budget: number, max: number, unit: 'cqw' | 'cqh'): string {
  const len = Math.max(2, [...text].length);
  // Latin letters in Marhey are wider than joined Arabic ones.
  const perChar = /[A-Za-z]/.test(text) ? 0.95 : 0.56;
  return `${Math.min(max, budget / (len * perChar)).toFixed(2)}${unit}`;
}

function Art({ src, className, style }: { src: StaticImageData; className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={style} aria-hidden>
      <Image src={src} alt="" fill unoptimized priority sizes="100vw" className={styles.img} />
    </div>
  );
}

function Verse({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <p className={className} lang="ar" dir="rtl">
      {lines.map((l, i) => (
        <span key={i} className={styles.line}>
          {l}
        </span>
      ))}
    </p>
  );
}

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

function DateLine({ lines, className }: { lines: string[] | null; className?: string }) {
  if (!lines?.length) return null;
  return (
    <div className={`${className ?? ''} ${lines.length > 1 ? styles.twoLines : ''}`}>
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

export default function EmbroideredGardenKit(props: KitProps) {
  const { fields, copy, birthDate, unit, size } = props;
  const name = fields.baby_name ?? '';
  const father = fields.father_name ? `${copy.sonOf ?? ''} ${fields.father_name}`.trim() : null;

  if (unit === 'story') {
    return (
      <div className={styles.root}>
        <Art src={storyBg} className={styles.full} />
        <div className={styles.storyCol}>
          <Verse lines={HAMD} className={styles.verse} />
          {copy.blessed ? <p className={styles.blessed}>{copy.blessed}</p> : null}
          <div className={styles.storyName}>
            <Name name={name} size={fit(name, 76, 27, 'cqw')} />
          </div>
          {father ? <p className={styles.father}>{father}</p> : null}
          <DateLine lines={birthDate} className={styles.date} />
          <Verse lines={DUA} className={styles.dua} />
        </div>
      </div>
    );
  }

  if (unit === 'card') {
    return (
      <div className={styles.root}>
        <Art src={linen} className={styles.full} />
        <Art src={bandTop} className={styles.cardTop} />
        <Art src={bandBottom} className={styles.cardBottom} />
        <Art src={doveSmall} className={styles.cardDoveA} />
        <Art src={doveLarge} className={styles.cardDoveB} />
        <div className={styles.cardText}>
          <Verse lines={HAMD} className={styles.cardVerse} />
          {copy.blessed ? <p className={styles.cardBlessed}>{copy.blessed}</p> : null}
          <Name name={name} size={fit(name, 66, 19, 'cqw')} />
          {father ? <p className={styles.cardFather}>{father}</p> : null}
          <DateLine lines={birthDate} className={styles.cardDate} />
          <Verse lines={DUA} className={styles.cardVerse} />
        </div>
      </div>
    );
  }

  if (unit === 'sticker-round' || unit === 'sticker-square') {
    const round = unit === 'sticker-round';
    return (
      <div className={`${styles.root} ${round ? styles.round : styles.square}`}>
        <Art src={linen} className={styles.full} />
        {round ? (
          <>
            <Art src={bandTop} className={styles.stTop} />
            <Art src={bandBottom} className={styles.stBottom} />
          </>
        ) : (
          <>
            <Art src={cornerTl} className={styles.sqTl} />
            <Art src={cornerBr} className={styles.sqBr} />
          </>
        )}
        <div className={styles.stRing} aria-hidden />
        <div className={styles.stText}>
          <Name name={name} size={fit(name, 58, 22, 'cqw')} />
          {father ? <p className={styles.stFather}>{father}</p> : null}
          <DateLine lines={birthDate} className={styles.stDate} />
        </div>
      </div>
    );
  }

  // Bottle wrap: art at both ends, the glued strip (right edge) left plain.
  const ratio = (size.width / size.height) * 100; // unit width in cqh
  const overlap = (size.overlap / size.height) * 100;
  const textWidth = ratio - overlap - 2 * 96;
  return (
    <div className={styles.root} style={{ '--eg-overlap': `${overlap}cqh` } as CSSProperties}>
      <Art src={linen} className={styles.full} />
      <Art src={cornerTl} className={styles.btLeft} />
      <Art src={cornerTr} className={styles.btRight} />
      <Art src={doveSmall} className={styles.btDoveA} />
      <Art src={doveLarge} className={styles.btDoveB} />
      <div className={styles.btText}>
        {copy.blessed ? <p className={styles.btBlessed}>{copy.blessed}</p> : null}
        <Name name={name} size={fit(name, textWidth * 0.8, 44, 'cqh')} />
        <div className={styles.btMeta}>
          {father ? <p className={styles.btFather}>{father}</p> : null}
          <DateLine lines={birthDate ? [birthDate.join(' · ')] : null} className={styles.btDate} />
        </div>
      </div>
    </div>
  );
}
