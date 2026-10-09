import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/aref-ruqaa/700.css';
import '@fontsource-variable/noto-sans-arabic';
import '@fontsource-variable/vazirmatn';
import type React from 'react';
import { FONTS, JUSTIFY, type ArtworkSide } from './ArtworkCard';

/**
 * Newborn extras, drawn by the platform on the owner's artwork (Admin → Themes → Newborn extras design) or,
 * without artwork, on a simple soft design in the baby's colours: the Instagram story, the chocolate sticker
 * (round or square) and the label that wraps around a water bottle, each alone or as a print-ready A4 sheet.
 * Until the invitation is paid every one of them carries a watermark (drawn here, on the server's render).
 */
export type ProductData = {
  dir: 'rtl' | 'ltr';
  lang: string;
  babyName: string | null;
  gender: 'boy' | 'girl' | null;
  parents: string | null;
  birthDate: string | null;
  quote: string | null;
  labels: { itsABoy: string; itsAGirl: string; bornOn: string; watermark: string; watermarkNote: string };
  design: { story: ArtworkSide | null; sticker: ArtworkSide | null; bottle: ArtworkSide | null };
  stickerShape: 'round' | 'square';
  watermark: boolean;
};

/** Sizes in mm (story in CSS px). A 4 cm sticker suits chocolates; the label wraps a 0.5 L bottle (≈ 21 cm round). */
export const PRODUCT_SIZES = {
  story: { width: 1080, height: 1920 },
  sticker: { mm: 40, gapMm: 4 },
  bottle: { width: 215, height: 55, gapMm: 6 },
} as const;

const SOFT = {
  boy: { paper: '#eaf2fb', ink: '#29435f', accent: '#3d6fa3' },
  girl: { paper: '#fbecf2', ink: '#5a2d40', accent: '#b04a73' },
  none: { paper: '#f7f0e6', ink: '#3b2f2a', accent: '#8a6a3b' },
} as const;

/** The owner's artwork style, or the soft default in the baby's colours. */
function look(design: ArtworkSide | null, gender: ProductData['gender'], fallbackInset: number) {
  const soft = SOFT[gender ?? 'none'];
  return design
    ? { src: design.src, paper: 'transparent', ink: design.ink, accent: design.accent, heading: FONTS[design.headingFont], body: FONTS[design.bodyFont], align: design.align, inset: design.insetMm, scale: design.scale / 100 }
    : { src: null, paper: soft.paper, ink: soft.ink, accent: soft.accent, heading: FONTS.ruqaa, body: FONTS.sans, align: 'center' as const, inset: fallbackInset, scale: 1 };
}

/** Repeated diagonal "preview" marks and a ribbon saying they go away after purchase. */
export function Watermark({ labels, compact = false }: { labels: ProductData['labels']; compact?: boolean }) {
  const text = labels.watermark.replace(/[<&>]/g, '');
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="160"><text x="130" y="85" text-anchor="middle" font-family="Noto Sans Arabic, sans-serif" font-size="26" font-weight="700" fill="rgba(80,40,50,0.22)" transform="rotate(-28 130 80)">${text}</text></svg>`;
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tile)}")`, backgroundSize: compact ? '34% auto' : '260px auto' }} />
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          // Low on the picture, so the name stays readable in the preview.
          bottom: compact ? '9%' : '7%',
          background: 'rgba(43,26,30,0.72)',
          color: '#fff',
          textAlign: 'center',
          fontFamily: FONTS.sans,
          fontWeight: 700,
          fontSize: compact ? '7%' : undefined,
          padding: compact ? '1.5% 3%' : '0.6em 1em',
          lineHeight: 1.4,
        }}
      >
        {labels.watermarkNote}
      </div>
    </div>
  );
}

function Background({ src, paper }: { src: string | null; paper: string }) {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: paper }} />
      {/* eslint-disable-next-line @next/next/no-img-element -- print document */}
      {src ? <img src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
    </>
  );
}

