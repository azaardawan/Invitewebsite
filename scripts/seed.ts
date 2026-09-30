import { closeDb, db } from '../src/server/db/client';
import { seedRbac } from '../src/server/rbac/seed';

await seedRbac(db());
await closeDb();
console.log('Seeded permissions and built-in roles.');
