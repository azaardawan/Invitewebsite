import 'server-only';
import sharp, { type Metadata } from 'sharp';
import { parseBuffer } from 'music-metadata';

export class MediaError extends Error {
  constructor(public readonly code: 'tooLarge' | 'unsupportedImage' | 'unsupportedAudio' | 'imageTooSmall' | 'audioTooLong') {
    super(code);
  }
}

export const MEDIA_LIMITS = {
  imageMaxBytes: 15 * 1024 * 1024,
  imageMaxPixels: 40_000_000,
  imageMinSide: 200,
  imageOutputMaxWidth: 2400,
  audioMaxBytes: 15 * 1024 * 1024,
  audioMaxSeconds: 10 * 60,
} as const;

/**
 * Re-encodes any accepted raster image to WebP. The format is detected from
 * the bytes (never trusted from the filename or browser), EXIF orientation is
 * applied, and all metadata (EXIF/GPS/ICC comments) is dropped.
 */
export async function processImage(input: Buffer) {
  if (input.byteLength > MEDIA_LIMITS.imageMaxBytes) throw new MediaError('tooLarge');
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: MEDIA_LIMITS.imageMaxPixels }).metadata();
  } catch {
    throw new MediaError('unsupportedImage');
  }
  // SVG is deliberately not accepted for uploads (script risk); theme SVGs live in code.
  if (!meta.format || !['jpeg', 'png', 'webp', 'avif', 'heif'].includes(meta.format)) {
    throw new MediaError('unsupportedImage');
  }
  if ((meta.width ?? 0) < MEDIA_LIMITS.imageMinSide || (meta.height ?? 0) < MEDIA_LIMITS.imageMinSide) {
    throw new MediaError('imageTooSmall');
  }
  const { data, info } = await sharp(input, { limitInputPixels: MEDIA_LIMITS.imageMaxPixels })
    .rotate()
    .resize({ width: MEDIA_LIMITS.imageOutputMaxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  return { data, mime: 'image/webp', width: info.width, height: info.height, ext: 'webp' as const };
}

/** Accepts MP3 only, verified by parsing the audio frames; returns its duration. */
export async function processAudio(input: Buffer) {
  if (input.byteLength > MEDIA_LIMITS.audioMaxBytes) throw new MediaError('tooLarge');
  const head = input.subarray(0, 3);
  const looksMp3 = head.toString('latin1') === 'ID3' || (head[0] === 0xff && ((head[1] ?? 0) & 0xe0) === 0xe0);
  if (!looksMp3) throw new MediaError('unsupportedAudio');
  let duration: number | undefined;
  try {
    const meta = await parseBuffer(input, { mimeType: 'audio/mpeg' }, { duration: true });
    if (meta.format.container !== 'MPEG' || !meta.format.codec?.includes('Layer 3')) throw new Error('not mp3');
    duration = meta.format.duration;
  } catch {
    throw new MediaError('unsupportedAudio');
  }
  if (!duration || duration < 1) throw new MediaError('unsupportedAudio');
  if (duration > MEDIA_LIMITS.audioMaxSeconds) throw new MediaError('audioTooLong');
  return { data: input, mime: 'audio/mpeg', durationSeconds: Math.round(duration), ext: 'mp3' as const };
}
