import { describe, expect, it } from 'vitest';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { packageFeatures, packages, themes } from '@/server/db/schema';
import { syncThemesFromRegistry } from '@/server/catalog/themes';
import { applyOwnerSetups, OWNER_SETUPS } from '@/server/catalog/owner-setup';
import { manifestByCodeRef } from '@/theme-registry';
import { activeTheme } from '../fixtures';
import { uniqueKey } from '../helpers';

describe("the owner's chat requests applied on deploy", () => {
  it('name the design and add its two packages at the sister design’s prices, once, never over Admin edits', async () => {
    const sister = await activeTheme(); // two packages: 25 000 and 60 000 IQD
    const key = uniqueKey('pearl');
    await syncThemesFromRegistry(db(), [{ ...manifestByCodeRef('pearl-garden@1')!, key }], sister.actor);
    const setup = { ...OWNER_SETUPS[0]!, themeKey: key, pricesFrom: sister.theme.key };

    expect(await applyOwnerSetups(db(), sister.actor, [setup])).toHaveLength(2);
    const [t] = await db().select().from(themes).where(eq(themes.key, key));
    expect(t!.name).toMatchObject({ ar: 'أوراق مزهرة', en: 'Flowery Leaves' });
    expect(t!.description?.en).toContain('pink thread');
    const made = await db().select().from(packages).where(eq(packages.themeId, t!.id)).orderBy(asc(packages.sortOrder));
    expect(made.map((p) => [p.name.en, p.priceIqd])).toEqual([
      ['Basic', 25000],
      ['Complete', 60000],
    ]);
    const features = async (id: string) => (await db().select().from(packageFeatures).where(eq(packageFeatures.packageId, id))).map((f) => f.featureKey).sort();
    expect(await features(made[0]!.id)).toEqual(['print_card', 'story']);
    expect(await features(made[1]!.id)).toEqual(['bottle_label', 'print_card', 'sticker', 'story']);

    // Running again (every deploy) changes nothing, and an Admin rename is kept.
    await db().update(themes).set({ name: { ar: 'اسم المالك', en: "Owner's name" } }).where(eq(themes.id, t!.id));
    expect(await applyOwnerSetups(db(), sister.actor, [setup])).toEqual([]);
    const [again] = await db().select().from(themes).where(eq(themes.id, t!.id));
    expect(again!.name.ar).toBe('اسم المالك');
    expect(await db().select().from(packages).where(eq(packages.themeId, t!.id))).toHaveLength(2);
  });

  it('leave the packages to Admin when the sister design has no prices', async () => {
    const { actor } = await activeTheme();
    const key = uniqueKey('pearl');
    await syncThemesFromRegistry(db(), [{ ...manifestByCodeRef('pearl-garden@1')!, key }], actor);
    expect(await applyOwnerSetups(db(), actor, [{ ...OWNER_SETUPS[0]!, themeKey: key, pricesFrom: 'no-such-design' }])).toEqual([`${key}: name and description`]);
  });
});
