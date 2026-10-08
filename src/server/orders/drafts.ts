import 'server-only';
import { and, eq, gt, inArray } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations } from '@/server/db/schema';
import type { Locale } from '@/i18n/config';
import { invitationPublicId, slugFromNames } from '@/lib/ids';
import type { RequestContext } from '@/server/auth/request-context';
import { consumeRateLimit } from '@/server/rate-limit';
import { OrderError, PREVIEW_TTL_MS, fieldDefs, loadPurchasable } from './common';
import { newPreviewToken, previewTokenHash } from './tokens';
import { trackEvent } from '@/server/analytics/events';
import { validateFieldValues } from './validation';
import { extrasUpdate, type OrderExtras } from './extras';

export type DraftInput = { themeKey: string; packageId: string; locale: Locale; values: Record<string, unknown>; extras?: OrderExtras };

/** Step 1 of buying: the customer's details become a private draft with a preview link. */
export async function createDraft(db: DbOrTx, input: DraftInput, ctx: RequestContext, now = new Date()) {
  if (ctx.ipHash && !(await consumeRateLimit(db, `draft:${ctx.ipHash}`, 30, 3600, now))) throw new OrderError('rateLimited');
  const p = await loadPurchasable(db, input.themeKey, input.packageId);
  const result = validateFieldValues(input.values, p.pkg.fieldKeys, p.defs, now);
  if (!result.ok) throw new OrderError('invalidFields', result.errors);
  // Card back, signature and colour set (only what the package includes).
  const extra = await extrasUpdate(db, { themeId: p.theme.id, featureKeys: p.pkg.featureKeys, cardOptions: {}, signatureAssetId: null, colors: null }, input.extras ?? {});

  const token = newPreviewToken();
  for (let attempt = 0; attempt < 5; attempt++) {
    const inserted = await db
      .insert(invitations)
      .values({
        publicId: invitationPublicId(),
        slug: slugFromNames([result.values.person_1_name, result.values.person_2_name]),
        themeId: p.theme.id,
        themeVersionId: p.version.id,
        packageId: p.pkg.id,
        sectionId: p.theme.sectionId,
        locale: input.locale,
        fieldValues: result.values,
        fieldKeys: p.pkg.fieldKeys,
        featureKeys: p.pkg.featureKeys,
        musicTrackId: p.theme.musicTrackId,
        ...extra,
        previewTokenHash: previewTokenHash(token),
        previewExpiresAt: new Date(now.getTime() + PREVIEW_TTL_MS),
      })
      .onConflictDoNothing({ target: invitations.publicId })
      .returning({ id: invitations.id, publicId: invitations.publicId });
    if (inserted[0]) {
      await trackEvent(db, { name: 'order_started', locale: input.locale, themeId: p.theme.id, packageId: p.pkg.id, invitationId: inserted[0].id, occurredAt: now });
      return { previewToken: token, invitationId: inserted[0].id };
    }
  }
  throw new Error('Could not allocate a unique invitation id');
}

/** Finds a draft/awaiting-payment invitation by its preview token (valid and unexpired). */
export async function findByPreviewToken(db: DbOrTx, token: string, now = new Date()) {
  if (!token || token.length > 100) return null;
  const [row] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.previewTokenHash, previewTokenHash(token)),
        gt(invitations.previewExpiresAt, now),
        inArray(invitations.status, ['DRAFT', 'AWAITING_PAYMENT']),
      ),
    );
  return row ?? null;
}

/** The customer corrects their details before paying; each edit extends the preview window. */
export async function updateDraft(
  db: DbOrTx,
  token: string,
  input: { values: Record<string, unknown>; locale?: Locale; extras?: OrderExtras },
  now = new Date(),
) {
  return db.transaction(async (tx) => {
    const draft = await findByPreviewToken(tx, token, now);
    if (!draft) throw new OrderError('previewExpired');
    const [locked] = await tx.select().from(invitations).where(eq(invitations.id, draft.id)).for('update');
    if (locked!.status !== 'DRAFT') throw new OrderError('locked');
    const result = validateFieldValues(input.values, locked!.fieldKeys, await fieldDefs(tx, locked!.fieldKeys), now);
    if (!result.ok) throw new OrderError('invalidFields', result.errors);
    const extra = await extrasUpdate(tx, locked!, input.extras ?? {});
    await tx
      .update(invitations)
      .set({
        ...extra,
        fieldValues: result.values,
        slug: slugFromNames([result.values.person_1_name, result.values.person_2_name]),
        locale: input.locale ?? locked!.locale,
        previewExpiresAt: new Date(now.getTime() + 24 * 3600_000),
      })
      .where(eq(invitations.id, locked!.id));
  });
}
