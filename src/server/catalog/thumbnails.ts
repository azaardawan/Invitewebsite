import 'server-only';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { themes } from '@/server/db/schema';
import { storeImage } from '@/server/media/assets';
import { CatalogError, type Actor } from './common';
import { setThemeCover } from './themes';

/**
 * A design's own storefront thumbnail: `themes/<key>/thumbnail.webp`, 900 × 1320 (the designs list's card shape,
 * 3 : 4.4), made from the design's first screen with sample names so the whole of it shows in the arch-shaped cards.
 * It sits beside the version folders (never inside a frozen one) and is used only when the owner chooses it in Admin.
 */
const KEY = /^[a-z0-9][a-z0-9-]{0,62}$/;
const file = (key: string) => path.join(process.cwd(), 'themes', key, 'thumbnail.webp');

export async function designThumbnail(key: string): Promise<Buffer | null> {
  if (!KEY.test(key)) return null;
  return readFile(file(key)).catch(() => null);
}

/** The keys of the designs that have a thumbnail. */
export async function designThumbnailKeys(): Promise<string[]> {
  const dir = path.join(process.cwd(), 'themes');
  const keys = (await readdir(dir).catch(() => [] as string[])).filter((k) => KEY.test(k));
  const found = await Promise.all(keys.map(async (k) => ((await designThumbnail(k)) ? k : null)));
  return found.filter((k): k is string => k !== null);
}

/** Makes the design's thumbnail its cover (stored like an uploaded picture, centred); audited. */
export async function applyDesignThumbnail(db: DbOrTx, themeId: string, actor: Actor) {
  const [theme] = await db.select({ key: themes.key }).from(themes).where(eq(themes.id, themeId));
  if (!theme) throw new CatalogError('notFound');
  const image = await designThumbnail(theme.key);
  if (!image) throw new CatalogError('notFound');
  const asset = await storeImage(db, image, { filename: `${theme.key}-thumbnail.webp`, uploadedBy: actor.adminId });
  await setThemeCover(db, themeId, asset.id, actor, 'design_thumbnail');
}

/** Every design with a thumbnail gets it as its cover. Returns how many changed. */
export async function applyAllDesignThumbnails(db: DbOrTx, actor: Actor) {
  const keys = new Set(await designThumbnailKeys());
  const rows = await db.select({ id: themes.id, key: themes.key }).from(themes);
  let n = 0;
  for (const r of rows)
    if (keys.has(r.key)) {
      await applyDesignThumbnail(db, r.id, actor);
      n++;
    }
  return n;
}
