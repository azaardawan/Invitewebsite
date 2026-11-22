import 'server-only';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { desc, ilike, inArray, or } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { assets, tours } from '@/server/db/schema';
import { sha256Buffer } from '@/lib/crypto';
import type { Actor } from '@/server/catalog/common';
import { createTour, setTourLive, setTourModel } from './tours';

/**
 * Tour models the owner asked us to upload for them (owner, 2026-11-21: "my file is not being uploaded, you upload it,
 * the name is koup"), applied on deploy (seed). The model goes to the owner's tour of that name (or link name) while it
 * has no model yet, and the tour is switched on; with no such tour, one is made with a private link. When the bundled
 * model changes (the owner asked for changes), it replaces the one this put there (same file name, other contents);
 * a model the owner uploaded themselves is never replaced. Audited as the system.
 */
const OWNER_TOURS = [{ match: 'koup', name: 'KOUP', slug: 'koup', file: 'tours/koupup/koupup.glb' }];

export async function applyOwnerTours(db: DbOrTx, actor: Actor = { adminId: null, ipHash: null }): Promise<string[]> {
  const done: string[] = [];
  for (const t of OWNER_TOURS) {
    const file = path.join(process.cwd(), t.file);
    if (!existsSync(file)) continue;
    const found = await db
      .select()
      .from(tours)
      .where(or(ilike(tours.name, `${t.match}%`), ilike(tours.slug, `${t.match}%`)))
      .orderBy(desc(tours.createdAt));
    const name = path.basename(file);
    const withModel = found.filter((x) => x.modelAssetId);
    if (withModel.length) {
      // A model is there: replaced only when it is ours (our file's name) and ours has changed since.
      const models = await db
        .select()
        .from(assets)
        .where(inArray(assets.id, withModel.map((x) => x.modelAssetId!)));
      const sha = sha256Buffer(readFileSync(file));
      for (const tour of withModel) {
        const m = models.find((a) => a.id === tour.modelAssetId);
        if (!m || m.originalFilename !== name || m.sha256 === sha) continue;
        await setTourModel(db, tour.id, file, actor, name);
        done.push(`${tour.name}: model updated`);
      }
      continue;
    }
    const tour = found[0] ?? (await createTour(db, { name: t.name, slug: t.slug, links: {}, private: true }, actor));
    await setTourModel(db, tour.id, file, actor, name);
    await setTourLive(db, tour.id, true, actor);
    done.push(`${tour.name}: model uploaded, switched on`);
  }
  return done;
}
