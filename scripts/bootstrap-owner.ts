/**
 * First-deploy convenience: if there are no admin users yet and
 * BOOTSTRAP_OWNER_EMAIL is set, creates that OWNER and prints a temporary
 * password once to the deploy log. Does nothing afterwards (any admin exists),
 * so the variable can be removed after the first sign-in.
 */
import { count } from 'drizzle-orm';
import { closeDb, db } from '../src/server/db/client';
import { adminUsers } from '../src/server/db/schema';
import { createAdminUser } from '../src/server/admin/users';

const email = process.env.BOOTSTRAP_OWNER_EMAIL?.trim();
try {
  if (email) {
    const [row] = await db().select({ n: count() }).from(adminUsers);
    if ((row?.n ?? 0) === 0) {
      const { temporaryPassword } = await createAdminUser(
        db(),
        { email, name: process.env.BOOTSTRAP_OWNER_NAME?.trim() || 'Owner', roleKeys: ['OWNER'] },
        { adminId: null, ipHash: null, type: 'SYSTEM' },
      );
      console.log(`[bootstrap] Created owner ${email}. Temporary password (shown once): ${temporaryPassword}`);
      console.log('[bootstrap] Sign in at /admin, change the password and set up 2FA, then remove BOOTSTRAP_OWNER_EMAIL.');
    }
  }
} finally {
  await closeDb();
}
