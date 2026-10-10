import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/aref-ruqaa/700.css';
import '@fontsource-variable/noto-sans-arabic';
import type { PrintCardBackProps } from '@/theme-sdk/print';
import { invitationNames } from '@/catalog/fields';
import { FONTS, type PrintLook } from './ArtworkCard';

/**
 * The back of the printable card for themes without their own `print/CardBack.tsx`: the customer's big
 * title, their message, then the couple's names or the signatures, in the theme's colours. Landscape. The theme's
 * border (drawn with <ThemeBorder> on the front) repeats on this page by itself. Fills the page it is given.
 */
export function DefaultCardBack({ dir, lang, fields, labels, signatures, colors, title, message, look }: PrintCardBackProps & { look?: PrintLook }) {
  const ink = look?.ink ?? colors.ink ?? colors.text ?? '#3b2f2a';
  const accent = look?.accent ?? colors.accent ?? colors.primary ?? '#8a6a3b';
  const names = invitationNames(fields).join(` ${labels.and} `);
  return (
    <div
      dir={dir}
      lang={lang}
      style={{
        position: 'relative',
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        padding: '16mm 28mm',
        background: look?.paper ?? colors.paper ?? colors.background ?? '#fbf7f0',
        color: ink,
        fontFamily: look ? FONTS[look.bodyFont] : "'Noto Sans Arabic Variable', 'Noto Sans Arabic', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '5mm',
        overflow: 'hidden',
      }}
    >
      <h1 style={{ margin: 0, fontFamily: look ? FONTS[look.headingFont] : "'Aref Ruqaa', serif", fontWeight: 700, fontSize: '16mm', lineHeight: 1.15, color: accent, overflowWrap: 'anywhere' }}>{title}</h1>
      {message ? <p style={{ margin: 0, maxWidth: '140mm', fontSize: '4.4mm', lineHeight: 1.8, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{message}</p> : null}
      {signatures.length ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '8mm' }}>
          {signatures.map((sig, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- print document
            <img key={i} src={sig.src} alt="" style={{ maxWidth: signatures.length > 1 ? '46mm' : '60mm', maxHeight: '22mm', objectFit: 'contain' }} />
          ))}
        </div>
      ) : names ? (
        <p style={{ margin: 0, fontFamily: look ? FONTS[look.headingFont] : "'Aref Ruqaa', serif", fontSize: '7mm', color: accent }}>{names}</p>
      ) : null}
    </div>
  );
}
