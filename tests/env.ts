import { existsSync } from 'node:fs';

/** Test environment: always points at the dedicated test database, never dev/prod. */
export function loadTestEnv() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL must be set to run the tests');
  if (!/test/i.test(url)) throw new Error('Refusing to run tests against a database whose name does not contain "test"');
  process.env.DATABASE_URL = url;
  process.env.APP_URL ??= 'http://localhost:3000';
  process.env.TOTP_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString('base64');
  process.env.IP_HASH_SALT ||= 'test-salt-test-salt';
  process.env.STORAGE_DRIVER = 'local';
  process.env.LOCAL_STORAGE_DIR = '.storage-test';
  return url;
}
