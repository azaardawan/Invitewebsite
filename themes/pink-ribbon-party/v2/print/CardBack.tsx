import { ThemeBorder, type PrintCardBackProps } from '@/theme-sdk';
import { BOW_BORDER } from '../border';
import fonts from '../fonts.module.css';
import mark from '../assets/bow.svg';
import { Words } from './Words';
import p from './print.module.css';

/** Back of the A5 card, landscape: the design's bow over one centred column with the customer's words and the QR code. */
export default function CardBack(props: PrintCardBackProps) {
  const { locale, dir, lang, border } = props;
  return (
    <div className={`${fonts.fonts} ${p.back}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      <div className={p.column}>
        {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
        <img className={p.mark} src={mark.src} alt="" />
        <Words {...props} />
      </div>
      {border ? <ThemeBorder border={border} fallback={BOW_BORDER} medium="print" /> : null}
    </div>
  );
}
