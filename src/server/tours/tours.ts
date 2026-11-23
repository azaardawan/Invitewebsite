import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { assets, tours, type TourItemEdits, type TourLinks } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { auditActor, CatalogError, type Actor } from '@/server/catalog/common';
import { publicMediaUrl, storage } from '@/server/storage';
import { safeEqual, sha256Buffer } from '@/lib/crypto';

/**
 * Virtual tours (owner, 2026-11-21): a café's own 3D model, walked through from `/tour/<slug>` (the link in its
 * Instagram bio). The owner makes the model and sells the tour as a subscription: it shows while it is switched on and
 * before its end date. Every change is audited.
 */
export type Tour = typeof tours.$inferSelect;

/** The most a tour's model may weigh (phones download it on mobile data). */
export const TOUR_MODEL_MAX_BYTES = 80 * 1024 * 1024;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** A private link's code: 16 letters and digits (80 bits), nobody can guess it. */
const PRIVATE_KEY = /^[a-z0-9]{16}$/;

function newPrivateKey(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  // 36 letters: a byte below 252 picks one evenly.
  let key = '';
  while (key.length < 16) for (const b of randomBytes(24)) if (b < 252 && key.length < 16) key += alphabet[b % 36];
  return key;
}

/** The tour's address on the site: `/tour/<slug>`, or `/tour/<slug>-<code>` for a private link. */
export function tourPath(t: Pick<Tour, 'slug' | 'privateKey'>): string {
  return `/tour/${t.slug}${t.privateKey ? `-${t.privateKey}` : ''}`;
}
const link = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https:\/\/[^\s]+$/i.test(v), 'https')
  .transform((v) => v || undefined);

export const tourInput = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().toLowerCase().min(3).max(60).regex(SLUG),
  links: z.object({ instagram: link.optional(), location: link.optional(), menu: link.optional(), whatsapp: z.string().trim().max(30).optional() }),
  /** Only on creating: a private link from the start (see `setTourPrivacy` afterwards). */
  private: z.boolean().optional(),
  /** YYYY-MM-DD (the end of that day, Baghdad time), or empty for no end. */
  endsOn: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'date')
    .optional(),
});
export type TourInput = z.input<typeof tourInput>;

/** The end of a day in Baghdad (UTC+3), from YYYY-MM-DD. */
function endOfDay(day: string): Date {
  return new Date(`${day}T23:59:59+03:00`);
}

/** A WhatsApp number as a link (digits, with the country code), or undefined. */
export function whatsappLink(phone: string | undefined): string | undefined {
  const digits = (phone ?? '').replace(/[^\d]/g, '');
  return digits.length >= 8 ? `https://wa.me/${digits}` : undefined;
}

function parse(input: TourInput) {
  const r = tourInput.safeParse(input);
  if (!r.success) throw new CatalogError('invalidTour', r.error.issues.map((i) => i.path.join('.') || i.message));
  const { name, slug, links, endsOn } = r.data;
  const clean: TourLinks = Object.fromEntries(Object.entries(links).filter(([, v]) => v)) as TourLinks;
  return { data: { name, slug, links: clean, endsAt: endsOn ? endOfDay(endsOn) : null }, private: r.data.private ?? false };
}

// The private code is a secret (like a token): only whether there is one is audited.
function snapshot(t: Pick<Tour, 'name' | 'slug' | 'links' | 'endsAt' | 'live' | 'privateKey'>) {
  return { name: t.name, slug: t.slug, links: t.links, endsAt: t.endsAt?.toISOString() ?? null, live: t.live, private: !!t.privateKey };
}

export async function listTours(db: DbOrTx) {
  return db.select().from(tours).orderBy(desc(tours.createdAt));
}

export async function getTour(db: DbOrTx, id: string) {
  const [t] = await db.select().from(tours).where(eq(tours.id, id));
  return t ?? null;
}

export async function createTour(db: DbOrTx, input: TourInput, actor: Actor) {
  const { data, private: isPrivate } = parse(input);
  return db.transaction(async (tx) => {
    const [taken] = await tx.select({ id: tours.id }).from(tours).where(eq(tours.slug, data.slug));
    if (taken) throw new CatalogError('slugTaken');
    const [row] = await tx
      .insert(tours)
      .values({ ...data, privateKey: isPrivate ? newPrivateKey() : null })
      .returning();
    await recordAudit(tx, { ...auditActor(actor), action: 'tour.created', objectType: 'tour', objectId: row!.id, after: snapshot(row!) });
    return row!;
  });
}

