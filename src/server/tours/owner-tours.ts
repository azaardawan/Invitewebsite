import 'server-only';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { desc, ilike, or } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { tours } from '@/server/db/schema';
import type { Actor } from '@/server/catalog/common';
import { createTour, setTourLive, setTourModel } from './tours';

/**
 * Tour models the owner asked us to upload for them (owner, 2026-11-21: "my file is not being uploaded, you upload it,
 * the name is koup"), applied once on deploy (seed). The model goes to the owner's tour of that name (or link name)
 * while it has no model yet, and the tour is switched on; with no such tour, one is made with a private link. Once a
 * tour has a model this never touches it again, so the owner's later changes in Admin stay. Audited as the system.
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
    // Already has a model (ours or the owner's own): nothing to do.
    if (found.some((x) => x.modelAssetId)) continue;
    const tour = found[0] ?? (await createTour(db, { name: t.name, slug: t.slug, links: {}, private: true }, actor));
    await setTourModel(db, tour.id, file, actor, path.basename(file));
    await setTourLive(db, tour.id, true, actor);
    done.push(`${tour.name}: model uploaded, switched on`);
  }
  return done;
}
