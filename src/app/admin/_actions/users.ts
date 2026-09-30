'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { requestContext } from '@/server/auth/request-context';
import {
  AdminUserError,
  createAdminUser,
  resetUserPassword,
  resetUserTwoFactor,
  setUserRoles,
  setUserStatus,
  type Actor,
} from '@/server/admin/users';
import type { ActionState } from './state';

async function actor(): Promise<Actor> {
  const { user } = await requireAdmin({ permission: 'users.manage' });
  return { adminId: user.id, ipHash: (await requestContext()).ipHash };
}

function failure(error: unknown): ActionState {
  if (error instanceof AdminUserError) return { error: `users.errors.${error.code}` };
  throw error;
}

const reasonField = z.string().trim().max(500).optional().transform((v) => v || undefined);
const roleKeys = z.array(z.string().min(1).max(50)).min(1).max(10);

export async function createUserAction(_: ActionState, form: FormData): Promise<ActionState> {
  const by = await actor();
  const parsed = z
    .object({ email: z.email().max(254), name: z.string().trim().min(1).max(100), roleKeys })
    .safeParse({ email: form.get('email'), name: form.get('name'), roleKeys: form.getAll('roles') });
  if (!parsed.success) return { error: 'users.errors.invalid' };
  try {
    const { temporaryPassword } = await createAdminUser(db(), parsed.data, by);
    revalidatePath('/admin/users');
    return { ok: true, message: 'users.created', secret: temporaryPassword, nonce: Date.now() };
  } catch (e) {
    return failure(e);
  }
}

const target = z.object({ userId: z.uuid(), reason: reasonField });

export async function saveRolesAction(_: ActionState, form: FormData): Promise<ActionState> {
  const by = await actor();
  const parsed = target
    .extend({ roleKeys })
    .safeParse({ userId: form.get('userId'), reason: form.get('reason') ?? undefined, roleKeys: form.getAll('roles') });
  if (!parsed.success) return { error: 'users.errors.noRoles' };
  try {
    await setUserRoles(db(), parsed.data.userId, parsed.data.roleKeys, by, parsed.data.reason);
    revalidatePath('/admin/users');
    return { ok: true, message: 'users.done', nonce: Date.now() };
  } catch (e) {
    return failure(e);
  }
}

export async function setStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  const by = await actor();
  const parsed = target
    .extend({ status: z.enum(['ACTIVE', 'DISABLED']) })
    .safeParse({ userId: form.get('userId'), reason: form.get('reason') ?? undefined, status: form.get('status') });
  if (!parsed.success) return { error: 'users.errors.invalid' };
  try {
    await setUserStatus(db(), parsed.data.userId, parsed.data.status, by, parsed.data.reason);
    revalidatePath('/admin/users');
    return { ok: true, message: 'users.done', nonce: Date.now() };
  } catch (e) {
    return failure(e);
  }
}

export async function resetTwoFactorAction(_: ActionState, form: FormData): Promise<ActionState> {
  const by = await actor();
  const parsed = target.safeParse({ userId: form.get('userId'), reason: form.get('reason') ?? undefined });
  if (!parsed.success) return { error: 'users.errors.invalid' };
  try {
    await resetUserTwoFactor(db(), parsed.data.userId, by, parsed.data.reason);
    revalidatePath('/admin/users');
    return { ok: true, message: 'users.done', nonce: Date.now() };
  } catch (e) {
    return failure(e);
  }
}

export async function resetPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  const by = await actor();
  const parsed = target.safeParse({ userId: form.get('userId'), reason: form.get('reason') ?? undefined });
  if (!parsed.success) return { error: 'users.errors.invalid' };
  try {
    const { temporaryPassword } = await resetUserPassword(db(), parsed.data.userId, by, parsed.data.reason);
    return { ok: true, message: 'users.newPassword', secret: temporaryPassword, nonce: Date.now() };
  } catch (e) {
    return failure(e);
  }
}
