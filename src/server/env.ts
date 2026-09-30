import 'server-only';
import { z } from 'zod';

const base64Key32 = z
  .string()
  .min(1, 'is required')
  .refine((v) => Buffer.from(v, 'base64').length === 32, 'must be 32 bytes, base64-encoded');

const schema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.url(),
  DATABASE_URL: z.string().startsWith('postgres'),
  TOTP_ENCRYPTION_KEY: base64Key32,
  IP_HASH_SALT: z.string().min(16, 'must be at least 16 characters'),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/**
 * Validated server environment. Parsed lazily so `next build` does not need
 * production secrets, but the first request fails loudly if anything is missing.
 */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  cached = parsed.data;
  return cached;
}

export const isProduction = () => env().APP_ENV === 'production';
