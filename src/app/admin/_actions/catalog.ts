'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { requestContext } from '@/server/auth/request-context';
import { can } from '@/server/rbac/authz';
import type { Permission } from '@/server/rbac/permissions';
import type { Actor } from '@/server/catalog/common';
import { FIELD_KEYS } from '@/catalog/fields';
import { FEATURE_KEYS } from '@/catalog/features';
import { createSection, moveSection, setSectionDefaultFields, setSectionStatus, updateSection } from '@/server/catalog/sections';
import { updateField } from '@/server/catalog/fields';
import { createMusicTrack, renameMusicTrack, setMusicStatus } from '@/server/catalog/music';
import {
  THEME_TRANSITIONS,
  getThemeDetail,
  moveTheme,
  setCurrentVersion,
  setThemeFields,
  syncThemesFromRegistry,
  transitionTheme,
  updateThemeSettings,
  type ThemeStatus,
} from '@/server/catalog/themes';
import { createPackage, movePackage, setPackageStatus, updatePackage } from '@/server/catalog/packages';
import { themeManifests } from '@/theme-registry';
import { catalogFailure, readI18n, readString } from './form-helpers';
import type { ActionState } from './state';

async function actorWith(permission: Permission): Promise<Actor> {
  const { user } = await requireAdmin({ permission });
  return { adminId: user.id, ipHash: (await requestContext()).ipHash };
}

const ok = (message = 'catalog.common.saved'): ActionState => ({ ok: true, message, nonce: Date.now() });
const id = (form: FormData, name = 'id') => z.uuid().parse(form.get(name));
const direction = (form: FormData) => z.enum(['up', 'down']).parse(form.get('direction'));
const status = (form: FormData) => z.enum(['ACTIVE', 'ARCHIVED']).parse(form.get('status'));

/** Wraps an action body: maps domain/validation errors to form messages. */
async function run(body: () => Promise<ActionState | void>, paths: string[]): Promise<ActionState> {
  try {
    const result = await body();
    for (const p of paths) revalidatePath(p);
    return result ?? ok();
  } catch (e) {
    return catalogFailure(e);
  }
}

// ---------- Sections ----------

export async function createSectionAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('sections.manage');
  return run(async () => {
    await createSection(db(), { key: form.get('key') as string, name: readI18n(form, 'name') }, actor);
  }, ['/admin/sections']);
}

export async function updateSectionAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('sections.manage');
  return run(async () => {
    await updateSection(
      db(),
      id(form),
      {
        name: readI18n(form, 'name'),
        description: readI18n(form, 'description'),
        imageAssetId: readString(form, 'imageAssetId') ?? null,
        requiredFeatures: form.getAll('requiredFeatures').filter((v): v is string => typeof v === 'string') as never,
      },
      actor,
    );
  }, ['/admin/sections']);
}

export async function sectionDefaultFieldsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('sections.manage');
  return run(async () => {
    const items = FIELD_KEYS.filter((k) => form.get(`df.${k}.included`) === 'on')
      .map((k) => ({ fieldKey: k, order: Number(form.get(`df.${k}.order`) ?? 0), label: readI18n(form, `df.${k}.label`) }))
      .sort((a, b) => a.order - b.order)
      .map(({ fieldKey, label }) => ({ fieldKey, label }));
    await setSectionDefaultFields(db(), id(form), items, actor);
  }, ['/admin/sections']);
}

export async function sectionStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('sections.manage');
  return run(() => setSectionStatus(db(), id(form), status(form), actor, readString(form, 'reason')), ['/admin/sections']);
}

export async function moveSectionAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('sections.manage');
  return run(() => moveSection(db(), id(form), direction(form), actor), ['/admin/sections']);
}

// ---------- Field library ----------

export async function updateFieldAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('sections.manage');
  return run(async () => {
    const key = z.enum(FIELD_KEYS as [string, ...string[]]).parse(form.get('key'));
    await updateField(db(), key, { label: readI18n(form, 'label'), maxLength: readString(form, 'maxLength') as never }, actor);
  }, ['/admin/fields']);
}

// ---------- Music ----------

export async function createMusicAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('music.manage');
  return run(async () => {
    await createMusicTrack(db(), { title: form.get('title') as string, assetId: form.get('assetId') as string }, actor);
  }, ['/admin/music']);
}

export async function renameMusicAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('music.manage');
  return run(() => renameMusicTrack(db(), id(form), form.get('title') as string, actor), ['/admin/music', '/admin/themes']);
}

export async function musicStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('music.manage');
  return run(() => setMusicStatus(db(), id(form), status(form), actor), ['/admin/music']);
}

// ---------- Themes ----------

