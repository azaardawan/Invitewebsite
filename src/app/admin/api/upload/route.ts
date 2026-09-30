import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/server/db/client';
import { getCurrentAdmin } from '@/server/auth/current';
import { nextAuthStep } from '@/server/auth/session';
import { isSameOrigin } from '@/server/auth/same-origin';
import { can } from '@/server/rbac/authz';
import { assetUrl, storeAudio, storeImage } from '@/server/media/assets';
import { MEDIA_LIMITS, MediaError } from '@/server/media/process';

/**
 * Admin file uploads (images, MP3). A route handler rather than a server
 * action so large files don't require raising the body limit for every action.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const current = await getCurrentAdmin();
  if (!current || nextAuthStep(current.user, current.session) !== 'ok') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const length = Number(req.headers.get('content-length') ?? 0);
  const maxBytes = Math.max(MEDIA_LIMITS.imageMaxBytes, MEDIA_LIMITS.audioMaxBytes) + 64 * 1024;
  if (!length || length > maxBytes) return NextResponse.json({ error: 'tooLarge' }, { status: 413 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const kind = form.get('kind');
  const file = form.get('file');
  if ((kind !== 'image' && kind !== 'audio') || !(file instanceof File)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const allowed =
    kind === 'audio'
      ? can(current.authz, 'music.manage')
      : can(current.authz, 'sections.manage') || can(current.authz, 'themes.manage');
  if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const opts = { filename: file.name, uploadedBy: current.user.id };
    const asset = kind === 'audio' ? await storeAudio(db(), bytes, opts) : await storeImage(db(), bytes, opts);
    return NextResponse.json({
      id: asset.id,
      url: assetUrl(asset),
      width: asset.width,
      height: asset.height,
      durationSeconds: asset.durationSeconds,
    });
  } catch (e) {
    if (e instanceof MediaError) return NextResponse.json({ error: e.code }, { status: 422 });
    throw e;
  }
}
