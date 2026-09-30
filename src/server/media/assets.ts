import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets } from '@/server/db/schema';
import { storage, publicMediaUrl } from '@/server/storage';
import { sha256Buffer } from '@/lib/crypto';
import { processAudio, processImage } from './process';

export type AssetRecord = typeof assets.$inferSelect;

function safeFilename(name: string | undefined) {
  return name ? name.replace(/[^\p{L}\p{N}._ -]/gu, '').slice(0, 120) || null : null;
}

/** Stores an uploaded image (re-encoded) and records it. */
export async function storeImage(db: DbOrTx, input: Buffer, opts: { filename?: string; uploadedBy: string | null }) {
  const img = await processImage(input);
  const hash = sha256Buffer(img.data);
  const [existing] = await db.select().from(assets).where(and(eq(assets.kind, 'IMAGE'), eq(assets.sha256, hash)));
  if (existing) return existing;
  const key = `images/${randomUUID()}.${img.ext}`;
  await storage().put(key, img.data, img.mime);
  const [row] = await db
    .insert(assets)
    .values({
      kind: 'IMAGE',
      storageKey: key,
      mime: img.mime,
      bytes: img.data.byteLength,
      width: img.width,
      height: img.height,
      sha256: hash,
      originalFilename: safeFilename(opts.filename),
      uploadedBy: opts.uploadedBy,
    })
    .returning();
  return row!;
}

/** Stores an MP3 once: re-uploading identical audio returns the existing asset. */
export async function storeAudio(db: DbOrTx, input: Buffer, opts: { filename?: string; uploadedBy: string | null }) {
  const audio = await processAudio(input);
  const hash = sha256Buffer(audio.data);
  const [existing] = await db.select().from(assets).where(and(eq(assets.kind, 'AUDIO'), eq(assets.sha256, hash)));
  if (existing) return existing;
  const key = `audio/${randomUUID()}.${audio.ext}`;
  await storage().put(key, audio.data, audio.mime);
  const [row] = await db
    .insert(assets)
    .values({
      kind: 'AUDIO',
      storageKey: key,
      mime: audio.mime,
      bytes: audio.data.byteLength,
      durationSeconds: audio.durationSeconds,
      sha256: hash,
      originalFilename: safeFilename(opts.filename),
      uploadedBy: opts.uploadedBy,
    })
    .returning();
  return row!;
}

export function assetUrl(asset: Pick<AssetRecord, 'storageKey'> | null | undefined) {
  return asset ? publicMediaUrl(asset.storageKey) : null;
}
