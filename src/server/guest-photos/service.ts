import 'server-only';
import { randomUUID } from 'node:crypto';
import { PassThrough, type Readable } from 'node:stream';
import archiver from 'archiver';
import sharp from 'sharp';
import { and, asc, count, eq, inArray, isNotNull, lt } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { guestPhotos, invitations } from '@/server/db/schema';
import { storage } from '@/server/storage';
import { randomToken, sha256, sha256Buffer } from '@/lib/crypto';
import { recordAudit } from '@/server/audit/audit';
import { isLive } from '@/server/orders/payment';
import { occasionKey } from '@/server/invitation/load';
import { DEFAULT_PER_GUEST, MAX_PHOTO_BYTES, OPEN_WHILE_LIVE_SECTIONS, WINDOW_DAYS } from '@/catalog/guest-photos';

type InvitationRow = typeof invitations.$inferSelect;
export type GuestPhoto = typeof guestPhotos.$inferSelect;

export class GuestPhotoError extends Error {
  constructor(public readonly code: 'notFound' | 'closed' | 'full' | 'shareUsed' | 'duplicate' | 'tooBig' | 'type' | 'name') {
    super(code);
  }
}

const PREFIX = 'guest-photos/';
const DAY = 24 * 3600_000;
/** Baghdad is UTC+3 all year (no daylight saving). */
const BAGHDAD_OFFSET_MS = 3 * 3600_000;

/** The guest's phone token (a cookie) as stored: never the token itself. */
export const deviceHashOf = (token: string) => sha256(`guest-device:${token}`);
export const newDeviceToken = () => randomToken(24);
export const newUploadToken = () => randomToken(18);

/** The invitation whose upload page this is, while the add-on is bought; null otherwise. */
export async function invitationByUploadToken(db: DbOrTx, token: string): Promise<InvitationRow | null> {
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) return null;
  const [inv] = await db.select().from(invitations).where(and(eq(invitations.guestPhotosToken, token), isNotNull(invitations.guestPhotosCap)));
  return inv ?? null;
}

/**
 * When guests may upload (owner, 2026-11-21): only while the invitation is online, and for occasions with an event date
 * from 2 days before it to 2 days after (Baghdad days). Couples, Friends and Birthdays: the whole time it is online.
 */
export async function uploadWindow(db: DbOrTx, inv: InvitationRow, now = new Date()) {
  const live = isLive(inv, now);
  const section = await occasionKey(db, inv.sectionId);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(inv.fieldValues.event_date ?? '') ? inv.fieldValues.event_date! : null;
  let opensAt = inv.publishedAt;
  let closesAt = inv.expiresAt;
  if (date && !(OPEN_WHILE_LIVE_SECTIONS as readonly string[]).includes(section ?? '')) {
    const midnight = Date.parse(`${date}T00:00:00Z`) - BAGHDAD_OFFSET_MS;
    opensAt = new Date(midnight - WINDOW_DAYS * DAY);
    const end = new Date(midnight + (WINDOW_DAYS + 1) * DAY - 1000);
    closesAt = closesAt && closesAt < end ? closesAt : end;
  }
  const open = live && (!opensAt || opensAt <= now) && (!closesAt || closesAt > now);
  return { open, opensAt, closesAt, live };
}

/** The file's kind from its first bytes (never from its name or what the phone says). */
export function photoKind(bytes: Buffer): { ext: string; type: string } | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', type: 'image/png' };
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return { ext: 'webp', type: 'image/webp' };
  if (bytes.toString('ascii', 4, 8) === 'ftyp') {
    const brand = bytes.toString('ascii', 8, 12);
    if (['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) return { ext: 'heic', type: 'image/heic' };
    if (brand === 'avif') return { ext: 'avif', type: 'image/avif' };
  }
  return null;
}

/** A guest's name as stored: one line, 1 to 60 letters. */
export function cleanGuestName(name: string): string | null {
  const n = name.replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim();
  return n.length >= 1 && n.length <= 60 ? n : null;
}

async function thumbnail(bytes: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(bytes, { failOn: 'none' }).rotate().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 74 }).toBuffer();
  } catch {
    return null; // e.g. an iPhone HEIC: kept as sent, shown without a picture
  }
}

