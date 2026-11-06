import 'server-only';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { coupons, themes } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { CatalogError, auditActor, type Actor } from '@/server/catalog/common';
import { OrderError } from './common';

export type Coupon = typeof coupons.$inferSelect;

/** What customers type: letters, digits and dashes; case and spaces don't matter. */
export function normalizeCouponCode(input: string) {
  return input.normalize('NFKC').replace(/\s+/g, '').toUpperCase();
}

export const couponInput = z
  .object({
    code: z
      .string()
      .transform(normalizeCouponCode)
      .pipe(z.string().regex(/^[A-Z0-9-]{3,30}$/)),
    kind: z.enum(['PERCENT', 'AMOUNT']),
    value: z.coerce.number().int().min(1).max(100_000_000),
    maxUses: z.coerce.number().int().min(1).max(1_000_000).nullish(),
    expiresAt: z.coerce.date().nullish(),
    note: z.string().trim().max(200).nullish(),
    /** The themes it may be used on; empty = every theme. */
    themeIds: z.array(z.uuid()).max(1000).default([]),
  })
  .refine((c) => c.kind !== 'PERCENT' || c.value <= 100, { path: ['value'], message: 'percent above 100' });

export async function listCoupons(db: DbOrTx) {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

/** Creates a coupon. Audited (the code itself is not a secret: it's what customers type). */
export async function createCoupon(db: DbOrTx, input: z.input<typeof couponInput>, actor: Actor) {
  const data = couponInput.parse(input);
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, data.code));
    if (existing) throw new CatalogError('keyTaken');
    const themeIds = [...new Set(data.themeIds)];
    if (themeIds.length) {
      const found = await tx.select({ id: themes.id }).from(themes).where(inArray(themes.id, themeIds));
      if (found.length !== themeIds.length) throw new CatalogError('notFound');
    }
    const [row] = await tx
      .insert(coupons)
      .values({ code: data.code, kind: data.kind, value: data.value, maxUses: data.maxUses ?? null, expiresAt: data.expiresAt ?? null, note: data.note || null, themeIds, createdBy: actor.adminId })
      .returning();
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'coupon.created',
      objectType: 'coupon',
      objectId: row!.id,
      after: { code: row!.code, kind: row!.kind, value: row!.value, maxUses: row!.maxUses, expiresAt: row!.expiresAt, themeIds: row!.themeIds },
    });
    return row!;
  });
}

/** Stops (or restarts) a coupon. Orders already placed keep their discount. */
export async function setCouponStatus(db: DbOrTx, id: string, status: 'ACTIVE' | 'ARCHIVED', actor: Actor) {
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(coupons).where(eq(coupons.id, id)).for('update');
    if (!row) throw new CatalogError('notFound');
    if (row.status === status) return;
    await tx.update(coupons).set({ status }).where(eq(coupons.id, id));
    await recordAudit(tx, {
      ...auditActor(actor),
      action: status === 'ARCHIVED' ? 'coupon.stopped' : 'coupon.restarted',
      objectType: 'coupon',
      objectId: id,
      before: { status: row.status },
      after: { status },
    });
  });
}

/** The discount a coupon gives on a price (never more than the price). */
export function couponDiscount(coupon: Pick<Coupon, 'kind' | 'value'>, priceIqd: number) {
  const off = coupon.kind === 'PERCENT' ? Math.round((priceIqd * coupon.value) / 100) : coupon.value;
  return Math.min(priceIqd, Math.max(0, off));
}

/**
 * Inside the checkout transaction: checks the code (active, not expired, uses left, made for this theme), counts one
 * use and returns the discount. Locks the coupon row so two customers can't take its last use together.
 */
export async function redeemCoupon(tx: DbOrTx, input: string, priceIqd: number, now: Date, themeId: string) {
  const code = normalizeCouponCode(input);
  const [c] = await tx.select().from(coupons).where(eq(coupons.code, code)).for('update');
  const usable = c && c.status === 'ACTIVE' && (!c.expiresAt || c.expiresAt > now) && (c.maxUses === null || c.usedCount < c.maxUses);
  if (!usable) throw new OrderError('invalidCoupon');
  // A coupon for some themes only (empty = every theme).
  if (c.themeIds.length && !c.themeIds.includes(themeId)) throw new OrderError('couponNotForTheme');
  await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, c.id));
  return { couponId: c.id, code: c.code, discountIqd: couponDiscount(c, priceIqd) };
}
