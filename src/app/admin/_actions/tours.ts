'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { requestContext } from '@/server/auth/request-context';
import type { Actor } from '@/server/catalog/common';
import { createTour, setTourLive, setTourLogo, updateTour, type TourInput } from '@/server/tours/tours';
import { catalogFailure } from './form-helpers';
import type { ActionState } from './state';

/** Virtual tours (owner, 2026-11-21): every action checks `tours.manage` itself and is audited by the service. */
async function actor(): Promise<Actor> {
  const { user } = await requireAdmin({ permission: 'tours.manage' });
  return { adminId: user.id, ipHash: (await requestContext()).ipHash };
}

const id = (form: FormData) => z.uuid().parse(form.get('id'));
const text = (form: FormData, name: string) => {
  const v = form.get(name);
  return typeof v === 'string' ? v : '';
};

function input(form: FormData): TourInput {
  return {
    name: text(form, 'name'),
    slug: text(form, 'slug'),
    endsOn: text(form, 'endsOn'),
    links: { instagram: text(form, 'instagram'), location: text(form, 'location'), menu: text(form, 'menu'), whatsapp: text(form, 'whatsapp') },
  };
}

async function run(body: () => Promise<void>, paths: string[]): Promise<ActionState> {
  try {
    await body();
    for (const p of paths) revalidatePath(p);
    return { ok: true, message: 'catalog.common.saved', nonce: Date.now() };
  } catch (e) {
    return catalogFailure(e);
  }
}

export async function createTourAction(_: ActionState, form: FormData): Promise<ActionState> {
  const who = await actor();
  let created: string | null = null;
  const result = await run(async () => {
    created = (await createTour(db(), input(form), who)).id;
  }, ['/admin/tours']);
  // On to the new tour, to upload its model.
  if (created) redirect(`/admin/tours/${created}`);
  return result;
}

export async function updateTourAction(_: ActionState, form: FormData): Promise<ActionState> {
  const who = await actor();
  const tourId = id(form);
  return run(() => updateTour(db(), tourId, input(form), who).then(() => {}), ['/admin/tours', `/admin/tours/${tourId}`]);
}

export async function tourLiveAction(_: ActionState, form: FormData): Promise<ActionState> {
  const who = await actor();
  const tourId = id(form);
  return run(() => setTourLive(db(), tourId, text(form, 'live') === 'true', who), ['/admin/tours', `/admin/tours/${tourId}`]);
}

export async function tourLogoAction(_: ActionState, form: FormData): Promise<ActionState> {
  const who = await actor();
  const tourId = id(form);
  const asset = text(form, 'assetId');
  return run(() => setTourLogo(db(), tourId, asset ? z.uuid().parse(asset) : null, who), [`/admin/tours/${tourId}`]);
}
