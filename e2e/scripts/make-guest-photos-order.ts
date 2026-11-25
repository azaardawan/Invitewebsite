/**
 * E2E fixture (run after make-order.ts, which puts demo-minimal, a birthday design, on sale): switches guest photo
 * sharing on in Settings and makes a paid order that bought it (5 per guest, 800 in total). Prints its receipt token
 * and the guests' upload token.
 */
import { eq } from 'drizzle-orm';
import { closeDb, db } from '../../src/server/db/client';
import { invitations, themes } from '../../src/server/db/schema';
import { packagesWithShape } from '../../src/server/catalog/themes';
import { createDraft } from '../../src/server/orders/drafts';
import { createOrder } from '../../src/server/orders/checkout';
import { markOrderPaid } from '../../src/server/orders/payment';
import { updateGuestPhotoSettings } from '../../src/server/settings/service';
import { randomToken } from '../../src/lib/crypto';

try {
  await updateGuestPhotoSettings(db(), { enabled: true, basePriceIqd: 15000, stepPriceIqd: 5000, maxCap: 3000 }, { adminId: null, ipHash: null });
  const [t] = await db().select().from(themes).where(eq(themes.key, 'demo-minimal'));
  const packageId = (await packagesWithShape(db(), t!.id)).find((p) => p.status === 'ACTIVE')!.id;
  const date = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  const ctx = { ipHash: randomToken(8), userAgent: 'e2e' };
  const d = await createDraft(
    db(),
    { themeKey: 'demo-minimal', packageId, locale: 'en', values: { person_1_name: 'Layan', event_date: date, event_time: '18:00', venue_name: 'Zawraa Park' }, extras: { guestPhotos: { on: true, cap: 800, perGuest: 5 } } },
    ctx,
  );
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'Test', phone: '07701234567', email: 'e2e@bahja.test' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, ctx);
  await markOrderPaid(db(), o.orderId, { kind: 'WAYL' });
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  console.log(JSON.stringify({ receiptToken: o.receiptToken, uploadToken: inv!.guestPhotosToken, amountIqd: o.amountIqd, invitationId: inv!.id }));
} finally {
  await closeDb();
}
