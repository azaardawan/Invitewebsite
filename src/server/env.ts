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
  /** `local` stores files on disk (development/tests); `s3` uses S3-compatible storage (Cloudflare R2). */
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_DIR: z.string().default('.storage'),
  S3_ENDPOINT: z.url().optional(),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /** Public CDN base URL for media in the bucket (e.g. https://media.example.com). */
  MEDIA_PUBLIC_BASE_URL: z.url().optional(),
}).superRefine((e, ctx) => {
  if (e.STORAGE_DRIVER === 's3') {
    for (const k of ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'MEDIA_PUBLIC_BASE_URL'] as const) {
      if (!e[k]) ctx.addIssue({ code: 'custom', path: [k], message: 'is required when STORAGE_DRIVER=s3' });
    }
  }
  if (e.APP_ENV !== 'development' && e.STORAGE_DRIVER === 'local') {
    ctx.addIssue({ code: 'custom', path: ['STORAGE_DRIVER'], message: 'must be s3 outside development' });
  }
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
