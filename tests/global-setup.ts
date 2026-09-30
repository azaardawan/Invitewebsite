import postgres from 'postgres';
import { loadTestEnv } from './env';
import { runMigrations } from '../src/server/db/migrate';

/** Rebuilds the test database schema from the migrations once per test run. */
export default async function setup() {
  const url = loadTestEnv();
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  await sql.unsafe('DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;');
  await sql.end();
  await runMigrations(url);
}