export async function updateTour(db: DbOrTx, id: string, input: TourInput, actor: Actor) {
  const { data } = parse(input);
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(tours).where(eq(tours.id, id)).for('update');
    if (!before) throw new CatalogError('notFound');
    const [taken] = await tx.select({ id: tours.id }).from(tours).where(eq(tours.slug, data.slug));
    if (taken && taken.id !== id) throw new CatalogError('slugTaken');
    const [row] = await tx.update(tours).set(data).where(eq(tours.id, id)).returning();
    await recordAudit(tx, { ...auditActor(actor), action: 'tour.updated', objectType: 'tour', objectId: id, before: snapshot(before), after: snapshot(row!) });
    return row!;
  });
}

/**
 * Makes the tour's link private (`/tour/<slug>-<code>`), public again (`/tour/<slug>`), or private with a new code
 * (`renew`: the old private link stops working at once).
 */
export async function setTourPrivacy(db: DbOrTx, id: string, mode: 'private' | 'public' | 'renew', actor: Actor) {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(tours).where(eq(tours.id, id)).for('update');
    if (!before) throw new CatalogError('notFound');
    const privateKey = mode === 'public' ? null : mode === 'private' && before.privateKey ? before.privateKey : newPrivateKey();
    const [row] = await tx.update(tours).set({ privateKey }).where(eq(tours.id, id)).returning();
    await recordAudit(tx, {
      ...auditActor(actor),
      action: mode === 'public' ? 'tour.link_public' : mode === 'renew' ? 'tour.link_renewed' : 'tour.link_private',
      objectType: 'tour',
      objectId: id,
      before: { private: !!before.privateKey },
      after: { private: !!privateKey },
    });
    return row!;
  });
}

/** Switches a tour on (only with its model) or off. */
export async function setTourLive(db: DbOrTx, id: string, live: boolean, actor: Actor) {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(tours).where(eq(tours.id, id)).for('update');
    if (!before) throw new CatalogError('notFound');
    if (live && !before.modelAssetId) throw new CatalogError('noModel');
    await tx.update(tours).set({ live }).where(eq(tours.id, id));
    await recordAudit(tx, { ...auditActor(actor), action: live ? 'tour.live' : 'tour.off', objectType: 'tour', objectId: id, before: { live: before.live }, after: { live } });
  });
}

/** Whether a file is a binary glTF model (a .glb): its header says so, and its length matches. */
export function isGlb(data: Buffer): boolean {
  if (data.byteLength < 20) return false;
  if (data.toString('ascii', 0, 4) !== 'glTF') return false;
  return data.readUInt32LE(4) === 2 && data.readUInt32LE(8) === data.byteLength;
}

/** Makes the file (on disk) the tour's model, replacing the one before (whose file is deleted). */
export async function setTourModel(db: DbOrTx, id: string, file: string, actor: Actor, filename?: string) {
  const size = (await stat(file)).size;
  if (size > TOUR_MODEL_MAX_BYTES) throw new CatalogError('tooLarge');
  const data = await readFile(file);
  if (!isGlb(data)) throw new CatalogError('notGlb');
  const key = `tours/${randomUUID()}.glb`;
  await storage().put(key, data, 'model/gltf-binary');
  const old = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(tours).where(eq(tours.id, id)).for('update');
    if (!before) return null;
    const [asset] = await tx
      .insert(assets)
      .values({ kind: 'MODEL', storageKey: key, mime: 'model/gltf-binary', bytes: data.byteLength, sha256: sha256Buffer(data), originalFilename: filename?.slice(0, 200) ?? null, uploadedBy: actor.adminId })
      .returning();
    await tx.update(tours).set({ modelAssetId: asset!.id }).where(eq(tours.id, id));
    await recordAudit(tx, { ...auditActor(actor), action: 'tour.model_set', objectType: 'tour', objectId: id, after: { bytes: data.byteLength } });
    return { previous: before.modelAssetId };
  });
  if (!old) {
    await storage().delete(key).catch(() => {});
    throw new CatalogError('notFound');
  }
  if (old.previous) {
    const [prev] = await db.delete(assets).where(eq(assets.id, old.previous)).returning();
    if (prev) await storage().delete(prev.storageKey).catch(() => {});
  }
}

/** Sets (or clears) the tour's logo (an image asset uploaded through Admin). */
export async function setTourLogo(db: DbOrTx, id: string, assetId: string | null, actor: Actor) {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(tours).where(eq(tours.id, id)).for('update');
    if (!before) throw new CatalogError('notFound');
    if (assetId) {
      const [a] = await tx.select({ kind: assets.kind }).from(assets).where(eq(assets.id, assetId));
      if (a?.kind !== 'IMAGE') throw new CatalogError('notImage');
    }
    await tx.update(tours).set({ logoAssetId: assetId }).where(eq(tours.id, id));
    await recordAudit(tx, { ...auditActor(actor), action: 'tour.logo_set', objectType: 'tour', objectId: id, after: { logo: !!assetId } });
  });
}

