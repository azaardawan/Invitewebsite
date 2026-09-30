/**
 * Creates an admin user from the command line. Used to bootstrap the first
 * OWNER; later users are created from Admin → Users.
 *
 *   pnpm admin:create --email owner@example.com --name "Owner" [--role OWNER]
 *
 * Prints a temporary password once. The user must change it and set up 2FA
 * at first sign-in.
 */
import { parseArgs } from 'node:util';
import { closeDb, db } from '../src/server/db/client';
import { createAdminUser } from '../src/server/admin/users';
import { seedRbac } from '../src/server/rbac/seed';

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', multiple: true, default: ['OWNER'] },
  },
});

if (!values.email || !values.name) {
  console.error('Usage: pnpm admin:create --email <email> --name <name> [--role OWNER]');
  process.exit(1);
}

try {
  await seedRbac(db());
  const { temporaryPassword } = await createAdminUser(
    db(),
    { email: values.email, name: values.name, roleKeys: values.role },
    { adminId: null, ipHash: null, type: 'SYSTEM' },
  );
  console.log(`Created ${values.email} (${values.role.join(', ')}).`);
  console.log(`Temporary password (shown once): ${temporaryPassword}`);
} finally {
  await closeDb();
}
