import { ThemeBorder, type PrintCardProps } from '@/theme-sdk';
import { ROSETTE_BORDER } from '../border';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import { PosterLine, posterDetails, posterLines } from '../poster';
import posterEn from '../assets/poster-en.webp';
import posterLocal from '../assets/poster-local.webp';
import p from './print.module.css';

/**
 * Printable invitation, A5 portrait: the poster itself, as it stands once opened (the designer's artwork pictured from
 * the scene: the peony cake, and the drawn «Birthday» in English), with the customer's lines set as on the invitation in
 * the design's fonts. The QR code is on the back.
 */
export default function Card({ locale, dir, lang, fields, event, extraLine, border }: PrintCardProps) {
  const t = copyFor(locale);
  const local = locale !== 'en';
  const name = fields.person_1_name?.trim() ?? '';
  const venue = fields.venue_name?.trim() ?? '';
  const specs = posterLines(t, name, posterDetails(event.date, event.time, t.posterSoon), venue, local);
  return (
    <div className={`${fonts.fonts} ${p.card}`} dir={dir} lang={lang} data-script={local ? 'arabic' : 'latin'}>
      {/* eslint-disable-next-line @next/next/no-img-element -- print artwork */}
      <img className={p.poster} src={(local ? posterLocal : posterEn).src} alt="" />
      <svg className={p.poster} viewBox="0 0 297.75 419.25" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {(Object.keys(specs) as (keyof typeof specs)[]).map((k) => (specs[k].text ? <PosterLine key={k} p="" k={k} spec={specs[k]} still /> : null))}
        {extraLine ? (
          <PosterLine p="" k="address" still spec={{ text: extraLine, y: venue ? (local ? 410 : 396) : local ? 399 : 385.6, size: 6, max: 170, fill: '#be2026', track: 1.2, italic: true }} />
        ) : null}
      </svg>
      {border ? <ThemeBorder border={border} fallback={ROSETTE_BORDER} medium="print" /> : null}
    </div>
  );
}
