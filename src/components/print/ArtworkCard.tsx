import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/aref-ruqaa/700.css';
import '@fontsource-variable/noto-sans-arabic';
import '@fontsource-variable/vazirmatn';
import type React from 'react';
import type { PrintCardBackProps, PrintCardProps } from '@/theme-sdk/print';
import { invitationNames } from '@/catalog/fields';

/** One side of the owner's own card artwork (Admin → Themes → Printable card design), ready to print. */
export type ArtworkSide = {
  src: string;
  ink: string;
  accent: string;
  headingFont: 'ruqaa' | 'sans' | 'vazir';
  bodyFont: 'ruqaa' | 'sans' | 'vazir';
  align: 'top' | 'center' | 'bottom';
  insetMm: number;
  scale: number;
};

/** How the page relates to the artwork: the picture is designed with `bleedMm` on every side. */
type Sheet = { bleedMm: number; pageHasBleed: boolean };

export const FONTS = {
  ruqaa: "'Aref Ruqaa', serif",
  sans: "'Noto Sans Arabic Variable', 'Noto Sans Arabic', sans-serif",
  vazir: "'Vazirmatn Variable', 'Vazirmatn', sans-serif",
} as const;

export const JUSTIFY = { top: 'flex-start', center: 'center', bottom: 'flex-end' } as const;

/** The artwork fills the page (and its bleed); the text sits in a block inset from the trim edge. */
function Frame({ design, sheet, dir, lang, children }: { design: ArtworkSide; sheet: Sheet; dir: string; lang: string; children: React.ReactNode }) {
  const out = sheet.pageHasBleed ? 0 : sheet.bleedMm;
  const inset = design.insetMm + (sheet.pageHasBleed ? sheet.bleedMm : 0);
  return (
    <div dir={dir} lang={lang} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', color: design.ink, fontFamily: FONTS[design.bodyFont], background: design.src ? undefined : DEFAULT_PAPER }}>
      {design.src ? (
        // eslint-disable-next-line @next/next/no-img-element -- print document
        <img src={design.src} alt="" style={{ position: 'absolute', inset: `-${out}mm`, width: `calc(100% + ${2 * out}mm)`, height: `calc(100% + ${2 * out}mm)`, objectFit: 'cover' }} />
      ) : (
        <div style={{ position: 'absolute', inset: `${8 + inset / 3}mm`, border: `0.4mm solid ${design.accent}`, borderRadius: '3mm', opacity: 0.5 }} />
      )}
      <div
        style={{
          position: 'absolute',
          inset: `${inset}mm`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: JUSTIFY[design.align],
          textAlign: 'center',
          gap: `${3.5 * (design.scale / 100)}mm`,
          fontSize: `${4.2 * (design.scale / 100)}mm`,
          lineHeight: 1.7,
          overflowWrap: 'anywhere',
        }}
      >
        {children}
      </div>
    </div>
  );
}

const mm = (n: number, design: ArtworkSide) => `${n * (design.scale / 100)}mm`;

const DEFAULT_PAPER = '#fbf7f0';

/**
 * The platform's simple card front for a design without its own printable card and without the owner's
 * artwork (e.g. a newborn design): the same layout on plain paper with a thin frame, in the theme's colours.
 */
export function DefaultCardFront(p: PrintCardProps & { sheet: Sheet }) {
  const design: ArtworkSide = {
    src: '',
    ink: p.colors.ink ?? p.colors.text ?? '#3b2f2a',
    accent: p.colors.accent ?? p.colors.primary ?? '#8a6a3b',
    headingFont: 'ruqaa',
    bodyFont: 'sans',
    align: 'center',
    insetMm: 18,
    scale: 100,
  };
  return <ArtworkCardFront {...p} design={design} />;
}

