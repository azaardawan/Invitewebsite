import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { auditLogs, sections, themes } from '@/server/db/schema';
import { createSubsection, listSubsections, moveSubsection, setSubsectionStatus, updateSubsection } from '@/server/catalog/subsections';
import { updateThemeSettings } from '@/server/catalog/themes';
import { activeTheme } from '../fixtures';

let shop: Awaited<ReturnType<typeof activeTheme>>;
let weddingId: string;
let engagementId: string;
beforeAll(async () => {
  shop = await activeTheme();
  weddingId = (await db().select().from(sections).where(eq(sections.key, 'wedding')))[0]!.id;
  engagementId = (await db().select().from(sections).where(eq(sections.key, 'engagement')))[0]!.id;
});
const k = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

describe('subsections', () => {
  it('are created, renamed, reordered and hidden inside a section, all audited', async () => {
    const a = await createSubsection(db(), weddingId, { key: k('classic'), name: { ar: 'كلاسيكي', en: 'Classic' } }, shop.actor);
    const b = await createSubsection(db(), weddingId, { key: k('modern'), name: { ar: 'عصري', en: 'Modern' } }, shop.actor);
    await expect(createSubsection(db(), weddingId, { key: a.key, name: { ar: 'x', en: 'x' } }, shop.actor)).rejects.toMatchObject({ code: 'keyTaken' });
    await expect(createSubsection(db(), weddingId, { key: 'Bad Key', name: { ar: 'x', en: 'x' } }, shop.actor)).rejects.toThrow();

    await updateSubsection(db(), a.id, { name: { ar: 'كلاسيكي فاخر', en: 'Classic luxe', ckb: 'کلاسیکی', bdn: 'کلاسیکی' } }, shop.actor);
    await moveSubsection(db(), b.id, 'up', shop.actor);
    const order = (await listSubsections(db(), weddingId, { activeOnly: true })).map((r) => r.subsection.id);
    expect(order.indexOf(b.id)).toBeLessThan(order.indexOf(a.id));

    await setSubsectionStatus(db(), b.id, 'ARCHIVED', shop.actor);
    expect((await listSubsections(db(), weddingId, { activeOnly: true })).some((r) => r.subsection.id === b.id)).toBe(false);
    const actions = (await db().select().from(auditLogs).where(eq(auditLogs.objectId, weddingId))).map((l) => l.action);
    expect(actions).toEqual(expect.arrayContaining(['subsection.created', 'subsection.updated', 'subsection.reordered', 'subsection.archived']));
  });

  it('a theme joins a subsection of its own section, and leaves it when its section changes', async () => {
    const sub = await createSubsection(db(), weddingId, { key: k('kurdish'), name: { ar: 'كردي', en: 'Kurdish' } }, shop.actor);
    const other = await createSubsection(db(), engagementId, { key: k('simple'), name: { ar: 'بسيط', en: 'Simple' } }, shop.actor);
    const t = shop.theme;
    const base = { name: t.name, sectionId: weddingId, coverAssetId: undefined as string | undefined, musicTrackId: shop.song.id };
    const [row] = await db().select().from(themes).where(eq(themes.id, t.id));
    base.coverAssetId = row!.coverAssetId ?? undefined;

    await updateThemeSettings(db(), t.id, { ...base, subsectionId: sub.id }, shop.actor);
    expect((await db().select().from(themes).where(eq(themes.id, t.id)))[0]!.subsectionId).toBe(sub.id);
    expect((await listSubsections(db(), weddingId)).find((r) => r.subsection.id === sub.id)?.themeCount).toBe(1);

    // A subsection of another section is refused.
    await expect(updateThemeSettings(db(), t.id, { ...base, subsectionId: other.id }, shop.actor)).rejects.toMatchObject({ code: 'subsectionMismatch' });
    // Saving without touching the subsection keeps it.
    await updateThemeSettings(db(), t.id, base, shop.actor);
    expect((await db().select().from(themes).where(eq(themes.id, t.id)))[0]!.subsectionId).toBe(sub.id);
    // Moving the theme to another section drops it.
    await updateThemeSettings(db(), t.id, { ...base, sectionId: engagementId }, shop.actor);
    expect((await db().select().from(themes).where(eq(themes.id, t.id)))[0]!.subsectionId).toBeNull();
    await updateThemeSettings(db(), t.id, base, shop.actor);
  });
});