/** Whether a tour shows: switched on, with its model, and its subscription not ended. */
export function tourState(t: Pick<Tour, 'live' | 'modelAssetId' | 'endsAt'>, now = new Date()): 'live' | 'off' | 'ended' {
  if (t.endsAt && t.endsAt.getTime() < now.getTime()) return 'ended';
  return t.live && t.modelAssetId ? 'live' : 'off';
}

/**
 * A tour for its page, from the address's last part: a public tour's slug, or a private tour's `<slug>-<code>` (a
 * private tour never opens at its bare slug).
 */
async function tourAt(db: DbOrTx, path: string) {
  if (!SLUG.test(path)) return null;
  const [exact] = await db.select().from(tours).where(eq(tours.slug, path));
  if (exact && !exact.privateKey) return exact;
  const cut = path.lastIndexOf('-');
  const key = path.slice(cut + 1);
  if (cut < 1 || !PRIVATE_KEY.test(key)) return null;
  const [t] = await db.select().from(tours).where(eq(tours.slug, path.slice(0, cut)));
  return t?.privateKey && safeEqual(t.privateKey, key) ? t : null;
}

/** A tour for its page (`/tour/<slug>`, or a private link): whether it shows, and what the page needs. */
export async function publicTour(db: DbOrTx, path: string, now = new Date()) {
  const t = await tourAt(db, path);
  if (!t) return { state: 'missing' as const };
  const state = tourState(t, now);
  if (state !== 'live') return { state, name: t.name };
  const ids = [t.modelAssetId, t.logoAssetId].filter((x): x is string => !!x);
  const rows = ids.length ? await db.select().from(assets).where(sql`${assets.id} in ${ids}`) : [];
  const model = rows.find((r) => r.id === t.modelAssetId);
  const logo = rows.find((r) => r.id === t.logoAssetId);
  if (!model) return { state: 'off' as const, name: t.name };
  return {
    state,
    tour: {
      id: t.id,
      name: t.name,
      // The model is read in WebGL: from this site (`/media/`), never the CDN.
      model: `/media/${model.storageKey}`,
      modelBytes: model.bytes,
      logo: logo ? publicMediaUrl(logo.storageKey) : null,
      links: { ...t.links, whatsapp: whatsappLink(t.links.whatsapp) },
      edits: t.itemEdits ?? {},
    },
  };
}

const offset = z.number().finite().min(-50).max(50);
/** An item's change, checked: at most 50 m away, turned at most a full turn; an item's code is a short word. */
export const tourItemEdits = z
  .record(z.string().regex(/^\w{1,16}$/), z.object({ x: offset.optional(), y: offset.optional(), z: offset.optional(), ry: z.number().finite().min(-7).max(7).optional() }).strict())
  .refine((r) => Object.keys(r).length <= 5000);

/**
 * Saves the owner's changes to the model's items (the editor): only the items actually moved or turned are kept.
 * Audited (which items changed, and how many are changed in all).
 */
export async function setTourItemEdits(db: DbOrTx, id: string, raw: unknown, actor: Actor) {
  const parsed = tourItemEdits.safeParse(raw);
  if (!parsed.success) throw new CatalogError('invalid');
  const edits: TourItemEdits = {};
  for (const [code, e] of Object.entries(parsed.data)) {
    const kept = Object.fromEntries(Object.entries(e).filter(([, v]) => typeof v === 'number' && Math.abs(v) >= 0.0005));
    if (Object.keys(kept).length) edits[code] = kept;
  }
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(tours).where(eq(tours.id, id)).for('update');
    if (!before) throw new CatalogError('notFound');
    await tx.update(tours).set({ itemEdits: edits }).where(eq(tours.id, id));
    const was = before.itemEdits ?? {};
    const changed = [...new Set([...Object.keys(was), ...Object.keys(edits)])].filter((c) => JSON.stringify(was[c] ?? null) !== JSON.stringify(edits[c] ?? null));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'tour.items_edited',
      objectType: 'tour',
      objectId: id,
      before: { items: Object.keys(was).length },
      after: { items: Object.keys(edits).length, changed: changed.slice(0, 200) },
    });
    return edits;
  });
}

/** Counts a visit (each opening of the page). */
export async function countTourVisit(db: DbOrTx, id: string) {
  await db
    .update(tours)
    .set({ visits: sql`${tours.visits} + 1` })
    .where(eq(tours.id, id));
}
