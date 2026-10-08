import 'server-only';
import { and, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { invitations, themePalettes, type CardOptions } from '@/server/db/schema';
import { storeSignature } from '@/server/media/assets';
import { MediaError } from '@/server/media/process';
import { OrderError } from './common';

type InvitationRow = typeof invitations.$inferSelect;

/** Limits for the customer's text on the back of the printable card. */
export const CARD_BACK_LIMITS = { title: 40, message: 300 } as const;

/**
 * Optional choices on the order form, each only for packages that include it:
 * - `cardBack` (print_card): big title and smaller message for the back of the card;
 * - `signature` / `signature2` (signature): each a PNG data URL from a drawing pad, `keep` (unchanged) or
 *   `none`; the customer chooses one signature or two (the second is then `none`);
 * - `paletteId` (color_choice): one of the theme's colour sets, or '' for the theme's own colours.
 */
export type OrderExtras = { cardBack?: { title: string; message: string }; signature?: string; signature2?: string; paletteId?: string };

/** What to store on the invitation for these choices. Throws OrderError('invalidFields') for bad input. */
export async function extrasUpdate(db: DbOrTx, inv: Pick<InvitationRow, 'themeId' | 'featureKeys' | 'cardOptions' | 'signatureAssetId' | 'signature2AssetId' | 'colors'>, extras: OrderExtras) {
  const set: Partial<Pick<InvitationRow, 'cardOptions' | 'signatureAssetId' | 'signature2AssetId' | 'colors'>> = {};
  const errors: Record<string, string> = {};

  if (extras.cardBack && inv.featureKeys.includes('print_card')) {
    const title = extras.cardBack.title.trim();
    const message = extras.cardBack.message.replace(/\r\n/g, '\n').trim();
    if (title.length > CARD_BACK_LIMITS.title) errors.cardBackTitle = 'tooLong';
    if (message.length > CARD_BACK_LIMITS.message) errors.cardBackMessage = 'tooLong';
    const next: CardOptions = { ...(inv.cardOptions ?? {}) };
    if (title) next.backTitle = title;
    else delete next.backTitle;
    if (message) next.backMessage = message;
    else delete next.backMessage;
    set.cardOptions = next;
  }

  for (const [input, column] of [
    [extras.signature, 'signatureAssetId'],
    [extras.signature2, 'signature2AssetId'],
  ] as const) {
    if (input === undefined || input === 'keep' || !inv.featureKeys.includes('signature')) continue;
    if (input === 'none' || input === '') set[column] = null;
    else {
      try {
        set[column] = (await storeSignature(db, input))?.id ?? null;
      } catch (e) {
        if (!(e instanceof MediaError)) throw e;
        errors.signature = 'invalid';
      }
    }
  }
  // Only a second signature (the first pad left empty): it becomes the first.
  const first = set.signatureAssetId !== undefined ? set.signatureAssetId : inv.signatureAssetId;
  const second = set.signature2AssetId !== undefined ? set.signature2AssetId : inv.signature2AssetId;
  if (!first && second) {
    set.signatureAssetId = second;
    set.signature2AssetId = null;
  }

  if (extras.paletteId !== undefined && inv.featureKeys.includes('color_choice')) {
    if (!extras.paletteId) set.colors = null;
    else if (!/^[0-9a-f-]{36}$/i.test(extras.paletteId)) errors.palette = 'invalid';
    else {
      const [p] = await db
        .select({ colors: themePalettes.colors })
        .from(themePalettes)
        .where(and(eq(themePalettes.id, extras.paletteId), eq(themePalettes.themeId, inv.themeId), eq(themePalettes.status, 'ACTIVE')));
      if (!p) errors.palette = 'invalid';
      else set.colors = p.colors;
    }
  }

  if (Object.keys(errors).length) throw new OrderError('invalidFields', errors);
  return set;
}
