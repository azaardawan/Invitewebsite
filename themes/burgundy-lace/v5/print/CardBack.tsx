import { Signature, type PrintCardBackProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import { LaceFrame } from './LaceFrame';
import p from './print.module.css';

/** Back of the A5 card, landscape: the customer's title and message, then the names (or signatures), in the same lace frame. */
export default function CardBack({ locale, dir, lang, fields, labels, title, message, signatures, border }: PrintCardBackProps) {
  return (
    <div className={`${fonts.fonts} ${p.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <LaceFrame border={border} />
      <div className={p.backSafe}>
        <h1 className={p.backTitle}>{title}</h1>
        {message ? <p className={p.backMessage}>{message}</p> : null}
        <div className={p.rule} aria-hidden="true">
          <span />
        </div>
        {signatures.length ? (
          <Signature signatures={signatures} className={p.backSignature} />
        ) : (
          <p className={p.backNames}>{[fields.person_1_name, fields.person_2_name].filter(Boolean).join(` ${labels.and} `)}</p>
        )}
      </div>
    </div>
  );
}
