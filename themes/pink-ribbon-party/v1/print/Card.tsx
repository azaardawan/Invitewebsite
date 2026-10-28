import { ThemeBorder, type PrintCardProps } from '@/theme-sdk';
import { BOW_BORDER } from '../border';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import { PosterLine, posterDetails } from '../poster';
import posterEn from '../assets/poster-en.webp';
import posterLocal from '../assets/poster-local.webp';
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
      <img className={p.poster} src={(local ? posterLocal : posterEn).src} alt="" />
      <svg className={p.poster} viewBox="0 0 297.75 419.25" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <PosterLine text={t.posterEyebrow} y={63} size={7.5} max={180} kind="serif" track={0.6} />
        {local ? <PosterLine text={t.posterHappy} y={128} size={40} max={190} kind="script" /> : null}
        <PosterLine text={fill(t.posterName)} y={280} size={40} max={180} kind="script" />
        <PosterLine text={posterDetails(event.date, event.time, t.posterSoon)} y={321} size={11} max={200} kind="serif" track={0.45} />
        {venue ? <PosterLine text={venue} y={355} size={6.5} max={180} kind="serif" track={0.35} /> : null}
        {extraLine ? <PosterLine text={extraLine} y={venue ? 368 : 355} size={6} max={160} kind="serif" track={0.35} /> : null}
      </svg>
      {border ? <ThemeBorder border={border} fallback={BOW_BORDER} medium="print" /> : null}
    </div>
  );
}
