import { ThemeBorder, type PrintCardProps } from '@/theme-sdk';
import { BOW_BORDER } from '../border';
import fonts from '../fonts.module.css';
import posterEn from '../assets/poster-en.webp';
import posterLocal from '../assets/poster-local.webp';
import { Lettering } from './Lettering';
import p from './print.module.css';

/**
 * Printable invitation, A5 portrait: the poster itself, as it stands once opened (the designer's artwork pictured from
 * the scene), with the customer's lines set as on the invitation in the design's fonts. The QR code is on the back.
 */
export default function Card(props: PrintCardProps) {
  const { locale, dir, lang, border } = props;
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang} data-script={locale === 'en' ? 'latin' : 'arabic'}>
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.poster} src={(locale === 'en' ? posterEn : posterLocal).src} alt="" />
      <svg className={p.poster} viewBox="0 0 297.75 419.25" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Lettering {...props} />
      </svg>
      {border ? <ThemeBorder border={border} fallback={BOW_BORDER} medium="print" /> : null}
    </div>
  );
}