/** The Instagram story (1080 × 1920): "It's a boy/girl", the name, the date, the parents and the quote. */
export function StoryPage({ d }: { d: ProductData }) {
  const l = look(d.design.story, d.gender, 0);
  const s = l.scale;
  const pad = d.design.story ? `${d.design.story.insetMm * 4}px` : '140px 110px';
  return (
    <div dir={d.dir} lang={d.lang} style={{ position: 'relative', width: PRODUCT_SIZES.story.width, height: PRODUCT_SIZES.story.height, overflow: 'hidden', color: l.ink, fontFamily: l.body }}>
      <Background src={l.src} paper={l.paper} />
      {!l.src ? <SoftDecor accent={l.accent} /> : null}
      <div style={{ position: 'absolute', inset: 0, padding: pad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: JUSTIFY[l.align], textAlign: 'center', gap: 36 * s }}>
        {d.gender ? <p style={{ margin: 0, fontSize: 52 * s, color: l.accent, fontWeight: 600 }}>{d.gender === 'boy' ? d.labels.itsABoy : d.labels.itsAGirl}</p> : null}
        {d.babyName ? <h1 style={{ margin: 0, fontFamily: l.heading, fontWeight: 700, fontSize: 190 * s, lineHeight: 1.15, color: l.accent, overflowWrap: 'anywhere' }}>{d.babyName}</h1> : null}
        {d.birthDate ? (
          <p style={{ margin: 0, fontSize: 46 * s }}>
            <span style={{ display: 'block', fontSize: '0.7em', opacity: 0.8 }}>{d.labels.bornOn}</span>
            {d.birthDate}
          </p>
        ) : null}
        {d.parents ? <p style={{ margin: 0, fontFamily: l.heading, fontSize: 64 * s, color: l.accent }}>{d.parents}</p> : null}
        {d.quote ? <p style={{ margin: 0, maxWidth: 820, fontSize: 48 * s, lineHeight: 1.6, fontStyle: 'italic' }}>{d.quote}</p> : null}
      </div>
      {d.watermark ? <Watermark labels={d.labels} /> : null}
    </div>
  );
}

