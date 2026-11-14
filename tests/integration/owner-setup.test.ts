import { describe, expect, it } from 'vitest';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { packageFeatures, packages, themePalettes, themes } from '@/server/db/schema';
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

  it('Memory Museum: its description in four languages, once; the packages are left to Admin (the owner’s prices)', async () => {
    const { actor } = await activeTheme();
    const key = uniqueKey('museum');
    await syncThemesFromRegistry(db(), [{ ...manifestByCodeRef('memory-museum@1')!, key }], actor, { complete: false });
    const setup = { ...OWNER_SETUPS.find((x) => x.themeKey === 'memory-museum')!, themeKey: key };
    expect(await applyOwnerSetups(db(), actor, [setup])).toEqual([`${key}: name and description`, `${key}: 5 colour sets`]);
    const [t] = await db().select().from(themes).where(eq(themes.key, key));
    expect(t!.name).toMatchObject({ ar: 'متحف الذكريات', en: 'Memory Museum', ckb: 'مۆزەخانەی یادەوەری', bdn: 'مۆزەخانەیا بیرهاتنان' });
    expect(Object.keys(t!.description ?? {}).sort()).toEqual(['ar', 'bdn', 'ckb', 'en']);
    expect(await db().select().from(packages).where(eq(packages.themeId, t!.id))).toHaveLength(0);
    // The owner's five wall colours, for packages with colour choice (slot `walls`).
    const sets = await db().select().from(themePalettes).where(eq(themePalettes.themeId, t!.id)).orderBy(asc(themePalettes.sortOrder));
    expect(sets.map((p) => [p.name.en, p.colors.walls])).toEqual([
      ['Deep Burgundy', '#6e2a35'],
      ['Muted Sage Green', '#9aab8f'],
      ['Dusty Blue', '#8ea3b5'],
      ['Soft Rose', '#d9b0aa'],
      ['Warm Taupe', '#a8977f'],
    ]);
    // The name stays the working title, so the description is the guard: an Admin edit is kept on the next deploy.
    await db().update(themes).set({ description: { ar: 'وصف المالك', en: "Owner's words" } }).where(eq(themes.id, t!.id));
    expect(await applyOwnerSetups(db(), actor, [setup])).toEqual([]);
    const [again] = await db().select().from(themes).where(eq(themes.id, t!.id));
    expect(again!.description?.ar).toBe('وصف المالك');
  });

  it('leave the packages to Admin when the sister design has no prices', async () => {
    const { actor } = await activeTheme();
    const key = uniqueKey('pearl');
    await syncThemesFromRegistry(db(), [{ ...manifestByCodeRef('pearl-garden@1')!, key }], actor);
    expect(await applyOwnerSetups(db(), actor, [{ ...OWNER_SETUPS[0]!, themeKey: key, pricesFrom: 'no-such-design' }])).toEqual([`${key}: name and description`]);
  });
});
