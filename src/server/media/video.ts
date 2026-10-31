import 'server-only';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '@/server/env';
import { MediaError } from './process';

/** A customer's video plays for at most this long: longer uploads are cut (owner, 2026-10-31: one short video). */
export const VIDEO_MAX_SECONDS = 60;
/**
 * Largest file accepted; written to disk, never held in memory. 100 MB is also the most a Cloudflare-proxied site
 * accepts in one request: a minute of phone video at normal quality fits.
 */
export const VIDEO_UPLOAD_MAX_BYTES = 100 * 1024 * 1024;
/** The longest side of the converted video (720p): sharp on phones and laptops, quick to load. */
const VIDEO_MAX_SIDE = 1280;
const CONVERT_TIMEOUT_MS = 180_000;

/** What ffmpeg may open: ordinary video files only, no playlists or network protocols (see song.ts). */
const FORMATS = 'mov,mp4,m4a,3gp,3g2,mj2,matroska,webm,avi,asf,mpegts';

/** Conversions running at once (video is heavier than sound); more wait their turn. */
const MAX_PARALLEL = 1;
let running = 0;
const queue: (() => void)[] = [];
async function slot() {
  if (running >= MAX_PARALLEL) await new Promise<void>((resolve) => queue.push(resolve));
  running++;
  return () => {
    running--;
    queue.shift()?.();
  };
}

/**
 * Turns a customer's video file (on disk) into what their page plays: H.264 MP4 (plays on every phone and browser), at
 * most a minute and 1280 px on its longest side, its sound as AAC (or silent when it has none), ready to start playing
 * before it has fully loaded, with all metadata (location, camera, dates) dropped. Also a still from its first second
 * (JPEG), shown until it plays. MediaError('unsupportedVideo') for a file without a usable picture.
 * `workDir` is a private temporary folder the caller deletes afterwards.
 */
export async function processVideo(file: string, workDir: string) {
  const out = path.join(workDir, 'video.mp4');
  const still = path.join(workDir, 'poster.jpg');
  const scale = `scale='if(gt(iw,ih),min(${VIDEO_MAX_SIDE},iw),-2)':'if(gt(iw,ih),-2,min(${VIDEO_MAX_SIDE},ih))'`;
  const common = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-protocol_whitelist', 'file', '-format_whitelist', FORMATS];
  const release = await slot();
  try {
    await run(env().FFMPEG_PATH ?? 'ffmpeg', [
      ...common,
      '-i', file,
      '-t', String(VIDEO_MAX_SECONDS),
      '-map', '0:v:0', '-map', '0:a:0?', '-sn', '-dn', '-map_metadata', '-1', '-map_chapters', '-1',
      '-vf', `${scale},format=yuv420p`,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-profile:v', 'high', '-r', '30',
      '-c:a', 'aac', '-b:a', '128k', '-ac', '2',
      '-movflags', '+faststart',
      '-y', out,
    ]);
    await run(env().FFMPEG_PATH ?? 'ffmpeg', [...common, '-ss', '0.5', '-i', out, '-frames:v', '1', '-q:v', '3', '-y', still]).catch(() =>
      // A video shorter than half a second: its very first picture.
      run(env().FFMPEG_PATH ?? 'ffmpeg', [...common, '-i', out, '-frames:v', '1', '-q:v', '3', '-y', still]),
    );
  } finally {
    release();
  }
  const [data, poster] = await Promise.all([readFile(out), readFile(still)]);
  const info = await probe(out);
  if (!info.width || !info.height || data.byteLength < 1000) throw new MediaError('unsupportedVideo');
  return {
    video: { data, mime: 'video/mp4', width: info.width, height: info.height, durationSeconds: Math.min(VIDEO_MAX_SECONDS, Math.max(1, Math.round(info.duration))) },
    poster: { data: poster, mime: 'image/jpeg', width: info.width, height: info.height },
  };
}

/** The converted video's size and length (ffprobe on our own file). */
async function probe(file: string) {
  const ffprobe = (env().FFMPEG_PATH ?? 'ffmpeg').replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
  const json = await run(ffprobe, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file]).catch(() => Buffer.from('{}'));
  const parsed = JSON.parse(json.toString() || '{}') as { streams?: { width?: number; height?: number }[]; format?: { duration?: string } };
  return { width: parsed.streams?.[0]?.width ?? 0, height: parsed.streams?.[0]?.height ?? 0, duration: Number(parsed.format?.duration ?? 0) };
}

function run(cmd: string, args: string[]) {
  return new Promise<Buffer>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const out: Buffer[] = [];
    let err = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), CONVERT_TIMEOUT_MS);
    child.stdout.on('data', (c: Buffer) => out.push(c));
    child.stderr.on('data', (c: Buffer) => {
      if (err.length < 2000) err += c.toString();
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve(Buffer.concat(out));
      // Not a video we can read: the customer is told so.
      console.warn(JSON.stringify({ level: 'warn', msg: 'video.convert_failed', code, error: err.slice(0, 500) }));
      reject(new MediaError('unsupportedVideo'));
    });
  });
}
