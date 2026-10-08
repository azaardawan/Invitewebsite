import 'server-only';
import { and, eq } from 'drizzle-orm';
import { IntlMessageFormat } from 'intl-messageformat';
import type { AbstractIntlMessages } from 'next-intl';
import type { DbOrTx } from '@/server/db/client';
import { uiTranslations } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { SHIPPED, setMessageOverrides } from '@/i18n/messages';
import { locales as LOCALES, type Locale } from '@/i18n/config';

/** How long a server keeps edits in memory before re-reading them (other servers pick changes up within this). */
const REFRESH_MS = 30_000;
const MAX_LENGTH = 3000;
/** Sorani dates come from built-in calendar data, so these keys need no Sorani text (same rule as i18n:check). */
const SORANI_CALENDAR = /^invitation\.(months|weekdays)\.|^invitation\.(am|pm)$/;

type Flat = Record<string, string>;

function flatten(obj: object, prefix = ''): Flat {
  const out: Flat = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'object' && v !== null) Object.assign(out, flatten(v, `${prefix}${k}.`));
    else out[`${prefix}${k}`] = String(v);
  }
  return out;
}

const shippedFlat = Object.fromEntries(LOCALES.map((l) => [l, flatten(SHIPPED[l])])) as Record<Locale, Flat>;

/**
 * Texts the owner may edit: everything customers see. Admin-panel texts (`admin.*`) stay in code.
 * Keys come from the Arabic file, which has every key.
 */
export const EDITABLE_KEYS = Object.keys(shippedFlat.ar).filter((k) => !k.startsWith('admin.'));
const editable = new Set(EDITABLE_KEYS);

export class TranslationError extends Error {
  constructor(
    readonly code: 'unknownKey' | 'tooLong' | 'invalidSyntax' | 'unknownPlaceholder',
    readonly detail?: string,
  ) {
    super(code);
  }
}

function nest(flat: Flat): AbstractIntlMessages {
  const out: AbstractIntlMessages = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let node = out;
    for (const p of parts.slice(0, -1)) node = (node[p] ??= {}) as AbstractIntlMessages;
    node[parts.at(-1)!] = value;
  }
  return out;
}

let loadedAt = 0;
let loading: Promise<void> | null = null;
let current: Record<Locale, Flat> = { ar: {}, en: {}, ckb: {}, bdn: {} };

async function load(db: DbOrTx) {
  const rows = await db.select({ key: uiTranslations.key, locale: uiTranslations.locale, value: uiTranslations.value }).from(uiTranslations);
  const next: Record<Locale, Flat> = { ar: {}, en: {}, ckb: {}, bdn: {} };
  // A key removed from the code since it was edited is simply ignored.
  for (const r of rows) if (editable.has(r.key)) next[r.locale][r.key] = r.value;
  current = next;
  setMessageOverrides(Object.fromEntries(LOCALES.map((l) => [l, nest(next[l])])));
  loadedAt = Date.now();
}

/**
 * Makes sure this server uses the latest Admin edits (re-read at most every 30 s). Called for every
 * request by the i18n setup; if the database can't be reached, the shipped texts keep working.
 */
export async function refreshTranslations(db: DbOrTx, force = false) {
  if (!force && Date.now() - loadedAt < REFRESH_MS) return;
  loading ??= load(db)
    .catch((e) => console.error('[translations] could not load edits; using shipped texts', e))
    .finally(() => (loading = null));
  await loading;
}

/** Placeholder and tag names a message uses ({name}, {count, plural…}, <terms>…</terms>). */
function namesIn(message: string): { args: Set<string>; tags: Set<string> } {
  const args = new Set<string>();
  const tags = new Set<string>();
  type El = { type: number; value?: string; options?: Record<string, { value: El[] }>; children?: El[] };
  const walk = (els: El[]) => {
    for (const el of els) {
      if (el.type === 8 && el.value) tags.add(el.value);
      else if (el.type >= 1 && el.type <= 6 && el.value) args.add(el.value);
      if (el.options) for (const o of Object.values(el.options)) walk(o.value);
      if (el.children) walk(el.children);
    }
  };
  walk(new IntlMessageFormat(message, 'en').getAst() as unknown as El[]);
  return { args, tags };
}

/**
 * A text can be saved when it is valid message syntax and only uses placeholders the original has
 * (an unknown {name} would break the page). Leaving one out is allowed.
 */
