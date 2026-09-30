import 'server-only';
import { and, asc, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { assets, musicTracks, themes } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { CatalogError, auditActor, type Actor } from './common';

const title = z.string().trim().min(1).max(120);

export async function listMusic(db: DbOrTx) {
  const rows = await db
    .select({ track: musicTracks, asset: assets })
    .from(musicTracks)
    .innerJoin(assets, eq(assets.id, musicTracks.assetId))
    .orderBy(asc(musicTracks.status), asc(musicTracks.title));
  const assigned = await db.select({ id: themes.id, key: themes.key, name: themes.name, musicTrackId: themes.musicTrackId }).from(themes);
  return rows.map((r) => ({ ...r, themes: assigned.filter((t) => t.musicTrackId === r.track.id) }));
}

export async function createMusicTrack(db: DbOrTx, input: { title: string; assetId: string }, actor: Actor) {
  const data = z.object({ title, assetId: z.uuid() }).parse(input);
  return db.transaction(async (tx) => {
    const [asset] = await tx.select().from(assets).where(eq(assets.id, data.assetId));
    if (asset?.kind !== 'AUDIO') throw new CatalogError('invalidAsset');
    // One library entry per audio file; the same MP3 is never duplicated.
    const [existing] = await tx.select().from(musicTracks).where(eq(musicTracks.assetId, data.assetId));
    if (existing) throw new CatalogError('duplicateTrack', [existing.title]);
    const [row] = await tx.insert(musicTracks).values(data).returning();
    await recordAudit(tx, { ...auditActor(actor), action: 'music.created', objectType: 'music_track', objectId: row!.id, after: data });
    return row!;
  });
}

export async function renameMusicTrack(db: DbOrTx, id: string, newTitle: string, actor: Actor) {
  const t = title.parse(newTitle);
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(musicTracks).where(eq(musicTracks.id, id)).for('update');
    if (!before) throw new CatalogError('notFound');
    await tx.update(musicTracks).set({ title: t }).where(eq(musicTracks.id, id));
    await recordAudit(tx, { ...auditActor(actor), action: 'music.renamed', objectType: 'music_track', objectId: id, before: { title: before.title }, after: { title: t } });
  });
}

export async function setMusicStatus(db: DbOrTx, id: string, status: 'ACTIVE' | 'ARCHIVED', actor: Actor) {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(musicTracks).where(eq(musicTracks.id, id)).for('update');
    if (!before) throw new CatalogError('notFound');
    if (status === 'ARCHIVED') {
      const inUse = await tx
        .select({ key: themes.key })
        .from(themes)
        .where(and(eq(themes.musicTrackId, id), ne(themes.status, 'ARCHIVED')));
      if (inUse.length) throw new CatalogError('musicInUse', inUse.map((t) => t.key));
    }
    await tx.update(musicTracks).set({ status }).where(eq(musicTracks.id, id));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: status === 'ARCHIVED' ? 'music.archived' : 'music.restored',
      objectType: 'music_track',
      objectId: id,
      before: { status: before.status },
      after: { status },
    });
  });
}
