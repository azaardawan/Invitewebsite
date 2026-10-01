/** E2E/dev fixture: an unpaid order (manual mode) with payment settings filled in. Prints the receipt token. */
import { eq } from 'drizzle-orm';
import { closeDb, db } from '../../src/server/db/client';
import { themes } from '../../src/server/db/schema';
import { packagesWithShape } from '../../src/server/catalog/themes';
import { createDraft } from '../../src/server/orders/drafts';
import { createOrder } from '../../src/server/orders/checkout';
import { updatePaymentSettings } from '../../src/server/settings/service';
import { randomToken } from '../../src/lib/crypto';

try {
  const [t] = await db().select().from(themes).where(eq(themes.key, 'demo-minimal'));
  const pkg = (await packagesWithShape(db(), t!.id)).find((p) => p.status === 'ACTIVE')!;
  await updatePaymentSettings(db(), { whatsapp: '+9647701234567', manualInstructions: { ar: 'ادفع عبر زين كاش إلى 07701234567', en: 'Pay with Zain Cash to 07701234567' } }, { adminId: null, ipHash: null });
  const date = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  const ctx = { ipHash: randomToken(8), userAgent: 'e2e' };
  const d = await createDraft(db(), { themeKey: 'demo-minimal', packageId: pkg.id, locale: 'ar', values: { person_1_name: 'ريم', event_date: date, event_time: '18:00', venue_name: 'قاعة' } }, ctx);
  const o = await createOrder(db(), { previewToken: d.previewToken, customer: { name: 'زبون يدوي', phone: '07701234567', email: 'm@bahja.test' }, acceptedTerms: true, idempotencyKey: randomToken(18) }, ctx);
  console.log(JSON.stringify({ receiptToken: o.receiptToken, orderNumber: o.orderNumber }));
} finally {
  await closeDb();
}