/** One chocolate sticker (40 mm, round or square): the name and the date. */
export function Sticker({ d, cutLine = false }: { d: ProductData; cutLine?: boolean }) {
  const l = look(d.design.sticker, d.gender, 4);
  const size = PRODUCT_SIZES.sticker.mm;
  const round = d.stickerShape === 'round';
  return (
    <div
      dir={d.dir}
      lang={d.lang}
      style={{
        position: 'relative',
        width: `${size}mm`,
        height: `${size}mm`,
        borderRadius: round ? '50%' : '3mm',
        overflow: 'hidden',
        color: l.ink,
        fontFamily: l.body,
        outline: cutLine ? '0.2mm solid #c9c2bd' : undefined,
        outlineOffset: '-0.1mm',
      }}
    >
      <Background src={l.src} paper={l.paper} />
      {!l.src ? <div style={{ position: 'absolute', inset: '1.6mm', borderRadius: round ? '50%' : '2mm', border: `0.35mm solid ${l.accent}`, opacity: 0.6 }} /> : null}
      <div style={{ position: 'absolute', inset: `${(round ? 6 : 4) + (d.design.sticker ? 0 : 0)}mm`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.8mm' }}>
        {d.babyName ? <p style={{ margin: 0, fontFamily: l.heading, fontWeight: 700, fontSize: `${7.2 * l.scale}mm`, lineHeight: 1.1, color: l.accent, overflowWrap: 'anywhere' }}>{d.babyName}</p> : null}
        {d.birthDate ? <p style={{ margin: 0, fontSize: `${2.4 * l.scale}mm`, lineHeight: 1.3 }}>{d.birthDate}</p> : null}
      </div>
      {d.watermark ? <Watermark labels={d.labels} compact /> : null}
    </div>
  );
}

/** An A4 sheet of stickers (4 × 6 = 24) with light cut lines, at their real size. */
export function StickerSheet({ d }: { d: ProductData }) {
  const { mm, gapMm } = PRODUCT_SIZES.sticker;
  const cols = 4;
  const rows = 6;
  return (
    <div style={{ width: '210mm', height: '297mm', position: 'relative', display: 'grid', placeContent: 'center', gridTemplateColumns: `repeat(${cols}, ${mm}mm)`, gridAutoRows: `${mm}mm`, gap: `${gapMm}mm` }}>
      {Array.from({ length: cols * rows }, (_, i) => (
        <Sticker key={i} d={{ ...d, watermark: false }} cutLine />
      ))}
      {d.watermark ? <Watermark labels={d.labels} /> : null}
    </div>
  );
}

/** One water bottle label (215 × 55 mm, wraps a 0.5 L bottle with a small overlap). */
export function BottleLabel({ d, cutLine = false }: { d: ProductData; cutLine?: boolean }) {
  const l = look(d.design.bottle, d.gender, 6);
  const { width, height } = PRODUCT_SIZES.bottle;
  return (
    <div
      dir={d.dir}
      lang={d.lang}
      style={{ position: 'relative', width: `${width}mm`, height: `${height}mm`, overflow: 'hidden', color: l.ink, fontFamily: l.body, outline: cutLine ? '0.2mm solid #c9c2bd' : undefined, outlineOffset: '-0.1mm' }}
    >
      <Background src={l.src} paper={l.paper} />
      {!l.src ? <div style={{ position: 'absolute', inset: '2.5mm', border: `0.35mm solid ${l.accent}`, borderRadius: '2mm', opacity: 0.55 }} /> : null}
      {/* The middle third faces out once wrapped; the ends overlap at the back. */}
      <div style={{ position: 'absolute', insetBlock: `${l.inset}mm`, insetInline: '45mm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: JUSTIFY[l.align], textAlign: 'center', gap: '1.2mm' }}>
        {d.babyName ? <p style={{ margin: 0, fontFamily: l.heading, fontWeight: 700, fontSize: `${11 * l.scale}mm`, lineHeight: 1.1, color: l.accent, overflowWrap: 'anywhere' }}>{d.babyName}</p> : null}
        {d.quote ? <p style={{ margin: 0, fontSize: `${3.2 * l.scale}mm`, lineHeight: 1.4 }}>{d.quote}</p> : null}
        <p style={{ margin: 0, fontSize: `${2.8 * l.scale}mm`, opacity: 0.9 }}>{[d.birthDate, d.parents].filter(Boolean).join(' · ')}</p>
      </div>
      {d.watermark ? <Watermark labels={d.labels} compact /> : null}
    </div>
  );
}

/** An A4 landscape sheet of three labels with light cut lines, at their real size. */
export function BottleSheet({ d }: { d: ProductData }) {
  return (
    <div style={{ width: '297mm', height: '210mm', position: 'relative', display: 'grid', placeContent: 'center', gap: `${PRODUCT_SIZES.bottle.gapMm}mm` }}>
      {[0, 1, 2].map((i) => (
        <BottleLabel key={i} d={{ ...d, watermark: false }} cutLine />
      ))}
      {d.watermark ? <Watermark labels={d.labels} /> : null}
    </div>
  );
}

/** Soft circles for the default story design (no artwork). */
function SoftDecor({ accent }: { accent: string }) {
  const circle = (style: React.CSSProperties) => <div style={{ position: 'absolute', borderRadius: '50%', background: accent, opacity: 0.08, ...style }} />;
  return (
    <>
      {circle({ width: 700, height: 700, top: -260, insetInlineEnd: -260 })}
      {circle({ width: 520, height: 520, bottom: -180, insetInlineStart: -200 })}
      <div style={{ position: 'absolute', inset: 48, border: `3px solid ${accent}`, borderRadius: 40, opacity: 0.35 }} />
    </>
  );
}
