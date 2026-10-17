import { Signature, ThemeBorder, type PrintCardBackProps } from '@/theme-sdk';
import { BOTANICAL_BORDER } from '../border';
import fonts from '../fonts.module.css';
import spray from '../assets/ivory-spray.webp';
import p from './print.module.css';

/** Back of the A5 card, landscape: the customer's title and message, then the graduate's name (or signature). */
export default function CardBack({ locale, dir, lang, fields, title, message, signatures, border }: PrintCardBackProps) {
  return (
    <div className={`${fonts.fonts} ${p.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <ThemeBorder border={border} fallback={BOTANICAL_BORDER} medium="print" />
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.backFlowers} src={spray.src} alt="" />
      <div className={p.backSafe}>
        <h1 className={p.backTitle}>{title}</h1>
        {message ? <p className={p.backMessage}>{message}</p> : null}
        <div className={p.rule} aria-hidden="true" />
        {signatures.length ? (
          <Signature signatures={signatures} className={p.backSignature} />
        ) : fields.person_1_name ? (
          <p className={p.backName}>{fields.person_1_name}</p>
        ) : null}
      </div>
    </div>
  );
}