/** Front of the card on the owner's artwork: names, message, date, time, venue, extra line and QR code. */
export function ArtworkCardFront({ design, sheet, ...p }: PrintCardProps & { design: ArtworkSide; sheet: Sheet }) {
  const names = invitationNames(p.fields);
  const heading: React.CSSProperties = { margin: 0, fontFamily: FONTS[design.headingFont], color: design.accent, fontWeight: 700, lineHeight: 1.2 };
  const gender = p.fields.baby_gender === 'boy' ? p.labels.itsABoy : p.fields.baby_gender === 'girl' ? p.labels.itsAGirl : null;
  const parents = [p.fields.mother_name, p.fields.father_name].filter(Boolean).join(` ${p.labels.and} `);
  const details = [
    p.birthDate ? [p.labels.bornOn, p.birthDate.full] : null,
    p.event.date ? [p.labels.date, p.event.date.full] : null,
    p.event.time ? [p.labels.time, p.event.time] : null,
    p.fields.venue_name ? [p.labels.venue, p.fields.venue_name] : null,
  ].filter((d): d is [string, string] => !!d);
  return (
    <Frame design={design} sheet={sheet} dir={p.dir} lang={p.lang}>
      {gender ? <p style={{ margin: 0, color: design.accent, fontWeight: 600 }}>{gender}</p> : null}
      {names.length ? (
        <h1 style={{ ...heading, fontSize: mm(names.length > 1 ? 11 : 13, design) }}>
          {names.length > 1 ? (
            <>
              {names[0]}
              <span style={{ display: 'block', fontSize: '0.55em', fontWeight: 400 }}>{p.labels.and}</span>
              {names[1]}
            </>
          ) : (
            names[0]
          )}
        </h1>
      ) : null}
      {p.fields.invitation_message ? <p style={{ margin: 0, maxWidth: '110mm', whiteSpace: 'pre-line' }}>{p.fields.invitation_message}</p> : null}
      {p.fields.baby_quote ? <p style={{ margin: 0, maxWidth: '110mm', fontStyle: 'italic' }}>{p.fields.baby_quote}</p> : null}
      {parents ? <p style={{ ...heading, fontSize: mm(6, design), fontWeight: 400 }}>{parents}</p> : null}
      {details.length ? (
        <dl style={{ margin: 0, display: 'grid', gap: mm(1.5, design) }}>
          {details.map(([label, value]) => (
            <div key={label}>
              <dt style={{ fontSize: '0.8em', color: design.accent }}>{label}</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {p.extraLine ? <p style={{ margin: 0, fontWeight: 600 }}>{p.extraLine}</p> : null}
      {p.qrDataUrl ? (
        <figure style={{ margin: 0, display: 'grid', justifyItems: 'center', gap: '1.5mm' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print document, data URL */}
          <img src={p.qrDataUrl} alt="" style={{ width: '22mm', height: '22mm', background: '#fff', padding: '1.5mm' }} />
          <figcaption style={{ fontSize: '0.7em' }}>{p.labels.scanToOpen}</figcaption>
        </figure>
      ) : null}
    </Frame>
  );
}

/** Back of the card on the owner's artwork: the big title, the message, then the signatures or names. */
export function ArtworkCardBack({ design, sheet, ...p }: PrintCardBackProps & { design: ArtworkSide; sheet: Sheet }) {
  const names = invitationNames(p.fields).join(` ${p.labels.and} `);
  return (
    <Frame design={design} sheet={sheet} dir={p.dir} lang={p.lang}>
      <h1 style={{ margin: 0, fontFamily: FONTS[design.headingFont], color: design.accent, fontWeight: 700, fontSize: mm(16, design), lineHeight: 1.15 }}>{p.title}</h1>
      {p.message ? <p style={{ margin: 0, maxWidth: '140mm', whiteSpace: 'pre-line' }}>{p.message}</p> : null}
      {p.signatures.length ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '8mm' }}>
          {p.signatures.map((sig, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- print document
            <img key={i} src={sig.src} alt="" style={{ maxWidth: p.signatures.length > 1 ? '46mm' : '60mm', maxHeight: '22mm', objectFit: 'contain' }} />
          ))}
        </div>
      ) : names ? (
        <p style={{ margin: 0, fontFamily: FONTS[design.headingFont], fontSize: mm(7, design), color: design.accent }}>{names}</p>
      ) : null}
    </Frame>
  );
}
