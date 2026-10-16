/**
 * How long a package keeps the invitation online after it is published (the owner picks one per package).
 * `forever` never ends: its expiry is stored as FOREVER, a date far in the future, so every "is it live?"
 * check keeps working unchanged.
 */
export const PACKAGE_LIFETIMES = ['30', '60', '365', 'forever'] as const;
export type PackageLifetime = (typeof PACKAGE_LIFETIMES)[number];
export const DEFAULT_LIFETIME: PackageLifetime = '30';

/** The stored expiry of an invitation that never ends. */
export const FOREVER = new Date('9999-12-31T00:00:00.000Z');

export function isPackageLifetime(value: unknown): value is PackageLifetime {
  return typeof value === 'string' && (PACKAGE_LIFETIMES as readonly string[]).includes(value);
}

/** When an invitation published at `from` ends. */
export function lifetimeExpiry(from: Date, lifetime: PackageLifetime) {
  return lifetime === 'forever' ? FOREVER : new Date(from.getTime() + Number(lifetime) * 86400_000);
}

/** Whether a stored expiry means "never ends". */
export function isForever(expiresAt: Date | string | null | undefined) {
  return !!expiresAt && new Date(expiresAt).getTime() >= FOREVER.getTime();
}