export function checkTranslation(key: string, value: string) {
  if (!editable.has(key)) throw new TranslationError('unknownKey');
  if (value.length > MAX_LENGTH) throw new TranslationError('tooLong');
  let mine;
  try {
    mine = namesIn(value);
  } catch {
    throw new TranslationError('invalidSyntax');
  }
  const original = namesIn(shippedFlat.ar[key]!);
  const extra = [...[...mine.args].filter((a) => !original.args.has(a)), ...[...mine.tags].filter((t) => !original.tags.has(t))];
  if (extra.length) throw new TranslationError('unknownPlaceholder', extra.join(', '));
}

export type TranslationRow = {
  key: string;
  shipped: Partial<Record<Locale, string>>;
  edited: Partial<Record<Locale, string>>;
  /** True when Sorani or Badini has neither a shipped nor an edited text (Kurdish visitors see Arabic). */
  missingKurdish: boolean;
};

export async function listTranslations(db: DbOrTx, f: { q?: string; filter?: 'missing' | 'edited'; group?: string } = {}) {
  await refreshTranslations(db, true);
  const q = f.q?.toLowerCase();
  const rows: TranslationRow[] = [];
  for (const key of EDITABLE_KEYS) {
    if (f.group && !key.startsWith(`${f.group}.`)) continue;
    const shipped = Object.fromEntries(LOCALES.flatMap((l) => (shippedFlat[l][key] !== undefined ? [[l, shippedFlat[l][key]]] : [])));
    const edited = Object.fromEntries(LOCALES.flatMap((l) => (current[l][key] !== undefined ? [[l, current[l][key]]] : [])));
    const missingKurdish = (['ckb', 'bdn'] as const).some((l) => shipped[l] === undefined && edited[l] === undefined && !(l === 'ckb' && SORANI_CALENDAR.test(key)));
    if (f.filter === 'missing' && !missingKurdish) continue;
    if (f.filter === 'edited' && !Object.keys(edited).length) continue;
    if (q && !key.toLowerCase().includes(q) && ![...Object.values(shipped), ...Object.values(edited)].some((v) => v.toLowerCase().includes(q))) continue;
    rows.push({ key, shipped, edited, missingKurdish });
  }
  return rows;
}

/** Groups (first part of the key) for the filter. */
export const TRANSLATION_GROUPS = [...new Set(EDITABLE_KEYS.map((k) => k.split('.')[0]!))];

/** Number of customer texts Kurdish visitors still see in Arabic, for the dashboard. */
export async function missingKurdishTexts(db: DbOrTx) {
  return (await listTranslations(db, { filter: 'missing' })).length;
}

/**
 * Saves the texts given for one key. An empty text, or one equal to the shipped text, removes the edit
 * (the shipped text, or Arabic for Kurdish without one, shows again). Recorded in the audit log.
 */
export async function saveTranslation(
  db: DbOrTx,
  key: string,
  values: Partial<Record<Locale, string>>,
  actor: { adminId: string; ipHash: string | null },
) {
  const clean = Object.fromEntries(Object.entries(values).map(([l, v]) => [l, (v ?? '').replace(/\r\n/g, '\n').trim()])) as Partial<Record<Locale, string>>;
  for (const v of Object.values(clean)) if (v) checkTranslation(key, v);
  if (!editable.has(key)) throw new TranslationError('unknownKey');
  const changed = await db.transaction(async (tx) => {
    const before: Partial<Record<Locale, string | null>> = {};
    const after: Partial<Record<Locale, string | null>> = {};
    for (const [locale, value] of Object.entries(clean) as [Locale, string][]) {
      const [row] = await tx.select().from(uiTranslations).where(and(eq(uiTranslations.key, key), eq(uiTranslations.locale, locale))).for('update');
      const next = !value || value === shippedFlat[locale][key] ? null : value;
      if ((row?.value ?? null) === next) continue;
      before[locale] = row?.value ?? null;
      after[locale] = next;
      if (next === null) await tx.delete(uiTranslations).where(and(eq(uiTranslations.key, key), eq(uiTranslations.locale, locale)));
      else
        await tx
          .insert(uiTranslations)
          .values({ key, locale, value: next, updatedBy: actor.adminId, updatedAt: new Date() })
          .onConflictDoUpdate({ target: [uiTranslations.key, uiTranslations.locale], set: { value: next, updatedBy: actor.adminId, updatedAt: new Date() } });
    }
    if (!Object.keys(after).length) return false;
    await recordAudit(tx, { actorType: 'ADMIN', actorAdminId: actor.adminId, action: 'translation.update', objectType: 'translation', objectId: null, before: { key, ...before }, after: { key, ...after }, ipHash: actor.ipHash });
    return true;
  });
  await refreshTranslations(db, true);
  return changed;
}
