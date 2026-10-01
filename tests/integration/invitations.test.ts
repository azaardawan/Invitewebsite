import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, invitations, musicTracks } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import {
  changeInvitationMusic,
  extendInvitation,
  getInvitation,
  listInvitations,
  setInvitationPublished,
  updateInvitationValues,
} from '@/server/invitation/admin';
import { resolvePublicInvitation } from '@/server/invitation/public';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

async function published() {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, visitor);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  return inv!;
}
const reason = 'Customer asked by phone';
const row = async (id: string) => (await db().select().from(invitations).where(eq(invitations.id, id)))[0]!;
const actions = async (id: string) => (await db().select().from(auditLogs).where(eq(auditLogs.objectId, id))).map((a) => a.action);

describe('public invitation URLs', () => {
  it('the canonical URL renders; any other slug redirects; a draft looks missing', async () => {
    const inv = await published();
    const canonical = `${inv.slug}-${inv.publicId}`;
    expect(await resolvePublicInvitation(canonical)).toMatchObject({ state: 'live', canonicalPath: `/i/${canonical}` });
    expect(await resolvePublicInvitation(`old-names-${inv.publicId}`)).toEqual({ state: 'redirect', to: `/i/${canonical}` });
    expect(await resolvePublicInvitation(inv.publicId)).toEqual({ state: 'redirect', to: `/i/${canonical}` });
    expect(await resolvePublicInvitation('nothing-here')).toEqual({ state: 'missing' });

    const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, { ...ctx, ipHash: randomToken(8) });
    const [draft] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
    expect(await resolvePublicInvitation(`${draft!.slug}-${draft!.publicId}`)).toEqual({ state: 'missing' });
  });

  it('expired and unpublished invitations show the ended page', async () => {
    const inv = await published();
    await db().update(invitations).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(invitations.id, inv.id));
    expect((await resolvePublicInvitation(`${inv.slug}-${inv.publicId}`)).state).toBe('ended');
  });
});

describe('admin invitation management', () => {
  it('edits details with validation, optimistic locking, slug update and audit', async () => {
    const inv = await published();
    const values = { ...inv.fieldValues, person_1_name: 'Sara', person_2_name: 'Yusuf' };
    const { slug } = await updateInvitationValues(db(), inv.id, { values, expectedVersion: inv.version, reason }, shop.actor);
    expect(slug).toBe('sara-yusuf');
    const after = await row(inv.id);
    expect(after.fieldValues.person_1_name).toBe('Sara');
    expect(after.version).toBe(inv.version + 1);
    // A second editor working from the old version is stopped.
    await expect(updateInvitationValues(db(), inv.id, { values, expectedVersion: inv.version, reason }, shop.actor)).rejects.toMatchObject({ code: 'stale' });
    await expect(updateInvitationValues(db(), inv.id, { values: { ...values, event_time: 'noon' }, expectedVersion: after.version, reason }, shop.actor)).rejects.toMatchObject({
      code: 'invalidFields',
      fieldErrors: { event_time: 'invalidTime' },
    });
    await expect(updateInvitationValues(db(), inv.id, { values, expectedVersion: after.version, reason: '' }, shop.actor)).rejects.toMatchObject({ code: 'reason' });
    expect(await actions(inv.id)).toContain('invitation.edited');
    // The old link now redirects to the new one.
    expect(await resolvePublicInvitation(`${inv.slug}-${inv.publicId}`)).toEqual({ state: 'redirect', to: `/i/sara-yusuf-${inv.publicId}` });
  });

  it('a past event date that is unchanged can stay when fixing other details', async () => {
    const inv = await published();
    await db().update(invitations).set({ fieldValues: { ...inv.fieldValues, event_date: '2026-01-10' } }).where(eq(invitations.id, inv.id));
    const cur = await row(inv.id);
    await expect(updateInvitationValues(db(), inv.id, { values: { ...cur.fieldValues, venue_name: 'قاعة جديدة' }, expectedVersion: cur.version, reason }, shop.actor)).resolves.toBeDefined();
  });

  it('extends from the current end, or from now if already ended', async () => {
    const inv = await published();
    const { expiresAt } = await extendInvitation(db(), inv.id, { days: 10, reason }, shop.actor);
    expect(expiresAt.getTime()).toBe(inv.expiresAt!.getTime() + 10 * 86400_000);
    await db().update(invitations).set({ expiresAt: new Date(Date.now() - 5 * 86400_000) }).where(eq(invitations.id, inv.id));
    const now = new Date();
    const again = await extendInvitation(db(), inv.id, { days: 3, reason }, shop.actor, now);
    expect(again.expiresAt.getTime()).toBe(now.getTime() + 3 * 86400_000);
    await expect(extendInvitation(db(), inv.id, { days: 0, reason }, shop.actor)).rejects.toMatchObject({ code: 'days' });
    expect(await actions(inv.id)).toContain('invitation.extended');
  });

  it('unpublishes and republishes, keeping the dates', async () => {
    const inv = await published();
    await setInvitationPublished(db(), inv.id, { published: false, reason }, shop.actor);
    expect((await row(inv.id)).status).toBe('UNPUBLISHED');
    expect((await resolvePublicInvitation(`${inv.slug}-${inv.publicId}`)).state).toBe('ended');
    await expect(setInvitationPublished(db(), inv.id, { published: false, reason }, shop.actor)).rejects.toMatchObject({ code: 'notPublished' });
    await setInvitationPublished(db(), inv.id, { published: true, reason }, shop.actor);
    const back = await row(inv.id);
    expect(back.status).toBe('PUBLISHED');
    expect(back.expiresAt).toEqual(inv.expiresAt);
    expect(await actions(inv.id)).toEqual(expect.arrayContaining(['invitation.unpublished', 'invitation.republished']));
  });

  it('changes only this invitation’s song', async () => {
    const inv = await published();
    const [track] = await db().select().from(musicTracks).where(eq(musicTracks.status, 'ACTIVE')).limit(1);
    await changeInvitationMusic(db(), inv.id, { musicTrackId: null, reason }, shop.actor);
    expect((await row(inv.id)).musicTrackId).toBeNull();
    if (track) {
      await changeInvitationMusic(db(), inv.id, { musicTrackId: track.id, reason }, shop.actor);
      expect((await row(inv.id)).musicTrackId).toBe(track.id);
    }
    await expect(changeInvitationMusic(db(), inv.id, { musicTrackId: '00000000-0000-4000-8000-000000000000', reason }, shop.actor)).rejects.toMatchObject({ code: 'music' });
  });

  it('lists and finds invitations by name, id or order number', async () => {
    const inv = await published();
    const detail = await getInvitation(db(), inv.id);
    expect(detail?.orders[0]?.status).toBe('PAID');
    const byId = await listInvitations(db(), { q: inv.publicId });
    expect(byId.map((r) => r.invitation.id)).toEqual([inv.id]);
    const byOrder = await listInvitations(db(), { q: detail!.orders[0]!.orderNumber });
    expect(byOrder[0]?.invitation.id).toBe(inv.id);
    const live = await listInvitations(db(), { filter: 'live', limit: 500 });
    expect(live.some((r) => r.invitation.id === inv.id)).toBe(true);
  });
});
