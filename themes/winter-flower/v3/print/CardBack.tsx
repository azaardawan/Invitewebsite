import { Signature, ThemeBorder, type PrintCardBackProps } from '@/theme-sdk';
import { RULE_BORDER } from '../border';
import fonts from '../fonts.module.css';
import flourish from '../assets/flourish.webp';
import { Flowers } from './Flowers';
import p from './print.module.css';

/** Back of the A5 card, landscape: the customer's title and message, then the names (or signatures). */
export default function CardBack({ locale, dir, lang, fields, labels, title, message, signatures, border }: PrintCardBackProps) {
  return (
    <div className={`${fonts.fonts} ${p.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <ThemeBorder border={border} fallback={RULE_BORDER} medium="print" />
      <Flowers />
      <div className={p.backSafe}>
        <h1 className={p.backTitle}>{title}</h1>
        {message ? <p className={p.backMessage}>{message}</p> : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
        <img className={p.flourish} src={flourish.src} alt="" />
        {signatures.length ? (
          <Signature signatures={signatures} className={p.backSignature} />
        ) : (
          <p className={p.backNames}>{[fields.person_1_name, fields.person_2_name].filter(Boolean).join(` ${labels.and} `)}</p>
        )}
      </div>
    </div>
  );
}
