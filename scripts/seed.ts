/**
 * Idempotent setup, run on every deploy after migrations:
 * permissions/roles, the field library, starter sections, and theme
 * versions found in the deployed code.
 */
import { closeDb, db } from '../src/server/db/client';
import { seedRbac } from '../src/server/rbac/seed';
import { seedCatalog } from '../src/server/catalog/seed';
import { seedLegalDrafts } from '../src/server/legal/seed';
import { backfillAccessCodes } from '../src/server/orders/access';
import { syncThemesFromRegistry } from '../src/server/catalog/themes';
import { themeManifests } from '../src/theme-registry';
import { addKurdishNames } from '../src/server/catalog/kurdish-names';

try {
  await seedRbac(db());
  await seedCatalog(db());
  await seedLegalDrafts(db());
  await backfillAccessCodes(db());
  const report = await syncThemesFromRegistry(db(), themeManifests(), { adminId: null, ipHash: null });
  console.log('Seeded permissions, roles, field library and starter sections.');
  console.log('Theme sync:', JSON.stringify(report));
  console.log(`Kurdish added to ${await addKurdishNames(db())} design/package name(s).`);
  if (report.conflicts.length) {
    console.error(`ERROR: activated theme versions changed in code: ${report.conflicts.join(', ')}. Create a new version folder instead.`);
    process.exitCode = 1;
  }
} finally {
  await closeDb();
}
