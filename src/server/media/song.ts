import 'server-only';
import { spawn } from 'node:child_process';
import { parseBuffer } from 'music-metadata';
import { env } from '@/server/env';
import { MediaError } from './process';

/** A customer's song plays for at most this long: longer uploads are cut, with a short fade at the end. */
export const SONG_MAX_SECONDS = 120;
const FADE_OUT_SECONDS = 3;
/**
 * Largest file accepted; it is written to disk, never held in memory. 100 MB is also the most a Cloudflare-proxied site
 * accepts in one request; a song file is a few MB, a short phone video tens of MB.
 */
export const SONG_UPLOAD_MAX_BYTES = 100 * 1024 * 1024;
/** The latest start a customer can pick (the slider never goes past the end of their file anyway). */
export const SONG_MAX_START_SECONDS = 60 * 60;
const CONVERT_TIMEOUT_MS = 90_000;

/**
 * What ffmpeg may open: ordinary audio and video files only. No playlists (HLS, concat…) or network protocols, so a
 * crafted file can never make the server read another file or fetch a URL.
 */
const FORMATS = 'mov,mp4,m4a,3gp,3g2,mj2,mp3,wav,ogg,matroska,webm,flac,aac,amr,avi,asf,mpegts,caf,aiff';

/** Conversions running at once; more wait their turn so the website stays quick. */
const MAX_PARALLEL = 2;
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
 * Turns a customer's audio or video file (on disk) into the MP3 their invitation plays: the sound only, from `start`
 * seconds, at most 2 minutes (fading out when it is cut), 128 kbit/s stereo, with all metadata (titles, tags, cover
 * pictures, location) dropped. MediaError('unsupportedAudio') when it has no usable sound.
 */
export async function processSong(file: string, start = 0) {
  const from = Number.isFinite(start) ? Math.min(Math.max(0, start), SONG_MAX_START_SECONDS) : 0;
  const fades = [...(from > 0 ? ['afade=t=in:d=0.5'] : []), `afade=t=out:st=${SONG_MAX_SECONDS - FADE_OUT_SECONDS}:d=${FADE_OUT_SECONDS}`];
  const args = [
    '-hide_banner', '-nostdin', '-loglevel', 'error',
    '-protocol_whitelist', 'file', '-format_whitelist', FORMATS,
    ...(from > 0 ? ['-ss', from.toFixed(2)] : []),
    '-i', file,
    '-t', String(SONG_MAX_SECONDS),
    '-map', '0:a:0', '-vn', '-sn', '-dn', '-map_metadata', '-1', '-map_chapters', '-1',
    '-af', fades.join(','),
    '-ac', '2', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k',
    '-f', 'mp3', 'pipe:1',
  ];
  const release = await slot();
  let data: Buffer;
  try {
    data = await run(env().FFMPEG_PATH ?? 'ffmpeg', args);
  } finally {
    release();
  }
  let duration: number | undefined;
  try {
    duration = (await parseBuffer(data, { mimeType: 'audio/mpeg' }, { duration: true })).format.duration;
  } catch {
    throw new MediaError('unsupportedAudio');
  }
  if (!duration || duration < 1) throw new MediaError('unsupportedAudio');
  return { data, mime: 'audio/mpeg', durationSeconds: Math.min(SONG_MAX_SECONDS, Math.round(duration)) };
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
      // The file isn't audio/video we can read (or has no sound): the customer is told so.
      console.warn(JSON.stringify({ level: 'warn', msg: 'song.convert_failed', code, error: err.slice(0, 500) }));
      reject(new MediaError('unsupportedAudio'));
    });
  });
}
