import type { AbstractIntlMessages } from 'next-intl';
import ar from './messages/ar.json';
import en from './messages/en.json';
import ckb from './messages/ckb.json';
import bdn from './messages/bdn.json';
import type { Locale } from './config';

type Messages = AbstractIntlMessages;

function isObject(v: unknown): v is Messages {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deep merge where `override` wins; used to fall back to Arabic for untranslated Kurdish keys. */
export function mergeMessages(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(override)) {
    const b = out[k];
    out[k] = isObject(b) && isObject(v) ? mergeMessages(b, v) : v;
  }
  return out;
}

/** The texts shipped with the code, per language (Kurdish only where approved). */
export const SHIPPED: Record<Locale, Messages> = { ar, en, ckb, bdn };

/** Texts changed in Admin → Translations, per language, as nested messages. Set by the server's loader. */
let overrides: Partial<Record<Locale, Messages>> = {};
const cache = new Map<Locale, Messages>();

export function setMessageOverrides(next: Partial<Record<Locale, Messages>>) {
  overrides = next;
  cache.clear();
}

/**
 * Kurdish files contain only owner-approved translations. Any key not yet
 * approved falls back to Arabic (never to a machine guess). Admin edits win
 * over the shipped texts; Arabic edits also reach Kurdish keys that fall back.
 */
export function messagesFor(locale: Locale): Messages {
  const hit = cache.get(locale);
  if (hit) return hit;
  const withEdits = (l: Locale) => (overrides[l] ? mergeMessages(SHIPPED[l], overrides[l]) : SHIPPED[l]);
  const out = locale === 'ar' || locale === 'en' ? withEdits(locale) : mergeMessages(withEdits('ar'), withEdits(locale));
  cache.set(locale, out);
  return out;
}
