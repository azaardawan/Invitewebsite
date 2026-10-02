'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { requestContext } from '@/server/auth/request-context';
import {
  changeInvitationMusic,
  extendInvitation,
  InvitationAdminError,
  setInvitationPublished,
  updateInvitationValues,
} from '@/server/invitation/admin';
import { GuestResponseError, setGuestMessageStatus } from '@/server/guests/responses';
import { setPublicGuestbook } from '@/server/guests/guestbook';
import { DocumentError, removeCustomCard, updateCardOptions } from '@/server/documents/documents';
import type { ActionState } from './state';

const uuid = z.uuid();

function fail(e: unknown): ActionState {
  if (e instanceof InvitationAdminError) {
    return { error: `invitations.errors.${e.code}`, details: Object.entries(e.fieldErrors).map(([k, v]) => `${k}: ${v}`) };
  }
  throw e;
}

function ids(form: FormData) {
  const id = uuid.safeParse(form.get('id'));
  if (!id.success) throw new InvitationAdminError('notFound');
  return id.data;
}

const reasonOf = (form: FormData) => String(form.get('reason') ?? '');

async function done(id: string): Promise<ActionState> {
  revalidatePath(`/admin/invitations/${id}`);
  revalidatePath('/admin/invitations');
  return { ok: true, message: 'invitations.saved', nonce: Date.now() };
}

export async function editInvitationAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'invitations.edit' });
  try {
    const id = ids(form);
    const values: Record<string, string> = {};
    for (const [k, v] of form.entries()) if (k.startsWith('f.') && typeof v === 'string') values[k.slice(2)] = v;
    await updateInvitationValues(db(), id, { values, expectedVersion: Number(form.get('version')), reason: reasonOf(form) }, { adminId: user.id, ipHash: (await requestContext()).ipHash });
    return done(id);
  } catch (e) {
    return fail(e);
  }
}

export async function extendInvitationAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'invitations.extend' });
  try {
    const id = ids(form);
    await extendInvitation(db(), id, { days: Number(form.get('days')), reason: reasonOf(form) }, { adminId: user.id, ipHash: (await requestContext()).ipHash });
    return done(id);
  } catch (e) {
    return fail(e);
  }
}

export async function publishInvitationAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'invitations.publish' });
  try {
    const id = ids(form);
    await setInvitationPublished(db(), id, { published: form.get('published') === 'true', reason: reasonOf(form) }, { adminId: user.id, ipHash: (await requestContext()).ipHash });
    return done(id);
  } catch (e) {
    return fail(e);
  }
}

export async function invitationMusicAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'invitations.edit' });
  try {
    const id = ids(form);
    const raw = String(form.get('musicTrackId') ?? '');
    const track = raw ? uuid.safeParse(raw) : null;
    if (track && !track.success) throw new InvitationAdminError('music');
    await changeInvitationMusic(db(), id, { musicTrackId: track ? track.data! : null, reason: reasonOf(form) }, { adminId: user.id, ipHash: (await requestContext()).ipHash });
    return done(id);
  } catch (e) {
    return fail(e);
  }
}

export async function guestMessageStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'guests.moderate' });
  const id = uuid.safeParse(form.get('responseId'));
  const invitationId = uuid.safeParse(form.get('id'));
  if (!id.success || !invitationId.success) return { error: 'invitations.errors.notFound' };
  try {
    const status = form.get('status') === 'HIDDEN' ? 'HIDDEN' : 'VISIBLE';
    await setGuestMessageStatus(db(), id.data, status, { adminId: user.id, ipHash: (await requestContext()).ipHash });
  } catch (e) {
    if (e instanceof GuestResponseError) return { error: 'invitations.errors.notFound' };
    throw e;
  }
  revalidatePath(`/admin/invitations/${invitationId.data}`);
  return { ok: true, message: 'invitations.saved', nonce: Date.now() };
}

export async function cardOptionsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'documents.generate' });
  const id = uuid.safeParse(form.get('id'));
  if (!id.success) return { error: 'invitations.errors.notFound' };
  try {
    const useOwnMessage = form.get('messageMode') === 'custom';
    await updateCardOptions(
      db(),
      id.data,
      {
        message: useOwnMessage ? String(form.get('message') ?? '') : undefined,
        extraLine: String(form.get('extraLine') ?? ''),
        showQr: form.get('showQr') === 'on',
      },
      { adminId: user.id, ipHash: (await requestContext()).ipHash },
    );
  } catch (e) {
    if (e instanceof DocumentError) return { error: `invitations.cardErrors.${e.code}` };
    throw e;
  }
  revalidatePath(`/admin/invitations/${id.data}`);
  return { ok: true, message: 'invitations.saved', nonce: Date.now() };
}

export async function removeCustomCardAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'documents.generate' });
  const id = uuid.safeParse(form.get('id'));
  if (!id.success) return { error: 'invitations.errors.notFound' };
  await removeCustomCard(db(), id.data, { adminId: user.id, ipHash: (await requestContext()).ipHash });
  revalidatePath(`/admin/invitations/${id.data}`);
  return { ok: true, message: 'invitations.saved', nonce: Date.now() };
}

export async function guestbookVisibilityAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'invitations.edit' });
  const id = uuid.safeParse(form.get('id'));
  if (!id.success) return { error: 'invitations.errors.notFound' };
  await setPublicGuestbook(db(), id.data, form.get('public') === 'true', { type: 'ADMIN', adminId: user.id, ipHash: (await requestContext()).ipHash });
  revalidatePath(`/admin/invitations/${id.data}`);
  return { ok: true, message: 'invitations.saved', nonce: Date.now() };
}
