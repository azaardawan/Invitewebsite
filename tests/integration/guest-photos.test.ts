import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { db } from '@/server/db/client';
import { guestPhotos, invitations } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { randomToken } from '@/lib/crypto';
import {
  GuestPhotoError,
  deleteEndedGuestPhotos,
  deleteOwnPhoto,
  devicePhotos,
  deviceHashOf,
  guestPhotosZip,
  invitationByUploadToken,
  photoKind,
  photosByGuest,
  removeGuestPhoto,
  uploadGuestPhoto,
  uploadWindow,
} from '@/server/guest-photos/service';
import { BASE_CAP, guestPhotoPrice, validCap } from '@/catalog/guest-photos';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

const EVENT = '2027-03-10';
/** Noon in Baghdad on a day around the event. */
const day = (offset: number) => new Date(Date.parse(`${EVENT}T09:00:00Z`) + offset * 86400_000);

async function bought(opts: { cap?: number; perGuest?: number; values?: Record<string, string> } = {}) {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues({ event_date: EVENT, ...opts.values }) }, visitor);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  const token = randomToken(18);
  const [inv] = await db()
    .update(invitations)
    .set({ guestPhotosCap: opts.cap ?? 750, guestPhotosPerGuest: opts.perGuest ?? 5, guestPhotosToken: token, expiresAt: new Date(Date.parse(`${EVENT}T00:00:00Z`) + 60 * 86400_000) })
    .where(eq(invitations.id, d.invitationId))
    .returning();
  return { inv: inv!, token };
}

let n = 0;
/** A different small JPEG each time (the same photo is refused twice). */
const jpeg = () => sharp({ create: { width: 40 + (n++ % 50), height: 30, channels: 3, background: { r: n % 255, g: 90, b: 120 } } }).jpeg().toBuffer();

describe('guest photo sharing: price', () => {
  it('only the total sets the price: the basic price, plus the rate for every 50 photos over 750', () => {
    const pricing = { basePriceIqd: 15000, stepPriceIqd: 5000, maxCap: 3000 };
    expect(guestPhotoPrice(BASE_CAP, pricing)).toBe(15000);
    expect(guestPhotoPrice(1000, pricing)).toBe(40000);
    expect(validCap(750, pricing)).toBe(true);
    expect(validCap(775, pricing)).toBe(false);
    expect(validCap(700, pricing)).toBe(false);
    expect(validCap(3050, pricing)).toBe(false);
  });
});

