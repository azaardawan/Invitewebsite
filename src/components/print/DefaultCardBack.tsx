import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/aref-ruqaa/700.css';
import '@fontsource-variable/noto-sans-arabic';
import type { PrintCardBackProps } from '@/theme-sdk/print';

/**
 * The back of the printable card for themes without their own `print/CardBack.tsx`: the customer's big
 * title, their message, then the couple's names or the signature, in the theme's colours. The theme's
 * border (drawn with <ThemeBorder> on the front) repeats on this page by itself. Fills the page it is given.
 */
export function DefaultCardBack({ dir, lang, fields, labels, signature, colors, title, message }: PrintCardBackProps) {
  const ink = colors.ink ?? colors.text ?? '#3b2f2a';
  const accent = colors.accent ?? colors.primary ?? '#8a6a3b';
  const names = [fields.person_1_name, fields.person_2_name].filter(Boolean).join(` ${labels.and} `);
  return (
    <div
      dir={dir}
      lang={lang}
      style={{
        position: 'relative',
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        padding: '24mm 20mm',
        background: colors.paper ?? colors.background ?? '#fbf7f0',
        color: ink,
        fontFamily: "'Noto Sans Arabic Variable', 'Noto Sans Arabic', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '7mm',
        overflow: 'hidden',
      }}
    >
      <h1 style={{ margin: 0, fontFamily: "'Aref Ruqaa', serif", fontWeight: 700, fontSize: '19mm', lineHeight: 1.15, color: accent, overflowWrap: 'anywhere' }}>{title}</h1>
      {message ? <p style={{ margin: 0, maxWidth: '100mm', fontSize: '4.6mm', lineHeight: 1.8, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{message}</p> : null}
      {signature ? (
        // eslint-disable-next-line @next/next/no-img-element -- print document
        <img src={signature.src} alt="" style={{ maxWidth: '60mm', maxHeight: '22mm', objectFit: 'contain' }} />
      ) : names ? (
        <p style={{ margin: 0, fontFamily: "'Aref Ruqaa', serif", fontSize: '7mm', color: accent }}>{names}</p>
      ) : null}
    </div>
  );
}
