import { Signature, ThemeBorder, type PrintCardBackProps } from '@/theme-sdk';
import { LACE_BORDER } from '../border';
import fonts from '../fonts.module.css';
import rose from '../assets/rose.webp';
import p from './print.module.css';

/** Back of the A5 card, landscape: the poster's paper and lace, the customer's title and message, then the names. */
export default function CardBack({ locale, dir, lang, fields, labels, title, message, signatures, border }: PrintCardBackProps) {
  return (
    <div className={`${fonts.fonts} ${p.back} ${p.paper}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <ThemeBorder border={border} fallback={LACE_BORDER} medium="print" />
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.rose} src={rose.src} alt="" />
      <div className={p.backSafe}>
        <h1 className={p.backTitle}>{title}</h1>
        {message ? <p className={p.backMessage}>{message}</p> : null}
        {signatures.length ? (
          <Signature signatures={signatures} className={p.backSignature} />
        ) : (
          <p className={p.backNames}>{[fields.person_1_name, fields.person_2_name].filter(Boolean).join(` ${labels.and} `)}</p>
        )}
      </div>
    </div>
  );
}
