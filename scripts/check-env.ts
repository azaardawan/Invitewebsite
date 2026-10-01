/**
 * Runs first in the container. If settings are missing (e.g. Railway's first
 * automatic deploy, before variables are added), prints a plain list of what
 * to add instead of a stack trace, and stops.
 */
import { env } from '../src/server/env';

try {
  env();
  console.log('[check-env] Settings OK.');
} catch (e) {
  console.error('\n================ Bahja cannot start yet ================');
  console.error((e as Error).message);
  if (!process.env.DATABASE_URL) console.error('  DATABASE_URL: add a PostgreSQL database to the project, then set DATABASE_URL=${{Postgres.DATABASE_URL}}');
  console.error('Add these in Railway → your service → Variables (see docs/runbooks/deploy.md), then redeploy.');
  console.error('=========================================================\n');
  process.exit(1);
}
