import 'server-only';
import { hash, verify } from '@node-rs/argon2';

// OWASP-recommended Argon2id baseline (19 MiB, 2 iterations, 1 lane).
// `algorithm: 2` is Algorithm.Argon2id (a const enum, which isolatedModules can't import).
const OPTIONS = { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/** Burns the same time as a real verification so unknown emails can't be detected by timing. */
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword('dummy-password-for-timing-equalization');
  await verifyPassword(await dummyHash, password);
  return false;
}

/** Returns an error key (see admin i18n `password.*`) or null when acceptable. */
export function passwordProblem(password: string, context: { email?: string } = {}): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return 'tooShort';
  if (password.length > PASSWORD_MAX_LENGTH) return 'tooLong';
  if (new Set(password).size < 5) return 'tooSimple';
  const local = context.email?.split('@')[0]?.toLowerCase();
  if (local && local.length >= 4 && password.toLowerCase().includes(local)) return 'containsEmail';
  return null;
}
