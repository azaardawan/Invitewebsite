import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, generatedDocuments, invitations } from '@/server/db/schema';
import { createDraft } from '@/server/orders/drafts';
import { createOrder } from '@/server/orders/checkout';
import { markOrderPaid } from '@/server/orders/payment';
import { updateInvitationValues } from '@/server/invitation/admin';
import { submitGuestResponse } from '@/server/guests/responses';
import { DocumentError, ensureDocument } from '@/server/documents/documents';
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
    expect(data.page).toEqual({ width: '154mm', height: '216mm', margin: '0' });
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
