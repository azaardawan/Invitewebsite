import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import postgres from 'postgres';

/**
 * Fresh e2e database per run, migrated, with one OWNER whose temporary
 * password is captured from the real `admin:create` command.
 */
export default async function globalSetup() {
  const url = process.env.E2E_DATABASE_URL ?? 'postgres://bahja:bahja@localhost:5432/bahja_e2e_test';
  if (!/test/i.test(url)) throw new Error('E2E database name must contain "test"');
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  await sql.unsafe('DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;');
  await sql.end();

  const env = { ...process.env, DATABASE_URL: url };
  execFileSync('pnpm', ['-s', 'db:migrate'], { env, stdio: 'inherit' });
  const out = execFileSync('pnpm', ['-s', 'admin:create', '--email', 'owner@bahja.test', '--name', 'مالك بهجه'], { env }).toString();
  const password = out.match(/Temporary password \(shown once\): (\S+)/)?.[1];
  if (!password) throw new Error(`Could not read temporary password from:\n${out}`);
  writeFileSync('e2e/.owner.json', JSON.stringify({ email: 'owner@bahja.test', password }));
}
