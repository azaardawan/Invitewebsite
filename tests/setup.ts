import { afterAll } from 'vitest';
import { loadTestEnv } from './env';

loadTestEnv();

afterAll(async () => {
  const { closeDb } = await import('@/server/db/client');
  await closeDb();
});