/** A guest's upload: checked, kept as sent (original quality), with a small picture for the couple. */
export async function uploadGuestPhoto(
  db: DbOrTx,
  inv: InvitationRow,
  input: { deviceHash: string; name: string; bytes: Buffer },
  now = new Date(),
): Promise<GuestPhoto> {
  if (!(await uploadWindow(db, inv, now)).open) throw new GuestPhotoError('closed');
  const name = cleanGuestName(input.name);
  if (!name) throw new GuestPhotoError('name');
  if (input.bytes.length > MAX_PHOTO_BYTES) throw new GuestPhotoError('tooBig');
  const kind = photoKind(input.bytes);
  if (!kind) throw new GuestPhotoError('type');
  const hash = sha256Buffer(input.bytes);
  const id = randomUUID();
  const key = `${PREFIX}${id}.${kind.ext}`;
  const thumb = await thumbnail(input.bytes);
  const thumbKey = thumb ? `${PREFIX}${randomUUID()}.jpg` : null;
  return db.transaction(async (tx) => {
    // One upload at a time per invitation, so the total and each phone's share hold.
    const [locked] = await tx.select({ cap: invitations.guestPhotosCap, perGuest: invitations.guestPhotosPerGuest }).from(invitations).where(eq(invitations.id, inv.id)).for('update');
    if (!locked?.cap) throw new GuestPhotoError('notFound');
    const [same] = await tx.select({ id: guestPhotos.id }).from(guestPhotos).where(and(eq(guestPhotos.invitationId, inv.id), eq(guestPhotos.sha256, hash)));
    if (same) throw new GuestPhotoError('duplicate');
    const [all] = await tx.select({ n: count() }).from(guestPhotos).where(eq(guestPhotos.invitationId, inv.id));
    if ((all?.n ?? 0) >= locked.cap) throw new GuestPhotoError('full');
    const [mine] = await tx.select({ n: count() }).from(guestPhotos).where(and(eq(guestPhotos.invitationId, inv.id), eq(guestPhotos.deviceHash, input.deviceHash)));
    if ((mine?.n ?? 0) >= (locked.perGuest ?? DEFAULT_PER_GUEST)) throw new GuestPhotoError('shareUsed');
    await storage().put(key, input.bytes, kind.type);
    if (thumb && thumbKey) await storage().put(thumbKey, thumb, 'image/jpeg');
    try {
      const [row] = await tx
        .insert(guestPhotos)
        .values({ id, invitationId: inv.id, deviceHash: input.deviceHash, guestName: name, storageKey: key, thumbKey, contentType: kind.type, byteSize: input.bytes.length, sha256: hash, createdAt: now })
        .returning();
      return row!;
    } catch (e) {
      await removeFiles([{ storageKey: key, thumbKey }]);
      throw e;
    }
  });
}

async function removeFiles(rows: Pick<GuestPhoto, 'storageKey' | 'thumbKey'>[]) {
  for (const r of rows) {
    await storage().delete(r.storageKey).catch(() => {});
    if (r.thumbKey) await storage().delete(r.thumbKey).catch(() => {});
  }
}

/** This phone's photos, oldest first. */
export async function devicePhotos(db: DbOrTx, invitationId: string, deviceHash: string) {
  return db.select().from(guestPhotos).where(and(eq(guestPhotos.invitationId, invitationId), eq(guestPhotos.deviceHash, deviceHash))).orderBy(asc(guestPhotos.createdAt));
}

/** A guest removes one of their own photos, while uploading is open. */
export async function deleteOwnPhoto(db: DbOrTx, inv: InvitationRow, deviceHash: string, photoId: string, now = new Date()) {
  if (!(await uploadWindow(db, inv, now)).open) throw new GuestPhotoError('closed');
  const gone = await db
    .delete(guestPhotos)
    .where(and(eq(guestPhotos.id, photoId), eq(guestPhotos.invitationId, inv.id), eq(guestPhotos.deviceHash, deviceHash)))
    .returning();
  if (!gone.length) throw new GuestPhotoError('notFound');
  await removeFiles(gone);
}

/** Every guest's photos, grouped by name (in order of each guest's first photo). */
export async function photosByGuest(db: DbOrTx, invitationId: string) {
  const rows = await db.select().from(guestPhotos).where(eq(guestPhotos.invitationId, invitationId)).orderBy(asc(guestPhotos.createdAt));
  const groups = new Map<string, { name: string; photos: GuestPhoto[] }>();
  for (const r of rows) {
    // Two phones under one name stay one guest for the couple.
    const k = r.guestName.toLocaleLowerCase();
    if (!groups.has(k)) groups.set(k, { name: r.guestName, photos: [] });
    groups.get(k)!.photos.push(r);
  }
  return { total: rows.length, groups: [...groups.values()] };
}

export async function guestPhotoOf(db: DbOrTx, invitationId: string, photoId: string) {
  const [row] = await db.select().from(guestPhotos).where(and(eq(guestPhotos.id, photoId), eq(guestPhotos.invitationId, invitationId)));
  return row ?? null;
}

/** The couple (or the team, audited) removes a photo. */
export async function removeGuestPhoto(db: DbOrTx, invitationId: string, photoId: string, actor?: { adminId: string; ipHash: string | null }) {
  return db.transaction(async (tx) => {
    const gone = await tx.delete(guestPhotos).where(and(eq(guestPhotos.id, photoId), eq(guestPhotos.invitationId, invitationId))).returning();
    if (!gone.length) throw new GuestPhotoError('notFound');
    if (actor)
      await recordAudit(tx, {
        actorType: 'ADMIN',
        actorAdminId: actor.adminId,
        action: 'guest_photo.removed',
        objectType: 'invitation',
        objectId: invitationId,
        ipHash: actor.ipHash,
        after: { guestName: gone[0]!.guestName, photoId },
      });
    await removeFiles(gone);
  });
}

