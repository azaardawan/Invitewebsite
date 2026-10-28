import 'server-only';
import type { DbOrTx } from '@/server/db/client';
import type { invitations } from '@/server/db/schema';
import type { ThemeProps } from '@/theme-sdk/types';
import type { ProductData } from '@/components/print/Products';
import { DEFAULT_BOTTLE_SIZE, type BottleSize } from '@/catalog/products';
import { defaultLook, themeArtwork, type ResolvedArtwork } from '@/server/catalog/card-design';
import { invitationMessages } from '@/server/invitation/theme-props';
import { invitationRenderData } from '@/server/invitation/load';
import { listPhotos } from '@/server/photos/photos';
import { includedCollages } from '@/catalog/collages';
import type { CollageText } from '@/theme-sdk/collage';
import type { ThemePhoto } from '@/theme-sdk/types';

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
  design: Pick<ResolvedArtwork, 'story' | 'sticker' | 'bottle' | 'look'>,
  opts: { stickerShape: 'round' | 'square'; bottleSize?: BottleSize; watermark: boolean; codeRef?: string; collagePhotos?: ThemePhoto[] },
): ProductData {
  const msgs = invitationMessages(props.locale) as unknown as { print: { watermark: string; watermarkNote: string; collage: CollageText } };
  const f = props.fields;
  const gender = f.baby_gender === 'boy' || f.baby_gender === 'girl' ? f.baby_gender : null;
  return {
    dir: props.dir,
    lang: props.lang,
    babyName: f.baby_name ?? f.person_1_name ?? null,
    gender,
    parents: [f.mother_name, f.father_name].filter(Boolean).join(` ${props.labels.and} `) || null,
    birthDate: props.birthDate ? props.birthDate.lines.join(' · ') : (props.event.date?.full ?? null),
    quote: f.baby_quote ?? null,
    labels: { itsABoy: props.labels.itsABoy, itsAGirl: props.labels.itsAGirl, bornOn: props.labels.bornOn, watermark: msgs.print.watermark, watermarkNote: msgs.print.watermarkNote },
    // One look for the whole set: the owner's, or the design's colours (with the customer's colour set).
    look: design.look ?? defaultLook(props.colors),
    design: { story: design.story, sticker: design.sticker, bottle: design.bottle },
    stickerShape: opts.stickerShape,
    bottleSize: opts.bottleSize ?? DEFAULT_BOTTLE_SIZE,
    watermark: opts.watermark,
    locale: props.locale,
    collage: {
      photos: opts.collagePhotos ?? [],
      name: f.person_1_name ?? f.baby_name ?? null,
      message: f.invitation_message?.trim() || null,
      date: props.event.date ? `${props.event.date.day} ${props.event.date.month}` : (props.birthDate?.lines[0] ?? null),
      text: msgs.print.collage,
    },
    theme: opts.codeRef
      ? {
          codeRef: opts.codeRef,
          props: {
            locale: props.locale,
            dir: props.dir,
            lang: props.lang,
            fields: props.fields,
            birthDate: props.birthDate,
            wording: props.wording,
            switches: props.switches,
            labels: { itsABoy: props.labels.itsABoy, itsAGirl: props.labels.itsAGirl, bornOn: props.labels.bornOn, and: props.labels.and },
          },
        }
      : null,
  };
}

/**
 * A customer's extras: watermarked until the invitation is paid (decided here, on the server). Stickers are
 * drawn in the chosen shape; with both shapes chosen, round unless `stickerShape` asks for the square set.
 */
export async function productData(db: DbOrTx, inv: InvitationRow, opts: { stickerShape?: 'round' | 'square' } = {}): Promise<ProductData> {
  const { codeRef, props } = await invitationRenderData(db, inv, 'live');
  const stickerShape = opts.stickerShape ?? (inv.stickerShape === 'both' ? 'round' : inv.stickerShape);
  // Collages: the customer's photos at full size, for print (only when the package has a collage).
  const collagePhotos = includedCollages(inv.featureKeys).length
    ? (await listPhotos(db, inv.id)).map((p, i) => ({ index: i, src: p.fullSrc, width: p.width, height: p.height, focus: p.focus, label: null }))
    : [];
  return productDataFrom(props, await themeArtwork(db, inv.themeId), { stickerShape, bottleSize: inv.bottleSize, watermark: !isPaid(inv), codeRef, collagePhotos });
}
