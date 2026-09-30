import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/server/env';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { __bahjaSql?: postgres.Sql; __bahjaDb?: Db };

function create(): Db {
  const sql = postgres(env().DATABASE_URL, { max: 10, prepare: true });
  globalForDb.__bahjaSql = sql;
  return drizzle(sql, { schema, casing: 'snake_case' });
}

/** Shared connection pool (reused across dev hot-reloads). */
export function db(): Db {
  globalForDb.__bahjaDb ??= create();
  return globalForDb.__bahjaDb;
}

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type DbOrTx = Db | Tx;

export async function closeDb() {
  await globalForDb.__bahjaSql?.end({ timeout: 5 });
  globalForDb.__bahjaSql = undefined;
  globalForDb.__bahjaDb = undefined;
}
