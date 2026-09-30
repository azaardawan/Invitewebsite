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

/**
 * Kurdish files contain only owner-approved translations. Any key not yet
 * approved falls back to Arabic (never to a machine guess).
 */
export function messagesFor(locale: Locale): Messages {
  switch (locale) {
    case 'ar':
      return ar;
    case 'en':
      return en;
    case 'ckb':
      return mergeMessages(ar, ckb);
    case 'bdn':
      return mergeMessages(ar, bdn);
  }
}
