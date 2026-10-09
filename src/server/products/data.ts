import 'server-only';
import type { DbOrTx } from '@/server/db/client';
import type { invitations } from '@/server/db/schema';
import type { ThemeProps } from '@/theme-sdk/types';
import type { ProductData } from '@/components/print/Products';
import { themeArtwork, type ResolvedArtwork } from '@/server/catalog/card-design';
import { invitationMessages } from '@/server/invitation/theme-props';
import { invitationRenderData } from '@/server/invitation/load';

type InvitationRow = typeof invitations.$inferSelect;

/** The newborn extras a package can include, and the feature that switches each on. */
export const PRODUCTS = { story: 'story', sticker: 'sticker', bottle: 'bottle_label' } as const;
export type Product = keyof typeof PRODUCTS;

/** Paid (or published): the files come without a watermark. Before that every picture is watermarked. */
export function isPaid(inv: Pick<InvitationRow, 'status' | 'publishedAt'>) {
  return inv.status === 'PAID' || inv.status === 'PUBLISHED' || (inv.status === 'UNPUBLISHED' && inv.publishedAt !== null);
}

/** What the story, sticker and bottle label show, from an invitation's (or a sample's) theme props. */
export function productDataFrom(
  props: ThemeProps,
  design: Pick<ResolvedArtwork, 'story' | 'sticker' | 'bottle'>,
  opts: { stickerShape: 'round' | 'square'; watermark: boolean },
): ProductData {
  const msgs = invitationMessages(props.locale) as unknown as { print: { watermark: string; watermarkNote: string } };
  const f = props.fields;
  const gender = f.baby_gender === 'boy' || f.baby_gender === 'girl' ? f.baby_gender : null;
  return {
    dir: props.dir,
    lang: props.lang,
    babyName: f.baby_name ?? f.person_1_name ?? null,
    gender,
    parents: [f.mother_name, f.father_name].filter(Boolean).join(` ${props.labels.and} `) || null,
    birthDate: props.birthDate?.full ?? props.event.date?.full ?? null,
    quote: f.baby_quote ?? null,
    labels: { itsABoy: props.labels.itsABoy, itsAGirl: props.labels.itsAGirl, bornOn: props.labels.bornOn, watermark: msgs.print.watermark, watermarkNote: msgs.print.watermarkNote },
    design: { story: design.story, sticker: design.sticker, bottle: design.bottle },
    stickerShape: opts.stickerShape,
    watermark: opts.watermark,
  };
}

/** A customer's extras: watermarked until the invitation is paid (decided here, on the server). */
export async function productData(db: DbOrTx, inv: InvitationRow): Promise<ProductData> {
  const { props } = await invitationRenderData(db, inv, 'live');
  return productDataFrom(props, await themeArtwork(db, inv.themeId), { stickerShape: inv.stickerShape, watermark: !isPaid(inv) });
}
