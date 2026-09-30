'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type Option = { value: string; label: string };

const WIDTHS = [360, 390, 430, 1280] as const;
const LANGS = ['ar', 'en', 'ckb', 'bdn'] as const;

/**
 * Live sample preview of a theme inside a sandboxed iframe, so the theme's
 * CSS/JS can never affect the admin page around it.
 */
export function ThemePreviewPanel({
  themeKey,
  packages,
  states,
  versions,
  defaultVersion,
}: {
  themeKey: string;
  packages: Option[];
  states: Option[];
  versions: Option[];
  defaultVersion: string;
}) {
  const t = useTranslations('admin.catalog');
  const [shape, setShape] = useState(packages[0] ? `pkg:${packages[0].value}` : `state:${states.at(-1)?.value ?? 0}`);
  const [lang, setLang] = useState<(typeof LANGS)[number]>('ar');
  const [names, setNames] = useState<'short' | 'long'>('short');
  const [width, setWidth] = useState<(typeof WIDTHS)[number]>(390);
  const [version, setVersion] = useState(defaultVersion);

  const [kind, value] = shape.split(':');
  const params = new URLSearchParams({ names, v: version, ...(kind === 'pkg' ? { pkg: value! } : { state: value! }) });
  const src = `/admin/preview/${lang}/theme/${themeKey}?${params}`;
  const select = 'rounded-md border border-line bg-surface px-2 py-1.5 text-sm';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <label className="text-sm">
          <span className="sr-only">{t('preview.contents')}</span>
          <select className={select} value={shape} onChange={(e) => setShape(e.target.value)} aria-label={t('preview.contents')}>
            {packages.length ? (
              <optgroup label={t('themes.packages')}>
                {packages.map((p) => (
                  <option key={p.value} value={`pkg:${p.value}`}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            ) : null}
            <optgroup label={t('preview.designedStates')}>
              {states.map((s) => (
                <option key={s.value} value={`state:${s.value}`}>
                  {s.label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <select className={select} value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} aria-label={t('preview.language')}>
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {t(`common.lang.${l}`)}
            </option>
          ))}
        </select>
        <select className={select} value={names} onChange={(e) => setNames(e.target.value as typeof names)} aria-label={t('preview.names')}>
          <option value="short">{t('preview.shortNames')}</option>
          <option value="long">{t('preview.longNames')}</option>
        </select>
        {versions.length > 1 ? (
          <select className={select} value={version} onChange={(e) => setVersion(e.target.value)} aria-label={t('themes.version')}>
            {versions.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('preview.width')}>
        {WIDTHS.map((w) => (
          <button
            key={w}
            type="button"
            aria-pressed={width === w}
            onClick={() => setWidth(w)}
            className={`rounded-md border px-2 py-1 text-xs ${width === w ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface'}`}
          >
            {w === 1280 ? t('preview.desktop') : `${w}px`}
          </button>
        ))}
        <a href={src} target="_blank" rel="noopener" className="ms-auto text-sm text-accent underline">
          {t('preview.openNewTab')}
        </a>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-canvas p-2">
        <iframe
          key={src}
          src={src}
          title={t('themes.preview')}
          width={width}
          height={760}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          className="mx-auto block rounded-lg border border-line bg-white"
        />
      </div>
    </div>
  );
}
