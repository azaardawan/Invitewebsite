import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, generatedDocuments, invitations } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { updateInvitationValues } from '@/server/invitation/admin';
import { submitGuestResponse } from '@/server/guests/responses';
import { DocumentError, ensureDocument, printShopCard, removeCustomCard, updateCardOptions, uploadCustomCard } from '@/server/documents/documents';
import { customerDelivery, keepsakeReady } from '@/server/documents/delivery';
import { receiptTokenHash } from '@/server/orders/tokens';
import { orders } from '@/server/db/schema';
import { PDFDocument } from 'pdf-lib';
import { printData } from '@/server/documents/data';
import { printToken, verifyPrintToken } from '@/server/documents/tokens';
import { storage } from '@/server/storage';
import { randomToken } from '@/lib/crypto';
import { activeTheme, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

let shop: Awaited<ReturnType<typeof activeTheme>>;
beforeAll(async () => {
  shop = await activeTheme();
});

async function order(paid: boolean) {
  const visitor = { ...ctx, ipHash: randomToken(8) };
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId: shop.full.id, locale: 'ar', values: weddingValues() }, visitor);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون', phone: '07701234567', email: 'c@example.com' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, visitor);
  if (paid) await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  return (await db().select().from(invitations).where(eq(invitations.id, d.invitationId)))[0]!;
}

/** Stand-in for Chromium: a tiny fake PDF that records each call. */
function fakeRenderer() {
  const calls: string[] = [];
  const render = async (kind: string, id: string) => {
    calls.push(`${kind}:${id}`);
    return Buffer.from(`%PDF-1.7 fake ${kind} ${calls.length}`);
  };
  return { calls, render };
}

describe('print tokens', () => {
  it('accept their own signature only, until they expire', () => {
    const id = crypto.randomUUID();
    const token = printToken('card', id, 60, 1_000_000);
    expect(verifyPrintToken(token, 1_000_000)).toEqual({ kind: 'card', invitationId: id });
    expect(verifyPrintToken(token, 1_000_000 + 61_000)).toBeNull();
    expect(verifyPrintToken(token.replace('card.', 'keepsake.'), 1_000_000)).toBeNull();
    expect(verifyPrintToken(`${token.slice(0, -2)}xx`, 1_000_000)).toBeNull();
    expect(verifyPrintToken('nonsense', 1_000_000)).toBeNull();
  });
});

