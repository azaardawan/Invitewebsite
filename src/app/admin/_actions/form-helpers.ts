import 'server-only';
import { ZodError } from 'zod';
import { CatalogError } from '@/server/catalog/common';
import type { ActionState } from './state';

/**
 * Reads `<prefix>.ar`, `.en`, `.ckb`, `.bdn` from a form. A text is either
 * left empty in every language or written in all four, so a visitor never sees
 * another language after switching (owner rule).
 */
export function readI18n(form: FormData, prefix: string) {
  const get = (l: string) => {
    const v = form.get(`${prefix}.${l}`);
    return typeof v === 'string' ? v : '';
  };
  const value = { ar: get('ar'), en: get('en'), ckb: get('ckb'), bdn: get('bdn') };
  const filled = Object.values(value).filter((v) => v.trim() !== '').length;
  if (filled > 0 && filled < 4) throw new CatalogError('allLanguages');
  return value;
}

export function readString(form: FormData, name: string): string | undefined {
  const v = form.get(name);
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
}

/** Maps known domain errors to form messages; unknown errors are re-thrown (never shown raw). */
export function catalogFailure(e: unknown): ActionState {
  if (e instanceof CatalogError) return { error: `catalog.errors.${e.code}`, details: e.details };
  if (e instanceof ZodError) return { error: 'catalog.errors.invalid' };
  throw e;
}
