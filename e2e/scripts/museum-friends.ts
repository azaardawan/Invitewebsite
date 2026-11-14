/**
 * E2E fixture: sells Memory Museum in the Friends section too ("Also sold in", as the owner does in Admin) and prints its
 * colour sets (the owner's five wall colours, added on deploy): [{ id, name }].
 */
import { eq } from 'drizzle-orm';
import { closeDb, db } from '../../src/server/db/client';
import { sections, themeExtraSections, themePalettes, themes } from '../../src/server/db/schema';

try {
  const [t] = await db().select().from(themes).where(eq(themes.key, 'memory-museum'));
  const [s] = await db().select().from(sections).where(eq(sections.key, 'friends'));
  if (!t || !s) throw new Error('memory-museum or the friends section is missing (run db:seed)');
  await db().insert(themeExtraSections).values({ themeId: t.id, sectionId: s.id }).onConflictDoNothing();
  const rows = await db().select().from(themePalettes).where(eq(themePalettes.themeId, t.id));
  console.log(JSON.stringify(rows.map((r) => ({ id: r.id, name: r.name.en }))));
} finally {
  await closeDb();
}