describe('printable card', () => {
  it('passes only package fields, localized labels and a QR code to the invitation', async () => {
    const inv = await order(true);
    const data = await printData(db(), inv, 'card');
    expect(data.kind).toBe('card');
    expect(data.page).toEqual({ width: '148mm', height: '210mm', margin: '0', cropMm: 3 }); // exactly A5, bleed cropped
    expect((await printData(db(), inv, 'cardBleed')).page).toMatchObject({ width: '154mm', height: '216mm', cropMm: 0 });
    expect(data.props.labels.scanToOpen).toBe('امسح الرمز لفتح الدعوة');
    expect(data.props.fields.person_1_name).toBe(inv.fieldValues.person_1_name);
    expect('qrDataUrl' in data.props && data.props.qrDataUrl?.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('is only available after payment', async () => {
    const inv = await order(false);
    await expect(ensureDocument(db(), inv.id, 'card', { render: fakeRenderer().render })).rejects.toThrow(DocumentError);
  });

  it('is generated once, reused while unchanged, and regenerated after an edit', async () => {
    const inv = await order(true);
    const r = fakeRenderer();
    const first = await ensureDocument(db(), inv.id, 'card', { render: r.render });
    const again = await ensureDocument(db(), inv.id, 'card', { render: r.render });
    expect(r.calls).toHaveLength(1);
    expect(again.pdf.equals(first.pdf)).toBe(true);
    expect(first.fileName).toBe(`invitation-card-${inv.publicId}.pdf`);

    const [before] = await db().select().from(generatedDocuments).where(eq(generatedDocuments.invitationId, inv.id));
    await updateInvitationValues(
      db(),
      inv.id,
      { values: { ...inv.fieldValues, venue_name: 'قاعة جديدة' }, expectedVersion: inv.version, reason: 'Customer fixed the venue' },
      { adminId: shop.admin.id, ipHash: null },
    );
    await ensureDocument(db(), inv.id, 'card', { render: r.render });
    expect(r.calls).toHaveLength(2);
    const [after] = await db().select().from(generatedDocuments).where(eq(generatedDocuments.invitationId, inv.id));
    expect(after!.storageKey).not.toBe(before!.storageKey);
    expect(await storage().get(before!.storageKey)).toBeNull(); // the stale copy is removed
  });

  it('Admin can force a regeneration, which is audited', async () => {
    const inv = await order(true);
    const r = fakeRenderer();
    const actor = { adminId: shop.admin.id, ipHash: null };
    await ensureDocument(db(), inv.id, 'card', { render: r.render });
    await ensureDocument(db(), inv.id, 'card', { render: r.render, actor, force: true });
    expect(r.calls).toHaveLength(2);
    const logs = await db().select().from(auditLogs).where(eq(auditLogs.objectId, inv.id));
    expect(logs.some((l) => l.action === 'document.generate')).toBe(true);
  });
});

describe('keepsake', () => {
  it('needs the keepsake feature, and refreshes when a new message arrives', async () => {
    const inv = await order(true);
    const r = fakeRenderer();
    await expect(ensureDocument(db(), inv.id, 'keepsake', { render: r.render })).rejects.toMatchObject({ code: 'notIncluded' });

    await db()
      .update(invitations)
      .set({ featureKeys: [...inv.featureKeys, 'congratulations', 'keepsake_pdf'] })
      .where(eq(invitations.id, inv.id));
    await ensureDocument(db(), inv.id, 'keepsake', { render: r.render });
    await ensureDocument(db(), inv.id, 'keepsake', { render: r.render });
    expect(r.calls).toHaveLength(1);

    await submitGuestResponse(db(), { invitationId: inv.id, response: { name: 'سارة', attendance: 'ATTENDING', message: 'ألف مبروك' }, ipHash: randomToken(8), clientToken: randomToken(24) });
    await ensureDocument(db(), inv.id, 'keepsake', { render: r.render });
    expect(r.calls).toHaveLength(2);
    const docs = await db().select().from(generatedDocuments).where(eq(generatedDocuments.invitationId, inv.id));
    const doc = docs.find((d) => d.kind === 'KEEPSAKE_PDF');
    expect(doc?.messageCount).toBe(1);
  });
});

async function pdfWithPage(width: number, height: number) {
  const doc = await PDFDocument.create();
  doc.addPage([width, height]);
  return Buffer.from(await doc.save());
}

describe('changing the card', () => {
  it('applies the team\'s wording and QR choice, and regenerates', async () => {
    const inv = await order(true);
    const actor = { adminId: shop.admin.id, ipHash: null };
    const r = fakeRenderer();
    await ensureDocument(db(), inv.id, 'card', { render: r.render });

    await updateCardOptions(db(), inv.id, { message: 'دعوة خاصة للأهل', extraLine: 'الدعوة عائلية', showQr: false }, actor);
    const [row] = await db().select().from(invitations).where(eq(invitations.id, inv.id));
    const data = await printData(db(), row!, 'card');
    expect(data.props.fields.invitation_message).toBe('دعوة خاصة للأهل');
    expect('extraLine' in data.props && data.props.extraLine).toBe('الدعوة عائلية');
    expect('qrDataUrl' in data.props && data.props.qrDataUrl).toBeNull();
    await ensureDocument(db(), inv.id, 'card', { render: r.render });
    expect(r.calls).toHaveLength(2);

    await updateCardOptions(db(), inv.id, { message: '' }, actor); // empty = no message on the card
    const [row2] = await db().select().from(invitations).where(eq(invitations.id, inv.id));
    expect((await printData(db(), row2!, 'card')).props.fields.invitation_message).toBeUndefined();
    await expect(updateCardOptions(db(), inv.id, { extraLine: 'x'.repeat(121) }, actor)).rejects.toMatchObject({ code: 'tooLong' });
  });

  it('accepts an uploaded A5 design that replaces the automatic card, and can go back', async () => {
    const inv = await order(true);
    const actor = { adminId: shop.admin.id, ipHash: null };
    await expect(uploadCustomCard(db(), inv.id, Buffer.from('not a pdf'), actor)).rejects.toMatchObject({ code: 'notPdf' });
    await expect(uploadCustomCard(db(), inv.id, await pdfWithPage(595.28, 841.89), actor)).rejects.toMatchObject({ code: 'notA5' }); // A4

    const mine = await pdfWithPage(419.53, 595.28);
    expect(await uploadCustomCard(db(), inv.id, mine, actor)).toBe(1);
    const r = fakeRenderer();
    expect((await ensureDocument(db(), inv.id, 'card', { render: r.render })).pdf.equals(mine)).toBe(true);
    expect((await printShopCard(db(), inv.id, r.render)).pdf.equals(mine)).toBe(true);
    expect(r.calls).toHaveLength(0);

    await removeCustomCard(db(), inv.id, actor);
    await ensureDocument(db(), inv.id, 'card', { render: r.render });
    expect(r.calls).toEqual([`card:${inv.id}`]);
    expect((await printShopCard(db(), inv.id, r.render)).fileName).toContain('print-shop');
    expect(r.calls.at(-1)).toBe(`cardBleed:${inv.id}`);
    const actions = (await db().select().from(auditLogs).where(eq(auditLogs.objectId, inv.id))).map((l) => l.action);
    expect(actions).toEqual(expect.arrayContaining(['card.custom_uploaded', 'card.custom_removed']));
  });
});

describe('keepsake delivery', () => {
  it('reaches the customer once the event has started, with a WhatsApp-ready receipt link', async () => {
    const inv = await order(true);
    const withKeepsake = { ...inv, featureKeys: [...inv.featureKeys, 'keepsake_pdf'] };
    expect(keepsakeReady(withKeepsake, new Date())).toBe(false); // the wedding is weeks away
    expect(keepsakeReady(withKeepsake, new Date(Date.now() + 400 * 86400_000))).toBe(true);
    expect(keepsakeReady(inv, new Date(Date.now() + 400 * 86400_000))).toBe(false); // package without keepsake

    const d = await customerDelivery(db(), inv.id);
    expect(d?.phone).toBe('+9647701234567');
    const token = d!.receiptUrl.split('/r/')[1]!;
    const [o] = await db().select().from(orders).where(eq(orders.invitationId, inv.id));
    expect(o!.receiptTokenHash).toBe(receiptTokenHash(token));
    expect(d!.keepsakeUrl).toBe(`${d!.receiptUrl}/keepsake`);
  });
});

