import type { PrintCardBackProps } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import p from './print.module.css';

/**
 * Back of the A5 card, landscape (216 × 154 mm with bleed), on the owner's framed cream back (#8): the
 * customer's title and message, then the couple's names. The artwork's own frame is the border here.
 */
export default function CardBack({ dir, lang, fields, labels, title, message }: PrintCardBackProps) {
  return (
    <div className={`${fonts.fonts} ${p.back}`} dir={dir} lang={lang}>
      <div className={p.backSafe}>
        <h1 className={p.backTitle}>{title}</h1>
        {message ? <p className={p.backMessage}>{message}</p> : null}
        <span className={p.backRule} aria-hidden="true" />
        <p className={p.backNames}>
          {[fields.person_1_name, fields.person_2_name].filter(Boolean).join(` ${labels.and} `)}
        </p>
      </div>
    </div>
  );
}
