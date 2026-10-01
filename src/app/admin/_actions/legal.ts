'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { requestContext } from '@/server/auth/request-context';
import { discardDraft, LegalError, POLICY_TYPES, POLICY_SLUGS, publishDraft, saveDraft, type PolicyType } from '@/server/legal/policies';
import type { ActionState } from './state';

function policyType(form: FormData): PolicyType | null {
  const v = String(form.get('type') ?? '');
  return (POLICY_TYPES as readonly string[]).includes(v) ? (v as PolicyType) : null;
}

function refresh(type: PolicyType) {
  revalidatePath('/admin/legal');
  revalidatePath(`/admin/legal/${POLICY_SLUGS[type]}`);
  revalidatePath(`/[locale]/legal/${POLICY_SLUGS[type]}`, 'page');
}

export async function saveLegalDraftAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'legal.manage' });
  const type = policyType(form);
  if (!type) return { error: 'legal.errors.invalid' };
  const text = (k: string) => String(form.get(k) ?? '');
  try {
    await saveDraft(db(), type, { ar: text('ar'), en: text('en'), ckb: text('ckb'), bdn: text('bdn') }, { adminId: user.id, ipHash: (await requestContext()).ipHash });
  } catch (e) {
    if (e instanceof LegalError) return { error: `legal.errors.${e.code}` };
    throw e;
  }
  refresh(type);
  return { ok: true, message: 'legal.draftSaved', nonce: Date.now() };
}

export async function publishLegalAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'legal.manage' });
  const type = policyType(form);
  if (!type) return { error: 'legal.errors.invalid' };
  try {
    await publishDraft(db(), type, { adminId: user.id, ipHash: (await requestContext()).ipHash });
  } catch (e) {
    if (e instanceof LegalError) return { error: `legal.errors.${e.code}` };
    throw e;
  }
  refresh(type);
  return { ok: true, message: 'legal.published', nonce: Date.now() };
}

export async function discardLegalDraftAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin({ permission: 'legal.manage' });
  const type = policyType(form);
  if (!type) return { error: 'legal.errors.invalid' };
  await discardDraft(db(), type, { adminId: user.id, ipHash: (await requestContext()).ipHash });
  refresh(type);
  return { ok: true, message: 'legal.discarded', nonce: Date.now() };
}
