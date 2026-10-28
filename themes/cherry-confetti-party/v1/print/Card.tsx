import { ThemeBorder, type PrintCardProps } from '@/theme-sdk';
import { BOW_BORDER } from '../border';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import { PosterLine, posterDetails } from '../poster';
import poster from '../assets/poster.webp';
import p from './print.module.css';

/**
 * Printable invitation, A5 portrait: the poster itself, as it stands once opened (the designer's artwork pictured from
 * the scene), with the customer's lines set as on the invitation in the design's fonts. The QR code is on the back.
 */
export default function Card({ locale, dir, lang, fields, event, extraLine, border }: PrintCardProps) {
  const t = copyFor(locale);
  const local = locale !== 'en';
  const name = fields.person_1_name?.trim() ?? '';
  const venue = fields.venue_name?.trim() ?? '';
  const fill = (text: string) => text.replace('{name}', name);
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang} data-script={local ? 'arabic' : 'latin'}>
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.poster} src={poster.src} alt="" />
      <svg className={p.poster} viewBox="0 0 297.75 419.25" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <PosterLine text={t.posterEyebrow} y={211} size={6.8} max={150} kind="serif" track={0.5} />
        <PosterLine text={fill(t.posterBig)} y={268} size={53} max={185} kind="script" />
        <PosterLine text={fill(t.posterSmall)} y={312} size={29} max={185} kind="script" />
        <PosterLine text={posterDetails(event.date, event.time, t.posterSoon)} y={352} size={11} max={208} kind="serif" track={0.6} />
        {venue ? <PosterLine text={venue} y={383} size={6.7} max={170} kind="serif" track={0.55} /> : null}
        {extraLine ? <PosterLine text={extraLine} y={venue ? 396 : 383} size={6} max={150} kind="serif" track={0.4} /> : null}
      </svg>
      {border ? <ThemeBorder border={border} fallback={BOW_BORDER} medium="print" /> : null}
    </div>
  );
}
