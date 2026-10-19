import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseBuffer } from 'music-metadata';
import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { assets, auditLogs, invitations } from '@/server/db/schema';
import { storage } from '@/server/storage';
import { createPackage } from '@/server/catalog/packages';
import { createDraft } from '@/server/orders/drafts';
import { invitationRenderData } from '@/server/invitation/load';
import { removeInvitationSong } from '@/server/invitation/admin';
import { runHousekeeping } from '@/server/housekeeping';
import { processSong } from '@/server/media/song';
import { customSong, deleteOrphanSongFiles, setCustomSong } from '@/server/music/custom';
import { handleSongRequest } from '@/server/music/http';
import { withUploadLines } from '@/server/legal/seed';
import { randomToken } from '@/lib/crypto';
import { activeTheme, BASIC_FIELDS, weddingValues } from '../fixtures';
import { ctx } from '../helpers';

const dir = mkdtempSync(path.join(tmpdir(), 'bahja-song-test-'));

/** Makes a media file with ffmpeg (a tone, optionally with a picture track, and a title tag). */
function media(name: string, args: string[]) {
  const file = path.join(dir, name);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args, file]);
  return file;
}

let files: { video: string; short: string; silentVideo: string; notMedia: string };
let shop: Awaited<ReturnType<typeof activeTheme>> & { withSong: string };

beforeAll(async () => {
  files = {
    // A phone-like video of a song: 3 minutes 20, picture and sound, with a title and a location tag.
    video: media('song-video.mp4', [
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=200', '-f', 'lavfi', '-i', 'color=c=blue:s=320x240:d=200',
      '-shortest', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac',
      '-metadata', 'title=Secret title', '-metadata', 'location=+36.19+044.01/',
    ]),
    short: media('short.m4a', ['-f', 'lavfi', '-i', 'sine=frequency=660:duration=20', '-c:a', 'aac']),
    silentVideo: media('silent.mp4', ['-f', 'lavfi', '-i', 'color=c=red:s=160x120:d=3', '-c:v', 'libx264', '-preset', 'ultrafast']),
    notMedia: path.join(dir, 'notes.txt'),
  };
  writeFileSync(files.notMedia, 'not a song at all '.repeat(200));
  const base = await activeTheme();
  const withSong = await createPackage(
    db(),
    base.theme.id,
    { name: { ar: 'أغنيتي', en: 'My song' }, priceIqd: 40000, fieldKeys: [...BASIC_FIELDS], featureKeys: ['music', 'custom_music', 'print_card'] },
    base.actor,
  );
  shop = { ...base, withSong: withSong.id };
}, 60_000);

async function draft(packageId = shop.withSong) {
  const d = await createDraft(db(), { themeKey: shop.theme.key, packageId, locale: 'en', values: weddingValues() }, { ...ctx, ipHash: randomToken(8) });
  const [inv] = await db().select().from(invitations).where(eq(invitations.id, d.invitationId));
  return inv!;
}

const fresh = async (id: string) => (await db().select().from(invitations).where(eq(invitations.id, id)))[0]!;

function upload(file: string, query = 'confirm=1') {
  return new Request(`http://localhost/p/x/music?${query}`, { method: 'POST', body: readFileSync(file), headers: { 'Content-Type': 'video/mp4' } });
}