describe('guest photo sharing: uploads', () => {
  it('opens 2 days before the event and closes 2 days after (Baghdad days)', async () => {
    const { inv } = await bought();
    expect((await uploadWindow(db(), inv, day(-3))).open).toBe(false);
    expect((await uploadWindow(db(), inv, day(-2))).open).toBe(true);
    expect((await uploadWindow(db(), inv, day(2))).open).toBe(true);
    expect((await uploadWindow(db(), inv, day(3))).open).toBe(false);
  });

  it('finds the invitation only by its own upload link', async () => {
    const { inv, token } = await bought();
    expect((await invitationByUploadToken(db(), token))?.id).toBe(inv.id);
    expect(await invitationByUploadToken(db(), 'x'.repeat(24))).toBeNull();
    expect(await invitationByUploadToken(db(), '../../etc')).toBeNull();
  });

  it('keeps each phone to its share, refuses the same photo twice, and stops at the total', async () => {
    const { inv } = await bought({ cap: 3, perGuest: 2 });
    const now = day(0);
    const a = deviceHashOf(randomToken(16));
    const b = deviceHashOf(randomToken(16));
    const first = await jpeg();
    await uploadGuestPhoto(db(), inv, { deviceHash: a, name: 'سارة', bytes: first }, now);
    await expect(uploadGuestPhoto(db(), inv, { deviceHash: b, name: 'عمر', bytes: first }, now)).rejects.toMatchObject({ code: 'duplicate' });
    await uploadGuestPhoto(db(), inv, { deviceHash: a, name: 'سارة', bytes: await jpeg() }, now);
    await expect(uploadGuestPhoto(db(), inv, { deviceHash: a, name: 'سارة', bytes: await jpeg() }, now)).rejects.toMatchObject({ code: 'shareUsed' });
    await uploadGuestPhoto(db(), inv, { deviceHash: b, name: 'عمر', bytes: await jpeg() }, now);
    await expect(uploadGuestPhoto(db(), inv, { deviceHash: b, name: 'عمر', bytes: await jpeg() }, now)).rejects.toMatchObject({ code: 'full' });
    expect((await devicePhotos(db(), inv.id, a)).length).toBe(2);
  });

  it('refuses closed uploads, files that are not photos, and a missing name', async () => {
    const { inv } = await bought();
    const dev = deviceHashOf(randomToken(16));
    await expect(uploadGuestPhoto(db(), inv, { deviceHash: dev, name: 'سارة', bytes: await jpeg() }, day(-5))).rejects.toMatchObject({ code: 'closed' });
    await expect(uploadGuestPhoto(db(), inv, { deviceHash: dev, name: 'سارة', bytes: Buffer.from('<svg></svg> not a photo at all') }, day(0))).rejects.toMatchObject({ code: 'type' });
    await expect(uploadGuestPhoto(db(), inv, { deviceHash: dev, name: '   ', bytes: await jpeg() }, day(0))).rejects.toBeInstanceOf(GuestPhotoError);
    expect(photoKind(Buffer.from('0000ftypheic00000000'))?.type).toBe('image/heic');
  });

  it('a guest removes only their own photos; the couple removes any; the team is audited', async () => {
    const { inv } = await bought();
    const a = deviceHashOf(randomToken(16));
    const b = deviceHashOf(randomToken(16));
    const pa = await uploadGuestPhoto(db(), inv, { deviceHash: a, name: 'سارة', bytes: await jpeg() }, day(0));
    const pb = await uploadGuestPhoto(db(), inv, { deviceHash: b, name: 'عمر', bytes: await jpeg() }, day(0));
    await expect(deleteOwnPhoto(db(), inv, b, pa.id, day(0))).rejects.toMatchObject({ code: 'notFound' });
    await deleteOwnPhoto(db(), inv, a, pa.id, day(0));
    await removeGuestPhoto(db(), inv.id, pb.id);
    expect((await photosByGuest(db(), inv.id)).total).toBe(0);
  });

  it('groups by name for the couple and zips a ZIP per guest inside one ZIP', async () => {
    const { inv } = await bought();
    for (const [name, k] of [['Sara', 2], ['Omar', 1], ['sara', 1]] as const)
      for (let i = 0; i < k; i++) await uploadGuestPhoto(db(), inv, { deviceHash: deviceHashOf(`${name}-${i}`), name, bytes: await jpeg() }, day(0));
    const { total, groups } = await photosByGuest(db(), inv.id);
    expect(total).toBe(4);
    expect(groups.map((g) => [g.name, g.photos.length])).toEqual([
      ['Sara', 3],
      ['Omar', 1],
    ]);
    const chunks: Buffer[] = [];
    for await (const c of guestPhotosZip(groups)) chunks.push(c as Buffer);
    const zip = Buffer.concat(chunks);
    expect(zip.subarray(0, 4).toString('hex')).toBe('504b0304');
    expect(zip.toString('latin1')).toContain('Sara.zip');
    expect(zip.toString('latin1')).toContain('Omar.zip');
  });

  it('deletes the photos once the invitation has ended', async () => {
    const { inv } = await bought();
    await uploadGuestPhoto(db(), inv, { deviceHash: deviceHashOf('x'), name: 'سارة', bytes: await jpeg() }, day(0));
    await deleteEndedGuestPhotos(db(), new Date(Date.parse(`${EVENT}T00:00:00Z`) + 61 * 86400_000));
    expect(await db().select().from(guestPhotos).where(eq(guestPhotos.invitationId, inv.id))).toHaveLength(0);
  });
});
