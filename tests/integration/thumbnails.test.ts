import { afterAll, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, themes } from '@/server/db/schema';
import { designThumbnail, designThumbnailKeys, applyDesignThumbnail } from '@/server/catalog/thumbnails';
import { activeTheme } from '../fixtures';

const made: string[] = [];
afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

describe("a design's own thumbnail (themes/<key>/thumbnail.webp)", () => {
  it('is read only for a plain design key', async () => {
    expect(await designThumbnail('../package')).toBeNull();
    expect(await designThumbnail('no-such-design')).toBeNull();
    expect((await designThumbnail('golden-arch'))?.length).toBeGreaterThan(1000);
    expect(await designThumbnailKeys()).toEqual(expect.arrayContaining(['golden-arch', 'bluebird-garden', 'rosebird-garden']));
  });

  it('becomes the cover when the owner chooses it, centred and audited', async () => {
    const shop = await activeTheme();
    const [t] = await db().select().from(themes).where(eq(themes.id, shop.theme.id));
    const dir = path.join(process.cwd(), 'themes', t!.key);
    mkdirSync(dir, { recursive: true });
    made.push(dir);
    writeFileSync(
      path.join(dir, 'thumbnail.webp'),
      await sharp({ create: { width: 900, height: 1320, channels: 3, background: '#cde' } })
        .webp()
        .toBuffer(),
    );
    const before = t!.coverAssetId;

    await applyDesignThumbnail(db(), t!.id, shop.actor);
    const [after] = await db().select().from(themes).where(eq(themes.id, t!.id));
    expect(after!.coverAssetId).not.toBe(before);
    expect(after!.coverFocus).toBeNull();
    const [log] = await db()
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.objectId, t!.id), eq(auditLogs.action, 'theme.cover_updated')))
      .orderBy(desc(auditLogs.at));
    expect(log).toMatchObject({ before: { coverAssetId: before }, after: { coverAssetId: after!.coverAssetId, source: 'design_thumbnail' } });
  });
});