describe('customer’s own song (feature `custom_music`)', () => {
  it('turns a video into an MP3 of its sound, at most 2 minutes, without tags', async () => {
    const song = await processSong(files.video);
    const meta = await parseBuffer(song.data, { mimeType: 'audio/mpeg' }, { duration: true });
    expect(meta.format.container).toBe('MPEG');
    expect(meta.format.duration).toBeGreaterThan(118);
    expect(meta.format.duration).toBeLessThan(121);
    expect(song.durationSeconds).toBe(120);
    expect(meta.common.title).toBeUndefined();
    expect(song.data.includes(Buffer.from('Secret title'))).toBe(false);
  });

  it('starts where the customer chose, and keeps a short song whole', async () => {
    const late = await processSong(files.video, 150);
    expect(late.durationSeconds).toBeGreaterThanOrEqual(49);
    expect(late.durationSeconds).toBeLessThanOrEqual(51);
    const short = await processSong(files.short);
    expect(short.durationSeconds).toBe(20);
  });

  it('refuses files without sound', async () => {
    await expect(processSong(files.notMedia)).rejects.toMatchObject({ code: 'unsupportedAudio' });
    await expect(processSong(files.silentVideo)).rejects.toMatchObject({ code: 'unsupportedAudio' });
  });

  it('the customer’s song replaces the design’s; removing it brings the design’s back', async () => {
    const inv = await draft();
    const designSong = (await invitationRenderData(db(), inv, 'preview')).props.music?.src;
    expect(designSong).toBeTruthy();

    // They must confirm they may use it.
    expect((await handleSongRequest(db(), upload(files.video, 'start=10'), inv, { ipHash: null, published: false })).status).toBe(400);
    const res = await handleSongRequest(db(), upload(files.video, 'start=10&confirm=1'), inv, { ipHash: null, published: false });
    expect(res.status).toBe(200);
    const { song } = (await res.json()) as { song: { src: string; durationSeconds: number } };
    expect(song.durationSeconds).toBe(120);
    expect((await invitationRenderData(db(), await fresh(inv.id), 'preview')).props.music?.src).toBe(song.src);

    const [log] = await db().select().from(auditLogs).where(and(eq(auditLogs.objectId, inv.id), eq(auditLogs.action, 'music.custom_set')));
    expect(log?.after).toMatchObject({ rightsConfirmed: true, start: 10 });

    // A second song replaces the first, whose file is deleted.
    const first = (await fresh(inv.id)).customMusicAssetId!;
    const [firstFile] = await db().select().from(assets).where(eq(assets.id, first));
    await handleSongRequest(db(), upload(files.short), await fresh(inv.id), { ipHash: null, published: false });
    expect((await customSong(db(), await fresh(inv.id)))?.durationSeconds).toBe(20);
    expect(await db().select().from(assets).where(eq(assets.id, first))).toEqual([]);
    expect(await storage().get(firstFile!.storageKey)).toBeNull();

    const del = await handleSongRequest(db(), new Request('http://localhost/p/x/music', { method: 'DELETE' }), await fresh(inv.id), { ipHash: null, published: false });
    expect(del.status).toBe(200);
    expect((await fresh(inv.id)).customMusicAssetId).toBeNull();
    expect((await invitationRenderData(db(), await fresh(inv.id), 'preview')).props.music?.src).toBe(designSong);
  }, 60_000);

  it('only packages with the feature take a song; files without sound and huge files are refused', async () => {
    const plain = await draft(shop.basic.id);
    expect((await handleSongRequest(db(), upload(files.short), plain, { ipHash: null, published: false })).status).toBe(400);
    const inv = await draft();
    const bad = await handleSongRequest(db(), upload(files.notMedia), inv, { ipHash: null, published: false });
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: 'unsupportedAudio' });
    const huge = new Request('http://localhost/p/x/music?confirm=1', { method: 'POST', body: 'x', headers: { 'Content-Length': String(300 * 1024 * 1024) } });
    expect((await handleSongRequest(db(), huge, inv, { ipHash: null, published: false })).status).toBe(413);
    expect((await fresh(inv.id)).customMusicAssetId).toBeNull();
  });

  it('the team can take a song off (with a reason, audited)', async () => {
    const inv = await draft();
    await setCustomSong(db(), inv, files.short);
    await expect(removeInvitationSong(db(), inv.id, { reason: 'x' }, shop.actor)).rejects.toMatchObject({ code: 'reason' });
    await removeInvitationSong(db(), inv.id, { reason: 'Copyright complaint' }, shop.actor);
    expect((await fresh(inv.id)).customMusicAssetId).toBeNull();
    const logs = await db().select().from(auditLogs).where(and(eq(auditLogs.objectId, inv.id), eq(auditLogs.action, 'invitation.custom_music_removed')));
    expect(logs[0]?.reason).toBe('Copyright complaint');
  });

  it('songs of orders never paid are deleted with the photos; unused files after an hour', async () => {
    const inv = await draft();
    await setCustomSong(db(), inv, files.short);
    await runHousekeeping(db(), new Date(Date.now() + 20 * 86400_000), { prepareKeepsakes: false });
    expect((await fresh(inv.id)).customMusicAssetId).not.toBeNull();
    const result = await runHousekeeping(db(), new Date(Date.now() + 32 * 86400_000), { prepareKeepsakes: false });
    expect(result.songsDeleted).toBeGreaterThanOrEqual(1);
    expect((await fresh(inv.id)).customMusicAssetId).toBeNull();

    // A file whose invitation let go of it without deleting it.
    const other = await draft();
    await setCustomSong(db(), other, files.short);
    const assetId = (await fresh(other.id)).customMusicAssetId!;
    await db().update(invitations).set({ customMusicAssetId: null }).where(eq(invitations.id, other.id));
    expect(await deleteOrphanSongFiles(db())).toBe(0);
    expect(await deleteOrphanSongFiles(db(), new Date(Date.now() + 2 * 3600_000))).toBeGreaterThanOrEqual(1);
    expect(await db().select().from(assets).where(eq(assets.id, assetId))).toEqual([]);
  });
});

describe('policies for customers’ songs and photos', () => {
  const terms = { ar: 'مقدمة\n\n## الملكية\n- نص', en: 'Intro\n\n## Ownership\n- Text', ckb: 'ckb', bdn: 'bdn' };

  it('adds the section before Ownership once, leaving unapproved Kurdish as it is', () => {
    const next = withUploadLines('TERMS', terms)!;
    expect(next.en).toMatch(/## Songs, videos and photos you add[\s\S]*\n\n## Ownership/);
    expect(next.ar).toMatch(/## الأغاني والفيديوهات والصور التي تضيفها[\s\S]*\n\n## الملكية/);
    expect(next.ckb).toBe('ckb');
    expect(withUploadLines('TERMS', next)).toBeNull();
  });

  it('adds the privacy lines after the matching sentences, or at the end when reworded', () => {
    const privacy = {
      ar: 'نص',
      en: '## What we collect\n- From guests (when the feature is included): their name, whether they will attend, and their congratulation message.\n- Other',
      ckb: null,
      bdn: null,
    };
    const next = withUploadLines('PRIVACY', privacy)!;
    expect(next.en).toContain('congratulation message.\n- If your package includes them: the photos and the song');
    expect(next.en.trimEnd().endsWith('30 days after the preview link expires.')).toBe(true);
    expect(next.ar).toContain('صورك وأغنيتك الخاصة');
    expect(withUploadLines('REFUND', privacy)).toBeNull();
  });
});