/** Housekeeping: guests' photos are kept while the invitation is online (owner, 2026-11-21), then deleted. */
export async function deleteEndedGuestPhotos(db: DbOrTx, now = new Date()) {
  const ended = await db.select({ id: invitations.id }).from(invitations).where(and(isNotNull(invitations.guestPhotosCap), lt(invitations.expiresAt, now)));
  if (!ended.length) return 0;
  const gone = await db.delete(guestPhotos).where(inArray(guestPhotos.invitationId, ended.map((e) => e.id))).returning();
  await removeFiles(gone);
  return gone.length;
}

/** A file name safe on every computer, from a guest's name. */
export function fileNameOf(name: string) {
  return name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^\.+/, '').slice(0, 60) || 'guest';
}

/**
 * Every guest's photos as one ZIP holding a ZIP per guest (owner, 2026-11-21), streamed: one guest's files in memory at
 * a time. Photos are already compressed, so they are stored as they are.
 */
export function guestPhotosZip(groups: { name: string; photos: GuestPhoto[] }[]): Readable {
  const outer = archiver('zip', { store: true, forceZip64: true });
  const out = new PassThrough();
  outer.pipe(out);
  outer.on('warning', () => {});
  outer.on('error', (e) => out.destroy(e));
  void (async () => {
    const used = new Map<string, number>();
    try {
      for (const g of groups) {
        const base = fileNameOf(g.name);
        const n = (used.get(base) ?? 0) + 1;
        used.set(base, n);
        const inner = archiver('zip', { store: true });
        const parts: Buffer[] = [];
        inner.on('data', (c: Buffer) => parts.push(c));
        const done = new Promise<void>((resolve, reject) => {
          inner.on('end', resolve);
          inner.on('error', reject);
        });
        for (const [i, p] of g.photos.entries()) {
          const body = await storage().get(p.storageKey);
          if (body) inner.append(body, { name: `${base} ${i + 1}.${p.storageKey.split('.').pop()}`, date: p.createdAt });
        }
        await inner.finalize();
        await done;
        const added = new Promise<void>((resolve) => outer.once('entry', () => resolve()));
        outer.append(Buffer.concat(parts), { name: `${n > 1 ? `${base} (${n})` : base}.zip` });
        await added;
      }
      await outer.finalize();
    } catch (e) {
      out.destroy(e as Error);
    }
  })();
  return out;
}

/** What the couple's receipt shows (null when guest photo sharing was not bought). */
export async function guestPhotoSummary(db: DbOrTx, invitationId: string, now = new Date()) {
  const [inv] = await db.select().from(invitations).where(eq(invitations.id, invitationId));
  if (!inv?.guestPhotosCap) return null;
  const [{ total, groups }, window] = await Promise.all([photosByGuest(db, inv.id), uploadWindow(db, inv, now)]);
  return { cap: inv.guestPhotosCap, perGuest: inv.guestPhotosPerGuest ?? DEFAULT_PER_GUEST, total, groups, window, uploadToken: inv.guestPhotosToken, expiresAt: inv.expiresAt };
}

/**
 * The team adds guest photo sharing to an order after the fact, changes its size, or takes it off (Admin, owner
 * 2026-11-21: «an option in admin for me to add it separately»). Audited. Taking it off keeps the guests' photos
 * until the invitation ends; the upload page just stops.
 */
export async function setGuestPhotosByAdmin(
  db: DbOrTx,
  invitationId: string,
  choice: { cap: number; perGuest: number } | null,
  actor: { adminId: string; ipHash: string | null },
  reason?: string,
) {
  return db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invitations).where(eq(invitations.id, invitationId)).for('update');
    if (!inv) throw new GuestPhotoError('notFound');
    const before = { cap: inv.guestPhotosCap, perGuest: inv.guestPhotosPerGuest };
    const set = choice
      ? { guestPhotosCap: choice.cap, guestPhotosPerGuest: choice.perGuest, guestPhotosToken: inv.guestPhotosToken ?? newUploadToken() }
      : { guestPhotosCap: null, guestPhotosPerGuest: null };
    await tx.update(invitations).set(set).where(eq(invitations.id, invitationId));
    await recordAudit(tx, {
      actorType: 'ADMIN',
      actorAdminId: actor.adminId,
      action: 'invitation.guest_photos_set',
      objectType: 'invitation',
      objectId: invitationId,
      ipHash: actor.ipHash,
      reason,
      before,
      after: choice,
    });
  });
}
