import { Signature, ThemeBorder, type PrintCardBackProps } from '@/theme-sdk';
import { GOLD_BORDER } from '../border';
import fonts from '../fonts.module.css';
import rosesBottom from '../assets/roses-bottom.webp';
import laurel from '../assets/laurel-cap.webp';
import p from './print.module.css';

/** Back of the A5 card, landscape: the customer's title and message under the laurel, then the graduate's name. */
export default function CardBack({ locale, dir, lang, fields, title, message, signatures, border }: PrintCardBackProps) {
  return (
    <div className={`${fonts.fonts} ${p.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <ThemeBorder border={border} fallback={GOLD_BORDER} medium="print" />
      {/* eslint-disable @next/next/no-img-element -- print artwork */}
      <img className={p.backRoses} src={rosesBottom.src} alt="" />
      <div className={p.backSafe}>
        <img className={p.backLaurel} src={laurel.src} alt="" />
        {/* eslint-enable @next/next/no-img-element */}
        <h1 className={p.backTitle}>{title}</h1>
        {message ? <p className={p.backMessage}>{message}</p> : null}
        <span className={p.rule} />
        {signatures.length ? (
          <Signature signatures={signatures} className={p.backSignature} />
        ) : fields.person_1_name ? (
          <p className={p.backName}>{fields.person_1_name}</p>
        ) : null}
      </div>
    </div>
  );
}
