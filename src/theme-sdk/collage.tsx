import type { CSSProperties, ReactNode } from 'react';
import { COLLAGE_KINDS } from '@/catalog/collages';
import { Photo } from './photo';
import type { InvitationLocale, ThemePhoto } from './types';
import polaroidsArt from './collages/polaroids.webp';
import polaroidsTop from './collages/polaroids-top.webp';
import storyArt from './collages/story.webp';
import storyTop from './collages/story-top.webp';
import wallArt from './collages/wall.webp';
import wallTop from './collages/wall-top.webp';

/**
 * Photo collages (features `collage_polaroids`, `collage_story`, `collage_wall`): the customer's photos placed in one
 * of three designs from the owner's artwork, with the lettering written again in the invitation's language. A design
 * can draw them in its own fonts with `print/Collage.tsx` (render `<Collage>` with `fonts`); otherwise the platform
 * draws them in its own. Each collage is drawn in its artwork's own box (`COLLAGES[kind].width` × `height` CSS px,
 * a size container) and pictured at print size by the platform, which adds the watermark before payment.
 */
export type CollageKind = 'polaroids' | 'story' | 'wall';

/** A photo's place: its box in the artwork's units and its tilt (degrees). */
type Frame = { x: number; y: number; w: number; h: number; rot: number };

/**
 * The three designs: their size, their photo places (the first is the largest) and the output picture. Photos fill
 * the places in order; with fewer photos than places they repeat, so a collage never shows an empty frame.
 */
export const COLLAGES: Record<CollageKind, { width: number; height: number; photos: number; frames: readonly Frame[]; art: string; top: string; ink: string }> =
  {
    // A3 poster: «Happy Birthday» in script, three polaroids, the cake drawing and the message.
    polaroids: {
      width: 842.25,
      height: 1190.25,
      photos: COLLAGE_KINDS.polaroids.photos,
      frames: [
        { x: 191.7, y: 445.3, w: 302, h: 289.4, rot: 3 },
        { x: 534.3, y: 394.2, w: 131.1, h: 125.8, rot: 3 },
        { x: 506.5, y: 578.8, w: 139.1, h: 237.7, rot: 3 },
      ],
      art: polaroidsArt.src,
      top: polaroidsTop.src,
      ink: '#3c3333',
    },
    // Instagram story (9:16): «HAPPY Birthday!», four photos and a note with their name.
    story: {
      width: 810,
      height: 1440,
      photos: COLLAGE_KINDS.story.photos,
      frames: [
        { x: 126.5, y: 338.5, w: 388, h: 399, rot: 0 },
        { x: 484.5, y: 419.5, w: 175, h: 253, rot: 0 },
        { x: 318.5, y: 737.5, w: 385, h: 560, rot: 0 },
        { x: 68.5, y: 971.5, w: 197, h: 293, rot: 0 },
      ],
      art: storyArt.src,
      top: storyTop.src,
      ink: '#524238',
    },
    // Photo wall (4 × 6 print): eight photos in a grid and a polaroid in the middle, «HAPPY BIRTHDAY» under it.
    wall: {
      width: 567,
      height: 850.5,
      photos: COLLAGE_KINDS.wall.photos,
      frames: [
        { x: 164.8, y: 273.4, w: 238.6, h: 253.3, rot: 2.75 },
        { x: 0, y: 0, w: 180, h: 276, rot: 0 },
        { x: 187.5, y: 0, w: 191, h: 276, rot: 0 },
        { x: 385.5, y: 0, w: 181.5, h: 276, rot: 0 },
        { x: 0, y: 283.5, w: 180, h: 284, rot: 0 },
        { x: 385.5, y: 283.5, w: 181.5, h: 284, rot: 0 },
        { x: 0, y: 575.5, w: 180, h: 275, rot: 0 },
        { x: 187.5, y: 575.5, w: 191, h: 275, rot: 0 },
        { x: 385.5, y: 575.5, w: 181.5, h: 275, rot: 0 },
      ],
      art: wallArt.src,
      top: wallTop.src,
      ink: '#452e1d',
    },
  };

/** The collages' lettering in the invitation's language (platform messages, `print.collage`). */
export type CollageText = {
  /** The poster's two script lines: «Happy» / «Birthday». */
  headingTop: string;
  headingBottom: string;
  /** The story's small capitals and big script: «HAPPY» / «Birthday!». */
  kicker: string;
  title: string;
  /** Under the wall's polaroid: «HAPPY BIRTHDAY». */
  caption: string;
  /** The poster's message when the customer wrote none. */
  wish: string;
};

/** The typefaces a design draws its collages in: one set for Latin, one for Arabic and Kurdish. */
export type CollageFonts = { script: string; display: string; body: string };

export type PrintCollageProps = {
  kind: CollageKind;
  locale: InvitationLocale;
  dir: 'rtl' | 'ltr';
  lang: string;
  /** The customer's photos, full size, in order (may be fewer than the collage's places, or none in samples). */
  photos: ThemePhoto[];
  /** The birthday person's name, or null. */
  name: string | null;
  /** The customer's own message (the invitation's), or null. */
  message: string | null;
  /** Their day, as the invitation writes it (e.g. «11 December»), or null. */
  date: string | null;
  text: CollageText;
};

const PLATFORM_FONTS: { latin: CollageFonts; arabic: CollageFonts } = {
  latin: { script: "'Aref Ruqaa', serif", display: "'Vazirmatn Variable', 'Vazirmatn', sans-serif", body: "'Vazirmatn Variable', 'Vazirmatn', sans-serif" },
  arabic: {
    script: "'Aref Ruqaa', serif",
    display: "'Vazirmatn Variable', 'Vazirmatn', sans-serif",
    body: "'Noto Sans Arabic Variable', 'Noto Sans Arabic', sans-serif",
  },
};

