import { notFound } from 'next/navigation';
import { manifestByCodeRef } from '@/theme-registry';
import { generatedThemeComponents } from '@/theme-registry/generated-components';
import { SAMPLES } from './samples';

/** The theme lab exists only in development (like internal themes); elsewhere it is a 404. */
export function assertLabEnabled() {
  if ((process.env.APP_ENV ?? 'development') !== 'development') notFound();
}

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Resolves `/dev/themes/<key@version>?state=<n>&locale=ar|en&sample=short|long`.
 * `state` indexes the manifest's `validStates` (default: the complete theme).
 */
export async function labContext(ref: string, search: Search) {
  assertLabEnabled();
  const codeRef = decodeURIComponent(ref);
  const manifest = manifestByCodeRef(codeRef);
  const loaders = generatedThemeComponents[codeRef];
  if (!manifest || !loaders) notFound();

  const locale: 'ar' | 'en' = one(search.locale) === 'en' ? 'en' : 'ar';
  const sample = one(search.sample) === 'long' ? 'long' : 'short';
  const stateParam = Number(one(search.state));
  const stateIndex =
    Number.isInteger(stateParam) && stateParam >= 0 && stateParam < manifest.validStates.length
      ? stateParam
      : manifest.validStates.length - 1;
  const state = manifest.validStates[stateIndex]!;
  const all = SAMPLES[locale][sample];
  const fields = Object.fromEntries(state.fields.map((k) => [k, all[k] ?? ''])) as typeof all;

  // No soundtrack is chosen for design review; `?music=1` plays silence so the audio toggle can be checked.
  const music = one(search.music) === '1' && state.features.includes('music') ? { src: SILENT_WAV } : null;

  return { manifest, loaders, locale, dir: locale === 'en' ? ('ltr' as const) : ('rtl' as const), sample, stateIndex, state, fields, music };
}

/** One second of silence (8 kHz, 8-bit mono WAV) as a data URL. */
const SILENT_WAV = (() => {
  const samples = 8000;
  const buf = Buffer.alloc(44 + samples);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(8000, 24);
  buf.writeUInt32LE(8000, 28);
  buf.writeUInt16LE(1, 32);
  buf.writeUInt16LE(8, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples, 40);
  buf.fill(128, 44);
  return `data:audio/wav;base64,${buf.toString('base64')}`;
})();
