import 'server-only';
import { invitationNames } from '@/catalog/fields';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations, orders } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { consumeRateLimit } from '@/server/rate-limit';
import { fieldDefs } from '@/server/orders/common';
import { isLive } from '@/server/orders/payment';
import { receiptTokenHash } from '@/server/orders/tokens';
import { validateFieldValues } from '@/server/orders/validation';
import { isLocale, type Locale } from '@/i18n/config';
import { slugFromNames } from '@/lib/ids';
import { extrasUpdate } from '@/server/orders/extras';
import { OrderError } from '@/server/orders/common';

/** How many times a customer can change their published invitation themselves (packages with `self_edit`). */
export const SELF_EDIT_LIMIT = 3;

type InvitationRow = typeof invitations.$inferSelect;

/** Whether the customer may edit now, and how many edits are left. */
export function selfEditState(inv: Pick<InvitationRow, 'featureKeys' | 'status' | 'expiresAt' | 'selfEdits'>, now = new Date()) {
  const included = inv.featureKeys.includes('self_edit');
  const left = Math.max(0, SELF_EDIT_LIMIT - inv.selfEdits);
  return { included, left, allowed: included && isLive(inv, now) && left > 0 };
}

export type CustomerEditResult =
  | { ok: true; left: number }
  | { ok: false; error: 'notFound' | 'notAllowed' | 'limitReached' | 'rateLimited' | 'invalidFields'; fieldErrors?: Record<string, string> };

/**
 * The customer corrects their own published invitation from their private
 * receipt (reached by link or invitation number). Same validation as the order
 * form; a date already set may stay as it is even if it has passed. The PDFs
 * follow automatically (they are rebuilt when the details change). Audited.
 */
export async function customerEditInvitation(
  db: DbOrTx,
  input: { receiptToken: string; values: Record<string, unknown>; locale?: string; ipHash: string | null; signature?: string; signature2?: string },
  now = new Date(),
): Promise<CustomerEditResult> {
  if (input.ipHash && !(await consumeRateLimit(db, `self-edit:${input.ipHash}`, 20, 3600, now))) return { ok: false, error: 'rateLimited' };
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ order: orders, inv: invitations })
      .from(orders)
      .innerJoin(invitations, eq(invitations.id, orders.invitationId))
      .where(eq(orders.receiptTokenHash, receiptTokenHash(input.receiptToken)));
    if (!row || row.order.status !== 'PAID') return { ok: false, error: 'notFound' } as const;
    const [inv] = await tx.select().from(invitations).where(eq(invitations.id, row.inv.id)).for('update');
    const state = selfEditState(inv!, now);
    if (!state.included || !isLive(inv!, now)) return { ok: false, error: 'notAllowed' } as const;
    if (state.left === 0) return { ok: false, error: 'limitReached' } as const;

    const existingDate = inv!.fieldValues.event_date;
    const keepsPastDate = typeof existingDate === 'string' && input.values.event_date === existingDate;
    const validateAt = keepsPastDate && new Date(`${existingDate}T00:00:00Z`) < now ? new Date(`${existingDate}T00:00:00Z`) : now;
    const result = validateFieldValues(input.values, inv!.fieldKeys, await fieldDefs(tx, inv!.fieldKeys), validateAt);
    if (!result.ok) return { ok: false, error: 'invalidFields', fieldErrors: result.errors } as const;

    // Signatures can be redrawn too (packages with `signature`): same pads as the order form.
    let signatures;
    try {
      signatures = await extrasUpdate(tx, inv!, { signature: input.signature, signature2: input.signature2 });
    } catch (e) {
      if (e instanceof OrderError) return { ok: false, error: 'invalidFields', fieldErrors: e.fieldErrors } as const;
      throw e;
    }

    const locale: Locale = input.locale && isLocale(input.locale) ? input.locale : inv!.locale;
    const slug = slugFromNames(invitationNames(result.values));
    await tx
      .update(invitations)
      .set({ ...signatures, fieldValues: result.values, slug, locale, selfEdits: inv!.selfEdits + 1, version: inv!.version + 1 })
      .where(eq(invitations.id, inv!.id));
    await recordAudit(tx, {
      actorType: 'CUSTOMER',
      action: 'invitation.customer_edited',
      objectType: 'invitation',
      objectId: inv!.id,
      before: { values: inv!.fieldValues, locale: inv!.locale, slug: inv!.slug, signatures: [inv!.signatureAssetId, inv!.signature2AssetId] },
      after: {
        values: result.values,
        locale,
        slug,
        selfEdits: inv!.selfEdits + 1,
        signatures: [signatures.signatureAssetId ?? inv!.signatureAssetId, signatures.signature2AssetId ?? inv!.signature2AssetId],
      },
      ipHash: input.ipHash,
    });
    return { ok: true, left: state.left - 1 } as const;
  });
}