const ARABIC = /[؀-ۿ]/;

/** One collage. `fonts`: the design's typefaces (left out: the platform's). */
export function Collage({ fonts, ...p }: PrintCollageProps & { fonts?: { latin: CollageFonts; arabic: CollageFonts } }) {
  const c = COLLAGES[p.kind];
  const arabic = p.locale !== 'en';
  const f = (fonts ?? PLATFORM_FONTS)[arabic ? 'arabic' : 'latin'];
  // Lengths in the artwork's units, as a share of the box (it is a size container).
  const X = (v: number) => `${(v / c.width) * 100}cqw`;
  const pos = (x: number, y: number, w: number, h: number): CSSProperties => ({ position: 'absolute', left: X(x), top: X(y), width: X(w), height: X(h) });
  const text = (style: CSSProperties, children: ReactNode, key?: string) => (
    <div key={key} dir={p.dir} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', color: c.ink, overflowWrap: 'anywhere', ...style }}>
      {children}
    </div>
  );
  const photo = (i: number) => (p.photos.length ? p.photos[i % p.photos.length]! : null);
  // A name written in Latin letters on an Arabic collage (or the other way round) keeps its own script's font.
  const nameFont = (name: string) => (ARABIC.test(name) === arabic ? f.body : (fonts ?? PLATFORM_FONTS)[ARABIC.test(name) ? 'arabic' : 'latin'].body);

  return (
    <div
      lang={p.lang}
      data-collage={p.kind}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        containerType: 'size',
        background: `#f6f1ea url(${c.art}) center / 100% 100% no-repeat`,
      }}
    >
      {c.frames.map((fr, i) => {
        const ph = photo(i);
        const box: CSSProperties = { ...pos(fr.x, fr.y, fr.w, fr.h), transform: fr.rot ? `rotate(${fr.rot}deg)` : undefined };
        return ph ? (
          <Photo key={i} photo={ph} eager style={box} />
        ) : (
          // A sample without photos: a soft empty frame.
          <div key={i} style={{ ...box, background: 'linear-gradient(150deg, #e9e1d6, #d9cfc2)' }} />
        );
      })}
      {/* What the artwork draws over the photos (the story's flowers and tape, the wall's polaroid frame). */}
      {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
      <img src={c.top} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {p.kind === 'polaroids' ? (
        <>
          {/* Latin: the designer's two script lines, the second set in; Arabic and Kurdish: centred under each other, clear of the doodle. */}
          {text(
            arabic
              ? { ...pos(60, 80, 540, 330), fontFamily: f.script, lineHeight: 1.5, textAlign: 'center', alignItems: 'center' }
              : { ...pos(50, 70, 660, 330), fontFamily: f.script, lineHeight: 1.05, textAlign: 'start' },
            <>
              <span style={{ fontSize: X(arabic ? 100 : 160) }}>{p.text.headingTop}</span>
              <span style={{ fontSize: X(arabic ? 100 : 160), paddingInlineStart: arabic ? 0 : X(120) }}>{p.text.headingBottom}</span>
            </>,
          )}
          {text(
            { ...pos(405, 890, 340, 180), fontFamily: f.body, textAlign: 'center', alignItems: 'center', gap: X(14) },
            <>
              <span style={{ fontSize: X((p.message ?? p.text.wish).length > 90 ? 19 : 25), lineHeight: 1.35 }}>{clip(p.message ?? p.text.wish, 160)}</span>
              {p.name || p.date ? (
                <span style={{ fontSize: X(14), fontWeight: 700, letterSpacing: arabic ? 0 : X(1), fontFamily: p.name ? nameFont(p.name) : f.body }}>
                  {[p.name, p.date].filter(Boolean).join(' · ')}
                </span>
              ) : null}
            </>,
          )}
        </>
      ) : null}

      {p.kind === 'story' ? (
        <>
          {text(
            { ...pos(205, 110, 400, 90), fontFamily: f.display, fontWeight: 700, textAlign: 'center', alignItems: 'center' },
            <span style={{ fontSize: X(arabic ? 52 : 64), letterSpacing: arabic ? 0 : X(4) }}>{p.text.kicker}</span>,
          )}
          {text(
            { ...pos(90, arabic ? 175 : 190, 630, 150), fontFamily: f.script, fontWeight: 700, textAlign: 'center', alignItems: 'center' },
            <span style={{ fontSize: X(arabic ? 96 : 150), lineHeight: 1 }}>{p.text.title}</span>,
          )}
          {p.name || p.date
            ? text(
                { ...pos(70, 760, 225, 150), fontFamily: f.body, textAlign: 'center', alignItems: 'center', gap: X(8) },
                <>
                  {p.name ? <span style={{ fontSize: X(p.name.length > 14 ? 30 : 42), lineHeight: 1.1, fontFamily: nameFont(p.name) }}>{p.name}</span> : null}
                  {p.date ? <span style={{ fontSize: X(20) }}>{p.date}</span> : null}
                </>,
              )
            : null}
        </>
      ) : null}

      {p.kind === 'wall'
        ? text(
            { ...pos(170, 528, 228, 46), transform: 'rotate(2.75deg)', fontFamily: f.display, fontWeight: 700, textAlign: 'center', alignItems: 'center' },
            <span style={{ fontSize: X(arabic ? 24 : 26), letterSpacing: arabic ? 0 : X(1.5), whiteSpace: 'nowrap' }}>{p.text.caption}</span>,
          )
        : null}
    </div>
  );
}

/** A long message, shortened to fit the poster's space (at a word). */
function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).trimEnd()}…`;
}
