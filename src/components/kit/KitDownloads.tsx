'use client';

import { useState } from 'react';
import { BOTTLE_SIZE_KEYS, DATE_STYLES, DEFAULT_KIT_OPTIONS, type BottleSize, type DateStyle, type DigitStyle, type KitUnitKey } from '@/catalog/kit';

export type KitDownloadLabels = {
  title: string;
  intro: string;
  dateStyle: string;
  digits: string;
  digitsArab: string;
  digitsLatn: string;
  units: Record<KitUnitKey | 'stickers', string>;
  shape: string;
  round: string;
  square: string;
  bottleSize: string;
  bottleHint: string;
  ml: string;
  pdf: string;
  pdfSheet: string;
  png: string;
  pngHint: string;
  slowHint: string;
  afterPayment: string;
};

const btn =
  'inline-flex h-11 items-center justify-center rounded-full border border-accent px-5 text-sm font-semibold text-accent transition hover:bg-accent hover:text-accent-ink';
const select = 'rounded-xl border border-line bg-surface px-3 py-2 text-sm';

/**
 * The customer's (or Admin's) file downloads. Options shape the files: how the
 * birth date is written, sticker shape and bottle size. Each link makes the
 * file on first use; later downloads are instant.
 */
export function KitDownloads({
  baseHref,
  units,
  dateExamples,
  showDigits,
  labels,
}: {
  baseHref: string;
  units: KitUnitKey[];
  /** `${style}:${digits}` → the customer's own date written that way. */
  dateExamples: Record<string, string>;
  showDigits: boolean;
  labels: KitDownloadLabels;
}) {
  const [dateStyle, setDateStyle] = useState<DateStyle>(DEFAULT_KIT_OPTIONS.dateStyle);
  const [digits, setDigits] = useState<DigitStyle>(DEFAULT_KIT_OPTIONS.digits);
  const [shape, setShape] = useState<'sticker-round' | 'sticker-square'>(units.includes('sticker-round') ? 'sticker-round' : 'sticker-square');
  const [bottle, setBottle] = useState<BottleSize>(DEFAULT_KIT_OPTIONS.bottle);
  const href = (unit: KitUnitKey, format: 'png' | 'pdf') =>
    `${baseHref}?${new URLSearchParams({ unit, format, date: dateStyle, digits, ...(unit === 'bottle' ? { bottle } : {}) })}`;
  const has = (u: KitUnitKey) => units.includes(u);
  const stickers = has('sticker-round') || has('sticker-square');

  return (
    <section className="space-y-5" aria-labelledby="kit-files">
      <div>
        <h2 id="kit-files" className="font-semibold">
          {labels.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{labels.intro}</p>
      </div>

      <fieldset className="space-y-2 rounded-xl border border-line bg-surface p-4">
        <legend className="px-1 text-sm font-medium">{labels.dateStyle}</legend>
        {DATE_STYLES.map((s) => (
          <label key={s} className="flex items-start gap-3 text-sm">
            <input type="radio" name="dateStyle" value={s} checked={dateStyle === s} onChange={() => setDateStyle(s)} className="mt-1" />
            <span className="whitespace-pre-line" dir="auto">
              {dateExamples[`${s}:${digits}`]}
            </span>
          </label>
        ))}
        {showDigits ? (
          <div className="flex flex-wrap items-center gap-4 border-t border-line pt-3 text-sm">
            <span className="font-medium">{labels.digits}</span>
            {(['arab', 'latn'] as const).map((d) => (
              <label key={d} className="flex items-center gap-2">
                <input type="radio" name="digits" value={d} checked={digits === d} onChange={() => setDigits(d)} />
                {d === 'arab' ? labels.digitsArab : labels.digitsLatn}
              </label>
            ))}
          </div>
        ) : null}
      </fieldset>

      <ul className="space-y-3">
        {has('story') ? (
          <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
            <span className="font-medium">{labels.units.story}</span>
            <a href={href('story', 'png')} download className={btn}>
              {labels.png}
            </a>
          </li>
        ) : null}
        {has('card') ? (
          <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
            <span className="font-medium">{labels.units.card}</span>
            <span className="flex flex-wrap gap-2">
              <a href={href('card', 'pdf')} download className={btn}>
                {labels.pdf}
              </a>
              <a href={href('card', 'png')} download className={btn}>
                {labels.png}
              </a>
            </span>
          </li>
        ) : null}
        {stickers ? (
          <li className="space-y-3 rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-medium">{labels.units.stickers}</span>
              {has('sticker-round') && has('sticker-square') ? (
                <label className="flex items-center gap-2 text-sm">
                  {labels.shape}
                  <select value={shape} onChange={(e) => setShape(e.target.value as typeof shape)} className={select}>
                    <option value="sticker-round">{labels.round}</option>
                    <option value="sticker-square">{labels.square}</option>
                  </select>
                </label>
              ) : null}
            </div>
            <span className="flex flex-wrap gap-2">
              <a href={href(shape, 'pdf')} download className={btn}>
                {labels.pdfSheet}
              </a>
              <a href={href(shape, 'png')} download className={btn}>
                {labels.png}
              </a>
            </span>
            <p className="text-xs text-muted">{labels.pngHint}</p>
          </li>
        ) : null}
        {has('bottle') ? (
          <li className="space-y-3 rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-medium">{labels.units.bottle}</span>
              <label className="flex items-center gap-2 text-sm">
                {labels.bottleSize}
                <select value={bottle} onChange={(e) => setBottle(e.target.value as BottleSize)} className={select}>
                  {BOTTLE_SIZE_KEYS.map((b) => (
                    <option key={b} value={b}>
                      {b} {labels.ml}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <span className="flex flex-wrap gap-2">
              <a href={href('bottle', 'pdf')} download className={btn}>
                {labels.pdfSheet}
              </a>
              <a href={href('bottle', 'png')} download className={btn}>
                {labels.png}
              </a>
            </span>
            <p className="text-xs text-muted">{labels.bottleHint}</p>
          </li>
        ) : null}
      </ul>
      <p className="text-xs text-muted">{labels.slowHint}</p>
    </section>
  );
}