export async function syncThemesAction(): Promise<ActionState> {
  const actor = await actorWith('themes.manage');
  return run(async () => {
    const r = await syncThemesFromRegistry(db(), themeManifests(), actor);
    return {
      ok: true,
      message: 'catalog.themes.synced',
      details: [
        `+${r.registeredThemes.length} / +${r.registeredVersions.length} / ~${r.updatedVersions.length}`,
        ...r.conflicts.map((c) => `⚠ ${c}`),
        ...r.missing.map((m) => `− ${m}`),
      ],
      nonce: Date.now(),
    };
  }, ['/admin/themes']);
}

export async function themeSettingsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('themes.manage');
  const themeId = id(form);
  return run(
    () =>
      updateThemeSettings(
        db(),
        themeId,
        {
          name: readI18n(form, 'name'),
          description: readI18n(form, 'description'),
          sectionId: readString(form, 'sectionId') ?? null,
          coverAssetId: readString(form, 'coverAssetId') ?? null,
          musicTrackId: readString(form, 'musicTrackId') ?? null,
        },
        actor,
      ),
    ['/admin/themes', `/admin/themes/${themeId}`],
  );
}

export async function themeFieldsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('themes.manage');
  const themeId = id(form);
  return run(async () => {
    const keys = form.getAll('fieldKey').filter((v): v is string => typeof v === 'string');
    const items = keys
      .map((k) => ({ fieldKey: k, order: Number(form.get(`tf.${k}.order`) ?? 0), label: readI18n(form, `tf.${k}.label`) }))
      .sort((a, b) => a.order - b.order)
      .map(({ fieldKey, label }) => ({ fieldKey, label }));
    await setThemeFields(db(), themeId, items, actor);
  }, [`/admin/themes/${themeId}`]);
}

export async function currentVersionAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('themes.manage');
  const themeId = id(form);
  return run(() => setCurrentVersion(db(), themeId, id(form, 'versionId'), actor), ['/admin/themes', `/admin/themes/${themeId}`]);
}

export async function themeTransitionAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { user, authz } = await requireAdmin({ permission: 'themes.view' });
  const themeId = id(form);
  const to = z.enum(['DEVELOPMENT', 'READY_FOR_REVIEW', 'ACTIVE', 'ARCHIVED']).parse(form.get('to')) as ThemeStatus;
  const detail = await getThemeDetail(db(), themeId).catch(() => null);
  const needed = detail ? THEME_TRANSITIONS[detail.theme.status][to] : undefined;
  if (!needed) return { error: 'catalog.errors.invalidTransition' };
  if (!can(authz, needed)) return { error: 'catalog.errors.forbidden' };
  const actor = { adminId: user.id, ipHash: (await requestContext()).ipHash };
  return run(() => transitionTheme(db(), themeId, to, actor, readString(form, 'reason')), ['/admin/themes', `/admin/themes/${themeId}`]);
}

export async function moveThemeAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('themes.manage');
  return run(() => moveTheme(db(), id(form), direction(form), actor), ['/admin/themes']);
}

// ---------- Packages ----------

/** The package's contents are one of the theme's designed states, chosen by index. */
async function packageShape(themeId: string, form: FormData) {
  const detail = await getThemeDetail(db(), themeId);
  const index = z.coerce.number().int().min(0).parse(form.get('state'));
  const state = detail.currentManifest?.validStates[index];
  if (!state) throw new z.ZodError([]);
  return { fieldKeys: state.fields, featureKeys: state.features.filter((f) => (FEATURE_KEYS as string[]).includes(f)) };
}

function packageFields(form: FormData) {
  return {
    name: readI18n(form, 'name'),
    description: readI18n(form, 'description'),
    priceIqd: Number(String(form.get('priceIqd') ?? '').replace(/[,\s٬]/g, '')),
  };
}

export async function createPackageAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('themes.manage');
  const themeId = id(form, 'themeId');
  return run(async () => {
    await createPackage(db(), themeId, { ...packageFields(form), ...(await packageShape(themeId, form)) }, actor);
  }, [`/admin/themes/${themeId}`, '/admin/themes']);
}

export async function updatePackageAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('themes.manage');
  const themeId = id(form, 'themeId');
  return run(async () => {
    await updatePackage(db(), id(form), { ...packageFields(form), ...(await packageShape(themeId, form)) }, actor);
  }, [`/admin/themes/${themeId}`, '/admin/themes']);
}

export async function packageStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('themes.manage');
  const themeId = id(form, 'themeId');
  return run(() => setPackageStatus(db(), id(form), status(form), actor, readString(form, 'reason')), [`/admin/themes/${themeId}`, '/admin/themes']);
}

export async function movePackageAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await actorWith('themes.manage');
  const themeId = id(form, 'themeId');
  return run(() => movePackage(db(), id(form), direction(form), actor), [`/admin/themes/${themeId}`]);
}
